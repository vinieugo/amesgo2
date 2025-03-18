Set objShell = CreateObject("WScript.Shell")
strDesktop = objShell.SpecialFolders("Desktop")

' Criar atalho para o script PowerShell
Set objShortcut = objShell.CreateShortcut(strDesktop & "\Instalar AMESGO SYSTEM.lnk")
objShortcut.TargetPath = "powershell.exe"
objShortcut.Arguments = "-ExecutionPolicy Bypass -File " & objShell.CurrentDirectory & "\setup-windows.ps1"
objShortcut.Description = "Instalar AMESGO SYSTEM"
objShortcut.IconLocation = "powershell.exe,0"
objShortcut.WindowStyle = 1
objShortcut.WorkingDirectory = objShell.CurrentDirectory
objShortcut.Save

' Criar atalho para o script batch (alternativa)
Set objShortcut = objShell.CreateShortcut(strDesktop & "\Instalar AMESGO SYSTEM (Batch).lnk")
objShortcut.TargetPath = objShell.CurrentDirectory & "\setup-windows.bat"
objShortcut.Description = "Instalar AMESGO SYSTEM (Batch)"
objShortcut.IconLocation = "cmd.exe,0"
objShortcut.WindowStyle = 1
objShortcut.WorkingDirectory = objShell.CurrentDirectory
objShortcut.Save

WScript.Echo "Atalhos criados com sucesso na área de trabalho!" & vbCrLf & vbCrLf & _
             "1. 'Instalar AMESGO SYSTEM' - Executa o instalador PowerShell" & vbCrLf & _
             "2. 'Instalar AMESGO SYSTEM (Batch)' - Executa o instalador Batch" & vbCrLf & vbCrLf & _
             "Clique com o botão direito e selecione 'Executar como administrador' para iniciar a instalação." 