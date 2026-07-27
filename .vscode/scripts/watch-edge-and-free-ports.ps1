<#
.SYNOPSIS
Cartographer: blocks on the given Edge process id and, once it exits, frees the dev-loop ports.

.DESCRIPTION
Launched by start-edge-debug-session.ps1 as a fully detached, independent process (not a VS Code
task) so it can't be entangled with VS Code's own task/debug-session bookkeeping — it runs
completely outside anything VS Code tracks. Has no visible terminal, so progress is logged to a
file instead.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [int]$EdgeProcessId,

    [Parameter(Mandatory = $true)]
    [string]$UserDataDir
)

. "$PSScriptRoot/cartographer-dev-loop-constants.ps1"
Import-Module "$PSScriptRoot/../../lib/language/powershell/index.psm1"

$LogFilePath = Join-Path $env:TEMP "cartographer-edge-watchdog.log"

function Write-CartographerWatchdogLog {
    param([string]$Message)
    "$(Get-Date -Format 'HH:mm:ss') $Message" | Add-Content -Path $LogFilePath
}

function Stop-CartographerAppPorts {
    Stop-ProcessOnPort -Port $CartographerBackendPort
    Stop-ProcessOnPort -Port $CartographerFrontendPort
}

Write-CartographerWatchdogLog "Watching Edge PID $EdgeProcessId."
$null = Wait-ProcessExit -ProcessId $EdgeProcessId

Write-CartographerWatchdogLog "Edge exited; freeing Cartographer ports."
Stop-CartographerAppPorts
Remove-Item -Recurse -Force -Path $UserDataDir -ErrorAction SilentlyContinue
