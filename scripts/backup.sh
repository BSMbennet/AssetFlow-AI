#!/bin/bash
# ============================================
# ASSETFLOW AI - Backup Script
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKUP_DIR=${BACKUP_DIR:-"/var/backups/assetflow"}
RETENTION_DAYS=${RETENTION_DAYS:-30}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="assetflow_${TIMESTAMP}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}💾 AssetFlow AI Backup${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Backup directory: ${GREEN}$BACKUP_DIR${NC}"
echo -e "Retention days: ${GREEN}$RETENTION_DAYS${NC}"
echo -e ""

# Create backup directory
mkdir -p $BACKUP_DIR

# Load environment
if [ -f ".env" ]; then
    source .env
elif [ -f ".env.production" ]; then
    source .env.production
else
    echo -e "${RED}❌ No .env file found${NC}"
    exit 1
fi

# Database backup
echo -e "${BLUE}🗄️  Backing up database...${NC}"
if [ ! -z "$DATABASE_URL" ]; then
    # Extract database info from URL
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\).*/\1/p')
    DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\([^@]*\)@.*/\1/p')
    
    # Use pg_dump if available
    if command -v pg_dump >/dev/null 2>&1; then
        PGPASSWORD=$DB_PASS pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME \
            | gzip > $BACKUP_DIR/${BACKUP_NAME}_db.sql.gz
        echo -e "${GREEN}✅ Database backup complete${NC}"
    else
        echo -e "${YELLOW}⚠️  pg_dump not found - using prisma db pull instead${NC}"
        npx prisma db pull --schema=./packages/database/prisma/schema.prisma \
            > $BACKUP_DIR/${BACKUP_NAME}_schema.prisma
        echo -e "${GREEN}✅ Schema backup complete${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  DATABASE_URL not set - skipping database backup${NC}"
fi

# Redis backup
echo -e "${BLUE}💾 Backing up Redis...${NC}"
if [ ! -z "$REDIS_URL" ]; then
    REDIS_HOST=$(echo $REDIS_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
    REDIS_PORT=$(echo $REDIS_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    REDIS_PASS=$(echo $REDIS_URL | sed -n 's/.*:\([^@]*\)@.*/\1/p')
    
    if command -v redis-cli >/dev/null 2>&1; then
        if [ ! -z "$REDIS_PASS" ]; then
            redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASS --rdb $BACKUP_DIR/${BACKUP_NAME}_redis.rdb
        else
            redis-cli -h $REDIS_HOST -p $REDIS_PORT --rdb $BACKUP_DIR/${BACKUP_NAME}_redis.rdb
        fi
        echo -e "${GREEN}✅ Redis backup complete${NC}"
    else
        echo -e "${YELLOW}⚠️  redis-cli not found - skipping Redis backup${NC}"
    fi
fi

# Files backup
echo -e "${BLUE}📁 Backing up files...${NC}"
if [ -d "apps/web/public" ]; then
    tar -czf $BACKUP_DIR/${BACKUP_NAME}_public.tar.gz apps/web/public
fi

if [ -d "apps/ai-service/uploads" ]; then
    tar -czf $BACKUP_DIR/${BACKUP_NAME}_uploads.tar.gz apps/ai-service/uploads
fi

# Backup environment
if [ -f ".env" ]; then
    cp .env $BACKUP_DIR/${BACKUP_NAME}_env
fi

# Create backup manifest
echo -e "${BLUE}📋 Creating backup manifest...${NC}"
cat > $BACKUP_DIR/${BACKUP_NAME}_manifest.txt << EOF
Backup created: $(date)
Backup name: $BACKUP_NAME
Environment: $ENVIRONMENT
Version: $(git describe --tags --always 2>/dev/null || echo "unknown")
Files included:
  - Database dump (if applicable)
  - Redis dump (if applicable)
  - Public files
  - Uploaded files
  - Environment configuration
Backup size: $(du -sh $BACKUP_DIR/${BACKUP_NAME}_* 2>/dev/null | awk '{sum+=$1} END {print sum " total"}')
EOF

# Clean up old backups
echo -e "${BLUE}🧹 Cleaning up old backups (> $RETENTION_DAYS days)...${NC}"
find $BACKUP_DIR -name "assetflow_*" -type f -mtime +$RETENTION_DAYS -delete

# Upload to S3 (if configured)
if [ ! -z "$AWS_ACCESS_KEY_ID" ] && [ ! -z "$S3_BUCKET" ]; then
    echo -e "${BLUE}☁️  Uploading to S3...${NC}"
    aws s3 sync $BACKUP_DIR s3://$S3_BUCKET/backups/ --exclude "*" --include "assetflow_*"
    echo -e "${GREEN}✅ Uploaded to S3${NC}"
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Backup complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Backup location: ${GREEN}$BACKUP_DIR/${BACKUP_NAME}_*${NC}"
echo -e "Backup size: $(du -sh $BACKUP_DIR | awk '{print $1}')"
echo -e "Retention: $RETENTION_DAYS days"
echo -e ""