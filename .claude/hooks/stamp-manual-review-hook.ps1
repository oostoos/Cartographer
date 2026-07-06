# @manualReviewRequested: 2026-07-06
# Invoked by the PostToolUse hook in .claude/settings.json after every Write/Edit. Extracts the
# edited file's path from the hook's JSON payload and stamps it via the shared logic in
# ManualReviewStamp.ps1. Never throws — a stamping failure must not block Claude's edit.
param(
    [Parameter(Mandatory)]
    [string]$HookJson
)

try {
    $j = $HookJson | ConvertFrom-Json
    $f = $j.tool_input.file_path
    if (-not $f) { $f = $j.tool_response.filePath }
    if ($f) {
        . (Join-Path $PSScriptRoot 'ManualReviewStamp.ps1')
        Set-ManualReviewStamp -FilePath $f | Out-Null
    }
} catch {
}
