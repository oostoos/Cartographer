# @manualReviewRequested: 2026-07-06
# Shared logic for stamping a file with an @manualReviewRequested / @manualReviewCompleted
# marker comment, so every file Claude touches carries a note for manual review. Dot-sourced by
# both the live PostToolUse hook (stamp-manual-review-hook.ps1) and the one-time repo backfill
# (scripts/stamp-manual-review-backfill.ps1) so the comment-syntax table and marker-detection
# logic exist in exactly one place.

# Matches an existing marker line, e.g. "@manualReviewRequested: 2026-07-06" or
# "@manualReviewCompleted: 2026-07-06", regardless of surrounding comment delimiters.
$ManualReviewMarkerRegex = '@manualReview(?<tag>Requested|Completed):\s*(?<date>\d{4}-\d{2}-\d{2})'

# Returns the comment style (a hashtable with Kind='Line'/'Block', Open, and Close for Block) for
# a given file path, or $null if the file type isn't one we know how to safely stamp. Whitelist
# approach: unlisted types (notably .json, .rec, .rec.lock, .lock, .tsbuildinfo) fall through to
# $null automatically rather than needing a parallel exclude list.
function Get-CommentStyle {
    param([Parameter(Mandatory)][string]$FilePath)

    $name = Split-Path -Leaf $FilePath
    $filenameMap = @{
        'Makefile'     = @{ Kind = 'Line'; Open = '#' }
        '.gitignore'   = @{ Kind = 'Line'; Open = '#' }
        '.env.example' = @{ Kind = 'Line'; Open = '#' }
    }
    if ($filenameMap.ContainsKey($name)) { return $filenameMap[$name] }

    $ext = [IO.Path]::GetExtension($name).ToLowerInvariant()
    $extMap = @{
        '.py'   = @{ Kind = 'Line';  Open = '#' }
        '.yml'  = @{ Kind = 'Line';  Open = '#' }
        '.yaml' = @{ Kind = 'Line';  Open = '#' }
        '.toml' = @{ Kind = 'Line';  Open = '#' }
        '.ini'  = @{ Kind = 'Line';  Open = '#' }
        '.ps1'  = @{ Kind = 'Line';  Open = '#' }
        '.txt'  = @{ Kind = 'Line';  Open = '#' }
        '.ts'   = @{ Kind = 'Line';  Open = '//' }
        '.tsx'  = @{ Kind = 'Line';  Open = '//' }
        '.js'   = @{ Kind = 'Line';  Open = '//' }
        '.jsx'  = @{ Kind = 'Line';  Open = '//' }
        '.css'  = @{ Kind = 'Block'; Open = '/*';   Close = '*/' }
        '.html' = @{ Kind = 'Block'; Open = '<!--'; Close = '-->' }
        '.md'   = @{ Kind = 'Block'; Open = '<!--'; Close = '-->' }
        '.svg'  = @{ Kind = 'Block'; Open = '<!--'; Close = '-->' }
        '.vbs'  = @{ Kind = 'Line';  Open = "'" }
    }
    if ($extMap.ContainsKey($ext)) { return $extMap[$ext] }
    return $null
}

# Renders a marker line, e.g. "# @manualReviewRequested: 2026-07-06" or
# "<!-- @manualReviewRequested: 2026-07-06 -->", in the given comment style.
function Format-MarkerLine {
    param(
        [Parameter(Mandatory)]$Style,
        [Parameter(Mandatory)][string]$Tag,
        [Parameter(Mandatory)][string]$Date
    )
    $body = "@manualReview${Tag}: $Date"
    if ($Style.Kind -eq 'Block') {
        return "$($Style.Open) $body $($Style.Close)"
    }
    return "$($Style.Open) $body"
}

# Stamps (or re-stamps, or leaves untouched) the manual-review marker on one file.
#
# Behavior:
#   - Unsupported/missing/gitignored files are left alone entirely.
#   - A file with no marker gets one inserted at the top (after a shebang or HTML doctype line,
#     if present), dated $Today.
#   - A file already marked @manualReviewRequested is left completely untouched (true no-op),
#     so a pending review's original request date is never disturbed.
#   - A file already marked @manualReviewCompleted gets that line overwritten with a freshly
#     dated @manualReviewRequested, since it was edited again after being reviewed.
#
# Returns one of: Stamped, Restamped, AlreadyPending, SkippedMissing, SkippedIgnored,
# SkippedUnsupported, Error.
function Set-ManualReviewStamp {
    param(
        [Parameter(Mandatory)][string]$FilePath,
        [string]$Today = (Get-Date -Format 'yyyy-MM-dd')
    )
    try {
        if (-not (Test-Path -LiteralPath $FilePath -PathType Leaf)) { return 'SkippedMissing' }

        $ignored = $false
        try {
            git check-ignore -q -- $FilePath 2>$null
            $ignored = ($LASTEXITCODE -eq 0)
        } catch { }
        if ($ignored) { return 'SkippedIgnored' }

        $style = Get-CommentStyle -FilePath $FilePath
        if (-not $style) { return 'SkippedUnsupported' }

        # Raw byte read/write (not Get-Content/Set-Content) so CRLF-vs-LF and BOM presence are
        # preserved exactly as they were, rather than normalized by PowerShell's text cmdlets.
        $bytes = [IO.File]::ReadAllBytes($FilePath)
        $hasBom = ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
        if ($hasBom) {
            $encoding = New-Object System.Text.UTF8Encoding($true)
            $text = $encoding.GetString($bytes, 3, $bytes.Length - 3)
        } else {
            $encoding = New-Object System.Text.UTF8Encoding($false)
            $text = $encoding.GetString($bytes)
        }

        if ($text.Length -eq 0) {
            $lines = [Collections.Generic.List[string]]::new()
        } else {
            $lines = [Collections.Generic.List[string]]::new([string[]]($text -split "`r`n|`n"))
        }
        $eol = if ($text -match "`r`n") { "`r`n" } else { "`n" }
        # No separate "preserve trailing newline" step needed: -split on the EOL pattern already
        # leaves a trailing empty element when $text ends in a newline, so joining with $eol
        # reproduces it naturally. Adding another $eol on top of that would double it up.

        $ext = [IO.Path]::GetExtension($FilePath).ToLowerInvariant()
        $targetIndex = 0
        if ($style.Open -eq '#' -and $lines.Count -gt 0 -and $lines[0] -match '^#!') {
            $targetIndex = 1
        } elseif ($ext -eq '.html' -and $lines.Count -gt 0 -and $lines[0] -match '^\s*<!doctype') {
            $targetIndex = 1
        } elseif ($ext -eq '.md' -and $lines.Count -gt 0 -and $lines[0] -eq '---') {
            # YAML frontmatter (e.g. skill name/description) must stay the very first thing in
            # the file or its parser breaks, so the marker goes after the closing '---' instead.
            $closingIndex = -1
            for ($i = 1; $i -lt $lines.Count; $i++) {
                if ($lines[$i] -eq '---') { $closingIndex = $i; break }
            }
            if ($closingIndex -ge 0) { $targetIndex = $closingIndex + 1 }
        }

        $existingLine = if ($targetIndex -lt $lines.Count) { $lines[$targetIndex] } else { $null }
        $match = $null
        if ($existingLine) { $match = [regex]::Match($existingLine, $ManualReviewMarkerRegex) }

        if ($match -and $match.Success -and $match.Groups['tag'].Value -eq 'Requested') {
            return 'AlreadyPending'
        }

        $newMarker = Format-MarkerLine -Style $style -Tag 'Requested' -Date $Today

        if ($match -and $match.Success -and $match.Groups['tag'].Value -eq 'Completed') {
            $lines[$targetIndex] = $newMarker
            $status = 'Restamped'
        } else {
            if ($targetIndex -ge $lines.Count) {
                $lines.Add($newMarker)
            } else {
                $lines.Insert($targetIndex, $newMarker)
            }
            $status = 'Stamped'
        }

        $joined = ($lines -join $eol)

        [IO.File]::WriteAllText($FilePath, $joined, $encoding)
        return $status
    } catch {
        return 'Error'
    }
}
