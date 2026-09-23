-- Phase 12 bootstrap: the first authenticated profile in an organization may claim
-- the OWNER membership once. After the first member exists, normal role policies apply.

drop function if exists private.bootstrap_access_member();

drop policy if exists organization_members_bootstrap on public.organization_members;

create policy organization_members_bootstrap on public.organization_members
for insert
to authenticated
with check (
  organization_id = private.current_access_org()
  and user_id = auth.uid()
  and role = 'OWNER'
  and status = 'ACTIVE'
  and not exists (
    select 1
    from public.organization_members existing
    where existing.organization_id = private.current_access_org()
  )
);
