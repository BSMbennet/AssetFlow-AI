create table if not exists public.servicing_positions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  investor_id uuid not null references auth.users(id) on delete cascade,
  units numeric(28,8) not null check (units > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(asset_id, investor_id)
);

create table if not exists public.corporate_actions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  action_type text not null check (action_type in ('INTEREST','DIVIDEND','PRINCIPAL','FEE','MATURITY')),
  amount numeric(20,2) not null check (amount > 0),
  currency text not null default 'USD',
  record_date date not null,
  payment_date date not null,
  status text not null default 'SCHEDULED' check (status in ('DRAFT','SCHEDULED','READY','PROCESSING','COMPLETED','FAILED','CANCELLED')),
  notes text,
  external_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (payment_date >= record_date)
);

create table if not exists public.corporate_action_allocations (
  id uuid primary key default gen_random_uuid(),
  corporate_action_id uuid not null references public.corporate_actions(id) on delete cascade,
  investor_id uuid not null references auth.users(id) on delete cascade,
  units numeric(28,8) not null check (units >= 0),
  amount numeric(20,2) not null check (amount >= 0),
  status text not null default 'PENDING' check (status in ('PENDING','PROCESSING','PAID','FAILED')),
  paid_at timestamptz,
  external_reference text,
  transaction_hash text,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(corporate_action_id, investor_id)
);

create index if not exists servicing_positions_org_asset_idx on public.servicing_positions(organization_id, asset_id);
create index if not exists servicing_positions_investor_idx on public.servicing_positions(investor_id);
create index if not exists corporate_actions_org_status_idx on public.corporate_actions(organization_id, status);
create index if not exists corporate_actions_asset_date_idx on public.corporate_actions(asset_id, payment_date);
create index if not exists corporate_action_allocations_action_idx on public.corporate_action_allocations(corporate_action_id);
create index if not exists corporate_action_allocations_investor_idx on public.corporate_action_allocations(investor_id);

alter table public.servicing_positions enable row level security;
alter table public.corporate_actions enable row level security;
alter table public.corporate_action_allocations enable row level security;

create or replace function public.assetflow_same_org(target_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.organization_id = target_org);
$$;

create policy servicing_positions_select on public.servicing_positions for select using (public.assetflow_same_org(organization_id));
create policy servicing_positions_insert on public.servicing_positions for insert with check (public.assetflow_same_org(organization_id));
create policy servicing_positions_update on public.servicing_positions for update using (public.assetflow_same_org(organization_id)) with check (public.assetflow_same_org(organization_id));
create policy servicing_positions_delete on public.servicing_positions for delete using (public.assetflow_same_org(organization_id));

create policy corporate_actions_select on public.corporate_actions for select using (public.assetflow_same_org(organization_id));
create policy corporate_actions_insert on public.corporate_actions for insert with check (public.assetflow_same_org(organization_id) and created_by = auth.uid());
create policy corporate_actions_update on public.corporate_actions for update using (public.assetflow_same_org(organization_id)) with check (public.assetflow_same_org(organization_id));

create policy corporate_action_allocations_select on public.corporate_action_allocations for select using (exists (select 1 from public.corporate_actions ca where ca.id = corporate_action_id and public.assetflow_same_org(ca.organization_id)));
create policy corporate_action_allocations_insert on public.corporate_action_allocations for insert with check (exists (select 1 from public.corporate_actions ca where ca.id = corporate_action_id and public.assetflow_same_org(ca.organization_id)));
create policy corporate_action_allocations_update on public.corporate_action_allocations for update using (exists (select 1 from public.corporate_actions ca where ca.id = corporate_action_id and public.assetflow_same_org(ca.organization_id)));
