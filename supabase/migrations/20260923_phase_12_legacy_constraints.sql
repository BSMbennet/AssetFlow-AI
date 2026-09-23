-- Phase 12 compatibility cleanup.
-- The pre-existing organization_members table used legacy lowercase role/status
-- constraints. Phase 12 normalizes these values to the institutional enum set,
-- so the legacy constraints must be removed after normalization.
alter table public.organization_members
  drop constraint if exists organization_members_role_check,
  drop constraint if exists organization_members_status_check;

-- The pre-existing membership visibility policy is superseded by the
-- organization-scoped Phase 12 policy set.
drop policy if exists "members can view their membership" on public.organization_members;
