alter table public.expedientes
  add column invima_compliance_score integer,
  add column invima_compliance_status text,
  add column invima_compliance_json jsonb;
