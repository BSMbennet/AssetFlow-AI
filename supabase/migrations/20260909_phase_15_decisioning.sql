create extension if not exists pgcrypto;

create table if not exists public.decision_policies (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 name text not null, decision_type text not null, required_approvals integer not null default 1,
 min_approver_role text, segregation_required boolean not null default true, evidence_required boolean not null default true,
 status text not null default 'ACTIVE' check (status in ('ACTIVE','PAUSED','ARCHIVED')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.decision_requests (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 workflow_id uuid references public.operational_workflows(id) on delete set null, task_id uuid references public.operational_tasks(id) on delete set null,
 asset_id uuid references public.assets(id) on delete set null, policy_id uuid references public.decision_policies(id) on delete set null,
 title text not null, decision_type text not null, status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED','RETURNED','CANCELLED')),
 requested_by uuid references auth.users(id), decided_at timestamptz, decision_summary text, evidence jsonb not null default '[]'::jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.decision_approvals (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 decision_id uuid not null references public.decision_requests(id) on delete cascade, approver_id uuid references auth.users(id),
 role text, action text not null check (action in ('APPROVE','REJECT','RETURN')),
 comment text, evidence jsonb not null default '[]'::jsonb, created_at timestamptz not null default now()
);

create table if not exists public.decision_events (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 decision_id uuid references public.decision_requests(id) on delete cascade, actor_id uuid references auth.users(id),
 event_type text not null, from_status text, to_status text, metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);

create index if not exists decision_requests_org_status_idx on public.decision_requests(organization_id,status,created_at desc);
create index if not exists decision_approvals_decision_idx on public.decision_approvals(decision_id,created_at desc);
create index if not exists decision_events_decision_idx on public.decision_events(decision_id,created_at desc);

alter table public.decision_policies enable row level security;
alter table public.decision_requests enable row level security;
alter table public.decision_approvals enable row level security;
alter table public.decision_events enable row level security;

create policy decision_policies_org_select on public.decision_policies for select using (organization_id=(select organization_id from public.profiles where id=auth.uid()));
create policy decision_requests_org_select on public.decision_requests for select using (organization_id=(select organization_id from public.profiles where id=auth.uid()));
create policy decision_approvals_org_select on public.decision_approvals for select using (organization_id=(select organization_id from public.profiles where id=auth.uid()));
create policy decision_events_org_select on public.decision_events for select using (organization_id=(select organization_id from public.profiles where id=auth.uid()));

create policy decision_requests_org_insert on public.decision_requests for insert with check (organization_id=(select organization_id from public.profiles where id=auth.uid()));
create policy decision_approvals_org_insert on public.decision_approvals for insert with check (organization_id=(select organization_id from public.profiles where id=auth.uid()));
create policy decision_events_org_insert on public.decision_events for insert with check (organization_id=(select organization_id from public.profiles where id=auth.uid()));
