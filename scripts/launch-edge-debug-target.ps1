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
#>
[CmdletBinding()]
param(
    [int]$CdpPort = 9223,
    [string]$Url = "http://localhost:5173",
    [int]$TimeoutSeconds = 15
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

Write-Host "Edge debug target ready at $Url (CDP port $CdpPort)."
exit 0
