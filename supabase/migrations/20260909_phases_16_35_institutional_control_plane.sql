create extension if not exists pgcrypto;

-- Phase 16: Evidence & Audit Intelligence
create table if not exists public.evidence_items (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, source_type text not null, source_id uuid, title text not null, content_hash text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());

-- Phase 17: Policy & Control Plane
create table if not exists public.control_policies (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, name text not null, version integer not null default 1, rules jsonb not null default '{}'::jsonb, status text not null default 'ACTIVE', created_at timestamptz not null default now(), updated_at timestamptz not null default now());

-- Phase 18: Institutional Data Room
create table if not exists public.data_rooms (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, name text not null, status text not null default 'ACTIVE', access_policy jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
create table if not exists public.data_room_items (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, room_id uuid not null references public.data_rooms(id) on delete cascade, evidence_id uuid references public.evidence_items(id) on delete set null, path text not null, created_at timestamptz not null default now());

-- Phase 19: Counterparty Intelligence
create table if not exists public.counterparties (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, name text not null, type text, risk_rating text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.counterparty_exposures (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, counterparty_id uuid not null references public.counterparties(id) on delete cascade, asset_id uuid references public.assets(id) on delete set null, amount numeric, currency text, as_of timestamptz not null default now());

-- Phase 20: Valuation & Scenario Engine
create table if not exists public.valuation_scenarios (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, asset_id uuid references public.assets(id) on delete cascade, name text not null, assumptions jsonb not null default '{}'::jsonb, valuation numeric, currency text, status text not null default 'DRAFT', created_at timestamptz not null default now());

-- Phase 21: Treasury & Cash Management
create table if not exists public.treasury_positions (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, account_ref text not null, rail text, currency text not null, balance numeric not null default 0, as_of timestamptz not null default now());
create table if not exists public.treasury_forecasts (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, horizon_date date not null, expected_inflows numeric not null default 0, expected_outflows numeric not null default 0, projected_balance numeric, created_at timestamptz not null default now());

-- Phase 22: Risk Aggregation
create table if not exists public.risk_snapshots (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, scope_type text not null, scope_id uuid, metric text not null, value numeric, severity text, as_of timestamptz not null default now());

-- Phase 23: Compliance Operations
create table if not exists public.compliance_cases (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, asset_id uuid references public.assets(id) on delete set null, counterparty_id uuid references public.counterparties(id) on delete set null, case_type text not null, status text not null default 'OPEN', severity text, assigned_role text, details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

-- Phase 24: Institutional Workflow Automation
create table if not exists public.automation_runs (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, workflow_id uuid references public.operational_workflows(id) on delete set null, automation_type text not null, status text not null default 'PENDING', steps jsonb not null default '[]'::jsonb, human_checkpoint_required boolean not null default true, created_at timestamptz not null default now(), completed_at timestamptz);

-- Phase 25: Institutional AI Copilot
create table if not exists public.copilot_sessions (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, user_id uuid references auth.users(id), context jsonb not null default '{}'::jsonb, messages jsonb not null default '[]'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

-- Phase 26: Marketplace & Distribution
create table if not exists public.marketplace_listings (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, asset_id uuid references public.assets(id) on delete set null, status text not null default 'DRAFT', terms jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());

-- Phase 27: Custody & Ownership
create table if not exists public.custody_positions (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, asset_id uuid references public.assets(id) on delete set null, custodian_ref text, owner_ref text, quantity numeric, status text not null default 'ACTIVE', reconciled_at timestamptz); 

-- Phase 28: Multi-Rail Payments
create table if not exists public.payment_transfers (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, rail text not null, external_ref text, amount numeric not null, currency text not null, status text not null default 'PENDING', idempotency_key text not null, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), unique(organization_id,idempotency_key));

-- Phase 29: Reconciliation & Finance Ops
create table if not exists public.reconciliation_breaks (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, domain text not null, external_ref text, expected_value numeric, observed_value numeric, status text not null default 'OPEN', details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), resolved_at timestamptz);

-- Phase 30: Institutional Analytics
create table if not exists public.analytics_snapshots (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, metric text not null, value numeric, dimensions jsonb not null default '{}'::jsonb, as_of timestamptz not null default now());

-- Phase 31: Governance, Security & Resilience
create table if not exists public.security_controls (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, control_key text not null, status text not null default 'PASS', evidence jsonb not null default '[]'::jsonb, tested_at timestamptz not null default now());

-- Phase 32: Institutional Network
create table if not exists public.institutional_connections (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, counterparty_id uuid references public.counterparties(id) on delete set null, connection_type text not null, status text not null default 'ACTIVE', permissions jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());

-- Phase 33: Global Regulatory Expansion
create table if not exists public.regulatory_rulesets (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, jurisdiction text not null, name text not null, version text not null, rules jsonb not null default '{}'::jsonb, status text not null default 'ACTIVE', effective_at timestamptz);

-- Phase 34: Institutional Liquidity Network
create table if not exists public.liquidity_routes (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, venue text not null, asset_id uuid references public.assets(id) on delete set null, rail text, quote jsonb not null default '{}'::jsonb, status text not null default 'ACTIVE', observed_at timestamptz not null default now());

-- Phase 35: Autonomous Institutional Operations
create table if not exists public.autonomy_policies (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, name text not null, allowed_actions jsonb not null default '[]'::jsonb, approval_required boolean not null default true, max_value numeric, status text not null default 'ACTIVE', created_at timestamptz not null default now());

-- Shared indexes
create index if not exists evidence_items_org_idx on public.evidence_items(organization_id,created_at desc);
create index if not exists counterparty_exposures_org_idx on public.counterparty_exposures(organization_id,as_of desc);
create index if not exists risk_snapshots_org_idx on public.risk_snapshots(organization_id,as_of desc);
create index if not exists payment_transfers_org_idx on public.payment_transfers(organization_id,created_at desc);
create index if not exists reconciliation_breaks_org_idx on public.reconciliation_breaks(organization_id,status);

-- Organization isolation for the entire future control plane.
do $$ declare t text; begin foreach t in array array['evidence_items','control_policies','data_rooms','data_room_items','counterparties','counterparty_exposures','valuation_scenarios','treasury_positions','treasury_forecasts','risk_snapshots','compliance_cases','automation_runs','copilot_sessions','marketplace_listings','custody_positions','payment_transfers','reconciliation_breaks','analytics_snapshots','security_controls','institutional_connections','regulatory_rulesets','liquidity_routes','autonomy_policies'] loop execute format('alter table public.%I enable row level security',t); execute format('create policy %I on public.%I for all using (organization_id=(select organization_id from public.profiles where id=auth.uid())) with check (organization_id=(select organization_id from public.profiles where id=auth.uid()))',t||'_org_isolation',t); end loop; end $$;
