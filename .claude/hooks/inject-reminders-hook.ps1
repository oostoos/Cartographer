# @manualReviewRequested: 2026-07-08
# Invoked by the PreToolUse hook in .claude/settings.json before every Write/Edit. Reads
# .claude/reminders.md and, if it has content, emits it as hookSpecificOutput.additionalContext so
# Claude sees it right before the tool call executes. A missing or empty file is a silent no-op.
# -HookJson is accepted for consistency with the PostToolUse hooks in this file but unused here —
# reminders apply to every Write/Edit regardless of which file is being touched.
param(
    [Parameter(Mandatory)]
    [string]$HookJson
)

try {
    $remindersPath = Join-Path $PSScriptRoot '..\reminders.md'
    if (Test-Path $remindersPath) {
        $content = (Get-Content -Raw $remindersPath).Trim()
        if ($content) {
            $output = @{
                hookSpecificOutput = @{
                    hookEventName     = 'PreToolUse'
                    additionalContext = $content
                }
            }
            $output | ConvertTo-Json -Depth 5 -Compress
        }
    }
} catch {
}
