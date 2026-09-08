create table if not exists public.settlement_instructions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  direction text not null check (direction in ('BUY','SELL')),
  amount numeric(20,2) not null check (amount > 0),
  currency text not null default 'USD',
  settlement_network text not null default 'Bank rail',
  counterparty text,
  status text not null default 'PENDING_REVIEW' check (status in ('PENDING_REVIEW','ELIGIBILITY_CHECK','READY','IN_SETTLEMENT','SETTLED','FAILED','CANCELLED')),
  settlement_date date,
  reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists settlement_instructions_org_idx on public.settlement_instructions(organization_id, created_at desc);
create index if not exists settlement_instructions_asset_idx on public.settlement_instructions(asset_id, created_at desc);

create table if not exists public.settlement_events (
  id uuid primary key default gen_random_uuid(),
  settlement_id uuid not null references public.settlement_instructions(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  from_status text,
  to_status text not null,
  message text,
  created_at timestamptz not null default now()
);
create index if not exists settlement_events_settlement_idx on public.settlement_events(settlement_id, created_at desc);

alter table public.settlement_instructions enable row level security;
alter table public.settlement_events enable row level security;

create policy settlement_instructions_select on public.settlement_instructions for select using (organization_id = (select organization_id from public.profiles where id = auth.uid()));
create policy settlement_instructions_insert on public.settlement_instructions for insert with check (organization_id = (select organization_id from public.profiles where id = auth.uid()) and created_by = auth.uid());
create policy settlement_instructions_update on public.settlement_instructions for update using (organization_id = (select organization_id from public.profiles where id = auth.uid())) with check (organization_id = (select organization_id from public.profiles where id = auth.uid()));
create policy settlement_events_select on public.settlement_events for select using (organization_id = (select organization_id from public.profiles where id = auth.uid()));
create policy settlement_events_insert on public.settlement_events for insert with check (organization_id = (select organization_id from public.profiles where id = auth.uid()) and (actor_id = auth.uid() or actor_id is null));

create or replace function public.set_settlement_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists settlement_instructions_updated_at on public.settlement_instructions;
create trigger settlement_instructions_updated_at before update on public.settlement_instructions for each row execute function public.set_settlement_updated_at();
