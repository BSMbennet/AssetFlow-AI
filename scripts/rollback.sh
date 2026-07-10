#!/bin/bash
# ============================================
# ASSETFLOW AI - Rollback Script
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT=${1:-dev}
TARGET_VERSION=${2:-latest}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}⏪ AssetFlow AI Rollback${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Environment: ${GREEN}$ENVIRONMENT${NC}"
echo -e "Target version: ${GREEN}$TARGET_VERSION${NC}"
echo -e ""

# Confirm rollback
echo -e "${RED}⚠️  WARNING: This will rollback to version $TARGET_VERSION${NC}"
read -p "Are you sure? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Rollback cancelled${NC}"
    exit 0
fi

# Load environment
if [ -f ".env.${ENVIRONMENT}" ]; then
    source .env.${ENVIRONMENT}
elif [ -f ".env" ]; then
    source .env
else
    echo -e "${RED}❌ No .env file found${NC}"
    exit 1
fi

# Rollback Kubernetes deployments
if command -v kubectl >/dev/null 2>&1; then
    echo -e "${BLUE}☸️  Rolling back Kubernetes deployments...${NC}"
    
    # Get previous revision
    PREVIOUS_REVISION=$(kubectl rollout history deployment/assetflow-api --namespace=assetflow | grep -v "REVISION" | tail -1 | awk '{print $1}')
    
    if [ ! -z "$PREVIOUS_REVISION" ]; then
        echo -e "Rolling back API to revision $PREVIOUS_REVISION"
        kubectl rollout undo deployment/assetflow-api --namespace=assetflow --to-revision=$PREVIOUS_REVISION
    else
        echo -e "${YELLOW}⚠️  No previous revision found for API${NC}"
    fi
    
    # Wait for rollout
    kubectl rollout status deployment/assetflow-api --namespace=assetflow --timeout=3m
    kubectl rollout status deployment/assetflow-ai --namespace=assetflow --timeout=3m
    kubectl rollout status deployment/assetflow-web --namespace=assetflow --timeout=3m
    
    echo -e "${GREEN}✅ Rollback complete${NC}"
fi

# Rollback database migrations (if needed)
echo -e "${BLUE}🗄️  Checking database migrations...${NC}"
if [ -f "packages/database/prisma/migrations" ]; then
    echo -e "${YELLOW}⚠️  Database migrations may need manual rollback${NC}"
    echo -e "Run: npx prisma migrate reset --schema=./packages/database/prisma/schema.prisma"
fi

# Verify rollback
echo -e "${BLUE}🔍 Verifying rollback...${NC}"
if command -v kubectl >/dev/null 2>&1; then
    kubectl get pods --namespace=assetflow
    kubectl get services --namespace=assetflow
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Rollback complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Environment: ${GREEN}$ENVIRONMENT${NC}"
echo -e "Target version: ${GREEN}$TARGET_VERSION${NC}"
echo -e "Rollback time: ${GREEN}$(date)${NC}"
echo -e ""