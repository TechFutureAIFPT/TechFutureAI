param([string]$StateDirectory = (Join-Path $env:LOCALAPPDATA 'AI Match\CV Match'))

$ErrorActionPreference = 'Stop'
trap {
    try { Add-Content -LiteralPath (Join-Path $StateDirectory 'bootstrap-error.log') -Value ((Get-Date -Format 'o') + ' ' + $_.ToString()) -Encoding UTF8 } catch { }
    exit 1
}
$configPath = Join-Path $StateDirectory 'background.json'
$statusPath = Join-Path $StateDirectory 'status.json'
$pausePath = Join-Path $StateDirectory 'paused'
$config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
$logDirectory = Join-Path $StateDirectory 'logs'
$null = New-Item -ItemType Directory -Path $logDirectory -Force
$mutex = [Threading.Mutex]::new($false, ('Local\AIMatchCV-' + [Security.Principal.WindowsIdentity]::GetCurrent().User.Value))
if (-not $mutex.WaitOne(0)) { $mutex.Dispose(); exit 0 }

function Write-ServiceLog([string]$Message) {
    $path = Join-Path $logDirectory ('supervisor-' + (Get-Date -Format 'yyyy-MM-dd') + '.log')
    Add-Content -LiteralPath $path -Value ((Get-Date -Format 'o') + ' ' + $Message) -Encoding UTF8
}

function Write-ServiceStatus([string]$Phase, [bool]$OnAC, [bool]$Online) {
    $payload = @{
        supervisorPid = $PID; updatedAt = (Get-Date).ToUniversalTime().ToString('o')
        phase = $Phase; onAC = $OnAC; idleSleepBlocked = $OnAC; ollamaOnline = $Online
        model = $config.Model; ollamaPid = $(if ($null -ne $script:ownedProcess) { $script:ownedProcess.Id } else { $null })
    } | ConvertTo-Json
    $temporary = $statusPath + '.tmp'
    [IO.File]::WriteAllText($temporary, $payload, [Text.UTF8Encoding]::new($false))
    Move-Item -LiteralPath $temporary -Destination $statusPath -Force
}

function Stop-OwnedModelRunners([int]$DaemonId, [datetime]$StartedAt, [datetime]$ExitedAt) {
    # Windows may leave the CUDA runner alive after a daemon crash. Only clean up
    # verified children of our daemon, created since that daemon was started.
    $expectedRunner = Join-Path (Split-Path -Parent $config.OllamaPath) 'lib\ollama\llama-server.exe'
    $children = Get-CimInstance Win32_Process -Filter "ParentProcessId = $DaemonId" -ErrorAction SilentlyContinue
    foreach ($child in $children) {
        if ($child.ExecutablePath -eq $expectedRunner -and $child.CreationDate -ge $StartedAt.AddSeconds(-1) -and $child.CreationDate -le $ExitedAt) {
            Stop-Process -Id $child.ProcessId -ErrorAction SilentlyContinue
            Write-ServiceLog "Released orphan model runner $($child.ProcessId) from owned daemon $DaemonId."
        }
    }
}

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
namespace AIMatch.LocalCV {
    [StructLayout(LayoutKind.Sequential)]
    public struct PowerStatus {
        public byte ACLineStatus, BatteryFlag, BatteryLifePercent, SystemStatusFlag;
        public uint BatteryLifeTime, BatteryFullLifeTime;
    }
    public static class Power {
        [DllImport("kernel32.dll", SetLastError=true)]
        public static extern bool GetSystemPowerStatus(out PowerStatus status);
        [DllImport("kernel32.dll", SetLastError=true)]
        public static extern uint SetThreadExecutionState(uint flags);
    }
}
'@

$env:OLLAMA_HOST = '127.0.0.1:11434'
$env:OLLAMA_NO_CLOUD = '1'
$env:OLLAMA_NUM_PARALLEL = '1'
$env:OLLAMA_MAX_LOADED_MODELS = '1'
$env:OLLAMA_FLASH_ATTENTION = '1'
$env:OLLAMA_KV_CACHE_TYPE = 'q8_0'
$env:OLLAMA_KEEP_ALIVE = '24h'
$ownedProcess = $null
$ownedStartedAt = [datetime]::MinValue
$lastPhase = ''
$lastWarm = [datetime]::MinValue
$exitCode = 0

try {
    Write-ServiceLog 'Supervisor started. Idle sleep is blocked on AC only; display and manual Sleep remain controlled by Windows.'
    while (-not (Test-Path -LiteralPath $pausePath)) {
        $power = [AIMatch.LocalCV.PowerStatus]::new()
        $onAC = [AIMatch.LocalCV.Power]::GetSystemPowerStatus([ref]$power) -and $power.ACLineStatus -eq 1
        $flags = [uint32]2147483648
        if ($onAC) { $flags = [uint32]2147483649 }
        if ([AIMatch.LocalCV.Power]::SetThreadExecutionState($flags) -eq 0) {
            throw 'Windows rejected the idle-sleep power request.'
        }
        $online = $false
        $phase = 'waiting'
        try {
            $tags = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 5
            $online = $true
            if ($config.Model -notin @($tags.models | ForEach-Object { $_.name })) {
                throw "Configured CV profile is not installed: $($config.Model)"
            }
            $phase = 'ready'
        } catch {
            if ($online) { throw }
            if ($null -eq $ownedProcess -or $ownedProcess.HasExited) {
                if ($null -ne $ownedProcess) {
                    Stop-OwnedModelRunners $ownedProcess.Id $ownedStartedAt (Get-Date)
                }
                $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
                $ownedProcess = Start-Process -FilePath $config.OllamaPath -ArgumentList 'serve' -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDirectory "ollama-$stamp.out.log") -RedirectStandardError (Join-Path $logDirectory "ollama-$stamp.err.log")
                $ownedStartedAt = $ownedProcess.StartTime
                $lastWarm = [datetime]::MinValue
                Write-ServiceLog "Started hidden Ollama process $($ownedProcess.Id)."
                $phase = 'starting'
            }
        }
        Write-ServiceStatus $phase $onAC $online
        if ($phase -ne $lastPhase) {
            Write-ServiceLog "State: $phase; AC power: $onAC."
            $lastPhase = $phase
        }
        if ($online -and ((Get-Date) - $lastWarm).TotalHours -ge 4) {
            try {
                $body = @{ model = $config.Model; stream = $false; keep_alive = '24h'; options = @{ num_ctx = [int]$config.Context } } | ConvertTo-Json -Depth 4
                $null = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/generate' -Method Post -ContentType 'application/json' -Body $body -TimeoutSec 60
                $lastWarm = Get-Date
                Write-ServiceLog 'CV profile loaded; model idle timeout is 24 hours.'
            } catch {
                # Do not kill a busy shared daemon or fall back to a cloud model.
                $lastWarm = (Get-Date).AddHours(-4).AddMinutes(5)
                Write-ServiceLog ('Warm-up delayed: ' + $_.Exception.Message)
            }
        }
        for ($tick = 0; $tick -lt 15; $tick++) {
            if (Test-Path -LiteralPath $pausePath) { break }
            Start-Sleep -Seconds 1
        }
    }
} catch {
    Write-ServiceLog ('Supervisor failed: ' + $_.Exception.Message)
    $exitCode = 1
} finally {
    $null = [AIMatch.LocalCV.Power]::SetThreadExecutionState([uint32]2147483648)
    try {
        if ($null -ne $ownedProcess -and -not $ownedProcess.HasExited) {
            Stop-Process -Id $ownedProcess.Id -ErrorAction SilentlyContinue
            $null = $ownedProcess.WaitForExit(3000)
        }
        if ($null -ne $ownedProcess -and $ownedProcess.HasExited) {
            Stop-OwnedModelRunners $ownedProcess.Id $ownedStartedAt (Get-Date)
        }
    } catch {
        Write-ServiceLog ('Runner cleanup needs review: ' + $_.Exception.Message)
    }
    Write-ServiceStatus 'stopped' $false $false
    Write-ServiceLog 'Supervisor stopped; its power request was released.'
    $mutex.ReleaseMutex()
    $mutex.Dispose()
}
exit $exitCode
