-- ============================================
-- ASSETFLOW AI - Database Initialization
-- ============================================

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create schema
CREATE SCHEMA IF NOT EXISTS assetflow;

-- Set search path
SET search_path TO assetflow, public;

-- Create audit function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create audit trigger for all tables
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.created_at = CURRENT_TIMESTAMP;
        NEW.updated_at = CURRENT_TIMESTAMP;
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.updated_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create partition function for time-series data
CREATE OR REPLACE FUNCTION create_partition(
    table_name TEXT,
    partition_name TEXT,
    start_date DATE,
    end_date DATE
) RETURNS VOID AS $$
BEGIN
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I PARTITION OF %I
        FOR VALUES FROM (%L) TO (%L)',
        partition_name, table_name, start_date, end_date
    );
END;
$$ language 'plpgsql';

-- Create full-text search function
CREATE OR REPLACE FUNCTION asset_search_vector(asset_data JSONB)
RETURNS TSVECTOR AS $$
BEGIN
    RETURN setweight(to_tsvector('english', asset_data->>'name'), 'A') ||
           setweight(to_tsvector('english', asset_data->>'description'), 'B') ||
           setweight(to_tsvector('english', asset_data->>'jurisdiction'), 'C');
END;
$$ language 'plpgsql' IMMUTABLE;

-- Create views for analytics
CREATE OR REPLACE VIEW asset_summary AS
SELECT 
    a.id,
    a.name,
    a.type,
    a.status,
    a.total_value,
    a.token_price,
    COUNT(DISTINCT th.user_id) as holder_count,
    SUM(th.balance) as total_tokens_held,
    (a.total_value / NULLIF(a.total_tokens, 0)) as nav_per_token
FROM assets a
LEFT JOIN token_holders th ON th.token_id = a.token_id
WHERE a.deleted_at IS NULL
GROUP BY a.id, a.name, a.type, a.status, a.total_value, a.token_price, a.total_tokens;

-- Create performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_organization_id ON assets(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trades_asset_id ON trades(asset_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trades_executed_at ON trades(executed_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO assetflow;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO assetflow;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO assetflow;