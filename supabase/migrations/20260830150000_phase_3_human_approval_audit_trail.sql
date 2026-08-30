create table if not exists public.asset_reviews (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','in_review','approved','rejected')),
  requested_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewer_note text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create unique index if not exists asset_reviews_asset_uidx on public.asset_reviews(asset_id);
create index if not exists asset_reviews_status_idx on public.asset_reviews(status);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  event_type text not null,
  actor_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_events_asset_created_idx on public.audit_events(asset_id, created_at desc);

alter table public.asset_reviews enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists asset_reviews_org_access on public.asset_reviews;
create policy asset_reviews_org_access on public.asset_reviews
  for all to public
  using (exists (select 1 from public.assets a where a.id = asset_reviews.asset_id and a.organization_id = public.user_org_id()))
  with check (exists (select 1 from public.assets a where a.id = asset_reviews.asset_id and a.organization_id = public.user_org_id()));

drop policy if exists audit_events_org_access on public.audit_events;
create policy audit_events_org_access on public.audit_events
  for all to public
  using (exists (select 1 from public.assets a where a.id = audit_events.asset_id and a.organization_id = public.user_org_id()))
  with check (exists (select 1 from public.assets a where a.id = audit_events.asset_id and a.organization_id = public.user_org_id()));
