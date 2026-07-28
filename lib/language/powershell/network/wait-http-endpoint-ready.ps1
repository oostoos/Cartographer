<#
.SYNOPSIS
Blocks until an HTTP GET to the given URI succeeds. Generic — has no
knowledge of what the endpoint is or why it's being waited on.
.PARAMETER Uri
The URI to poll.
.PARAMETER TimeoutSeconds
Maximum time to wait before giving up.
.PARAMETER PollIntervalMilliseconds
How long to sleep between polling attempts.
.OUTPUTS
[bool] $true once a request succeeds, $false if TimeoutSeconds elapsed first.
#>
$WaitHttpEndpointReadyDefaultTimeoutSeconds = 15
$WaitHttpEndpointReadyDefaultPollIntervalMilliseconds = 250

function Wait-HttpEndpointReady {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Uri,

        [int]$TimeoutSeconds = $WaitHttpEndpointReadyDefaultTimeoutSeconds,

        [int]$PollIntervalMilliseconds = $WaitHttpEndpointReadyDefaultPollIntervalMilliseconds
    )

    $startTime = Get-Date

    while ($true) {
        try {
            Invoke-WebRequest -Uri $Uri -UseBasicParsing -ErrorAction Stop | Out-Null
            return $true
        } catch {
            if (((Get-Date) - $startTime).TotalSeconds -ge $TimeoutSeconds) {
                return $false
            }
            Start-SleepMs $PollIntervalMilliseconds
        }
    }
}
