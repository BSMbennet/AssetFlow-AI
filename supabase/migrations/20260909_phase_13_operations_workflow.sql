-- Phase 13: Institutional Operations & Workflow Orchestration
create extension if not exists pgcrypto;

create table if not exists public.operational_workflows (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name text not null,
  workflow_type text not null check (workflow_type in ('ONBOARDING','SETTLEMENT','SERVICING','COMPLIANCE','REVIEW','EXCEPTION')),
  owner_role text not null default 'OPERATOR',
  status text not null default 'ACTIVE' check (status in ('ACTIVE','PAUSED','ARCHIVED')),
  sla_hours integer not null default 24 check (sla_hours > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.operational_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  workflow_id uuid references public.operational_workflows(id) on delete set null,
  asset_id uuid references public.assets(id) on delete set null,
  title text not null,
  task_type text not null default 'REVIEW',
  priority text not null default 'NORMAL' check (priority in ('LOW','NORMAL','HIGH','URGENT')),
  status text not null default 'OPEN' check (status in ('OPEN','IN_PROGRESS','BLOCKED','COMPLETED','CANCELLED')),
  assignee_id uuid,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.operational_exceptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  task_id uuid references public.operational_tasks(id) on delete set null,
  asset_id uuid references public.assets(id) on delete set null,
  title text not null,
  severity text not null default 'WATCH' check (severity in ('INFO','WATCH','CRITICAL')),
  status text not null default 'OPEN' check (status in ('OPEN','ACKNOWLEDGED','RESOLVED','WAIVED')),
  reason text,
  owner_id uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists operational_workflows_org_idx on public.operational_workflows(organization_id, status);
create index if not exists operational_tasks_org_status_idx on public.operational_tasks(organization_id, status, priority);
create index if not exists operational_tasks_due_idx on public.operational_tasks(organization_id, due_at);
create index if not exists operational_exceptions_org_status_idx on public.operational_exceptions(organization_id, status, severity);

alter table public.operational_workflows enable row level security;
alter table public.operational_tasks enable row level security;
alter table public.operational_exceptions enable row level security;

create policy "operations workflows org access" on public.operational_workflows
for all using (organization_id = (select organization_id from public.profiles where id = auth.uid()))
with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create policy "operations tasks org access" on public.operational_tasks
for all using (organization_id = (select organization_id from public.profiles where id = auth.uid()))
with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));

create policy "operations exceptions org access" on public.operational_exceptions
for all using (organization_id = (select organization_id from public.profiles where id = auth.uid()))
with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));

notify pgrst, 'reload schema';
