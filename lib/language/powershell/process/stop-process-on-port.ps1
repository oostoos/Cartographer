<#
.SYNOPSIS
Kills whatever process currently owns the given local TCP port, if any.
Generic — has no knowledge of any specific application or port.
.PARAMETER Port
The TCP port number to check and free.
#>
function Stop-ProcessOnPort {
    param(
        [Parameter(Mandatory = $true)]
        [int]$Port
    )

    # -State Listen excludes TIME_WAIT/other transient rows, which Windows commonly reports with
    # OwningProcess 0 (the unkillable System Idle Process) once the real process has already
    # released the socket — without this filter those rows get "stopped" as a no-op instead of (or
    # alongside) the actual listening server.
    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if (-not $connections) {
        Write-Host "No process is listening on port $Port."
        return
    }

    $ownerProcessIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique

    foreach ($ownerProcessId in $ownerProcessIds) {
        $process = Get-Process -Id $ownerProcessId -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "Stopping process '$($process.ProcessName)' (PID $ownerProcessId) on port $Port."
            Stop-Process -Id $ownerProcessId -Force -ErrorAction SilentlyContinue
        }
    }
}
