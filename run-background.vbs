' Explore Wings Digital Technologies - Silent Background Launcher
' Starts the web server in the background without any command prompt or PowerShell window.
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

nodePath = "C:\Users\NAVANEETH\.gemini\antigravity\brain\454a8e99-f6d8-4c8e-9da4-ed550db5fcf8\scratch\node\node-v22.23.4-win-x64"

cmd = "cmd.exe /c ""set PATH=" & nodePath & ";%PATH% && cd /d """ & scriptDir & """ && node server.js"""

' Run completely hidden (window style 0, no wait)
WshShell.Run cmd, 0, False

WScript.Sleep 1000

' Open browser automatically
WshShell.Run "http://localhost:3000", 1, False
