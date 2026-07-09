-- Paid Details + Traffic/MVC citations — hard-matched by employee_id
-- ===========================================================================
-- Two large FOIA datasets that carry employee_id, so they link to the officer
-- roster CONFIDENTLY (no name-match warning). Coverage is limited to officers
-- present in v2_officer_id_map — records whose employee_id isn't in the roster
-- (traffic has no officer name, so we can't mint them) are left unattached.
--
--   Paid details : raw_detail_records (323K rows, 2,001 officers, 100% in map)
--   Traffic/MVC  : raw_traffic_tickets (2020-era) + raw_traffic_tickets_fall_2025
--                  unified, deduped by citation number (both all-Boston-PD)

-- ---------------------------------------------------------------------------
-- 1. Paid details
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS production.v2_paid_detail (
    detail_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bpi_id        uuid REFERENCES production.v2_officer_id_map(bpi_id),
    tracking_no   integer,
    start_date    date,
    start_time    text,
    end_date      date,
    end_time      text,
    hours_worked  integer,
    detail_type   text,
    customer_name text,
    customer_city text,
    customer_zip  text,
    street        text,
    cross_street  text,
    org_desc      text,
    state_funded  text,
    pay_amount    numeric,
    pay_rate      integer,
    source        text NOT NULL,
    as_of         timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS v2_paid_detail_bpi_idx ON production.v2_paid_detail (bpi_id);

CREATE OR REPLACE FUNCTION production.run_paid_details_from_legacy()
RETURNS TABLE(rows_in int, attached int, distinct_officers int) AS $$
DECLARE v_in int; v_att int; v_off int;
BEGIN
    SELECT COUNT(*) INTO v_in FROM production.raw_detail_records;
    DELETE FROM production.v2_paid_detail WHERE source = 'bpd_detail_records';

    INSERT INTO production.v2_paid_detail
        (bpi_id, tracking_no, start_date, start_time, end_date, end_time, hours_worked,
         detail_type, customer_name, customer_city, customer_zip, street, cross_street,
         org_desc, state_funded, pay_amount, pay_rate, source, as_of)
    SELECT m.bpi_id, r.tracking_no, r.start_date, r.start_time, r.end_date, r.end_time,
           r.hours_worked, r.detail_type, r.customer_name, r.customer_city, r.customer_zip,
           r.street, r.xstreet, r.emp_org_desc, r.state_funded,
           production.parse_money(r.pay_amount), r.pay_rate,
           'bpd_detail_records', now()
      FROM production.raw_detail_records r
      JOIN production.v2_officer_id_map m ON m.employee_id = r.employee_id
     WHERE r.employee_id IS NOT NULL;
    GET DIAGNOSTICS v_att = ROW_COUNT;

    SELECT COUNT(DISTINCT bpi_id) INTO v_off FROM production.v2_paid_detail WHERE source='bpd_detail_records';
    rows_in := v_in; attached := v_att; distinct_officers := v_off; RETURN NEXT;
END
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 2. Traffic / MVC citations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS production.v2_traffic_citation (
    citation_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bpi_id          uuid REFERENCES production.v2_officer_id_map(bpi_id),
    event_date      date,
    citation_number text,
    citation_type   text,
    violation_type  text,
    offense_code    text,
    offense_desc    text,
    disposition     text,
    location_name   text,
    searched        boolean,
    crash           boolean,
    subject_race    text,
    subject_gender  text,
    subject_yob     integer,
    issuing_agency  text,
    source          text NOT NULL,
    as_of           timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS v2_traffic_citation_bpi_idx ON production.v2_traffic_citation (bpi_id);

CREATE OR REPLACE FUNCTION production.run_traffic_from_legacy()
RETURNS TABLE(attached_fall2025 int, attached_2020 int, distinct_officers int) AS $$
DECLARE v_f25 int; v_old int; v_off int;
BEGIN
    DELETE FROM production.v2_traffic_citation WHERE source IN ('bpd_traffic_fall_2025', 'bpd_traffic_2020');

    -- fall_2025 first (newer); officer_id is the employee_id (as text)
    INSERT INTO production.v2_traffic_citation
        (bpi_id, event_date, citation_number, citation_type, violation_type, offense_code, offense_desc,
         disposition, location_name, searched, crash, subject_race, subject_gender, subject_yob,
         issuing_agency, source, as_of)
    SELECT m.bpi_id, r.event_date, r.citation_number, r.citation_type, r.violator_type,
           r.offense_code, r.offense_description, NULL,
           r.location_name,
           CASE WHEN r.searched ~* '^(y|yes|t|true|1)$' THEN true WHEN r.searched ~* '^(n|no|f|false|0)$' THEN false ELSE NULL END,
           CASE WHEN r.crash    ~* '^(y|yes|t|true|1)$' THEN true WHEN r.crash    ~* '^(n|no|f|false|0)$' THEN false ELSE NULL END,
           r.race, r.gender, NULLIF(regexp_replace(r.year_of_birth, '[^0-9]', '', 'g'), '')::int,
           r.issuing_agency, 'bpd_traffic_fall_2025', now()
      FROM production.raw_traffic_tickets_fall_2025 r
      JOIN production.v2_officer_id_map m ON m.employee_id::text = NULLIF(r.officer_id, '')
     WHERE r.officer_id IS NOT NULL;
    GET DIAGNOSTICS v_f25 = ROW_COUNT;

    -- 2020-era, only citation numbers not already present from fall_2025
    INSERT INTO production.v2_traffic_citation
        (bpi_id, event_date, citation_number, citation_type, violation_type, offense_code, offense_desc,
         disposition, location_name, searched, crash, subject_race, subject_gender, subject_yob,
         issuing_agency, source, as_of)
    SELECT m.bpi_id, r.event_date, r.citation_no, r.citation_type, r.viol_type,
           r.offense, r.offense_desc, NULLIF(TRIM(r.disposition_desc), ''),
           r.location_name,
           CASE WHEN r.searched ~* '^(y|yes|t|true|1)$' THEN true WHEN r.searched ~* '^(n|no|f|false|0)$' THEN false ELSE NULL END,
           CASE WHEN r.crash    ~* '^(y|yes|t|true|1)$' THEN true WHEN r.crash    ~* '^(n|no|f|false|0)$' THEN false ELSE NULL END,
           r.race, r.gender, r.year_of_birth::int,
           r.issuing_agency, 'bpd_traffic_2020', now()
      FROM production.raw_traffic_tickets r
      JOIN production.v2_officer_id_map m ON m.employee_id = r.employee_id
     WHERE r.employee_id IS NOT NULL
       AND (r.citation_no IS NULL OR r.citation_no NOT IN (
             SELECT citation_number FROM production.v2_traffic_citation
             WHERE source='bpd_traffic_fall_2025' AND citation_number IS NOT NULL));
    GET DIAGNOSTICS v_old = ROW_COUNT;

    SELECT COUNT(DISTINCT bpi_id) INTO v_off FROM production.v2_traffic_citation;
    attached_fall2025 := v_f25; attached_2020 := v_old; distinct_officers := v_off; RETURN NEXT;
END
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 3. Views
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW production.vw_v2_paid_detail AS
SELECT detail_id, bpi_id, tracking_no, start_date, start_time, end_date, end_time, hours_worked,
       detail_type, customer_name, customer_city, customer_zip, street, cross_street,
       org_desc, state_funded, pay_amount, pay_rate, source, as_of
  FROM production.v2_paid_detail;

CREATE OR REPLACE VIEW production.vw_v2_traffic_citation AS
SELECT citation_id, bpi_id, event_date, citation_number, citation_type, violation_type,
       offense_code, offense_desc, disposition, location_name, searched, crash,
       subject_race, subject_gender, subject_yob, issuing_agency, source, as_of
  FROM production.v2_traffic_citation;

COMMENT ON TABLE production.v2_paid_detail IS
    'Paid detail assignments from raw_detail_records, hard-matched to officers by employee_id.';
COMMENT ON TABLE production.v2_traffic_citation IS
    'Traffic/MVC citations (2020-era + fall_2025, deduped by citation number), hard-matched by employee_id.';
