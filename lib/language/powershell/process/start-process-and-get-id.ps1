<#
.SYNOPSIS
Starts a process and returns its process id. Generic wrapper around
Start-Process -PassThru — has no knowledge of what's being started.
.PARAMETER FilePath
Path to the executable to start.
.PARAMETER ArgumentList
Arguments to pass to the executable.
.PARAMETER WorkingDirectory
Working directory for the new process. Defaults to Start-Process's own default
when omitted.
.OUTPUTS
[int] the process id of the newly started process.
#>
function Start-ProcessAndGetId {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,

        [string[]]$ArgumentList = @(),

        [string]$WorkingDirectory
    )

    $startProcessArgs = @{
        FilePath     = $FilePath
        ArgumentList = $ArgumentList
        PassThru     = $true
    }
    if ($WorkingDirectory) {
        $startProcessArgs.WorkingDirectory = $WorkingDirectory
    }

    $process = Start-Process @startProcessArgs
    return $process.Id
}
