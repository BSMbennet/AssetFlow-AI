create table if not exists public.tokenization_requests (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','ready_for_review','approved','rejected','issued','cancelled')),
  token_symbol text not null,
  total_supply numeric(30,0) not null check (total_supply > 0),
  token_price numeric(30,10) not null check (token_price >= 0),
  network text not null,
  asset_value numeric(30,2),
  risk_score numeric(6,2),
  compliance_score numeric(6,2),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tokenization_requests_org_idx on public.tokenization_requests(organization_id, created_at desc);
create index if not exists tokenization_requests_asset_idx on public.tokenization_requests(asset_id, created_at desc);
create index if not exists tokenization_requests_status_idx on public.tokenization_requests(status);

alter table public.tokenization_requests enable row level security;

drop policy if exists tokenization_requests_org_access on public.tokenization_requests;
create policy tokenization_requests_org_access on public.tokenization_requests
  for all to authenticated
  using (organization_id = public.user_org_id())
  with check (organization_id = public.user_org_id());

grant select, insert, update, delete on public.tokenization_requests to authenticated;
