create unique index if not exists compliance_records_asset_type_uidx
  on public.compliance_records(asset_id, compliance_type);

create unique index if not exists risk_assessments_asset_uidx
  on public.risk_assessments(asset_id);
