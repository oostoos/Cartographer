' Silent launcher for the desktop/taskbar shortcut: hides the PowerShell window so only the
' minimized "npm run dev" window (started by start-cartographer.ps1) is visible. Point a shortcut
' at this file directly and it never needs to change, even if start-cartographer.ps1's logic does.
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
psPath = scriptDir & "\start-cartographer.ps1"

shell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -File """ & psPath & """", 0, False
