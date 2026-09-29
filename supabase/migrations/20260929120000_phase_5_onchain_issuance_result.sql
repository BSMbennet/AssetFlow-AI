alter table public.tokenization_requests
  add column if not exists token_contract_address text,
  add column if not exists transaction_hash text,
  add column if not exists transaction_block bigint,
  add column if not exists issued_recipient text,
  add column if not exists issued_at timestamptz;

create index if not exists tokenization_requests_transaction_hash_idx
  on public.tokenization_requests(transaction_hash)
  where transaction_hash is not null;
