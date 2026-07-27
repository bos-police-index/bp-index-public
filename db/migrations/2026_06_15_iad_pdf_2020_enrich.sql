-- BPD IAD complaints 2020 (extracted from PDF via vision). This source's value is
-- the complaint NARRATIVES + disposition/priority/occurred-date. ~90% of its cases
-- already exist (hard-matched by employee_id via bpd_iad_internal), so we ENRICH
-- those existing records rather than duplicate them, and only insert the handful of
-- genuinely-new named cases as name-matched (unconfirmed).

-- Raw landing table (all text; cast safely downstream, matching the other raw tables).
CREATE TABLE IF NOT EXISTS production.raw_v2_iad_pdf (
    local_id                  serial PRIMARY KEY,
    ia_no                     text,
    incident_type             text,
    received_date             text,
    rank                      text,
    first_name                text,
    last_name                 text,
    allegation                text,
    finding                   text,
    action_taken              text,
    action_taken_date         text,
    days_or_hours_suspended   text,
    disposition               text,
    priority                  text,
    occurred_date             text,
    narrative                 text,
    page                      int
);

-- Insert ONLY cases not already present from the id-keyed / NLG sources, and only
-- rows that name an officer. Name-matched to the roster (unambiguous canonical name).
CREATE OR REPLACE FUNCTION production.run_misconduct_from_iad_pdf()
RETURNS TABLE(new_cases int, rows_inserted int, name_matched int) AS $$
DECLARE v_new int; v_ins int; v_match int;
BEGIN
    DELETE FROM production.v2_officer_misconduct WHERE source = 'bpd_iad_pdf_2020';

    WITH existing AS (
        SELECT DISTINCT case_number FROM production.v2_officer_misconduct
         WHERE source IN ('bpd_iad_internal', 'bpd_iad_nlg_2025') AND case_number IS NOT NULL
    ), ins AS (
        INSERT INTO production.v2_officer_misconduct
            (bpi_id, case_number, incident_type, allegation, finding, action_taken,
             received_date, completed_date, officer_first_name, officer_last_name, officer_rank,
             source, as_of, match_method)
        SELECT
            (SELECT (array_agg(m.bpi_id))[1] FROM production.v2_officer_id_map m
              WHERE m.canonical_name = production.canonicalize_name_parts(r.last_name, r.first_name)
              HAVING COUNT(DISTINCT m.bpi_id) = 1),
            r.ia_no, NULLIF(r.incident_type,''), NULLIF(r.allegation,''), NULLIF(r.finding,''), NULLIF(r.action_taken,''),
            CASE WHEN r.received_date ~ '^\d{4}-\d{2}-\d{2}$' THEN r.received_date::date END,
            CASE WHEN r.action_taken_date ~ '^\d{4}-\d{2}-\d{2}$' THEN r.action_taken_date::date END,
            NULLIF(r.first_name,''), NULLIF(r.last_name,''), NULLIF(r.rank,''),
            'bpd_iad_pdf_2020', now(), 'pdf_name_match'
        FROM production.raw_v2_iad_pdf r
        WHERE r.ia_no ~ '^IAD' AND COALESCE(r.last_name,'') <> ''
          AND r.ia_no NOT IN (SELECT case_number FROM existing)
        RETURNING bpi_id, case_number
    )
    SELECT count(*), count(DISTINCT case_number), count(bpi_id) INTO v_ins, v_new, v_match FROM ins;

    new_cases := v_new; rows_inserted := v_ins; name_matched := v_match; RETURN NEXT;
END
$$ LANGUAGE plpgsql;

-- Recreate the misconduct view, LEFT JOINing the per-case PDF aggregate so the
-- narrative + disposition/priority/occurred-date appear on EVERY matching record
-- (existing hard-matched rows and the new name-matched ones alike). Case-level:
-- longest real narrative wins; '[redacted]' shown only if that's all there is.
CREATE OR REPLACE VIEW production.vw_v2_officer_misconduct AS
WITH pdf AS (
    SELECT ia_no,
        NULLIF((array_agg(narrative ORDER BY (narrative <> '' AND narrative <> '[redacted]') DESC, length(narrative) DESC))[1], '') AS narrative,
        max(CASE WHEN occurred_date ~ '^\d{4}-\d{2}-\d{2}$' THEN occurred_date::date END) AS occurred_date,
        (array_agg(disposition) FILTER (WHERE disposition <> ''))[1] AS disposition,
        (array_agg(priority)    FILTER (WHERE priority    <> ''))[1] AS priority
    FROM production.raw_v2_iad_pdf
    WHERE ia_no ~ '^IAD'
    GROUP BY ia_no
)
SELECT
    mc.misconduct_id, mc.bpi_id, mc.case_number, mc.incident_type, mc.allegation, mc.finding,
    mc.action_taken, mc.received_date, mc.completed_date, mc.source, mc.as_of,
    mc.officer_first_name, mc.officer_last_name, mc.officer_rank, mc.officer_seq, mc.match_method,
    CASE WHEN mc.source = 'bpd_iad_internal' OR mc.match_method = ANY (ARRAY['ia_backfill','tskprof_bridge'])
         THEN 'id' ELSE 'name' END AS link_method,
    EXISTS (SELECT 1 FROM production.v2_name_match_confirmation c
             WHERE c.bpi_id = mc.bpi_id AND c.source = mc.source AND c.decision = 'confirmed') AS confirmed,
    pdf.narrative, pdf.disposition, pdf.priority, pdf.occurred_date
FROM production.v2_officer_misconduct mc
LEFT JOIN pdf ON pdf.ia_no = mc.case_number
WHERE NOT EXISTS (SELECT 1 FROM production.v2_name_match_confirmation c
                   WHERE c.bpi_id = mc.bpi_id AND c.source = mc.source AND c.decision = 'rejected');

COMMENT ON FUNCTION production.run_misconduct_from_iad_pdf() IS 'Insert only NEW named IAD-2020 cases (not in internal/NLG) as name-matched source bpd_iad_pdf_2020. Narrative enrichment for existing cases happens in vw_v2_officer_misconduct.';
