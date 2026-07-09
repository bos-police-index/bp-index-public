-- Incident Journal — crime incidents with officer linkage
-- ===========================================================================
-- The statereference "incidents" export carries an officer_journal_name of the
-- form "<employee_id>  <NAME>" (e.g. "102191  MADELINE BANKS"). The leading id
-- is the BPD employee_id (99% match the roster), so incidents HARD-MATCH to
-- officers — the officer-incident linkage that was previously impossible (the
-- Analyze Boston crime data has no officer field).
--
-- This file is a narrow window (~10K incidents, Dec 2020–Jan 2021); more can be
-- loaded the same way later.

CREATE TABLE IF NOT EXISTS production.raw_v2_incident_journal (
    url                    text,
    incident_number        text,
    links                  text,
    occurred_on_date       text,
    district               text,
    district_name          text,
    shooting               text,
    location_of_occurrence text,
    street                 text,
    nature_of_incident     text,
    officer_journal_name   text,
    offenses               text,
    incident_clearance     text,
    number_of_arrestees    text,
    number_of_victims      text,
    number_of_offenders    text
);

CREATE TABLE IF NOT EXISTS production.v2_incident (
    incident_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bpi_id             uuid REFERENCES production.v2_officer_id_map(bpi_id),
    incident_number    text,
    occurred_on_date   timestamptz,
    district           text,
    shooting           boolean,
    location           text,
    nature_of_incident text,
    offenses           text,
    incident_clearance text,
    num_arrestees      integer,
    num_victims        integer,
    num_offenders      integer,
    officer_journal_name text,
    url                text,
    source             text NOT NULL,
    as_of              timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS v2_incident_bpi_idx ON production.v2_incident (bpi_id);

CREATE OR REPLACE FUNCTION production.run_incidents_from_journal()
RETURNS TABLE(raw_rows int, with_officer int, attached int, distinct_officers int) AS $$
DECLARE v_raw int; v_off int; v_att int; v_do int;
BEGIN
    SELECT COUNT(*) INTO v_raw FROM production.raw_v2_incident_journal;
    SELECT COUNT(*) INTO v_off FROM production.raw_v2_incident_journal
     WHERE officer_journal_name ~ '^\s*\d+';
    DELETE FROM production.v2_incident WHERE source = 'statereference_incidents';

    INSERT INTO production.v2_incident
        (bpi_id, incident_number, occurred_on_date, district, shooting, location,
         nature_of_incident, offenses, incident_clearance, num_arrestees, num_victims,
         num_offenders, officer_journal_name, url, source, as_of)
    SELECT m.bpi_id, r.incident_number,
           NULLIF(r.occurred_on_date, '')::timestamptz,
           NULLIF(TRIM(COALESCE(r.district_name, r.district)), ''),
           CASE WHEN lower(r.shooting)='true' THEN true WHEN lower(r.shooting)='false' THEN false ELSE NULL END,
           NULLIF(TRIM(COALESCE(r.location_of_occurrence, r.street)), ''),
           NULLIF(TRIM(r.nature_of_incident), ''),
           NULLIF(TRIM(r.offenses), ''),
           NULLIF(TRIM(r.incident_clearance), ''),
           NULLIF(regexp_replace(COALESCE(r.number_of_arrestees,''), '[^0-9]', '', 'g'), '')::int,
           NULLIF(regexp_replace(COALESCE(r.number_of_victims,''),   '[^0-9]', '', 'g'), '')::int,
           NULLIF(regexp_replace(COALESCE(r.number_of_offenders,''), '[^0-9]', '', 'g'), '')::int,
           TRIM(r.officer_journal_name), r.url, 'statereference_incidents', now()
      FROM production.raw_v2_incident_journal r
      JOIN production.v2_officer_id_map m
        ON m.employee_id = NULLIF((regexp_match(r.officer_journal_name, '^\s*(\d+)'))[1], '')::int
     WHERE r.officer_journal_name ~ '^\s*\d+' AND r.incident_number IS NOT NULL;
    GET DIAGNOSTICS v_att = ROW_COUNT;

    SELECT COUNT(DISTINCT bpi_id) INTO v_do FROM production.v2_incident WHERE source='statereference_incidents';
    raw_rows := v_raw; with_officer := v_off; attached := v_att; distinct_officers := v_do; RETURN NEXT;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE VIEW production.vw_v2_incident AS
SELECT incident_id, bpi_id, incident_number, occurred_on_date, district, shooting, location,
       nature_of_incident, offenses, incident_clearance, num_arrestees, num_victims, num_offenders,
       url, source, as_of
  FROM production.v2_incident;

COMMENT ON TABLE production.v2_incident IS
    'Crime incidents from the statereference incident journal, hard-matched to officers via the '
    'employee_id embedded in officer_journal_name. The officer-incident linkage absent from the public crime data.';
