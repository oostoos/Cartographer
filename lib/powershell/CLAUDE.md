# lib/powershell/

PowerShell library barrel: `index.psm1`. Import via `Import-Module` rather
than dot-sourcing individual files directly.

## process — generic process/port management primitives

- **`Stop-ProcessOnPort -Port <int>`** — stops whatever process currently
  owns the given local TCP port, if any. No knowledge of any specific
  application or port.
