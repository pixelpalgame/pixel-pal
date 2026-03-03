Dim WshShell, gameDir
Set WshShell = CreateObject("WScript.Shell")
gameDir = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))
WshShell.Run """" & gameDir & "LAUNCH_GAME.bat""", 0, False
