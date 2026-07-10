#!/bin/bash
# ============================================
# ASSETFLOW AI - Setup Script
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 AssetFlow AI Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e ""

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js $NODE_VERSION installed${NC}"
else
    echo -e "${RED}❌ Node.js is required. Please install Node.js 18+${NC}"
    exit 1
fi

# Check npm
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✅ npm $NPM_VERSION installed${NC}"
else
    echo -e "${RED}❌ npm is required${NC}"
    exit 1
fi

# Check Python
if command -v python3 >/dev/null 2>&1; then
    PYTHON_VERSION=$(python3 -V)
    echo -e "${GREEN}✅ $PYTHON_VERSION installed${NC}"
else
    echo -e "${YELLOW}⚠️  Python 3.11+ recommended for AI service${NC}"
fi

# Check Docker
if command -v docker >/dev/null 2>&1; then
    DOCKER_VERSION=$(docker -v)
    echo -e "${GREEN}✅ $DOCKER_VERSION installed${NC}"
else
    echo -e "${YELLOW}⚠️  Docker not found - optional for containerized development${NC}"
fi

# Check Docker Compose
if command -v docker-compose >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker Compose installed${NC}"
else
    echo -e "${YELLOW}⚠️  Docker Compose not found - optional${NC}"
fi

echo -e ""

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

# Install AI service dependencies
if [ -f "apps/ai-service/requirements.txt" ]; then
    echo -e "${BLUE}🐍 Installing Python dependencies...${NC}"
    if command -v pip3 >/dev/null 2>&1; then
        pip3 install -r apps/ai-service/requirements.txt
    elif command -v pip >/dev/null 2>&1; then
        pip install -r apps/ai-service/requirements.txt
    else
        echo -e "${YELLOW}⚠️  pip not found - skipping Python dependencies${NC}"
    fi
fi

# Setup environment
if [ ! -f ".env" ]; then
    echo -e "${BLUE}📝 Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please update .env with your configuration${NC}"
fi

# Generate Prisma client
echo -e "${BLUE}🗄️  Generating Prisma client...${NC}"
npx prisma generate --schema=./packages/database/prisma/schema.prisma

# Setup database
echo -e "${BLUE}🗄️  Setting up database...${NC}"
if [ -f ".env" ]; then
    source .env
    if [ ! -z "$DATABASE_URL" ]; then
        npx prisma db push --schema=./packages/database/prisma/schema.prisma
        npx prisma db seed --schema=./packages/database/prisma/schema.prisma
    else
        echo -e "${YELLOW}⚠️  DATABASE_URL not set - skipping database setup${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env file not found - skipping database setup${NC}"
fi

# Build all packages
echo -e "${BLUE}🔨 Building packages...${NC}"
npm run build

# Setup git hooks
if [ -d ".git" ]; then
    echo -e "${BLUE}🔧 Setting up git hooks...${NC}"
    if [ -f ".husky/pre-commit" ]; then
        npm run prepare
    fi
fi

# Start development environment
if [ -f "docker/docker-compose.yml" ] && command -v docker-compose >/dev/null 2>&1; then
    echo -e "${BLUE}🐳 Starting Docker services...${NC}"
    docker-compose -f docker/docker-compose.yml up -d postgres redis
else
    echo -e "${YELLOW}⚠️  Docker Compose not found - skipping container startup${NC}"
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e ""
echo -e "📋 Next steps:"
echo -e "  1. Update .env with your configuration"
echo -e "  2. Run database migrations: npm run db:migrate"
echo -e "  3. Start development server: npm run dev"
echo -e "  4. Visit http://localhost:3000"
echo -e ""
echo -e "📚 Documentation: docs/README.md"
echo -e ""