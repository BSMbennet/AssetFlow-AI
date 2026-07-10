#!/bin/bash
# ============================================
# ASSETFLOW AI - Monitoring Script
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 AssetFlow AI Monitoring${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e ""

# Check if monitoring is running in Docker
if command -v docker-compose >/dev/null 2>&1; then
    if docker ps --format '{{.Names}}' | grep -q "assetflow-prometheus"; then
        echo -e "${GREEN}✅ Prometheus is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Prometheus is not running${NC}"
    fi
    
    if docker ps --format '{{.Names}}' | grep -q "assetflow-grafana"; then
        echo -e "${GREEN}✅ Grafana is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Grafana is not running${NC}"
    fi
fi

# Check API health
echo -e "${BLUE}🏥 Checking API health...${NC}"
API_URL=${API_URL:-"http://localhost:3001"}
if curl -s -o /dev/null -w "%{http_code}" $API_URL/health | grep -q "200"; then
    echo -e "${GREEN}✅ API is healthy${NC}"
else
    echo -e "${RED}❌ API is not healthy${NC}"
fi

# Check AI service health
echo -e "${BLUE}🤖 Checking AI service health...${NC}"
AI_URL=${AI_URL:-"http://localhost:8000"}
if curl -s -o /dev/null -w "%{http_code}" $AI_URL/health | grep -q "200"; then
    echo -e "${GREEN}✅ AI service is healthy${NC}"
else
    echo -e "${RED}❌ AI service is not healthy${NC}"
fi

# Check database connection
echo -e "${BLUE}🗄️  Checking database connection...${NC}"
if command -v psql >/dev/null 2>&1; then
    if [ -f ".env" ]; then
        source .env
        if [ ! -z "$DATABASE_URL" ]; then
            if PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1" >/dev/null 2>&1; then
                echo -e "${GREEN}✅ Database is healthy${NC}"
            else
                echo -e "${RED}❌ Database connection failed${NC}"
            fi
        fi
    fi
else
    echo -e "${YELLOW}⚠️  psql not found - skipping database check${NC}"
fi

# Check Redis connection
echo -e "${BLUE}💾 Checking Redis connection...${NC}"
if command -v redis-cli >/dev/null 2>&1; then
    if [ -f ".env" ]; then
        source .env
        if [ ! -z "$REDIS_URL" ]; then
            if redis-cli -h $REDIS_HOST -p $REDIS_PORT ping >/dev/null 2>&1; then
                echo -e "${GREEN}✅ Redis is healthy${NC}"
            else
                echo -e "${RED}❌ Redis connection failed${NC}"
            fi
        fi
    fi
else
    echo -e "${YELLOW}⚠️  redis-cli not found - skipping Redis check${NC}"
fi

# Check disk space
echo -e "${BLUE}💿 Checking disk space...${NC}"
df -h / | awk 'NR==2 {print "  Used: " $3 " / " $2 " (" $5 ")"}'

# Check memory
echo -e "${BLUE}🧠 Checking memory usage...${NC}"
free -h | awk 'NR==2 {print "  Used: " $3 " / " $2 " (" $3/$2*100 "%)"}'

# Check CPU load
echo -e "${BLUE}⚡ Checking CPU load...${NC}"
uptime | awk '{print "  Load average: " $10 $11 $12}'

# Check running containers
echo -e "${BLUE}🐳 Checking running containers...${NC}"
if command -v docker >/dev/null 2>&1; then
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "assetflow"
fi

# Check Kubernetes pods
echo -e "${BLUE}☸️  Checking Kubernetes pods...${NC}"
if command -v kubectl >/dev/null 2>&1; then
    kubectl get pods --namespace=assetflow 2>/dev/null || echo "  No pods found"
fi

# Check services
echo -e "${BLUE}🔍 Checking services...${NC}"
if command -v kubectl >/dev/null 2>&1; then
    kubectl get services --namespace=assetflow 2>/dev/null || echo "  No services found"
fi

# Get system metrics
echo -e "${BLUE}📈 System metrics:${NC}"
if command -v top >/dev/null 2>&1; then
    top -bn1 | head -5
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Monitoring check complete${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Timestamp: $(date)"
echo -e "Hostname: $(hostname)"
echo -e "Uptime: $(uptime -p)"
echo -e ""