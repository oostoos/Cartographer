<#
.SYNOPSIS
Thin wrapper around Start-Sleep for pausing execution by a millisecond
count. Generic — no knowledge of what the pause is for.
.PARAMETER Duration
How long to sleep, in milliseconds (the unit is fixed by the function name,
so it isn't repeated in the parameter name).
#>
function Start-SleepMs {
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [int]$Duration
    )

    Start-Sleep -Milliseconds $Duration
}
