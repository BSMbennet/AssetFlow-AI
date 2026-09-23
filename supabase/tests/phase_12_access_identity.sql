-- Phase 12 RLS smoke test.
-- Run in a disposable/test transaction as a privileged database role.
-- The test impersonates the authenticated Postgres role through the same
-- request JWT settings used by Supabase Data API requests.
begin;

insert into auth.users (id,aud,role,email,created_at,updated_at,is_sso_user,is_anonymous)
values
  ('00000000-0000-0000-0000-000000000171','authenticated','authenticated','phase12-owner-test@example.invalid',now(),now(),false,false),
  ('00000000-0000-0000-0000-000000000172','authenticated','authenticated','phase12-other-test@example.invalid',now(),now(),false,false);

update public.profiles
set organization_id = (select id from public.organizations order by created_at limit 1)
where id = '00000000-0000-0000-0000-000000000171';

update public.profiles
set organization_id = (select id from public.organizations order by created_at desc limit 1)
where id = '00000000-0000-0000-0000-000000000172';

insert into public.organization_members (
  organization_id,user_id,email,full_name,role,status
)
select
  p.organization_id,p.id,u.email,'Phase 12 Test User','OWNER','ACTIVE'
from public.profiles p
join auth.users u on u.id = p.id
where p.id in (
  '00000000-0000-0000-0000-000000000171',
  '00000000-0000-0000-0000-000000000172'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000171',
  true
);
select set_config('request.jwt.claim.role','authenticated',true);

do $$
declare
  current_org uuid;
  member_count integer;
  policy_count integer;
begin
  select private.current_access_org(), count(*)
  into current_org, member_count
  from public.organization_members;

  if current_org is null then
    raise exception 'Phase 12 failed: current org was not resolved';
  end if;

  if member_count <> 1 then
    raise exception 'Phase 12 failed: cross-organization membership leakage (% rows)', member_count;
  end if;

  if private.current_access_role() <> 'OWNER' then
    raise exception 'Phase 12 failed: active OWNER role was not resolved';
  end if;

  insert into public.access_policies (
    organization_id,name,resource,action,effect,role
  ) values (
    current_org,'Phase 12 test policy','assets','read','ALLOW','ANALYST'
  );

  select count(*)
  into policy_count
  from public.access_policies;

  if policy_count <> 1 then
    raise exception 'Phase 12 failed: own-org policy write/read check';
  end if;

  begin
    insert into public.access_policies (
      organization_id,name,resource,action,effect,role
    )
    values (
      (select id from public.organizations order by created_at desc limit 1),
      'Phase 12 cross-org policy','assets','read','ALLOW','ANALYST'
    );
    raise exception 'Phase 12 failed: cross-org policy insert was allowed';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.access_invitations (
      organization_id,email,role,invited_by
    )
    values (
      (select id from public.organizations order by created_at desc limit 1),
      'phase12-cross-org@example.invalid','INVESTOR',
      '00000000-0000-0000-0000-000000000171'
    );
    raise exception 'Phase 12 failed: cross-org invitation insert was allowed';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.access_events (
      organization_id,user_id,event_type,outcome
    )
    values (
      (select id from public.organizations order by created_at desc limit 1),
      '00000000-0000-0000-0000-000000000171',
      'PHASE12_CROSS_ORG_TEST','DENIED'
    );
    raise exception 'Phase 12 failed: cross-org event insert was allowed';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

rollback;
