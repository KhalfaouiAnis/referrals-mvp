#Requires -Version 5.1
<#
.SYNOPSIS
    Deploys the Referrals MVP to a local Minikube cluster on Windows.

.DESCRIPTION
    1. Starts Minikube (4 CPUs / 6 GB RAM) with the nginx-ingress addon
    2. Builds both Docker images inside Minikube's registry
    3. Applies all Kubernetes manifests in dependency order
    4. Waits for every rollout to complete
    5. Adds referrals.local / minio.referrals.local to C:\Windows\System32\drivers\etc\hosts
    6. Runs the database seed inside the running API pod

.PARAMETER Reset
    Delete the existing Minikube cluster before starting fresh.

.EXAMPLE
    .\minikube-deploy.ps1
    .\minikube-deploy.ps1 -Reset
#>
param(
    [switch]$Reset
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Colour helpers
function Write-Step  { param($msg) Write-Host "[deploy] $msg" -ForegroundColor Green  }
function Write-Warn  { param($msg) Write-Host "[warn]   $msg" -ForegroundColor Yellow }
function Write-Fail  { param($msg) Write-Host "[error]  $msg" -ForegroundColor Red; exit 1 }

# Working directory = repo root
$RepoRoot = Split-Path -Parent $PSScriptRoot
$K8sDir   = Join-Path $RepoRoot 'k8s'
Set-Location $RepoRoot

# Prerequisites
Write-Step "Checking prerequisites..."
foreach ($cmd in @('minikube', 'kubectl', 'docker', 'pnpm')) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Fail "'$cmd' is not installed or not on PATH."
    }
}
Write-Step "All prerequisites found."

# Optional reset
if ($Reset) {
    Write-Warn "Deleting existing Minikube cluster..."
    minikube delete 2>$null
}

# Start Minikube
$minikubeStatus = minikube status --format='{{.Host}}' 2>$null
if ($minikubeStatus -ne 'Running') {
    Write-Step "Starting Minikube (4 CPUs, 6 GB RAM)..."
    minikube start `
        --cpus=4 `
        --memory=6144 `
        --disk-size=20g `
        --driver=docker `
        --addons=ingress,ingress-dns,metrics-server
} else {
    Write-Step "Minikube already running."
    minikube addons enable ingress       2>$null
    minikube addons enable ingress-dns   2>$null
    minikube addons enable metrics-server 2>$null
}

$MinikubeIP = (minikube ip).Trim()
Write-Step "Minikube IP: $MinikubeIP"

# Point Docker to Minikube's internal registry
Write-Step "Configuring Docker to use Minikube's registry..."
# minikube docker-env --shell powershell outputs Set-Item env: commands
& minikube docker-env --shell powershell | Invoke-Expression

# Build images
Write-Step "Building API image (referrals-api:latest)..."
docker build `
    -t referrals-api:latest `
    -f (Join-Path $RepoRoot 'apps\api\Dockerfile') `
    $RepoRoot
if ($LASTEXITCODE -ne 0) { Write-Fail "API image build failed." }

Write-Step "Building Web image (referrals-web:latest)..."
docker build `
    -t referrals-web:latest `
    -f (Join-Path $RepoRoot 'apps\web\Dockerfile') `
    --build-arg VITE_API_URL="http://referrals.local" `
    --build-arg VITE_WS_URL="http://referrals.local" `
    $RepoRoot
if ($LASTEXITCODE -ne 0) { Write-Fail "Web image build failed." }

# Apply Kubernetes manifests
Write-Step "Applying Kubernetes manifests..."

$manifests = @(
    'namespace.yaml',
    'configmap.yaml',
    'secrets.yaml',
    'postgres\persistent-volume-claim.yaml',
    'postgres\deployment.yaml',
    'redis\deployment.yaml',
    'minio\persistent-volume-claim.yaml',
    'minio\deployment.yaml'
)
foreach ($m in $manifests) {
    kubectl apply -f (Join-Path $K8sDir $m)
    if ($LASTEXITCODE -ne 0) { Write-Fail "Failed to apply $m" }
}

# Wait for infrastructure
Write-Step "Waiting for infrastructure pods..."
kubectl rollout status deployment/postgres -n referrals --timeout=120s
kubectl rollout status deployment/redis    -n referrals --timeout=60s
kubectl rollout status deployment/minio    -n referrals --timeout=120s

# Deploy application
$appManifests = @(
    'api\deployment.yaml',
    'web\deployment.yaml',
    'ingress.yaml'
)
foreach ($m in $appManifests) {
    kubectl apply -f (Join-Path $K8sDir $m)
    if ($LASTEXITCODE -ne 0) { Write-Fail "Failed to apply $m" }
}

Write-Step "Waiting for application pods..."
kubectl rollout status deployment/api -n referrals --timeout=180s
kubectl rollout status deployment/web -n referrals --timeout=60s

# Update C:\Windows\System32\drivers\etc\hosts
$HostsFile = "$env:SystemRoot\System32\drivers\etc\hosts"
$HostsLine = "$MinikubeIP referrals.local minio.referrals.local"

$existing = Get-Content $HostsFile -ErrorAction SilentlyContinue
if ($existing -match 'referrals\.local') {
    Write-Warn "hosts file already contains referrals.local."
    Write-Warn "If the Minikube IP changed, update it manually:"
    Write-Warn "  $HostsLine"
} else {
    Write-Step "Adding entries to hosts file (requires elevation)..."
    try {
        # Check if running as Administrator
        $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
        if ($isAdmin) {
            Add-Content -Path $HostsFile -Value $HostsLine -Encoding ASCII
            Write-Step "Added: $HostsLine"
        } else {
            # Re-launch this specific step as Administrator
            $addHostsCmd = "Add-Content -Path '$HostsFile' -Value '$HostsLine' -Encoding ASCII"
            Start-Process powershell -ArgumentList "-NoProfile -Command $addHostsCmd" -Verb RunAs -Wait
            Write-Step "Added: $HostsLine"
        }
    } catch {
        Write-Warn "Could not update hosts file automatically."
        Write-Warn "Please add the following line manually to $HostsFile :"
        Write-Warn "  $HostsLine"
    }
}

# Run seed
Write-Step "Running database seed..."
$apiPod = kubectl get pod -n referrals -l app=api -o jsonpath='{.items[0].metadata.name}'
if ($apiPod) {
    kubectl exec -n referrals $apiPod -- node dist/seed/seed.js
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "Seed returned a non-zero exit code (may have already run — non-fatal)."
    }
} else {
    Write-Warn "Could not find API pod to run seed."
}

# Summary
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║       Referrals MVP — deployed on Minikube           ║" -ForegroundColor Green
Write-Host "╠══════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  Web app       http://referrals.local                ║" -ForegroundColor Green
Write-Host "║  API docs      http://referrals.local/api/docs       ║" -ForegroundColor Green
Write-Host "║  MinIO console http://minio.referrals.local          ║" -ForegroundColor Green
Write-Host "║  Health        http://referrals.local/api/v1/health  ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Login: " -NoNewline; Write-Host "sarah.chen@clinic.com" -ForegroundColor Yellow -NoNewline; Write-Host " / " -NoNewline; Write-Host "password123" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Useful commands:"
Write-Host "    kubectl get pods -n referrals"
Write-Host "    kubectl logs -n referrals -l app=api -f"
Write-Host "    kubectl logs -n referrals -l app=web -f"
Write-Host "    minikube dashboard"
Write-Host ""
