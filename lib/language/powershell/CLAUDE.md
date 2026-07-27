# lib/powershell/

PowerShell library barrel: `index.psm1`. Import via `Import-Module` rather
than dot-sourcing individual files directly.

## time — generic time-pausing primitives

- **`Start-SleepMs <int>`** — thin wrapper around `Start-Sleep -Milliseconds`
  taking a positional millisecond duration. No knowledge of what the pause
  is for.

## process — generic process/port management primitives

- **`Stop-ProcessOnPort -Port <int>`** — stops whatever process currently
  owns the given local TCP port, if any. No knowledge of any specific
  application or port.
- **`Wait-ProcessExit -ProcessId <int> [-PollIntervalMilliseconds <int>] [-TimeoutSeconds <int>] -> bool`**
  — blocks until the given process id is no longer running. Returns `$true`
  once it's gone (or was already gone), `$false` if `TimeoutSeconds` (0 =
  wait indefinitely) elapses first.
- **`Start-ProcessAndGetId -FilePath <string> [-ArgumentList <string[]>] [-WorkingDirectory <string>] -> int`**
  — thin `Start-Process -PassThru` wrapper that starts a process and returns
  its process id.

## network — generic network readiness primitives

- **`Wait-HttpEndpointReady -Uri <string> [-TimeoutSeconds <int>] [-PollIntervalMilliseconds <int>] -> bool`**
  — polls `Uri` with an HTTP GET until a request succeeds. Returns `$true`
  once it does, `$false` if `TimeoutSeconds` elapses first.

## windows — generic Windows OS primitives

- **`Get-AppPathFromRegistry -ExecutableName <string> -> string?`** — looks
  up an executable's installed path via the Windows "App Paths" registry key
  (`HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\<name>`).
  Returns `$null` if the executable isn't registered.
