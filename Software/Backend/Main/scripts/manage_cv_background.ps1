param(
    [ValidateSet('Install', 'Start', 'Stop', 'Status', 'Uninstall')]
    [string]$Action = 'Status',
    [switch]$UseUserStartup
)

$ErrorActionPreference = 'Stop'
$stateDirectory = Join-Path $env:LOCALAPPDATA 'AI Match\CV Match'
$configPath = Join-Path $stateDirectory 'background.json'
$statusPath = Join-Path $stateDirectory 'status.json'
$pausePath = Join-Path $stateDirectory 'paused'
$runPath = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
$runName = 'AIMatchCVLocal'
$taskName = 'AI Match - CV Match Local'
$supervisorPath = Join-Path $PSScriptRoot 'supervise_cv_ollama.ps1'
$launcherPath = Join-Path $stateDirectory 'launch-hidden.vbs'
$apiEnvironmentPath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\api_server\.env'))
$windowsPowerShell = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$scriptHost = Join-Path $env:SystemRoot 'System32\wscript.exe'
$config = $null
if (Test-Path -LiteralPath $configPath) { $config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json }

function Get-LiveSupervisor {
    if (-not (Test-Path -LiteralPath $statusPath)) { return $null }
    $status = Get-Content -LiteralPath $statusPath -Raw | ConvertFrom-Json
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($status.supervisorPid)" -ErrorAction SilentlyContinue
    if ($null -ne $process -and $process.CommandLine -and $process.CommandLine.IndexOf($supervisorPath, [StringComparison]::OrdinalIgnoreCase) -ge 0) { return $process }
    return $null
}

function Start-Background {
    if ($null -eq $script:config) { throw 'Install the background runtime first.' }
    # This marker is owned exclusively by this installer; no recursive removals.
    if (Test-Path -LiteralPath $pausePath) { [IO.File]::Delete($pausePath) }
    if ($null -ne (Get-LiveSupervisor)) { Write-Output 'Background supervisor is already running.'; return }
    if ($script:config.Autostart -eq 'ScheduledTask') {
        Start-ScheduledTask -TaskName $taskName
    } else {
        # Explorer starts this outside the calling terminal's process/job lifetime.
        $desktopShell = New-Object -ComObject Shell.Application
        $desktopShell.ShellExecute($scriptHost, ('"' + $launcherPath + '"'), $stateDirectory, 'open', 0)
    }
    Write-Output 'Background startup requested.'
}

function Stop-Background {
    if ($null -eq $script:config) { return }
    [IO.File]::WriteAllText($pausePath, 'Paused by the user')
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        if ($null -eq (Get-LiveSupervisor)) { Write-Output 'Background supervisor stopped.'; return }
        Start-Sleep -Seconds 1
    }
    Write-Warning 'Stop is pending until the current model warm-up finishes.'
}

switch ($Action) {
    'Install' {
        $null = New-Item -ItemType Directory -Path $stateDirectory -Force
        $ollama = (Get-Command ollama -ErrorAction Stop).Source
        $tags = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 5
        if ('cv-match:7b' -notin @($tags.models | ForEach-Object { $_.name })) { throw 'Create the cv-match:7b profile before installing background mode.' }
        $identity = [Security.Principal.WindowsIdentity]::GetCurrent().Name
        $arguments = '-NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "' + $supervisorPath + '" -StateDirectory "' + $stateDirectory + '"'
        $command = '"' + $windowsPowerShell + '" ' + $arguments
        $vbsLines = @(
            'Set shell = CreateObject("WScript.Shell")',
            'Set files = CreateObject("Scripting.FileSystemObject")',
            'Do',
            ('  If files.FileExists("' + $pausePath.Replace('"', '""') + '") Then WScript.Quit 0'),
            ('  code = shell.Run("' + $command.Replace('"', '""') + '", 0, True)'),
            '  If code = 0 Then WScript.Quit 0',
            '  WScript.Sleep 15000',
            'Loop'
        )
        $vbs = ($vbsLines -join "`r`n") + "`r`n"
        [IO.File]::WriteAllText($launcherPath, $vbs, [Text.Encoding]::Unicode)
        $autostart = 'ScheduledTask'
        $existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
        if ($null -ne $existingTask -and $existingTask.Actions.Arguments -notcontains $arguments -and ($null -eq $config -or $config.Supervisor -ne $supervisorPath)) { throw 'A different task already uses the CV Match task name.' }
        try {
            if ($UseUserStartup) { throw 'Per-user startup selected.' }
            $taskAction = New-ScheduledTaskAction -Execute $windowsPowerShell -Argument $arguments -WorkingDirectory $stateDirectory
            $trigger = New-ScheduledTaskTrigger -AtLogOn -User $identity
            $principal = New-ScheduledTaskPrincipal -UserId $identity -LogonType Interactive -RunLevel Limited
            $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -MultipleInstances IgnoreNew
            $null = Register-ScheduledTask -TaskName $taskName -Action $taskAction -Trigger $trigger -Principal $principal -Settings $settings -Description 'CV Match local Ollama supervisor. Keeps idle sleep off on AC; screen may turn off. Runs after this user signs in.' -Force
        } catch {
            $autostart = 'UserRunKey'
            if ($existingTask -and $config -and $config.Supervisor -eq $supervisorPath) {
                Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
            }
            $runCommand = '"' + $scriptHost + '" "' + $launcherPath + '"'
            $existingRun = (Get-ItemProperty -LiteralPath $runPath -Name $runName -ErrorAction SilentlyContinue).$runName
            if ($existingRun -and $existingRun -ne $runCommand) { throw 'A different startup entry already uses the CV Match name.' }
            $null = New-Item -Path $runPath -Force
            $null = New-ItemProperty -LiteralPath $runPath -Name $runName -PropertyType String -Value $runCommand -Force
            Write-Output 'Installed hidden Windows startup for the current user.'
        }
        $config = [pscustomobject]@{
            Model = 'cv-match:7b'; Context = 8192; OllamaPath = $ollama
            Autostart = $autostart; TaskName = $taskName; Supervisor = $supervisorPath
            InstalledAt = (Get-Date).ToUniversalTime().ToString('o')
            PreviousKeepAlive = $(if ($config -and $config.PSObject.Properties.Name -contains 'PreviousKeepAlive') { $config.PreviousKeepAlive } else {
                $previousLine = $(if (Test-Path -LiteralPath $apiEnvironmentPath) { [IO.File]::ReadAllLines($apiEnvironmentPath) | Where-Object { $_ -match '^LOCAL_CV_KEEP_ALIVE=' } | Select-Object -Last 1 })
                if ($previousLine) { $previousLine.Substring('LOCAL_CV_KEEP_ALIVE='.Length) } else { $null }
            })
        }
        [IO.File]::WriteAllText($configPath, ($config | ConvertTo-Json), [Text.UTF8Encoding]::new($false))
        if (Test-Path -LiteralPath $apiEnvironmentPath) {
            $lines = @([IO.File]::ReadAllLines($apiEnvironmentPath))
            if ($lines -match '^LOCAL_CV_KEEP_ALIVE=') {
                $lines = @($lines | ForEach-Object { if ($_ -match '^LOCAL_CV_KEEP_ALIVE=') { 'LOCAL_CV_KEEP_ALIVE=24h' } else { $_ } })
            } else { $lines += 'LOCAL_CV_KEEP_ALIVE=24h' }
            [IO.File]::WriteAllLines($apiEnvironmentPath, [string[]]$lines, [Text.UTF8Encoding]::new($false))
        }
        Start-Background
    }
    'Start' { Start-Background }
    'Stop' { Stop-Background }
    'Status' {
        $live = Get-LiveSupervisor
        [pscustomobject]@{ Installed = ($null -ne $config -and $config.Autostart -ne 'Disabled'); Running = ($null -ne $live); PID = $(if ($live) { $live.ProcessId } else { $null }); Autostart = $(if ($config) { $config.Autostart } else { '' }); StateDirectory = $stateDirectory }
        if (Test-Path -LiteralPath $statusPath) { Get-Content -LiteralPath $statusPath -Raw }
    }
    'Uninstall' {
        Stop-Background
        if ($config -and $config.Autostart -eq 'ScheduledTask') { Unregister-ScheduledTask -TaskName $taskName -Confirm:$false }
        $expectedRun = '"' + $scriptHost + '" "' + $launcherPath + '"'
        $actualRun = (Get-ItemProperty -LiteralPath $runPath -Name $runName -ErrorAction SilentlyContinue).$runName
        if ($actualRun -eq $expectedRun) { Remove-ItemProperty -LiteralPath $runPath -Name $runName }
        if ($config -and $config.PSObject.Properties.Name -contains 'PreviousKeepAlive' -and (Test-Path -LiteralPath $apiEnvironmentPath)) {
            $lines = @([IO.File]::ReadAllLines($apiEnvironmentPath) | ForEach-Object {
                if ($_ -eq 'LOCAL_CV_KEEP_ALIVE=24h') {
                    if ($null -ne $config.PreviousKeepAlive) { 'LOCAL_CV_KEEP_ALIVE=' + $config.PreviousKeepAlive }
                } else { $_ }
            })
            [IO.File]::WriteAllLines($apiEnvironmentPath, [string[]]$lines, [Text.UTF8Encoding]::new($false))
        }
        if ($config) {
            $config.Autostart = 'Disabled'
            [IO.File]::WriteAllText($configPath, ($config | ConvertTo-Json), [Text.UTF8Encoding]::new($false))
        }
        Write-Output 'Autostart removed. Logs/configuration retained; background is paused.'
    }
}
