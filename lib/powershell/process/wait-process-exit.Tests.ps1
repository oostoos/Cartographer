Describe "Wait-ProcessExit" {
    BeforeAll {
        . "$PSScriptRoot/wait-process-exit.ps1"
    }

    It "returns true immediately when the process is already gone" {
        Mock Get-Process { $null }
        Mock Start-Sleep {}

        $result = Wait-ProcessExit -ProcessId 9999

        $result | Should -Be $true
        Should -Invoke Start-Sleep -Times 0
    }

    It "polls until the process exits, then returns true" {
        $script:callCount = 0
        Mock Get-Process {
            $script:callCount++
            if ($script:callCount -le 2) { [pscustomobject]@{ Id = 4242 } } else { $null }
        }
        Mock Start-Sleep {}

        $result = Wait-ProcessExit -ProcessId 4242

        $result | Should -Be $true
        Should -Invoke Start-Sleep -Times 2
    }

    It "returns false once the timeout elapses while the process is still running" {
        Mock Get-Process { [pscustomobject]@{ Id = 4242 } }
        Mock Start-Sleep {}
        $script:fakeNow = Get-Date "2024-01-01T00:00:00"
        Mock Get-Date {
            $script:fakeNow = $script:fakeNow.AddSeconds(1)
            return $script:fakeNow
        }

        $result = Wait-ProcessExit -ProcessId 4242 -TimeoutSeconds 1

        $result | Should -Be $false
    }
}
