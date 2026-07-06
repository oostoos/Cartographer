# Force-stops Cartographer's dev servers (Flask/Werkzeug + Vite) by whatever is currently bound to
# their well-known ports, tree-killing each one's parent process too — Werkzeug's reloader watcher
# doesn't bind a socket itself (only its WERKZEUG_RUN_MAIN child does), so killing just the child
# risks the watcher's restart loop spawning a replacement; and Vite's node.exe runs under an
# npm.cmd/cmd.exe wrapper that should go down with it rather than being left running empty.
#
# Also resets the js-debug-launched Edge debug profile (.vscode/.browser-debug-profile) to a
# known-good state, since neither VS Code nor js-debug ever does this on its own — see the "Browser
# debug profile cleanup" section below for why that's necessary.
#
# Shared by two callers:
#   - scripts/stop-cartographer.vbs, for the desktop "Stop Cartographer" shortcut.
#   - .vscode/tasks.json's "Cartographer: Stop dev servers" task, used as a preLaunchTask safety
#     sweep and postDebugTask cleanup by the F5 launch compounds in .vscode/launch.json.
#
# Ports: 5000 = Flask/Werkzeug dev server. 5173 = Vite dev server.
$DevPorts = 5000, 5173

# Only tree-kill a resolved parent process if its name is one we'd actually expect to find in this
# process tree. Windows recycles PIDs; blindly trusting a stale ParentProcessId and force-killing
# whatever currently holds that PID could take down an unrelated process tree. This allowlist is
# the guard against that, not a completeness list.
$ExpectedParentNames = "python", "cmd", "powershell", "pwsh", "conhost", "WindowsTerminal"

function Stop-ProcessTreeSafely {
    param([int]$ProcessId)
    if (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue) {
        & taskkill /PID $ProcessId /T /F 2>$null | Out-Null
    }
}

foreach ($port in $DevPorts) {
    $ownerPids = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique

    foreach ($ownerPid in $ownerPids) {
        $owner = Get-CimInstance Win32_Process -Filter "ProcessId = $ownerPid" -ErrorAction SilentlyContinue
        if ($owner -and $owner.ParentProcessId) {
            $parent = Get-CimInstance Win32_Process -Filter "ProcessId = $($owner.ParentProcessId)" -ErrorAction SilentlyContinue
            if ($parent -and ($ExpectedParentNames -contains ($parent.Name -replace '\.exe$', ''))) {
                Stop-ProcessTreeSafely -ProcessId $parent.ProcessId
            }
        }
        # Always also kill the port owner directly (and anything it spawned) — covers cases where
        # the parent check above didn't apply, and is a harmless no-op if the parent-kill above
        # already took this PID down too.
        Stop-ProcessTreeSafely -ProcessId $ownerPid
    }
}

# --- Browser debug profile cleanup (Frontend: Edge) --------------------------------------------
#
# js-debug's native "launch" mode for the msedge/chrome config types launches over a pipe transport
# (port 0 by default), not a TCP port, so the port-owner sweep above can never see or clean up this
# browser process. Left alone, an ungracefully-torn-down debug session leaves this profile directory
# in a state that breaks the *next* launch in one of two ways:
#
#   1. A stale Chromium `lockfile` (Windows-only singleton lock) — if present, js-debug shows a
#      modal "a browser is already running from this profile" confirmation before every single
#      launch, and treats anything other than clicking "Debug Anyway" as an aborted launch.
#   2. `Default\Preferences` left with `"exit_type":"Crashed"` from the force-killed prior session —
#      Chromium's own crash-recovery logic then restores the last session's tab(s) *in addition to*
#      the new URL passed on the command line, producing two tabs instead of one, which can confuse
#      js-debug's target-discovery (it expects exactly one page matching the launch URL).
#
# We use an explicit, project-local userDataDir (.vscode/.browser-debug-profile, set on the
# "Frontend: Edge" config in .vscode/launch.json) specifically so this script can find and reset it
# deterministically, rather than having to rediscover VS Code's own opaque per-workspace storage
# hash directory on every machine/rename.
#
# Only a surgical string replace is done on Preferences, never a full JSON parse/reserialize — this
# file is a large, complex Chromium-internal structure and round-tripping it through a generic JSON
# (de)serializer risks silently dropping or reordering fields Chromium itself cares about.
$RepoRoot          = Split-Path $PSScriptRoot -Parent
$BrowserProfileDir = Join-Path $RepoRoot ".vscode\.browser-debug-profile"

if (Test-Path $BrowserProfileDir) {
    # Kill any process still holding this exact profile open. Matched by command-line substring
    # (same style as the port-owner matching above), never by bare process name — this profile
    # directory is unique to our debug sessions, so any msedge.exe whose command line references it
    # is safe to tree-kill outright; the user's real, daily-driver Edge windows run under a
    # completely different --user-data-dir and are never touched by this.
    $profileOwners = Get-CimInstance Win32_Process -Filter "Name = 'msedge.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -and $_.CommandLine.Contains($BrowserProfileDir) }

    if ($profileOwners) {
        foreach ($owner in $profileOwners) {
            Stop-ProcessTreeSafely -ProcessId $owner.ProcessId
        }
        # Give the OS a moment to release file handles before we touch the profile's files below.
        Start-Sleep -Milliseconds 300
    }

    $lockfile = Join-Path $BrowserProfileDir "lockfile"
    if (Test-Path $lockfile) {
        Remove-Item -Path $lockfile -Force -ErrorAction SilentlyContinue
    }

    $preferencesFile = Join-Path $BrowserProfileDir "Default\Preferences"
    if (Test-Path $preferencesFile) {
        $needle = '"exit_type":"Crashed"'
        $replacement = '"exit_type":"Normal"'
        $contents = [System.IO.File]::ReadAllText($preferencesFile)
        if ($contents.Contains($needle)) {
            $contents = $contents.Replace($needle, $replacement)
            [System.IO.File]::WriteAllText($preferencesFile, $contents)
        }
    }
}

exit 0
