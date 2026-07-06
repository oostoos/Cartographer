# @manualReviewRequested: 2026-07-06
# One-time pass that stamps every git-tracked file in the repo with an @manualReviewRequested
# marker, using the shared logic in .claude/hooks/ManualReviewStamp.ps1 (the same logic the
# PostToolUse hook uses on every future edit). Files that already carry a marker are left
# untouched, so this is safe to re-run. Uses `git ls-files` rather than a hardcoded exclude list,
# so it automatically skips anything gitignored (node_modules, .venv, dist, the custom DB's
# runtime data files, etc.) without needing to duplicate .gitignore's rules here.
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
. (Join-Path $RepoRoot ".claude\hooks\ManualReviewStamp.ps1")

$counts = @{}
Push-Location $RepoRoot
try {
    # --cached (tracked) + --others --exclude-standard (untracked but not gitignored) so newly
    # created files not yet `git add`-ed still get stamped, without needing to stage them first.
    $files = git ls-files --cached --others --exclude-standard
    foreach ($f in $files) {
        $status = Set-ManualReviewStamp -FilePath (Join-Path $RepoRoot $f)
        if (-not $counts.ContainsKey($status)) { $counts[$status] = 0 }
        $counts[$status]++
    }
} finally {
    Pop-Location
}

foreach ($k in ($counts.Keys | Sort-Object)) {
    "$($k): $($counts[$k])"
}
