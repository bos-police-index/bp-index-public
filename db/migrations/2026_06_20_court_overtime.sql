-- Court Overtime section (review Epic 1). raw_court_overtime is 83k employee-id-keyed
-- rows (2020–2024); attach to roster officers by employee_id (hard key).
CREATE TABLE IF NOT EXISTS production.v2_court_overtime (
    cot_id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bpi_id         uuid,
    employee_id    bigint,
    ot_date        date,
    ot_code        int,
    description    text,
    assigned_desc  text,
    charged_desc   text,
    worked_hours   numeric,
    source         text,
    as_of          timestamptz
);
CREATE INDEX IF NOT EXISTS ix_v2_cot_bpi ON production.v2_court_overtime(bpi_id);

CREATE OR REPLACE FUNCTION production.run_court_overtime_from_raw()
RETURNS TABLE(rows_in int, attached int, officers int) AS $$
DECLARE v_in int; v_att int; v_off int;
BEGIN
    SELECT COUNT(*) INTO v_in FROM production.raw_court_overtime;
    DELETE FROM production.v2_court_overtime WHERE source = 'bpd_court_overtime';

    INSERT INTO production.v2_court_overtime
        (bpi_id, employee_id, ot_date, ot_code, description, assigned_desc, charged_desc, worked_hours, source, as_of)
    SELECT m.bpi_id, r.employee_id, r.ot_date, r.ot_code,
           NULLIF(r.description,''), NULLIF(r.assigned_desc,''), NULLIF(r.charged_desc,''),
           r.worked_hours::numeric, 'bpd_court_overtime', now()
    FROM production.raw_court_overtime r
    JOIN production.v2_officer_id_map m ON m.employee_id = r.employee_id
    WHERE r.employee_id IS NOT NULL;
    GET DIAGNOSTICS v_att = ROW_COUNT;

    SELECT COUNT(DISTINCT bpi_id) INTO v_off FROM production.v2_court_overtime WHERE source='bpd_court_overtime';
    rows_in := v_in; attached := v_att; officers := v_off; RETURN NEXT;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE VIEW production.vw_v2_court_overtime AS
    SELECT cot_id, bpi_id, employee_id, ot_date, ot_code, description, assigned_desc, charged_desc, worked_hours, source, as_of
    FROM production.v2_court_overtime WHERE bpi_id IS NOT NULL;

COMMENT ON FUNCTION production.run_court_overtime_from_raw() IS 'Attach BPD court-overtime records to roster officers by employee_id (hard key).';
