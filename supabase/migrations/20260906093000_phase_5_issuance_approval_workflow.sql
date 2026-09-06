alter table public.tokenization_requests drop constraint if exists tokenization_requests_status_check;
alter table public.tokenization_requests add constraint tokenization_requests_status_check check (status in ('draft','ready_for_review','legal_review','custody_ready','investor_eligibility','approved','rejected','issued','cancelled'));

create index if not exists tokenization_requests_approval_status_idx on public.tokenization_requests(status, created_at desc);
