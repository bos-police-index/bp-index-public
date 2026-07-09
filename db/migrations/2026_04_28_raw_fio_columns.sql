-- Align raw_v2_boston_fio with the actual data.boston.gov FieldContact CSV.
-- The original Phase 1 schema was a placeholder; this adds the columns the
-- CKAN feed actually publishes (and leaves the legacy ones in place as nullable).

ALTER TABLE production.raw_v2_boston_fio
  ADD COLUMN IF NOT EXISTS contact_officer text,
  ADD COLUMN IF NOT EXISTS supervisor      text,
  ADD COLUMN IF NOT EXISTS duration        text,
  ADD COLUMN IF NOT EXISTS vehicle_year    text,
  ADD COLUMN IF NOT EXISTS vehicle_state   text,
  ADD COLUMN IF NOT EXISTS vehicle_model   text,
  ADD COLUMN IF NOT EXISTS vehicle_color   text,
  ADD COLUMN IF NOT EXISTS vehicle_style   text,
  ADD COLUMN IF NOT EXISTS vehicle_type    text,
  ADD COLUMN IF NOT EXISTS key_situations  text,
  ADD COLUMN IF NOT EXISTS contact_reason  text;
