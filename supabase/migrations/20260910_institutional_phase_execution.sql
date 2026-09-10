-- Phase execution hardening: make the remaining phase models operational rather than schema-only.
-- Add a uniform creation timestamp to domains whose original model was observation-oriented.
alter table if exists public.treasury_positions add column if not exists created_at timestamptz not null default now();
alter table if exists public.risk_snapshots add column if not exists created_at timestamptz not null default now();
alter table if exists public.custody_positions add column if not exists created_at timestamptz not null default now();
alter table if exists public.security_controls add column if not exists created_at timestamptz not null default now();
alter table if exists public.regulatory_rulesets add column if not exists created_at timestamptz not null default now();
alter table if exists public.liquidity_routes add column if not exists created_at timestamptz not null default now();

-- Phase 14: deterministic event -> workflow/task orchestration.
create or replace function public.process_event_trigger(p_trigger_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  tr public.event_triggers%rowtype;
  r public.event_rules%rowtype;
  wf_id uuid;
  task_id uuid;
  exception_id uuid;
  title text;
  org uuid;
begin
  select organization_id into org from public.profiles where id = auth.uid();
  if org is null then raise exception 'No organization is assigned to the authenticated user'; end if;

  select * into tr from public.event_triggers where id = p_trigger_id and organization_id = org for update;
  if not found then raise exception 'Event trigger not found'; end if;
  if tr.status = 'PROCESSED' then
    return jsonb_build_object('status','PROCESSED','workflow_id',tr.workflow_id,'task_id',tr.task_id,'exception_id',tr.exception_id);
  end if;
  if tr.status not in ('RECEIVED','FAILED') then raise exception 'Event trigger is not processable in status %', tr.status; end if;

  select * into r from public.event_rules where id = tr.rule_id and organization_id = org and enabled = true;
  if not found then
    update public.event_triggers set status='FAILED' where id=p_trigger_id;
    raise exception 'Enabled event rule not found';
  end if;

  title := coalesce(tr.payload->>'title', r.name || ' · ' || tr.event_type);
  insert into public.operational_workflows(organization_id,name,workflow_type,owner_role,status,sla_hours)
  values (org, title, r.target_workflow_type, coalesce(r.auto_assign_role,'OPERATOR'), 'ACTIVE', greatest(r.sla_hours,1))
  returning id into wf_id;

  insert into public.operational_tasks(organization_id,workflow_id,title,task_type,priority,status,due_at)
  values (org,wf_id,title,tr.event_type,r.priority,'OPEN',now() + make_interval(hours=>greatest(r.sla_hours,1)))
  returning id into task_id;

  if upper(tr.source_domain) in ('INTELLIGENCE','RISK','COMPLIANCE') or upper(tr.event_type) like '%CRITICAL%' then
    insert into public.operational_exceptions(organization_id,task_id,title,severity,status,reason)
    values (org,task_id,title,'CRITICAL','OPEN',coalesce(tr.payload->>'reason','Escalated by event orchestration'))
    returning id into exception_id;
  end if;

  update public.event_triggers
  set status='PROCESSED', workflow_id=wf_id, task_id=task_id, exception_id=exception_id, processed_at=now()
  where id=p_trigger_id;

  return jsonb_build_object('status','PROCESSED','workflow_id',wf_id,'task_id',task_id,'exception_id',exception_id);
exception when others then
  update public.event_triggers set status='FAILED' where id=p_trigger_id;
  raise;
end;
$$;

revoke all on function public.process_event_trigger(uuid) from public;
grant execute on function public.process_event_trigger(uuid) to authenticated;

-- Phase 15: server-side approval policy enforcement. Direct table updates cannot bypass the gate.
create or replace function public.enforce_decision_policy()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.decision_policies%rowtype;
  approval_count integer;
  distinct_approvers integer;
  role_ok boolean := false;
begin
  if new.status <> 'APPROVED' or new.status = old.status then return new; end if;
  if new.policy_id is null then return new; end if;

  select * into p from public.decision_policies where id=new.policy_id and organization_id=new.organization_id;
  if not found then raise exception 'Decision policy not found'; end if;
  if p.status <> 'ACTIVE' then raise exception 'Decision policy is not active'; end if;

  select count(*), count(distinct approver_id)
  into approval_count, distinct_approvers
  from public.decision_approvals
  where decision_id=new.id and organization_id=new.organization_id and action='APPROVE';

  if approval_count < p.required_approvals then
    raise exception 'Approval policy requires % approvals; only % recorded', p.required_approvals, approval_count;
  end if;
  if p.segregation_required and distinct_approvers < 2 then
    raise exception 'Segregation of duties requires at least two distinct approvers';
  end if;
  if p.evidence_required and jsonb_array_length(coalesce(new.evidence,'[]'::jsonb)) = 0 then
    raise exception 'Decision evidence is required before approval';
  end if;

  if p.min_approver_role is not null then
    select exists(
      select 1 from public.decision_approvals a
      where a.decision_id=new.id and a.organization_id=new.organization_id and a.action='APPROVE'
        and upper(coalesce(a.role,'')) = upper(p.min_approver_role)
    ) into role_ok;
    if not role_ok then raise exception 'Required approver role % is missing', p.min_approver_role; end if;
  end if;
  return new;
end;
$$;

drop trigger if exists decision_policy_enforcement on public.decision_requests;
create trigger decision_policy_enforcement
before update of status on public.decision_requests
for each row execute function public.enforce_decision_policy();

-- Operational integrity: keep organization ids aligned across linked objects.
create or replace function public.assert_org_linkage()
returns trigger
language plpgsql
as $$
declare linked_org uuid;
begin
  if new.workflow_id is not null then select organization_id into linked_org from public.operational_workflows where id=new.workflow_id; if linked_org is distinct from new.organization_id then raise exception 'Organization mismatch on workflow link'; end if; end if;
  if new.task_id is not null then select organization_id into linked_org from public.operational_tasks where id=new.task_id; if linked_org is distinct from new.organization_id then raise exception 'Organization mismatch on task link'; end if; end if;
  return new;
end;
$$;

drop trigger if exists event_trigger_org_linkage on public.event_triggers;
create trigger event_trigger_org_linkage before insert or update on public.event_triggers for each row execute function public.assert_org_linkage();

notify pgrst, 'reload schema';
