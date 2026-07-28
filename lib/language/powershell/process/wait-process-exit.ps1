<#
.SYNOPSIS
Blocks until the given process id is no longer running. Generic — has no
knowledge of what the process is or why it's being watched.
.PARAMETER ProcessId
The process id to wait on.
.PARAMETER PollIntervalMilliseconds
How long to sleep between liveness checks.
.PARAMETER TimeoutSeconds
Maximum time to wait before giving up. 0 (default) waits indefinitely.
.OUTPUTS
[bool] $true once the process has exited (or was already gone), $false if
TimeoutSeconds elapsed while it was still running.
#>
$WaitProcessExitDefaultPollIntervalMilliseconds = 500
$WaitProcessExitDefaultTimeoutSeconds = 0

function Wait-ProcessExit {
    param(
        [Parameter(Mandatory = $true)]
        [int]$ProcessId,

        [int]$PollIntervalMilliseconds = $WaitProcessExitDefaultPollIntervalMilliseconds,

        [int]$TimeoutSeconds = $WaitProcessExitDefaultTimeoutSeconds
    )

    $startTime = Get-Date

    while (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue) {
        if ($TimeoutSeconds -gt 0 -and ((Get-Date) - $startTime).TotalSeconds -ge $TimeoutSeconds) {
            return $false
        }
        Start-SleepMs $PollIntervalMilliseconds
    }

    return $true
}
