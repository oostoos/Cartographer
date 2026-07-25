<#
.SYNOPSIS
Kills whatever process currently owns the given local TCP port, if any.
Generic — has no knowledge of any specific application or port.
.PARAMETER Port
The TCP port number to check and free.
#>
param(
    [Parameter(Mandatory = $true)]
    [int]$Port
)

$connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue

if (-not $connections) {
    Write-Host "No process is listening on port $Port."
    exit 0
}

$ownerProcessIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique

foreach ($ownerProcessId in $ownerProcessIds) {
    $process = Get-Process -Id $ownerProcessId -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "Stopping process '$($process.ProcessName)' (PID $ownerProcessId) on port $Port."
        Stop-Process -Id $ownerProcessId -Force -ErrorAction SilentlyContinue
    }
}
