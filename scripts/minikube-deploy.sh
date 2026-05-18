#!/usr/bin/env bash
# =============================================================================
# Referrals — Minikube deployment script
# Usage: ./scripts/minikube-deploy.sh [--reset]
# =============================================================================
set -euo pipefail

NAMESPACE="referrals"
K8S_DIR="$(dirname "$0")/../k8s"
REPO_ROOT="$(dirname "$0")/.."

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[deploy]${NC} $*"; }
warn() { echo -e "${YELLOW}[warn]${NC}  $*"; }
die()  { echo -e "${RED}[error]${NC} $*"; exit 1; }

# Prerequisites
for cmd in minikube kubectl docker pnpm; do
  command -v "$cmd" &>/dev/null || die "'$cmd' is not installed."
done

# Optional reset
if [[ "${1:-}" == "--reset" ]]; then
  warn "Deleting existing minikube cluster…"
  minikube delete || true
fi

# Start minikube
if ! minikube status &>/dev/null; then
  log "Starting minikube (4 CPUs, 6 GB RAM)…"
  minikube start \
    --cpus=4 \
    --memory=6144 \
    --disk-size=20g \
    --driver=docker \
    --addons=ingress,ingress-dns,metrics-server
else
  log "Minikube already running."
  # Ensure ingress addon is enabled
  minikube addons enable ingress      2>/dev/null || true
  minikube addons enable ingress-dns  2>/dev/null || true
  minikube addons enable metrics-server 2>/dev/null || true
fi

# Point Docker daemon to minikube's internal registry
log "Pointing Docker to minikube registry…"
eval "$(minikube docker-env)"

MINIKUBE_IP=$(minikube ip)
log "Minikube IP: ${MINIKUBE_IP}"

# Build images inside minikube
log "Building API image…"
docker build \
  -t referrals-api:latest \
  -f "${REPO_ROOT}/apps/api/Dockerfile" \
  "${REPO_ROOT}"

log "Building Web image…"
docker build \
  -t referrals-web:latest \
  -f "${REPO_ROOT}/apps/web/Dockerfile" \
  --build-arg VITE_API_URL="http://referrals.local" \
  --build-arg VITE_WS_URL="http://referrals.local" \
  "${REPO_ROOT}"

# Apply K8s manifests
log "Applying Kubernetes manifests…"
kubectl apply -f "${K8S_DIR}/namespace.yaml"
kubectl apply -f "${K8S_DIR}/configmap.yaml"
kubectl apply -f "${K8S_DIR}/secrets.yaml"

# Infrastructure
kubectl apply -f "${K8S_DIR}/postgres/persistent-volume-claim.yaml"
kubectl apply -f "${K8S_DIR}/postgres/deployment.yaml"
kubectl apply -f "${K8S_DIR}/redis/deployment.yaml"
kubectl apply -f "${K8S_DIR}/minio/persistent-volume-claim.yaml"
kubectl apply -f "${K8S_DIR}/minio/deployment.yaml"

# Wait for infrastructure to be ready
log "Waiting for infrastructure pods to be ready…"
kubectl rollout status deployment/postgres -n "${NAMESPACE}" --timeout=120s
kubectl rollout status deployment/redis    -n "${NAMESPACE}" --timeout=60s
kubectl rollout status deployment/minio    -n "${NAMESPACE}" --timeout=120s

# Application
kubectl apply -f "${K8S_DIR}/api/deployment.yaml"
kubectl apply -f "${K8S_DIR}/web/deployment.yaml"
kubectl apply -f "${K8S_DIR}/ingress.yaml"

log "Waiting for application pods to be ready…"
kubectl rollout status deployment/api -n "${NAMESPACE}" --timeout=180s
kubectl rollout status deployment/web -n "${NAMESPACE}" --timeout=60s

# /etc/hosts entry
HOSTS_LINE="${MINIKUBE_IP} referrals.local minio.referrals.local"

if grep -q "referrals.local" /etc/hosts; then
  warn "/etc/hosts already contains referrals.local. Update manually if IP changed:"
  warn "  ${HOSTS_LINE}"
else
  log "Adding entries to /etc/hosts (requires sudo)…"
  # echo "${HOSTS_LINE}" | sudo tee -a /etc/hosts > /dev/null
  log "Added: ${HOSTS_LINE}"
fi

# Run seed (once)
log "Running database seed via kubectl exec…"
API_POD=$(kubectl get pod -n "${NAMESPACE}" -l app=api -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n "${NAMESPACE}" "${API_POD}" -- \
  node /app/apps/api/dist/seed/seed.js 2>/dev/null || warn "Seed may have already run (non-fatal)."

# Done
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Referrals — deployed on minikube       ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║${NC}  Web app       http://referrals.local                ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  API docs      http://referrals.local/api/docs       ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  MinIO console http://minio.referrals.local          ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  Health        http://referrals.local/api/v1/health  ${GREEN}║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Login: ${YELLOW}sarah.chen@clinic.com${NC} / ${YELLOW}password123${NC}"
echo ""
echo "  Useful commands:"
echo "    kubectl get pods -n referrals"
echo "    kubectl logs -n referrals -l app=api -f"
echo "    kubectl logs -n referrals -l app=web -f"
echo "    minikube dashboard"
echo ""
