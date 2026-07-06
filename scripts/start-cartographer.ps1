# Starts Cartographer for day-to-day use outside VS Code: launches the same `npm run dev` (Flask +
# Vite, hot-reload both sides) used everywhere else in this project, then opens the app in the
# default browser. Meant to be run via the sibling start-cartographer.vbs, which a desktop/taskbar
# shortcut points at — this file holds all the actual logic so the shortcut never has to change.
#
# Resolves the repo root relative to this script's own location, so it works no matter where the
# repo is checked out.
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

# Must match the Vite dev server port documented in README.md / package.json's dev:frontend script.
$VitePort = 5173
$AppUrl = "http://localhost:$VitePort"

# Give the servers this long to come up before giving up waiting and opening the browser anyway.
$MaxWaitSeconds = 30

function Test-PortListening {
    param([int]$Port)
    return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

if (-not (Test-PortListening -Port $VitePort)) {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run dev" `
        -WorkingDirectory $RepoRoot -WindowStyle Minimized

    $waited = 0
    while (-not (Test-PortListening -Port $VitePort) -and $waited -lt $MaxWaitSeconds) {
        Start-Sleep -Seconds 1
        $waited++
    }
}

Start-Process $AppUrl
