<#
.SYNOPSIS
Looks up an executable's installed path via the Windows "App Paths" registry
key. Generic — has no knowledge of which application is being looked up.
.PARAMETER ExecutableName
The executable's file name, e.g. "msedge.exe".
.OUTPUTS
[string] the registered path, or $null if the executable isn't registered.
#>
function Get-AppPathFromRegistry {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ExecutableName
    )

    $registryKeyPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\$ExecutableName"
    $registryKey = Get-Item -Path $registryKeyPath -ErrorAction SilentlyContinue
    if (-not $registryKey) {
        return $null
    }

    return $registryKey.GetValue("")
}
