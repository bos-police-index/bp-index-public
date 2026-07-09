-- The original Phase 1 schema constrained v2_officer_misconduct to one row per
-- (case_number, source). That's too tight: a single IA case typically has multiple
-- allegations (raw_employee_ia carries them as separate rows sharing an ia_no), and we want
-- each allegation as its own canonical row. Drop the constraint; the surrogate
-- misconduct_id UUID PK is the unique key, and the reconcile DELETE-then-INSERT pattern
-- handles re-runs.
DROP INDEX IF EXISTS production.v2_officer_misconduct_case_source_uq;

-- Pipe production.raw_employee_ia (BPD-internal IA case data, presumed to be sourced from
-- the team's `BPD COMPLAINTS - IAD CASES 2011-2024 - NO STATEMENTS - Updated_December_2025.xlsx`
-- and similar FOIA-acquired files) into the canonical production.v2_officer_misconduct table.
--
-- raw_employee_ia has 8,626 rows at the time of writing, all of which link cleanly to
-- v2_officer_id_map by employee_id (100% link rate). Each (ia_no, allegation) pair becomes
-- one canonical misconduct row. Re-runnable: it always replaces the source='bpd_iad_internal'
-- rows. Phase 2 admin upload will repopulate raw_employee_ia from a fresh xlsx, then this
-- reconcile re-fires on schedule.

CREATE OR REPLACE FUNCTION production.run_misconduct_from_legacy()
RETURNS TABLE(rows_in int, rows_out int) AS $$
DECLARE
    src_count int;
    out_count int;
BEGIN
    SELECT COUNT(*) INTO src_count FROM production.raw_employee_ia;

    DELETE FROM production.v2_officer_misconduct WHERE source = 'bpd_iad_internal';

    INSERT INTO production.v2_officer_misconduct
        (bpi_id, case_number, incident_type, allegation, finding, action_taken,
         received_date, completed_date, source, as_of)
    SELECT
        m.bpi_id,
        r.ia_no,
        NULLIF(TRIM(r.incident_type), ''),
        NULLIF(TRIM(r.allegation), ''),
        NULLIF(TRIM(r.finding), ''),
        NULLIF(TRIM(r.action_taken), ''),
        r.date_received,
        NULL::date,                     -- raw_employee_ia doesn't carry completed_date
        'bpd_iad_internal',
        now()
    FROM production.raw_employee_ia r
    JOIN production.v2_officer_id_map m
      ON m.employee_id = r.employee_id
    WHERE r.employee_id IS NOT NULL
      AND r.ia_no IS NOT NULL
      AND r.ia_no <> '';
    -- Note: the unique index v2_officer_misconduct_case_source_uq is on (case_number, source)
    -- WHERE case_number IS NOT NULL. Multiple allegations per IA case (which raw_employee_ia
    -- carries as separate rows) all share an ia_no, so the unique constraint would block them.
    -- Instead the canonical table tracks each (ia_no, allegation) as its own row via the
    -- surrogate misconduct_id PK. The partial unique index doesn't fire because we DELETE
    -- before INSERT.

    SELECT COUNT(*) INTO out_count
      FROM production.v2_officer_misconduct
      WHERE source = 'bpd_iad_internal';

    rows_in := src_count;
    rows_out := out_count;
    RETURN NEXT;
END
$$ LANGUAGE plpgsql;
