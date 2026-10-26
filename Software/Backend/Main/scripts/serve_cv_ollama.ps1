$ErrorActionPreference = 'Stop'

# Settings are scoped to this terminal/process, never written to the user registry.
$env:OLLAMA_HOST = '127.0.0.1:11434'
$env:OLLAMA_NO_CLOUD = '1'
$env:OLLAMA_NUM_PARALLEL = '1'
$env:OLLAMA_MAX_LOADED_MODELS = '1'
$env:OLLAMA_FLASH_ATTENTION = '1'
$env:OLLAMA_KV_CACHE_TYPE = 'q8_0'

$runtime = Get-Command ollama -ErrorAction Stop
try {
    $null = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2
    Write-Host 'Ollama is already running. Reusing it; this script has not changed its launch settings.'
    exit 0
} catch {
    if ($_.Exception -is [System.Management.Automation.CommandNotFoundException]) { throw }
}

& $runtime.Source serve
exit $LASTEXITCODE
