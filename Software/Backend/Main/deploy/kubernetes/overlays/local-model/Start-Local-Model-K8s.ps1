$ErrorActionPreference = 'Stop'
$clusterName = 'supporthr-cvlocal'
$backendRoot = (Resolve-Path (Join-Path $PSScriptRoot '../../../..')).Path
$modelsPath = Join-Path $env:USERPROFILE '.ollama/models'
$dataPath = Join-Path $backendRoot '.cache/k8s-local-data'
$ollamaDataPath = Join-Path $backendRoot '.cache/ollama-k8s-data'
$kindConfigPath = Join-Path $backendRoot '.cache/kind-local-model.yaml'

if (-not (Test-Path -LiteralPath (Join-Path $modelsPath 'blobs/sha256-fa9274857798b6a7dab38e58b42aafdc4fdf382e493167c0c3c24822b1323c66'))) { throw "The local v2 model weights were not found in $modelsPath." }
if (-not (Test-Path -LiteralPath (Join-Path $modelsPath 'manifests/registry.ollama.ai/library/qwen2.5-coder/7b'))) { throw "Local Ollama model qwen2.5-coder:7b was not found in $modelsPath." }
if (-not (Test-Path -LiteralPath (Join-Path $modelsPath 'manifests/registry.ollama.ai/library/nomic-embed-text/latest'))) { throw "Local Ollama model nomic-embed-text:latest was not found in $modelsPath." }
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Docker CLI is required.' }
if (-not (Get-Command kind -ErrorAction SilentlyContinue)) { throw 'kind is required.' }
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) { throw 'kubectl is required.' }
docker info --format '{{.ServerVersion}}' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Docker Engine is not running. Start Docker Desktop, then rerun this script.' }

$existingClusters = @(kind get clusters)
if ($existingClusters -contains $clusterName) {
    docker exec "$clusterName-control-plane" sh -lc 'test -f /ollama-seed/blobs/sha256-fa9274857798b6a7dab38e58b42aafdc4fdf382e493167c0c3c24822b1323c66 && test -d /supporthr-k8s-data'
    if ($LASTEXITCODE -ne 0) { throw "Existing cluster '$clusterName' is missing the local model or database mounts expected by this setup." }
    Write-Host "Reusing verified local-only cluster '$clusterName'."
}

New-Item -ItemType Directory -Force -Path $dataPath,$ollamaDataPath,(Split-Path -Parent $kindConfigPath) | Out-Null
$modelsPathYaml = $modelsPath.Replace('\', '/')
$dataPathYaml = $dataPath.Replace('\', '/')
$ollamaDataPathYaml = $ollamaDataPath.Replace('\', '/')
$kindConfig = @"
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraMounts:
  - hostPath: "$modelsPathYaml"
    containerPath: /ollama-seed
    readOnly: true
  - hostPath: "$ollamaDataPathYaml"
    containerPath: /ollama-data
  - hostPath: "$dataPathYaml"
    containerPath: /supporthr-k8s-data
"@
Set-Content -LiteralPath $kindConfigPath -Value $kindConfig -Encoding utf8

docker build -t supporthr-backend:local (Join-Path $backendRoot 'api_server')
if ($LASTEXITCODE -ne 0) { throw 'Backend image build failed.' }
docker pull ollama/ollama:0.40.7
if ($LASTEXITCODE -ne 0) { throw 'Failed to pull the Ollama runtime image for the local cluster.' }
if ($existingClusters -notcontains $clusterName) {
    kind create cluster --name $clusterName --config $kindConfigPath
    if ($LASTEXITCODE -ne 0) { throw 'Local kind cluster creation failed.' }
}
kind load docker-image supporthr-backend:local --name $clusterName
if ($LASTEXITCODE -ne 0) { throw 'Failed to load the local backend image into kind.' }
kubectl config use-context "kind-$clusterName"
if ($LASTEXITCODE -ne 0) { throw 'Failed to select the local kind context.' }
kubectl apply -k (Join-Path $PSScriptRoot '.')
if ($LASTEXITCODE -ne 0) { throw 'Failed to apply the local-only Kubernetes overlay.' }
kubectl -n supporthr-local rollout status deployment/local-ollama --timeout=15m
if ($LASTEXITCODE -ne 0) { throw 'Local Ollama deployment did not become ready.' }
kubectl -n supporthr-local rollout status deployment/supporthr-api --timeout=10m
if ($LASTEXITCODE -ne 0) { throw 'Local backend API deployment did not become ready.' }
kubectl -n supporthr-local rollout status deployment/supporthr-worker --timeout=10m
if ($LASTEXITCODE -ne 0) { throw 'Local backend worker deployment did not become ready.' }

Write-Host "Local-only cluster '$clusterName' is ready. Run: kubectl -n supporthr-local port-forward service/supporthr-api 8011:80"
