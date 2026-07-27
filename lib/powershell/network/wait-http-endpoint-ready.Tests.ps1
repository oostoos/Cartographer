Describe "Wait-HttpEndpointReady" {
    BeforeAll {
        . "$PSScriptRoot/../time/start-sleep-ms.ps1"
        . "$PSScriptRoot/wait-http-endpoint-ready.ps1"
    }

    It "returns true immediately when the endpoint responds on the first try" {
        Mock Invoke-WebRequest { [pscustomobject]@{ StatusCode = 200 } }
        Mock Start-SleepMs {}

        $result = Wait-HttpEndpointReady -Uri "http://localhost:9222/json/version"

        $result | Should -Be $true
        Should -Invoke Start-SleepMs -Times 0
    }

    It "keeps polling until the endpoint responds, then returns true" {
        $script:callCount = 0
        Mock Invoke-WebRequest {
            $script:callCount++
            if ($script:callCount -le 2) { throw "connection refused" }
            [pscustomobject]@{ StatusCode = 200 }
        }
        Mock Start-SleepMs {}

        $result = Wait-HttpEndpointReady -Uri "http://localhost:9222/json/version"

        $result | Should -Be $true
        Should -Invoke Start-SleepMs -Times 2
    }

    It "returns false once the timeout elapses while the endpoint never responds" {
        Mock Invoke-WebRequest { throw "connection refused" }
        Mock Start-SleepMs {}
        $script:fakeNow = Get-Date "2024-01-01T00:00:00"
        Mock Get-Date {
            $script:fakeNow = $script:fakeNow.AddSeconds(1)
            return $script:fakeNow
        }

        $result = Wait-HttpEndpointReady -Uri "http://localhost:9222/json/version" -TimeoutSeconds 1

        $result | Should -Be $false
    }
}
