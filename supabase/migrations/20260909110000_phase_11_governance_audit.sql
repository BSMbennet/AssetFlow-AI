create table if not exists public.governance_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  title text not null,
  review_type text not null default 'MODEL_GOVERNANCE',
  status text not null default 'OPEN',
  severity text not null default 'INFO',
  resource_type text,
  resource_id uuid,
  rationale text,
  evidence jsonb not null default '{}'::jsonb,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint governance_reviews_status_chk check (status in ('OPEN','ACKNOWLEDGED','RESOLVED','WAIVED')),
  constraint governance_reviews_severity_chk check (severity in ('INFO','WATCH','CRITICAL'))
);

create index if not exists governance_reviews_org_status_idx on public.governance_reviews(organization_id,status,created_at desc);

alter table public.governance_reviews enable row level security;

drop policy if exists governance_reviews_select on public.governance_reviews;
drop policy if exists governance_reviews_insert on public.governance_reviews;
drop policy if exists governance_reviews_update on public.governance_reviews;

create policy governance_reviews_select on public.governance_reviews for select using (
  organization_id = (select organization_id from public.profiles where id = auth.uid())
);
create policy governance_reviews_insert on public.governance_reviews for insert with check (
  organization_id = (select organization_id from public.profiles where id = auth.uid())
  and actor_id = auth.uid()
);
create policy governance_reviews_update on public.governance_reviews for update using (
  organization_id = (select organization_id from public.profiles where id = auth.uid())
) with check (
  organization_id = (select organization_id from public.profiles where id = auth.uid())
);

create or replace function public.set_governance_review_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists governance_reviews_updated_at on public.governance_reviews;
create trigger governance_reviews_updated_at before update on public.governance_reviews for each row execute function public.set_governance_review_updated_at();
