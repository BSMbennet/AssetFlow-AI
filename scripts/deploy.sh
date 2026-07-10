#!/bin/bash
# ============================================
# ASSETFLOW AI - Deployment Script
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
REGISTRY=${2:-docker.io}
PROJECT_NAME="assetflow"
VERSION=$(git describe --tags --always --dirty 2>/dev/null || echo "latest")

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 AssetFlow AI Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Environment: ${GREEN}$ENVIRONMENT${NC}"
echo -e "Registry: ${GREEN}$REGISTRY${NC}"
echo -e "Version: ${GREEN}$VERSION${NC}"
echo -e ""

# Validate environment
case $ENVIRONMENT in
    dev|staging|prod)
        echo -e "${GREEN}✅ Environment validated${NC}"
        ;;
    *)
        echo -e "${RED}❌ Invalid environment. Use: dev, staging, or prod${NC}"
        exit 1
        ;;
esac

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"
command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ Docker is required${NC}" >&2; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo -e "${YELLOW}⚠️  kubectl not found${NC}" >&2; }
command -v helm >/dev/null 2>&1 || { echo -e "${YELLOW}⚠️  helm not found${NC}" >&2; }
command -v terraform >/dev/null 2>&1 || { echo -e "${YELLOW}⚠️  terraform not found${NC}" >&2; }
echo -e "${GREEN}✅ Prerequisites check complete${NC}"

# Load environment variables
if [ -f ".env.${ENVIRONMENT}" ]; then
    echo -e "${YELLOW}📝 Loading .env.${ENVIRONMENT}...${NC}"
    source .env.${ENVIRONMENT}
elif [ -f ".env" ]; then
    echo -e "${YELLOW}📝 Loading .env...${NC}"
    source .env
else
    echo -e "${RED}❌ No .env file found${NC}"
    exit 1
fi

# Step 1: Build all applications
echo -e "${BLUE}📦 Building applications...${NC}"
npm run build

# Step 2: Run tests
echo -e "${BLUE}🧪 Running tests...${NC}"
npm run test

# Step 3: Build Docker images
echo -e "${BLUE}🐳 Building Docker images...${NC}"

# Build Web
docker build \
    --build-arg NODE_ENV=$ENVIRONMENT \
    -t ${REGISTRY}/${PROJECT_NAME}/web:${VERSION} \
    -t ${REGISTRY}/${PROJECT_NAME}/web:${ENVIRONMENT} \
    -f docker/Dockerfile.web .

# Build API
docker build \
    --build-arg NODE_ENV=$ENVIRONMENT \
    -t ${REGISTRY}/${PROJECT_NAME}/api:${VERSION} \
    -t ${REGISTRY}/${PROJECT_NAME}/api:${ENVIRONMENT} \
    -f docker/Dockerfile.api .

# Build AI Service
docker build \
    --build-arg PYTHON_VERSION=3.11 \
    -t ${REGISTRY}/${PROJECT_NAME}/ai:${VERSION} \
    -t ${REGISTRY}/${PROJECT_NAME}/ai:${ENVIRONMENT} \
    -f docker/Dockerfile.ai .

# Build Admin (if exists)
if [ -f "docker/Dockerfile.admin" ]; then
    docker build \
        --build-arg NODE_ENV=$ENVIRONMENT \
        -t ${REGISTRY}/${PROJECT_NAME}/admin:${VERSION} \
        -t ${REGISTRY}/${PROJECT_NAME}/admin:${ENVIRONMENT} \
        -f docker/Dockerfile.admin .
fi

echo -e "${GREEN}✅ Docker images built${NC}"

# Step 4: Push images to registry (if not local)
if [ "$ENVIRONMENT" != "dev" ]; then
    echo -e "${BLUE}📤 Pushing images to registry...${NC}"
    
    docker push ${REGISTRY}/${PROJECT_NAME}/web:${VERSION}
    docker push ${REGISTRY}/${PROJECT_NAME}/web:${ENVIRONMENT}
    docker push ${REGISTRY}/${PROJECT_NAME}/api:${VERSION}
    docker push ${REGISTRY}/${PROJECT_NAME}/api:${ENVIRONMENT}
    docker push ${REGISTRY}/${PROJECT_NAME}/ai:${VERSION}
    docker push ${REGISTRY}/${PROJECT_NAME}/ai:${ENVIRONMENT}
    
    echo -e "${GREEN}✅ Images pushed to registry${NC}"
fi

# Step 5: Deploy to Kubernetes
if [ "$ENVIRONMENT" != "dev" ] && command -v kubectl >/dev/null 2>&1; then
    echo -e "${BLUE}☸️  Deploying to Kubernetes...${NC}"
    
    # Apply namespace
    kubectl apply -f infrastructure/kubernetes/namespaces/assetflow.yaml
    
    # Apply secrets
    kubectl create secret generic assetflow-secrets \
        --namespace=assetflow \
        --from-literal=database_url=$DATABASE_URL \
        --from-literal=redis_url=$REDIS_URL \
        --from-literal=jwt_secret=$JWT_SECRET \
        --from-literal=openai_api_key=$OPENAI_API_KEY \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply configmaps
    kubectl apply -f infrastructure/kubernetes/configmaps/
    
    # Apply deployments with image update
    kubectl set image deployment/assetflow-api \
        api=${REGISTRY}/${PROJECT_NAME}/api:${VERSION} \
        --namespace=assetflow
    
    kubectl set image deployment/assetflow-ai \
        ai=${REGISTRY}/${PROJECT_NAME}/ai:${VERSION} \
        --namespace=assetflow
    
    kubectl set image deployment/assetflow-web \
        web=${REGISTRY}/${PROJECT_NAME}/web:${VERSION} \
        --namespace=assetflow
    
    # Apply services and ingress
    kubectl apply -f infrastructure/kubernetes/services/
    kubectl apply -f infrastructure/kubernetes/ingress/
    
    # Wait for rollout
    echo -e "${YELLOW}⏳ Waiting for deployments to roll out...${NC}"
    kubectl rollout status deployment/assetflow-api --namespace=assetflow --timeout=5m
    kubectl rollout status deployment/assetflow-ai --namespace=assetflow --timeout=5m
    kubectl rollout status deployment/assetflow-web --namespace=assetflow --timeout=5m
    
    # Verify deployment
    echo -e "${BLUE}🔍 Verifying deployment...${NC}"
    kubectl get pods --namespace=assetflow
    kubectl get services --namespace=assetflow
    kubectl get ingress --namespace=assetflow
    
    echo -e "${GREEN}✅ Kubernetes deployment complete${NC}"
fi

# Step 6: Database migrations (if applicable)
if [ "$ENVIRONMENT" != "dev" ]; then
    echo -e "${BLUE}🗄️  Running database migrations...${NC}"
    npm run db:deploy
fi

# Step 7: Health check
echo -e "${BLUE}🏥 Running health checks...${NC}"
sleep 10

if [ "$ENVIRONMENT" != "dev" ]; then
    # Check API health
    API_URL="https://api.assetflow.ai/health"
    if curl -s -o /dev/null -w "%{http_code}" $API_URL | grep -q "200"; then
        echo -e "${GREEN}✅ API health check passed${NC}"
    else
        echo -e "${RED}❌ API health check failed${NC}"
    fi
    
    # Check AI service health
    AI_URL="https://ai.assetflow.ai/health"
    if curl -s -o /dev/null -w "%{http_code}" $AI_URL | grep -q "200"; then
        echo -e "${GREEN}✅ AI service health check passed${NC}"
    else
        echo -e "${RED}❌ AI service health check failed${NC}"
    fi
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Environment: ${GREEN}$ENVIRONMENT${NC}"
echo -e "Version: ${GREEN}$VERSION${NC}"
echo -e "Deployed at: ${GREEN}$(date)${NC}"
echo -e ""
