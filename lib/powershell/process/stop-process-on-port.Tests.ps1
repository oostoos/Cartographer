Describe "Stop-ProcessOnPort" {
    BeforeAll {
        . "$PSScriptRoot/stop-process-on-port.ps1"
    }

    It "does nothing when no connection owns the port" {
        Mock Get-NetTCPConnection { }
        Mock Stop-Process {}

        Stop-ProcessOnPort -Port 9999

        Should -Invoke Stop-Process -Times 0
    }

    It "stops the owning process for a matched connection" {
        Mock Get-NetTCPConnection { [pscustomobject]@{ OwningProcess = 4242 } }
        Mock Get-Process { [pscustomobject]@{ Id = 4242; ProcessName = "node" } }
        Mock Stop-Process {}

        Stop-ProcessOnPort -Port 5173

        Should -Invoke Stop-Process -Times 1 -ParameterFilter { $Id -eq 4242 }
    }

    It "skips process ids that no longer exist" {
        Mock Get-NetTCPConnection { [pscustomobject]@{ OwningProcess = 4242 } }
        Mock Get-Process { $null }
        Mock Stop-Process {}

        Stop-ProcessOnPort -Port 5173

        Should -Invoke Stop-Process -Times 0
    }
}
