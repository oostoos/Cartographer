# PowerShell library barrel: generic, stack-agnostic building blocks.
# Import via `Import-Module <path>/index.psm1` rather than dot-sourcing
# individual files directly.

# process — generic process/port management primitives
. "$PSScriptRoot/process/stop-process-on-port.ps1"
. "$PSScriptRoot/process/wait-process-exit.ps1"
. "$PSScriptRoot/process/start-process-and-get-id.ps1"

# network — generic network readiness primitives
. "$PSScriptRoot/network/wait-http-endpoint-ready.ps1"

# windows — generic Windows OS primitives
. "$PSScriptRoot/windows/get-app-path-from-registry.ps1"

Export-ModuleMember -Function Stop-ProcessOnPort, Wait-ProcessExit, Start-ProcessAndGetId, Wait-HttpEndpointReady, Get-AppPathFromRegistry
