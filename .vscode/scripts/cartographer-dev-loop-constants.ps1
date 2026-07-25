<#
Shared constants for the F5 dev-loop scripts (start-edge-debug-session.ps1 and
watch-edge-and-free-ports.ps1) — dot-sourced by both so the two never drift out of sync.
Must match .env.example's CARTOGRAPHER_* defaults and .vscode/launch.json's Edge config;
update all three together if any changes.
#>

$CartographerEdgeExecutableName = "msedge.exe"
$CartographerFrontendPort = 5173
$CartographerBackendPort = 5000
$CartographerEdgeCdpPort = 9222
$CartographerEdgeCdpReadyTimeoutSeconds = 15
