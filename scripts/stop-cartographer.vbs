' Silent companion to start-cartographer.vbs, for an optional "Stop Cartographer" shortcut. Usually
' unnecessary — closing the minimized "npm run dev" window is enough — but useful as a clean sweep
' if that ever leaves an orphaned backend or frontend process behind.
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
psPath = scriptDir & "\stop-cartographer.ps1"

shell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -File """ & psPath & """", 0, True
