create table if not exists public.event_rules (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null, name text not null,
  source_domain text not null, event_type text not null, target_workflow_type text not null,
  enabled boolean not null default true, auto_assign_role text, priority text not null default 'NORMAL',
  sla_hours integer not null default 24, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.event_triggers (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null,
  rule_id uuid not null references public.event_rules(id) on delete cascade, source_event_id text,
  source_domain text not null, event_type text not null, payload jsonb not null default '{}'::jsonb,
  status text not null default 'RECEIVED', workflow_id uuid references public.operational_workflows(id) on delete set null,
  task_id uuid references public.operational_tasks(id) on delete set null,
  exception_id uuid references public.operational_exceptions(id) on delete set null,
  idempotency_key text not null, created_at timestamptz not null default now(), processed_at timestamptz
);
create unique index if not exists event_triggers_org_idempotency_idx on public.event_triggers(organization_id,idempotency_key);
create index if not exists event_rules_org_idx on public.event_rules(organization_id,enabled);
create index if not exists event_triggers_org_created_idx on public.event_triggers(organization_id,created_at desc);
create index if not exists event_triggers_org_status_idx on public.event_triggers(organization_id,status);
alter table public.event_rules enable row level security;
alter table public.event_triggers enable row level security;
drop policy if exists event_rules_org_select on public.event_rules;
drop policy if exists event_rules_org_modify on public.event_rules;
drop policy if exists event_triggers_org_select on public.event_triggers;
drop policy if exists event_triggers_org_modify on public.event_triggers;
create policy event_rules_org_select on public.event_rules for select using (organization_id = (select organization_id from public.profiles where id = auth.uid()));
create policy event_rules_org_modify on public.event_rules for all using (organization_id = (select organization_id from public.profiles where id = auth.uid())) with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));
create policy event_triggers_org_select on public.event_triggers for select using (organization_id = (select organization_id from public.profiles where id = auth.uid()));
create policy event_triggers_org_modify on public.event_triggers for all using (organization_id = (select organization_id from public.profiles where id = auth.uid())) with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));
