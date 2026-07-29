-- Format-agnostic date parser for uploaded POST/MPTC files. The source dates arrive
-- in several shapes depending on how the file was exported: ISO ('2025-07-01'),
-- ISO+time ('2025-07-01 00:00:00'), M/D/YYYY, MM/DD/YYYY, and M/D/YY (2-digit year,
-- which is what SheetJS yields from the xlsx display format). Never throws — an
-- unrecognized value returns NULL rather than failing the whole reconcile.
CREATE OR REPLACE FUNCTION production.parse_flex_date(s text) RETURNS date AS $$
BEGIN
    IF s IS NULL OR btrim(s) = '' THEN RETURN NULL; END IF;
    s := btrim(s);
    IF s ~ '^\d{4}-\d{1,2}-\d{1,2}' THEN
        RETURN to_date(substring(s from '^\d{4}-\d{1,2}-\d{1,2}'), 'YYYY-MM-DD');
    ELSIF s ~ '^\d{1,2}/\d{1,2}/\d{4}' THEN
        RETURN to_date(substring(s from '^\d{1,2}/\d{1,2}/\d{4}'), 'FMMM/FMDD/YYYY');
    ELSIF s ~ '^\d{1,2}/\d{1,2}/\d{2}([^0-9]|$)' THEN
        RETURN to_date(substring(s from '^\d{1,2}/\d{1,2}/\d{2}'), 'FMMM/FMDD/YY');
    END IF;
    RETURN NULL;
EXCEPTION WHEN others THEN
    RETURN NULL;
END
$$ LANGUAGE plpgsql IMMUTABLE;

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
        production.parse_flex_date(r.separation_date), NULLIF(r.separation_type,''),
        NULLIF(r.cert_status,''), production.parse_flex_date(r.cert_expiration),
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
        r.mptc_id, NULLIF(r.class_name,''), production.parse_flex_date(r.class_end_date),
        NULLIF(r.sending_org,''), NULLIF(r.enrollment_status,''), NULLIF(r.gender,''),
        (regexp_match(r.year_of_birth, '(\d{4})'))[1]::int,
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
