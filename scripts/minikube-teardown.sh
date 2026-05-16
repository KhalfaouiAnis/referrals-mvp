#!/usr/bin/env bash
# Tears down the referrals namespace (keeps minikube running)
set -euo pipefail

NAMESPACE="referrals"
GREEN='\033[0;32m'; NC='\033[0m'

echo -e "${GREEN}[teardown]${NC} Deleting namespace '${NAMESPACE}'…"
kubectl delete namespace "${NAMESPACE}" --ignore-not-found=true

echo -e "${GREEN}[teardown]${NC} Done. Minikube cluster is still running."
echo "  To stop minikube: minikube stop"
echo "  To destroy minikube: minikube delete"
