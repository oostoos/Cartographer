# @manualReviewRequested: 2026-07-06
<#
Cartographer: launches Edge as the debug target for VS Code's "Frontend: Edge" attach-mode config.

VS Code's own "request": "launch" for the chrome/msedge debug types has three distinct, real bugs on
this machine (see .vscode/launch.json's git history / CLAUDE.md discussion for the trace-log-backed
diagnosis): a crashed-profile duplicate-tab issue, a pipe-transport that dies within ~30ms of
spawning, and a hardcoded "localhost" hostname in its own fresh-launch discovery logic that loses a
race against the (always-unreachable) IPv6 loopback. None of those are fixable via launch.json
fields. So instead: we launch Edge ourselves, wait for genuine CDP-readiness (not just process
spawn), and VS Code's "Frontend: Edge" config uses "request": "attach" against the already-running,
already-verified-ready instance — a different code path that reads the configured address/port
directly instead of hardcoding "localhost", so it doesn't hit that race.

Wired as the "Start Edge (Debug Target)" task in .vscode/tasks.json, which dependsOn
"Start Frontend (Vite)" (sequence) — so Vite is already up before this points Edge at it. Unlike
scripts/verify-edge-cdp-attach.ps1 (its diagnostic twin), this script does NOT kill the browser it
launches when it exits successfully — the whole point is to leave it running for VS Code to attach
to. scripts/stop-cartographer.ps1 (wired as postDebugTask) is what cleans it up once the debug
session ends.

Also handles the "duplicate tab" case verify-edge-cdp-attach.ps1's diagnostic harness calls
SUCCESS_WITH_DUPLICATE_TARGETS. Two layers, aimed at two different root causes:

1. Command-line flags below (--disable-features=...StartupBoost/NewTabPageFeed/WebFeeds...,
   --disable-component-update, --disable-background-networking, --disable-sync,
   --disable-default-apps, --no-service-autorun) stop Edge's own New Tab Page/feed machinery from
   opening a second, genuinely independent tab in the first place. This was the main offender:
   empirically (isolated throwaway-profile testing, both against a plain external URL and against
   this app's own localhost:5173), Edge would spawn a real edge://newtab/ page target anywhere from
   ~1.5s to 20+ seconds after our own tab was already up and CDP-ready — well past any launch-time
   settle window — matching its background NTP feed refresh / "Startup Boost" behavior rather than
   anything in our launch sequence. With these flags, that never happened across repeated
   multi-minute observation windows.
2. Phase 3 below (settle-and-close sweep) is a backstop for the OTHER known cause: even with
   stop-cartographer.ps1 resetting exit_type to "Normal", a persistent profile can still surface a
   leftover session tab (crash-restore) or similar one-off extra alongside the real one — resetting
   exit_type is a first line of defense, not a guarantee. So after confirming our target tab is up,
   we sweep /json/list repeatedly for up to $SettleWindowSeconds and close every *other* page target
   via the CDP HTTP close endpoint (a single snapshot-and-close isn't enough on its own — the extra
   tab can take a couple seconds to even show up in /json/list).
#>
[CmdletBinding()]
param(
    [int]$CdpPort = 9223,
    [string]$Url = "http://localhost:5173",
    [int]$TimeoutSeconds = 15,
    [int]$SettleWindowSeconds = 8
)

$RepoRoot   = Split-Path $PSScriptRoot -Parent
$ProfileDir = Join-Path $RepoRoot ".vscode\.browser-debug-profile"
$EdgeExe    = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

if (-not (Test-Path $EdgeExe)) {
    throw "msedge.exe not found at expected path: $EdgeExe"
}

# Safety net: if a previous session's Edge (on this exact profile) is still around for any reason,
# clear it first so we don't end up polling a stale instance or failing to bind the port. Matched by
# command-line substring, never by bare process name, so this never touches the user's real
# daily-driver Edge windows (different --user-data-dir entirely).
$staleOwners = Get-CimInstance Win32_Process -Filter "Name = 'msedge.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -and $_.CommandLine.Contains($ProfileDir) }
foreach ($owner in $staleOwners) {
    & taskkill /PID $owner.ProcessId /T /F 2>$null | Out-Null
}
if ($staleOwners) { Start-Sleep -Milliseconds 300 }

$edgeArgs = @(
    "--remote-debugging-port=$CdpPort",
    "--user-data-dir=$ProfileDir",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-allow-origins=*",
    # Suppresses Edge's own New Tab Page / background feed machinery from opening a second,
    # independent tab on its own schedule (see the file-level doc comment for how this was diagnosed).
    "--disable-features=msEdgeStartupBoost,msEdgeNewTabPageFeed,msNewTabPageFeed,msWebFeedsShoppingList,MicrosoftEdgeFeedbackFramework,msWebFeedsForYou,EdgeFollowingFeed",
    "--disable-component-update",
    "--disable-background-networking",
    "--disable-sync",
    "--disable-default-apps",
    "--no-service-autorun",
    $Url
)
$sw = [System.Diagnostics.Stopwatch]::StartNew()
Start-Process -FilePath $EdgeExe -ArgumentList $edgeArgs | Out-Null

# --- Phase 1: wait for the CDP port to open at all ---
$portOpen = $false
while ($sw.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
    try {
        $null = Invoke-RestMethod -Uri "http://127.0.0.1:$CdpPort/json/version" -TimeoutSec 2
        $portOpen = $true
        break
    } catch {
        Start-Sleep -Milliseconds 250
    }
}
if (-not $portOpen) {
    Write-Error "Edge's CDP port $CdpPort never opened within ${TimeoutSeconds}s."
    exit 1
}

# --- Phase 2: wait for a page target matching our URL ---
$matched = $false
while ($sw.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
    try {
        $targets = Invoke-RestMethod -Uri "http://127.0.0.1:$CdpPort/json/list" -TimeoutSec 2
        $pages = @($targets | Where-Object { $_.type -eq "page" })
        if ($pages | Where-Object { $_.url -like "$Url*" }) {
            $matched = $true
            break
        }
    } catch {
        # keep polling
    }
    Start-Sleep -Milliseconds 250
}
if (-not $matched) {
    Write-Error "No page target matching $Url appeared within ${TimeoutSeconds}s."
    exit 1
}

# --- Phase 3: repeatedly close every other page target for a settle window ---
# Edge's own New Tab Page (MSN-backed feed, etc.) doesn't always finish spawning its CDP page
# target by the time our own tab is up — a single close-after-one-delay pass is a race against
# that (observed empirically: it can still be missing at the 1.5s mark and show up seconds later).
# So instead of one snapshot, we keep sweeping /json/list and closing non-matching page targets for
# up to $SettleWindowSeconds, stopping early once we've seen two consecutive clean passes (nothing
# left to close). Uses its own variable names (not Phase 2's $targets/$pages) so a failed re-fetch
# here can never silently fall back to Phase 2's now-stale snapshot.
$settleSw = [System.Diagnostics.Stopwatch]::StartNew()
$consecutiveCleanPasses = 0
while ($settleSw.Elapsed.TotalSeconds -lt $SettleWindowSeconds -and $consecutiveCleanPasses -lt 2) {
    Start-Sleep -Milliseconds 500
    try {
        $settledTargets = Invoke-RestMethod -Uri "http://127.0.0.1:$CdpPort/json/list" -TimeoutSec 3
    } catch {
        continue
    }
    $settledPages = @($settledTargets | Where-Object { $_.type -eq "page" })
    $keeper = $settledPages | Where-Object { $_.url -like "$Url*" } | Select-Object -First 1
    if (-not $keeper) {
        # Can't confidently tell which tab is the real one this pass — skip closing anything rather
        # than risk closing every tab, which would take the whole browser process down with nothing
        # left for VS Code to attach to.
        continue
    }
    $extras = @($settledPages | Where-Object { $_.id -ne $keeper.id })
    if ($extras.Count -eq 0) {
        $consecutiveCleanPasses++
        continue
    }
    $consecutiveCleanPasses = 0
    foreach ($extra in $extras) {
        try {
            Invoke-WebRequest -Uri "http://127.0.0.1:$CdpPort/json/close/$($extra.id)" -TimeoutSec 3 | Out-Null
        } catch {
            Write-Host "Warning: failed to close extra tab '$($extra.url)' ($($extra.id)): $_"
        }
    }
}

Write-Host "Edge debug target ready at $Url (CDP port $CdpPort)."
exit 0
