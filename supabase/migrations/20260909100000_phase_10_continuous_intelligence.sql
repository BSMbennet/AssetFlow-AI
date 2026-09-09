create table if not exists public.monitoring_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  status text not null default 'COMPLETED' check (status in ('RUNNING','COMPLETED','FAILED')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  assets_scanned integer not null default 0,
  signals_found integer not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.monitoring_signals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  run_id uuid not null references public.monitoring_runs(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  signal_type text not null,
  severity text not null check (severity in ('CRITICAL','WATCH','STABLE')),
  title text not null,
  detail text not null,
  score integer check (score between 0 and 100),
  status text not null default 'OPEN' check (status in ('OPEN','ACKNOWLEDGED','RESOLVED')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists monitoring_runs_org_started_idx on public.monitoring_runs(organization_id, started_at desc);
create index if not exists monitoring_signals_org_status_idx on public.monitoring_signals(organization_id, status, severity);
create index if not exists monitoring_signals_asset_created_idx on public.monitoring_signals(asset_id, created_at desc);

alter table public.monitoring_runs enable row level security;
alter table public.monitoring_signals enable row level security;

drop policy if exists monitoring_runs_org_access on public.monitoring_runs;
create policy monitoring_runs_org_access on public.monitoring_runs for all using (organization_id = (select organization_id from public.profiles where id = auth.uid())) with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));

drop policy if exists monitoring_signals_org_access on public.monitoring_signals;
create policy monitoring_signals_org_access on public.monitoring_signals for all using (organization_id = (select organization_id from public.profiles where id = auth.uid())) with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));
