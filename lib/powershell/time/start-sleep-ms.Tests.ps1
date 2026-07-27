Describe "Start-SleepMs" {
    BeforeAll {
        . "$PSScriptRoot/start-sleep-ms.ps1"
    }

    It "delegates to Start-Sleep with the given millisecond count" {
        Mock Start-Sleep {}

        Start-SleepMs 250

        Should -Invoke Start-Sleep -Times 1 -ParameterFilter { $Milliseconds -eq 250 }
    }
}
