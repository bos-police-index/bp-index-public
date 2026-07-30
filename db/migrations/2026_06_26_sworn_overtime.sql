-- BPD sworn-officer overtime, broken down by category (review: full overtime dataset).
-- Source: "BPD Police Overtime Files" — Sworn OT FY23, FY24, FY25, FY26-YTD (public records).
-- Per-line-item OT with an Overtime Category (Special Events, Court, Extended Tours,
-- Replacement Personnel, Additional Tour/Call-out). Quantity is HOURS PAID, not dollars
-- (the dollar total already lives in v2_earnings_year.ot_pay; these complement it).
-- Hard-matched to officers by employee_id (the file's ID column). ~762k line-items,
-- 2,399 officers (97% match), FY2022-07 → 2026-04.

-- 1) Raw landing table (data loaded separately via \copy — not committed).
CREATE TABLE IF NOT EXISTS production.raw_v2_sworn_overtime (
  raw_id        bigserial PRIMARY KEY,
  employee_id   bigint,
  name          text,
  rank          text,
  ot_date       date,
  hours         numeric,
  ot_code       int,
  description   text,
  category      text,
  fy            int,
  ingested_at   timestamptz DEFAULT now()
);

-- 2) Reconciled per-officer overtime.
CREATE TABLE IF NOT EXISTS production.v2_overtime (
  ot_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bpi_id         uuid NOT NULL,
  employee_id    bigint,
  ot_date        date,
  hours          numeric,
  ot_code        int,
  description    text,
  category       text,        -- raw category, e.g. 'COURT CODE ONLY'
  category_label text,        -- display label, e.g. 'Court'
  fy             int,
  source         text,
  as_of          timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_v2_overtime_bpi      ON production.v2_overtime(bpi_id);
CREATE INDEX IF NOT EXISTS idx_v2_overtime_category ON production.v2_overtime(category_label);
CREATE INDEX IF NOT EXISTS idx_v2_overtime_date     ON production.v2_overtime(ot_date);

-- Category raw -> display label (kept in one place).
CREATE OR REPLACE FUNCTION production.overtime_category_label(cat text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE upper(TRIM(cat))
    WHEN 'COURT CODE ONLY'            THEN 'Court'
    WHEN 'SPECIAL EVENTS'             THEN 'Special Events'
    WHEN 'EXTENDED TOURS'             THEN 'Extended Tours'
    WHEN 'REPLACEMENT PERSONNEL'      THEN 'Replacement Personnel'
    WHEN 'ADDITIONAL TOUR / CALL OUT' THEN 'Additional Tour / Call-out'
    ELSE initcap(TRIM(cat))
  END
$$;

-- 3) Reconciler: hard-match by employee_id → bpi_id.
CREATE OR REPLACE FUNCTION production.run_overtime_from_sworn()
RETURNS TABLE(raw_rows integer, attached integer, no_officer integer) LANGUAGE plpgsql AS $$
DECLARE v_raw int; v_att int; v_no int;
BEGIN
  SELECT count(*) INTO v_raw FROM production.raw_v2_sworn_overtime;
  DELETE FROM production.v2_overtime WHERE source = 'bpd_sworn_ot';
  INSERT INTO production.v2_overtime
      (bpi_id, employee_id, ot_date, hours, ot_code, description, category, category_label, fy, source)
  SELECT m.bpi_id, r.employee_id, r.ot_date, r.hours, r.ot_code, r.description,
         r.category, production.overtime_category_label(r.category), r.fy, 'bpd_sworn_ot'
    FROM production.raw_v2_sworn_overtime r
    JOIN production.v2_officer_id_map m ON m.employee_id = r.employee_id;
  GET DIAGNOSTICS v_att = ROW_COUNT;
  SELECT count(DISTINCT r.employee_id) INTO v_no
    FROM production.raw_v2_sworn_overtime r
   WHERE NOT EXISTS (SELECT 1 FROM production.v2_officer_id_map m WHERE m.employee_id = r.employee_id);
  RETURN QUERY SELECT v_raw, v_att, v_no;
END $$;

-- 4a) Explorer detail view — leads with the officer-identity block (Epic 2 pattern).
CREATE OR REPLACE VIEW production.vw_v2_overtime AS
SELECT o.ot_id,
       ib.officer_name, ib.officer_badge_no, ib.officer_post_id, ib.officer_employee_id,
       ib.officer_rank, ib.officer_current_unit,
       o.ot_date, o.category_label AS category, o.description, o.hours, o.ot_code, o.fy,
       o.bpi_id
FROM production.v2_overtime o
LEFT JOIN production.v2_officer_identity_block ib ON ib.bpi_id = o.bpi_id;

-- 4b) Per-officer category rollup — for the profile section.
CREATE OR REPLACE VIEW production.vw_v2_overtime_by_category AS
SELECT bpi_id,
       category_label,
       round(sum(hours)::numeric, 1) AS total_hours,
       count(*)                       AS line_items,
       min(fy)                        AS first_fy,
       max(fy)                        AS last_fy
FROM production.v2_overtime
GROUP BY bpi_id, category_label;

COMMENT ON VIEW production.vw_v2_overtime IS 'Sworn OT line-items (hours) by category, with officer identity — FY2023–FY2026.';
COMMENT ON VIEW production.vw_v2_overtime_by_category IS 'Per-officer overtime hours rolled up by category, for the profile.';
