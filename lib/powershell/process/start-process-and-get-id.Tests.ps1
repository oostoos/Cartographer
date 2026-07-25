Describe "Start-ProcessAndGetId" {
    BeforeAll {
        . "$PSScriptRoot/start-process-and-get-id.ps1"
    }

    It "returns the new process's id and forwards FilePath/ArgumentList to Start-Process" {
        Mock Start-Process { [pscustomobject]@{ Id = 1234 } }

        $result = Start-ProcessAndGetId -FilePath "C:\app.exe" -ArgumentList @("--flag")

        $result | Should -Be 1234
        Should -Invoke Start-Process -Times 1 -ParameterFilter {
            $FilePath -eq "C:\app.exe" -and $ArgumentList -contains "--flag" -and $PassThru -eq $true
        }
    }

    It "propagates an exception when Start-Process fails" {
        Mock Start-Process { throw "could not start process" }

        { Start-ProcessAndGetId -FilePath "C:\does-not-exist.exe" } | Should -Throw
    }
}
