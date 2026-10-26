param([switch]$SkipFrontend, [switch]$SkipAdmin, [switch]$AllowAutoSleep)
$ErrorActionPreference = 'Stop'
$taskRoot = $PSScriptRoot
$coreRoot = Join-Path $taskRoot 'Backend/Main/api_server'
$uiRoot = Join-Path $taskRoot 'Frontend/Desktop'
$studioRoot = Join-Path $taskRoot 'Local_AI_Server'
$logRoot = Join-Path $taskRoot 'Backend/Main/.cache/local-runtime'
$runtimeEnv = Join-Path $coreRoot '.env.local-runtime'
New-Item -ItemType Directory -Force -Path $logRoot | Out-Null

$controlToken = $null
if (Test-Path -LiteralPath $runtimeEnv) {
    $tokenLine = Get-Content -LiteralPath $runtimeEnv | Where-Object { $_ -match '^\s*LOCAL_AI_CONTROL_TOKEN\s*=' } | Select-Object -Last 1
    if ($tokenLine) { $controlToken = ($tokenLine -replace '^\s*LOCAL_AI_CONTROL_TOKEN\s*=\s*', '').Trim().Trim('"').Trim("'") }
}
if (-not $controlToken) {
    $tokenBytes = [byte[]]::new(32)
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($tokenBytes)
    $rng.Dispose()
    $controlToken = [Convert]::ToBase64String($tokenBytes).TrimEnd('=').Replace('+','-').Replace('/','_')
    Add-Content -LiteralPath $runtimeEnv -Value "LOCAL_AI_CONTROL_TOKEN='$controlToken'" -Encoding utf8
}

function Assert-FreePort([int]$Port) {
    if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) {
        throw "Port $Port is already in use. The existing process has been preserved."
    }
}

Assert-FreePort 8010
if (-not $SkipFrontend) {
    Assert-FreePort 3010
    if (-not (Test-Path -LiteralPath (Join-Path $uiRoot '.next-local/BUILD_ID'))) {
        throw 'Build the local frontend first. See Backend/Main/LOCAL-SQL-OLLAMA.md.'
    }
}
if (-not $SkipAdmin) { Assert-FreePort 8088 }

$env:NEXT_PUBLIC_RUNTIME_MODE = 'local'
$env:NEXT_PUBLIC_LOCAL_API_URL = 'http://localhost:8010'
$env:NEXT_DIST_DIR = '.next-local'
$env:AUTH_PROVIDER = 'sql'
$env:LOCAL_CORE_API_URL = 'http://localhost:8010'
$env:SQLITE_DB_PATH = Join-Path $studioRoot 'data/supporthr_local.db'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$processes = @()
$core = Start-Process -FilePath (Join-Path $coreRoot '.venv/Scripts/python.exe') -ArgumentList '-u','run_local.py','--port','8010' -WorkingDirectory $coreRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logRoot "$stamp-core.log") -RedirectStandardError (Join-Path $logRoot "$stamp-core-error.log")
$processes += @{ service = 'main-sql-ollama'; pid = $core.Id; url = 'http://localhost:8010/docs' }
if (-not $AllowAutoSleep) {
    $awakeScript = Join-Path $taskRoot 'Keep-AI-Match-Awake.ps1'
    $awake = Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File',('"{0}"' -f $awakeScript),'-TaskProcessId',$core.Id -WindowStyle Hidden -PassThru
    $processes += @{ service = 'temporary-keep-awake'; pid = $awake.Id; url = '' }
}
if (-not $SkipFrontend) {
    $node = (Get-Command node.exe -ErrorAction Stop).Source
    $ui = Start-Process -FilePath $node -ArgumentList 'node_modules/next/dist/bin/next','start','-p','3010','-H','127.0.0.1' -WorkingDirectory $uiRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logRoot "$stamp-ui.log") -RedirectStandardError (Join-Path $logRoot "$stamp-ui-error.log")
    $processes += @{ service = 'desktop-local'; pid = $ui.Id; url = 'http://localhost:3010' }
}
if (-not $SkipAdmin) {
    $env:LOCAL_AI_CONTROL_TOKEN = $controlToken
    $studio = Start-Process -FilePath (Join-Path $studioRoot '.venv/Scripts/python.exe') -ArgumentList '-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8088' -WorkingDirectory $studioRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logRoot "$stamp-admin.log") -RedirectStandardError (Join-Path $logRoot "$stamp-admin-error.log")
    Remove-Item Env:LOCAL_AI_CONTROL_TOKEN
    $processes += @{ service = 'sql-database-studio'; pid = $studio.Id; url = 'http://localhost:8088/admin/login' }
}
@{ startedAt = $stamp; processes = $processes; logs = $logRoot } | ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 -LiteralPath (Join-Path $logRoot 'processes.json')
$processes | ForEach-Object { [pscustomobject]$_ } | Format-Table service,pid,url
Write-Output "Logs: $logRoot"
