-- Reconcile queue: sticky resolutions
--
-- Without this migration, run_identity_merge() re-adds the same ambiguous
-- canonical_name groups to v2_reconciliation_review on every run, clobbering
-- any human decision the researcher made through the /admin/reconcile UI.
--
-- Two changes:
--   1. Add a `resolution` column so we can record HOW a row was resolved
--      ('merged' | 'kept_separate' | 'split'). resolved_at + resolution
--      together mark a row as handled.
--   2. Update run_identity_merge() so it SKIPS a canonical_name whose
--      previous resolution is still on file. Researchers' decisions stick.

ALTER TABLE production.v2_reconciliation_review
  ADD COLUMN IF NOT EXISTS resolution text;

-- Convenience view for the API: just the unresolved queue.
CREATE OR REPLACE VIEW production.vw_v2_reconciliation_pending AS
SELECT *
  FROM production.v2_reconciliation_review
 WHERE resolved_at IS NULL
   AND pipeline_name = 'identity_merge_ambiguous'
 ORDER BY created_at;

CREATE OR REPLACE FUNCTION production.run_identity_merge()
RETURNS TABLE(
    merged_groups   int,
    merged_rows     int,
    ambiguous_added int
) AS $$
DECLARE
    rec record;
    g_groups int := 0;
    g_rows   int := 0;
    g_ambig  int := 0;
BEGIN
    -- 1) Auto-merge eligible groups: same canonical_name, no conflicting hard ids,
    --    and no BPD+non-Boston-POST mixing.
    FOR rec IN
        WITH groups AS (
            SELECT
                canonical_name,
                array_agg(bpi_id ORDER BY
                    (employee_id IS NOT NULL) DESC,
                    (mptc_id     IS NOT NULL) DESC,
                    (badge_no    IS NOT NULL) DESC,
                    created_at) AS bpi_ids,
                COUNT(DISTINCT employee_id) FILTER (WHERE employee_id IS NOT NULL) AS d_emp,
                COUNT(DISTINCT mptc_id)     FILTER (WHERE mptc_id     IS NOT NULL) AS d_mptc,
                COUNT(DISTINCT badge_no)    FILTER (WHERE badge_no    IS NOT NULL) AS d_badge,
                bool_or(employee_id IS NOT NULL) AS has_bpd_emp,
                bool_or(agency_at_post IS NOT NULL
                        AND agency_at_post NOT ILIKE 'Boston Police%'
                        AND agency_at_post <> 'Unassociated Officer') AS has_non_bpd_agency
            FROM production.v2_officer_id_map
            WHERE canonical_name IS NOT NULL AND canonical_name <> ','
            GROUP BY canonical_name
            HAVING COUNT(*) > 1
        )
        SELECT canonical_name, bpi_ids
        FROM groups
        WHERE d_emp <= 1
          AND d_mptc <= 1
          AND d_badge <= 1
          AND NOT (has_bpd_emp AND has_non_bpd_agency)
          -- Sticky resolutions: skip canonical_names already resolved by a researcher.
          AND canonical_name NOT IN (
                SELECT (raw_row->>'canonical_name')
                  FROM production.v2_reconciliation_review
                 WHERE pipeline_name = 'identity_merge_ambiguous'
                   AND resolved_at IS NOT NULL
          )
    LOOP
        PERFORM production.merge_officer_ids(rec.bpi_ids[1], rec.bpi_ids[2:]);
        g_groups := g_groups + 1;
        g_rows   := g_rows + array_length(rec.bpi_ids, 1) - 1;
    END LOOP;

    -- 2) Refresh the ambiguous queue: clear pending rows, re-insert current
    --    ambiguous groups. Skip canonical_names that already have a resolved
    --    row (sticky resolutions).
    DELETE FROM production.v2_reconciliation_review
    WHERE pipeline_name = 'identity_merge_ambiguous'
      AND resolved_at IS NULL;

    WITH ambiguous AS (
        SELECT
            canonical_name,
            array_agg(bpi_id ORDER BY created_at) AS bpi_ids,
            COUNT(DISTINCT employee_id) FILTER (WHERE employee_id IS NOT NULL) AS d_emp,
            COUNT(DISTINCT mptc_id)     FILTER (WHERE mptc_id     IS NOT NULL) AS d_mptc,
            COUNT(DISTINCT badge_no)    FILTER (WHERE badge_no    IS NOT NULL) AS d_badge,
            bool_or(employee_id IS NOT NULL) AS has_bpd_emp,
            bool_or(agency_at_post IS NOT NULL
                    AND agency_at_post NOT ILIKE 'Boston Police%'
                    AND agency_at_post <> 'Unassociated Officer') AS has_non_bpd_agency
        FROM production.v2_officer_id_map
        WHERE canonical_name IS NOT NULL AND canonical_name <> ','
        GROUP BY canonical_name
        HAVING COUNT(*) > 1
           AND (
                COUNT(DISTINCT employee_id) FILTER (WHERE employee_id IS NOT NULL) > 1
             OR COUNT(DISTINCT mptc_id)     FILTER (WHERE mptc_id     IS NOT NULL) > 1
             OR COUNT(DISTINCT badge_no)    FILTER (WHERE badge_no    IS NOT NULL) > 1
             OR (bool_or(employee_id IS NOT NULL)
                 AND bool_or(agency_at_post IS NOT NULL
                             AND agency_at_post NOT ILIKE 'Boston Police%'
                             AND agency_at_post <> 'Unassociated Officer'))
           )
           -- Sticky: don't re-queue resolved ones.
           AND canonical_name NOT IN (
                 SELECT (raw_row->>'canonical_name')
                   FROM production.v2_reconciliation_review
                  WHERE pipeline_name = 'identity_merge_ambiguous'
                    AND resolved_at IS NOT NULL
           )
    ),
    inserted AS (
        INSERT INTO production.v2_reconciliation_review
            (pipeline_name, raw_row, candidate_bpi_ids)
        SELECT
            'identity_merge_ambiguous',
            jsonb_build_object(
                'canonical_name', canonical_name,
                'distinct_employee_ids', d_emp,
                'distinct_mptc_ids', d_mptc,
                'distinct_badge_nos', d_badge,
                'reason', CASE
                    WHEN d_emp > 1 THEN 'conflicting employee_ids'
                    WHEN d_mptc > 1 THEN 'conflicting mptc_ids'
                    WHEN d_badge > 1 THEN 'conflicting badge_nos'
                    WHEN has_bpd_emp AND has_non_bpd_agency THEN 'BPD officer same name as non-Boston POST officer'
                    ELSE 'unknown'
                END
            ),
            bpi_ids
        FROM ambiguous
        RETURNING 1
    )
    SELECT COUNT(*) INTO g_ambig FROM inserted;

    merged_groups   := g_groups;
    merged_rows     := g_rows;
    ambiguous_added := g_ambig;
    RETURN NEXT;
END
$$ LANGUAGE plpgsql;
