<#
.SYNOPSIS
Launches an isolated Edge instance for the F5 dev loop, waits for it to be CDP-attachable, hands
off teardown to a detached watchdog, then exits.

.DESCRIPTION
This is deliberately NOT a `lib/language/powershell` definition — it has Cartographer and Edge/CDP-
specific knowledge (ports, executable name), which the language-tier library must not contain (see
.ajx/AustinsSweManifesto.md, "Libraries").

Owning the Edge process directly (rather than letting VS Code's "msedge" launch config spawn and
own it) is what makes teardown work when the browser window is closed directly instead of stopped
from VS Code: VS Code's "stopAll" and "postDebugTask" are scoped to the debug session being stopped
through VS Code itself (see the comments on the "Start Edge (Debug)" task in tasks.json) and never
fire in that case.

This script itself exits promptly once Edge is ready, rather than blocking for the rest of the dev
session — the actual "wait for Edge to close, then free the ports" watchdog runs as a fully
detached process (watch-edge-and-free-ports.ps1), started here but never awaited. Keeping this
task-facing script short-lived matches how "Wait For Backend Ready" and the recovered prior
implementation's "Start Edge (Debug Target)" task both behave: a VS Code task that never completes
is a plausible way for VS Code's own debug-session bookkeeping to end up unable to cleanly mark
that session as ended, independent of whether the browser itself is actually gone.
#>

. "$PSScriptRoot/cartographer-dev-loop-constants.ps1"
Import-Module "$PSScriptRoot/../../lib/language/powershell/index.psm1"

function New-CartographerEdgeUserDataDir {
    $userDataDir = Join-Path $env:TEMP "cartographer-edge-debug-$([guid]::NewGuid())"
    New-Item -ItemType Directory -Path $userDataDir | Out-Null
    return $userDataDir
}

function Start-CartographerEdgeProcess {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ExecutablePath,

        [Parameter(Mandatory = $true)]
        [string]$UserDataDir
    )

    $arguments = @(
        "--remote-debugging-port=$CartographerEdgeCdpPort",
        "--user-data-dir=$UserDataDir",
        "--no-first-run",
        "--no-default-browser-check",
        "http://localhost:$CartographerFrontendPort"
    )
    return Start-ProcessAndGetId -FilePath $ExecutablePath -ArgumentList $arguments
}

function Wait-CartographerEdgeCdpReady {
    $isReady = Wait-HttpEndpointReady -Uri "http://localhost:$CartographerEdgeCdpPort/json/version" -TimeoutSeconds $CartographerEdgeCdpReadyTimeoutSeconds
    if (-not $isReady) {
        throw "Edge's CDP endpoint on port $CartographerEdgeCdpPort was not ready within $CartographerEdgeCdpReadyTimeoutSeconds seconds."
    }
}

function Start-CartographerEdgeWatchdog {
    param(
        [Parameter(Mandatory = $true)]
        [int]$EdgeProcessId,

        [Parameter(Mandatory = $true)]
        [string]$UserDataDir
    )

    $watchdogScriptPath = "$PSScriptRoot/watch-edge-and-free-ports.ps1"
    $watchdogArguments = @(
        "-NoProfile",
        "-WindowStyle", "Hidden",
        "-File", $watchdogScriptPath,
        "-EdgeProcessId", $EdgeProcessId,
        "-UserDataDir", $UserDataDir
    )
    Start-Process -FilePath "powershell.exe" -ArgumentList $watchdogArguments -WindowStyle Hidden
}

Write-Host "Launching Edge debug target..."

$edgeExecutablePath = Get-AppPathFromRegistry -ExecutableName $CartographerEdgeExecutableName
if (-not $edgeExecutablePath) {
    throw "Could not find $CartographerEdgeExecutableName via the Windows App Paths registry key."
}

$userDataDir = New-CartographerEdgeUserDataDir
$edgeProcessId = Start-CartographerEdgeProcess -ExecutablePath $edgeExecutablePath -UserDataDir $userDataDir
Wait-CartographerEdgeCdpReady
Start-CartographerEdgeWatchdog -EdgeProcessId $edgeProcessId -UserDataDir $userDataDir

Write-Host "Edge debug target ready (PID $edgeProcessId); watchdog handed off."
