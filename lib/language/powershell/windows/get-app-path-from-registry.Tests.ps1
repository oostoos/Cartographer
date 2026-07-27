Describe "Get-AppPathFromRegistry" {
    BeforeAll {
        . "$PSScriptRoot/get-app-path-from-registry.ps1"
    }

    It "returns the registered path for a registered executable" {
        $fakeKey = [pscustomobject]@{}
        $fakeKey | Add-Member -MemberType ScriptMethod -Name GetValue -Value {
            param($name)
            "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
        }
        Mock Get-Item { $fakeKey }

        $result = Get-AppPathFromRegistry -ExecutableName "msedge.exe"

        $result | Should -Be "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
    }

    It "returns null when the executable is not registered" {
        Mock Get-Item { $null }

        $result = Get-AppPathFromRegistry -ExecutableName "does-not-exist.exe"

        $result | Should -Be $null
    }
}
