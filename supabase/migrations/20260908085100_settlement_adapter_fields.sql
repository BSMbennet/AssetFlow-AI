alter table public.settlement_instructions add column if not exists idempotency_key text;
alter table public.settlement_instructions add column if not exists adapter_status text not null default 'NOT_SUBMITTED';
alter table public.settlement_instructions add column if not exists external_reference text;
alter table public.settlement_instructions add column if not exists failure_code text;
alter table public.settlement_instructions add column if not exists failure_message text;
alter table public.settlement_events add column if not exists event_type text not null default 'STATUS_CHANGE';
alter table public.settlement_events add column if not exists metadata jsonb not null default '{}'::jsonb;

create unique index if not exists settlement_instructions_org_idempotency_idx
  on public.settlement_instructions(organization_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists settlement_instructions_org_status_idx
  on public.settlement_instructions(organization_id, status, created_at desc);

create index if not exists settlement_events_settlement_created_idx
  on public.settlement_events(settlement_id, created_at asc);
