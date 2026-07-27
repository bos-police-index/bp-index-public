-- MA POST/MPTC FOIA data (Stecklow requests 25-10 separation, 25-11 academy).
-- Both are statewide, keyed by MPTC ID — a HARD identity key we already carry on
-- v2_officer_id_map — so these attach with id-level confidence (no name guessing).

-- ---- raw landing tables (all text; cast downstream) --------------------------
CREATE TABLE IF NOT EXISTS production.raw_v2_mptc_separation (
    local_id            serial PRIMARY KEY,
    mptc_id             text,
    first_name          text,
    last_name           text,
    cert_number         text,
    cert_status         text,
    cert_expiration     text,
    current_employer    text,
    separation_date     text,
    former_employer     text,
    separation_type     text
);

CREATE TABLE IF NOT EXISTS production.raw_v2_mptc_academy (
    local_id            serial PRIMARY KEY,
    mptc_id             text,
    first_name          text,
    last_name           text,
    gender              text,
    year_of_birth       text,
    race                text,
    enrollment_status   text,
    sending_org         text,
    class_name          text,
    class_end_date      text
);

-- ---- officer-facing tables ---------------------------------------------------
CREATE TABLE IF NOT EXISTS production.v2_officer_separation (
    sep_id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bpi_id            uuid,
    mptc_id           text,
    current_employer  text,
    former_employer   text,
    separation_date   date,
    separation_type   text,
    cert_status       text,
    cert_expiration   date,
    source            text,
    as_of             timestamptz
);
CREATE INDEX IF NOT EXISTS ix_v2_sep_bpi ON production.v2_officer_separation(bpi_id);

CREATE TABLE IF NOT EXISTS production.v2_officer_academy (
    acad_id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bpi_id            uuid,
    mptc_id           text,
    class_name        text,
    class_end_date    date,
    sending_org       text,
    enrollment_status text,
    gender            text,
    year_of_birth     int,
    race              text,
    source            text,
    as_of             timestamptz
);
CREATE INDEX IF NOT EXISTS ix_v2_acad_bpi ON production.v2_officer_academy(bpi_id);

-- ---- reconcilers: hard-match to roster by MPTC ID ----------------------------
CREATE OR REPLACE FUNCTION production.run_separation_from_raw()
RETURNS TABLE(rows_in int, attached int, officers int) AS $$
DECLARE v_in int; v_att int; v_off int;
BEGIN
    SELECT COUNT(*) INTO v_in FROM production.raw_v2_mptc_separation;
    DELETE FROM production.v2_officer_separation WHERE source = 'mass_post_separation_2025';

    INSERT INTO production.v2_officer_separation
        (bpi_id, mptc_id, current_employer, former_employer, separation_date, separation_type, cert_status, cert_expiration, source, as_of)
    SELECT
        (SELECT (array_agg(m.bpi_id))[1] FROM production.v2_officer_id_map m
          WHERE m.mptc_id = r.mptc_id HAVING COUNT(DISTINCT m.bpi_id) = 1),
        r.mptc_id, NULLIF(r.current_employer,''), NULLIF(r.former_employer,''),
        CASE WHEN r.separation_date ~ '^\d{4}-\d{2}-\d{2}$' THEN r.separation_date::date END,
        NULLIF(r.separation_type,''), NULLIF(r.cert_status,''),
        CASE WHEN r.cert_expiration ~ '^\d{4}-\d{2}-\d{2}$' THEN r.cert_expiration::date END,
        'mass_post_separation_2025', now()
    FROM production.raw_v2_mptc_separation r
    WHERE r.mptc_id IS NOT NULL AND r.mptc_id <> ''
      AND EXISTS (SELECT 1 FROM production.v2_officer_id_map m WHERE m.mptc_id = r.mptc_id);
    GET DIAGNOSTICS v_att = ROW_COUNT;

    SELECT COUNT(DISTINCT bpi_id) INTO v_off FROM production.v2_officer_separation
     WHERE source='mass_post_separation_2025' AND bpi_id IS NOT NULL;
    rows_in := v_in; attached := v_att; officers := v_off; RETURN NEXT;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION production.run_academy_from_raw()
RETURNS TABLE(rows_in int, attached int, officers int) AS $$
DECLARE v_in int; v_att int; v_off int;
BEGIN
    SELECT COUNT(*) INTO v_in FROM production.raw_v2_mptc_academy;
    DELETE FROM production.v2_officer_academy WHERE source = 'mptc_academy_2025';

    INSERT INTO production.v2_officer_academy
        (bpi_id, mptc_id, class_name, class_end_date, sending_org, enrollment_status, gender, year_of_birth, race, source, as_of)
    SELECT
        (SELECT (array_agg(m.bpi_id))[1] FROM production.v2_officer_id_map m
          WHERE m.mptc_id = r.mptc_id HAVING COUNT(DISTINCT m.bpi_id) = 1),
        r.mptc_id, NULLIF(r.class_name,''),
        CASE WHEN r.class_end_date ~ '^\d{4}-\d{2}-\d{2}$' THEN r.class_end_date::date END,
        NULLIF(r.sending_org,''), NULLIF(r.enrollment_status,''), NULLIF(r.gender,''),
        CASE WHEN r.year_of_birth ~ '^\d{4}$' THEN r.year_of_birth::int END,
        NULLIF(r.race,''), 'mptc_academy_2025', now()
    FROM production.raw_v2_mptc_academy r
    WHERE r.mptc_id IS NOT NULL AND r.mptc_id <> ''
      AND EXISTS (SELECT 1 FROM production.v2_officer_id_map m WHERE m.mptc_id = r.mptc_id);
    GET DIAGNOSTICS v_att = ROW_COUNT;

    SELECT COUNT(DISTINCT bpi_id) INTO v_off FROM production.v2_officer_academy
     WHERE source='mptc_academy_2025' AND bpi_id IS NOT NULL;
    rows_in := v_in; attached := v_att; officers := v_off; RETURN NEXT;
END
$$ LANGUAGE plpgsql;

-- ---- officer-facing views ----------------------------------------------------
CREATE OR REPLACE VIEW production.vw_v2_officer_separation AS
    SELECT sep_id, bpi_id, mptc_id, current_employer, former_employer, separation_date,
           separation_type, cert_status, cert_expiration, source, as_of
    FROM production.v2_officer_separation WHERE bpi_id IS NOT NULL;

CREATE OR REPLACE VIEW production.vw_v2_officer_academy AS
    SELECT acad_id, bpi_id, mptc_id, class_name, class_end_date, sending_org,
           enrollment_status, gender, year_of_birth, race, source, as_of
    FROM production.v2_officer_academy WHERE bpi_id IS NOT NULL;

COMMENT ON FUNCTION production.run_separation_from_raw() IS 'Attach MA POST separation/agency-change records to roster officers by MPTC ID (hard key).';
COMMENT ON FUNCTION production.run_academy_from_raw() IS 'Attach MPTC academy graduation records to roster officers by MPTC ID (hard key).';
