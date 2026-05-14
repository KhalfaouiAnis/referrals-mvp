#Requires -Version 5.1
<#
.SYNOPSIS
    Removes the referrals namespace from the running Minikube cluster.

.DESCRIPTION
    Deletes all workloads, services, PVCs and config in the 'referrals'
    namespace. The Minikube cluster itself keeps running.

.PARAMETER DeleteCluster
    Also stop and delete the entire Minikube cluster (not just the namespace).

.EXAMPLE
    .\minikube-teardown.ps1
    .\minikube-teardown.ps1 -DeleteCluster
#>
param(
    [switch]$DeleteCluster
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step { param($msg) Write-Host "[teardown] $msg" -ForegroundColor Green  }
function Write-Warn { param($msg) Write-Host "[warn]     $msg" -ForegroundColor Yellow }

Write-Step "Deleting namespace 'referrals'..."
kubectl delete namespace referrals --ignore-not-found=true
Write-Step "Namespace deleted."

if ($DeleteCluster) {
    Write-Warn "Stopping and deleting Minikube cluster..."
    minikube delete
    Write-Step "Minikube cluster deleted."
} else {
    Write-Step "Minikube cluster is still running."
    Write-Host ""
    Write-Host "  To stop Minikube:   minikube stop"
    Write-Host "  To destroy Minikube: minikube delete"
}
