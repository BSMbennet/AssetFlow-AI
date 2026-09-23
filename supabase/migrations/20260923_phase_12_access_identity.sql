-- Phase 12: Institutional Access & Identity
-- Organization-scoped membership, policy, invitation and access telemetry primitives.
-- Authorization is enforced in Postgres/RLS; the browser never supplies an organization_id
-- for privileged mutations.

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'INVESTOR',
  status text not null default 'ACTIVE',
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id),
  constraint organization_members_role_chk check (role in ('OWNER','ADMIN','OPERATOR','COMPLIANCE','ANALYST','INVESTOR')),
  constraint organization_members_status_chk check (status in ('ACTIVE','INACTIVE','SUSPENDED'))
);

create index if not exists organization_members_org_idx
  on public.organization_members(organization_id, status, created_at desc);

create table if not exists public.access_policies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  resource text not null,
  action text not null,
  effect text not null default 'ALLOW',
  role text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint access_policies_effect_chk check (effect in ('ALLOW','DENY')),
  constraint access_policies_role_chk check (role in ('OWNER','ADMIN','OPERATOR','COMPLIANCE','ANALYST','INVESTOR'))
);

create index if not exists access_policies_org_idx
  on public.access_policies(organization_id, enabled, created_at desc);

create table if not exists public.access_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null default 'INVESTOR',
  status text not null default 'PENDING',
  invited_by uuid not null references auth.users(id) on delete restrict,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint access_invitations_role_chk check (role in ('ADMIN','OPERATOR','COMPLIANCE','ANALYST','INVESTOR')),
  constraint access_invitations_status_chk check (status in ('PENDING','ACCEPTED','REVOKED','EXPIRED'))
);

create unique index if not exists access_invitations_pending_email_idx
  on public.access_invitations(organization_id, lower(email))
  where status = 'PENDING';

create index if not exists access_invitations_org_idx
  on public.access_invitations(organization_id, created_at desc);

create table if not exists public.access_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  resource text,
  action text,
  outcome text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint access_events_outcome_chk check (outcome in ('ALLOWED','DENIED','RECORDED'))
);

create index if not exists access_events_org_idx
  on public.access_events(organization_id, created_at desc);

create or replace function public.current_access_org()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_access_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.organization_members
  where organization_id = public.current_access_org()
    and user_id = auth.uid()
    and status = 'ACTIVE'
  limit 1
$$;

create or replace function public.touch_access_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists organization_members_updated_at on public.organization_members;
create trigger organization_members_updated_at
before update on public.organization_members
for each row execute function public.touch_access_member();

drop trigger if exists access_policies_updated_at on public.access_policies;
create trigger access_policies_updated_at
before update on public.access_policies
for each row execute function public.touch_access_member();

alter table public.organization_members enable row level security;
alter table public.access_policies enable row level security;
alter table public.access_invitations enable row level security;
alter table public.access_events enable row level security;

drop policy if exists organization_members_select on public.organization_members;
drop policy if exists organization_members_insert on public.organization_members;
drop policy if exists organization_members_update on public.organization_members;
drop policy if exists organization_members_delete on public.organization_members;

create policy organization_members_select on public.organization_members
for select using (organization_id = public.current_access_org());

create policy organization_members_insert on public.organization_members
for insert with check (
  organization_id = public.current_access_org()
  and public.current_access_role() in ('OWNER','ADMIN')
);

create policy organization_members_update on public.organization_members
for update using (
  organization_id = public.current_access_org()
  and public.current_access_role() in ('OWNER','ADMIN')
) with check (
  organization_id = public.current_access_org()
  and public.current_access_role() in ('OWNER','ADMIN')
);

create policy organization_members_delete on public.organization_members
for delete using (
  organization_id = public.current_access_org()
  and public.current_access_role() = 'OWNER'
);

drop policy if exists access_policies_select on public.access_policies;
drop policy if exists access_policies_insert on public.access_policies;
drop policy if exists access_policies_update on public.access_policies;
drop policy if exists access_policies_delete on public.access_policies;

create policy access_policies_select on public.access_policies
for select using (organization_id = public.current_access_org());

create policy access_policies_insert on public.access_policies
for insert with check (
  organization_id = public.current_access_org()
  and public.current_access_role() in ('OWNER','ADMIN')
);

create policy access_policies_update on public.access_policies
for update using (
  organization_id = public.current_access_org()
  and public.current_access_role() in ('OWNER','ADMIN')
) with check (
  organization_id = public.current_access_org()
  and public.current_access_role() in ('OWNER','ADMIN')
);

create policy access_policies_delete on public.access_policies
for delete using (
  organization_id = public.current_access_org()
  and public.current_access_role() = 'OWNER'
);

drop policy if exists access_invitations_select on public.access_invitations;
drop policy if exists access_invitations_insert on public.access_invitations;
drop policy if exists access_invitations_update on public.access_invitations;

create policy access_invitations_select on public.access_invitations
for select using (organization_id = public.current_access_org());

create policy access_invitations_insert on public.access_invitations
for insert with check (
  organization_id = public.current_access_org()
  and invited_by = auth.uid()
  and public.current_access_role() in ('OWNER','ADMIN')
);

create policy access_invitations_update on public.access_invitations
for update using (
  organization_id = public.current_access_org()
  and public.current_access_role() in ('OWNER','ADMIN')
) with check (
  organization_id = public.current_access_org()
  and public.current_access_role() in ('OWNER','ADMIN')
);

drop policy if exists access_events_select on public.access_events;
drop policy if exists access_events_insert on public.access_events;

create policy access_events_select on public.access_events
for select using (organization_id = public.current_access_org());

create policy access_events_insert on public.access_events
for insert with check (
  organization_id = public.current_access_org()
  and actor_id = auth.uid()
);

-- Prevent clients from changing the organization context of a member or policy row.
revoke all on public.current_access_org() from public;
revoke all on public.current_access_role() from public;
grant execute on function public.current_access_org() to authenticated;
grant execute on function public.current_access_role() to authenticated;
