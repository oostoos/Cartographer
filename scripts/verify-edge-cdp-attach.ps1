<#
Cartographer: Edge CDP target-discovery reproduction/verification harness.

This is NOT part of the wired debug lifecycle (unlike stop-cartographer.ps1) — it's a standalone
diagnostic tool for reproducing and validating a fix for the js-debug "Unable to attach to browser"
failure from OUTSIDE VS Code, since driving VS Code's own F5/DAP flow isn't something a script can
do. It launches msedge.exe directly against the SAME profile directory js-debug's "Frontend: Edge"
launch config uses (.vscode/.browser-debug-profile), with an explicit --remote-debugging-port so we
can poll the CDP HTTP endpoint the same way js-debug's own internal target-discovery effectively
does (over a pipe transport we can't observe directly, but functionally the same handshake: find a
page target whose URL matches the launch URL).

PRECONDITION: the Vite dev server must already be listening on port 5173 (e.g. via the
"Start Frontend (Vite)" task, or `npm run dev` in source/frontend) — this script does not manage
the frontend/backend dev servers, only the browser side. Pass -RequireViteRunning to fail fast with
a clear message instead of hanging on a page that will never finish loading if you forgot.

Re-runnable back-to-back any number of times: every run kills only msedge.exe processes whose
command line references THIS EXACT profile directory (never a bare `Stop-Process -Name msedge`, so
the user's daily-driver Edge windows, running under their own default profile, are never touched),
both as a pre-flight safety net and in a `finally` cleanup block.
#>
[CmdletBinding()]
param(
    [int]$CdpPort = 9922,
    [string]$Url = "http://localhost:5173",
    [int]$TimeoutSeconds = 15,
    [int]$SettleDelayMs = 1500,
    [switch]$RequireViteRunning
)

$RepoRoot   = Split-Path $PSScriptRoot -Parent
$ProfileDir = Join-Path $RepoRoot ".vscode\.browser-debug-profile"
$EdgeExe    = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

if (-not (Test-Path $EdgeExe)) {
    throw "msedge.exe not found at expected path: $EdgeExe"
}

if ($RequireViteRunning -and -not (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue)) {
    throw "Vite dev server is not listening on port 5173. Start it first (task 'Start Frontend (Vite)', or ``npm run dev`` in source/frontend) and leave it running, then re-run this harness."
}

function Stop-ProfileOwnedEdge {
    # Same philosophy as stop-cartographer.ps1: kill by command-line substring, never by bare
    # process name, so this never touches the user's real daily-driver Edge windows.
    $owners = Get-CimInstance Win32_Process -Filter "Name = 'msedge.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -and $_.CommandLine.Contains($ProfileDir) }
    foreach ($owner in $owners) {
        if (Get-Process -Id $owner.ProcessId -ErrorAction SilentlyContinue) {
            & taskkill /PID $owner.ProcessId /T /F 2>$null | Out-Null
        }
    }
    if ($owners) { Start-Sleep -Milliseconds 300 }
}

function Get-ProfileOwnedEdgeCount {
    # Positive verification helper for the caller's process-hygiene checks — returns how many
    # msedge.exe processes (if any) still reference this profile directory, rather than trusting
    # any prior kill's exit code alone.
    @(Get-CimInstance Win32_Process -Filter "Name = 'msedge.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -and $_.CommandLine.Contains($ProfileDir) }).Count
}

function Invoke-EdgeCdpAttachAttempt {
    $result = [ordered]@{
        Outcome                 = "UNKNOWN"
        PortOpenedAfterMs       = $null
        MatchingTargetAfterMs   = $null
        PageTargetsAtSuccess    = @()
        DuplicateTargetsWarning = $false
    }
    $edgeProc = $null
    try {
        $edgeArgs = @(
            "--remote-debugging-port=$CdpPort",
            "--user-data-dir=$ProfileDir",
            "--no-first-run",
            "--no-default-browser-check",
            "--remote-allow-origins=*",
            $Url
        )
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $edgeProc = Start-Process -FilePath $EdgeExe -ArgumentList $edgeArgs -PassThru

        # --- Phase 1: wait for the CDP port to open at all ---
        $portOpen = $false
        while ($sw.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
            try {
                $null = Invoke-RestMethod -Uri "http://127.0.0.1:$CdpPort/json/version" -TimeoutSec 2
                $portOpen = $true
                $result.PortOpenedAfterMs = [int]$sw.Elapsed.TotalMilliseconds
                break
            } catch {
                Start-Sleep -Milliseconds 250
            }
        }
        if (-not $portOpen) {
            $result.Outcome = "TIMEOUT_PORT_NEVER_OPENED"
            return $result
        }

        # --- Phase 2: wait for a page target matching our URL ---
        $matched = $false
        while ($sw.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
            try {
                $targets = Invoke-RestMethod -Uri "http://127.0.0.1:$CdpPort/json/list" -TimeoutSec 2
                $pages = @($targets | Where-Object { $_.type -eq "page" })
                if ($pages | Where-Object { $_.url -like "$Url*" }) {
                    $matched = $true
                    $result.MatchingTargetAfterMs = [int]$sw.Elapsed.TotalMilliseconds
                    break
                }
            } catch {
                # keep polling
            }
            Start-Sleep -Milliseconds 250
        }
        if (-not $matched) {
            $result.Outcome = "TIMEOUT_NO_MATCHING_TARGET"
            return $result
        }

        # Give Chromium a moment to settle (finish any session-restore tab creation) before the
        # final census — specifically to catch the "duplicate tab from crashed exit_type" case.
        Start-Sleep -Milliseconds $SettleDelayMs
        $finalTargets = Invoke-RestMethod -Uri "http://127.0.0.1:$CdpPort/json/list" -TimeoutSec 2
        $finalPages = @($finalTargets | Where-Object { $_.type -eq "page" })
        $result.PageTargetsAtSuccess = $finalPages | ForEach-Object { $_.url }

        if ($finalPages.Count -gt 1) {
            $result.DuplicateTargetsWarning = $true
            $result.Outcome = "SUCCESS_WITH_DUPLICATE_TARGETS"
        } else {
            $result.Outcome = "SUCCESS"
        }
        return $result
    }
    finally {
        if ($edgeProc -and (Get-Process -Id $edgeProc.Id -ErrorAction SilentlyContinue)) {
            & taskkill /PID $edgeProc.Id /T /F 2>$null | Out-Null
        }
        # Safety net: catches child/renderer processes that may have detached from $edgeProc's own
        # PID (Edge's launcher process commonly re-execs itself on Windows).
        Stop-ProfileOwnedEdge
    }
}

# Pre-flight: if our own CDP port is already bound (e.g. an orphan from a prior interrupted run),
# clear it before we start so we don't end up polling a stale/unrelated CDP server.
if (Get-NetTCPConnection -LocalPort $CdpPort -State Listen -ErrorAction SilentlyContinue) {
    Write-Host "Port $CdpPort already in use -- clearing any leftover profile-owned Edge from a previous run..."
    Stop-ProfileOwnedEdge
    Start-Sleep -Milliseconds 500
    if (Get-NetTCPConnection -LocalPort $CdpPort -State Listen -ErrorAction SilentlyContinue) {
        throw "Port $CdpPort is held by something other than our own debug-profile Edge instance. Pick a different -CdpPort."
    }
}

# Report pre-run profile state, since this is exactly what determines which failure mode (if any) we
# expect to reproduce.
$lockfilePath    = Join-Path $ProfileDir "lockfile"
$preferencesPath = Join-Path $ProfileDir "Default\Preferences"
$hasLockfile     = Test-Path $lockfilePath
$hasCrashedExit  = (Test-Path $preferencesPath) -and ([System.IO.File]::ReadAllText($preferencesPath).Contains('"exit_type":"Crashed"'))

Write-Host "Profile dir:        $ProfileDir"
Write-Host "Stale lockfile?:    $hasLockfile"
Write-Host "exit_type=Crashed?: $hasCrashedExit"
Write-Host ""

$result = Invoke-EdgeCdpAttachAttempt

Write-Host "=== Result ==="
$result.GetEnumerator() | ForEach-Object { Write-Host "$($_.Key): $($_.Value)" }

$leftoverCount = Get-ProfileOwnedEdgeCount
Write-Host ""
Write-Host "Leftover profile-owned msedge.exe processes after cleanup: $leftoverCount"
if ($leftoverCount -gt 0) {
    Write-Host "WARNING: cleanup did not fully clear profile-owned Edge processes." -ForegroundColor Yellow
}

switch ($result.Outcome) {
    "SUCCESS"                        { exit 0 }
    "SUCCESS_WITH_DUPLICATE_TARGETS" { exit 0 }
    default                           { exit 1 }
}
