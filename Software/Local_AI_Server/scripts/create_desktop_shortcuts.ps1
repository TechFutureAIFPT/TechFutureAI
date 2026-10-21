$WshShell = New-Object -ComObject WScript.Shell
$desktopPaths = @('C:\Users\Admin\OneDrive\Desktop', 'C:\Users\Admin\Desktop')

foreach ($dPath in $desktopPaths) {
    if (Test-Path $dPath) {
        # 1. Shortcut: 1-Click Launch Server & Dashboard
        $shortcut1 = $WshShell.CreateShortcut((Join-Path $dPath "SupportHR Local AI & Studio.lnk"))
        $shortcut1.TargetPath = "D:\cv match\Software\Local_AI_Server\start_server.bat"
        $shortcut1.WorkingDirectory = "D:\cv match\Software\Local_AI_Server"
        $shortcut1.Description = "Khoi dong SupportHR Local AI Server va mo Dashboard quan ly du lieu"
        $shortcut1.IconLocation = "$env:SystemRoot\System32\shell32.dll,220"
        $shortcut1.Save()

        # 2. Shortcut: Direct Dashboard Web Link
        $shortcut2 = $WshShell.CreateShortcut((Join-Path $dPath "SupportHR Database Explorer.lnk"))
        $shortcut2.TargetPath = "D:\cv match\Software\Local_AI_Server\open_dashboard.bat"
        $shortcut2.WorkingDirectory = "D:\cv match\Software\Local_AI_Server"
        $shortcut2.Description = "Mo Database Studio SQLite local tren trinh duyet"
        $shortcut2.IconLocation = "$env:SystemRoot\System32\shell32.dll,13"
        $shortcut2.Save()

        # 3. Direct Batch Files
        Copy-Item -Path "D:\cv match\Software\Local_AI_Server\start_server.bat" -Destination (Join-Path $dPath "Chay_Local_AI_Server.bat") -Force
        Copy-Item -Path "D:\cv match\Software\Local_AI_Server\open_dashboard.bat" -Destination (Join-Path $dPath "Mo_Database_Dashboard.bat") -Force

        Write-Host "[OK] Da tao thanh cong bieu tuong tren Desktop: $dPath"
    }
}
