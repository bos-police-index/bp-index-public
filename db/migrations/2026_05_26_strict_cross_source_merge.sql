-- Cross-source identity merging was too aggressive.
--
-- The original run_identity_merge() folded two bpi_id rows whenever they
-- shared a canonical_name and had no conflicting non-null hard ids
-- (employee_id, mptc_id, badge_no). That works inside BPD but breaks across
-- agencies — MA POST publishes ~23K officers from ~400 agencies, and same
-- last+first name collisions are common ("Smith,John" exists at BPD, MBTA,
-- MA State Police, etc.). 163 wrong cross-agency merges happened on the
-- existing data.
--
-- This migration:
--   1. Adds agency_at_post to v2_officer_id_map (denormalized from POST data).
--   2. Tightens run_identity_merge() to refuse cross-source merges when
--      employee_id is present on one side AND the other side's POST agency
--      is neither "Boston Police Department" nor "Unassociated Officer".
--      Those cases land in v2_reconciliation_review for human review.
--   3. Surgically un-merges the existing 163 bad rows.

-- 1) Add a denormalized POST agency column to v2_officer_id_map.
ALTER TABLE production.v2_officer_id_map
  ADD COLUMN IF NOT EXISTS agency_at_post text;

-- Populate it from v2_post_certification for everyone who already has one.
UPDATE production.v2_officer_id_map m
SET agency_at_post = sub.agency
FROM (
  SELECT DISTINCT ON (bpi_id) bpi_id, agency
  FROM production.v2_post_certification
  WHERE bpi_id IS NOT NULL
  ORDER BY bpi_id, as_of DESC
) sub
WHERE m.bpi_id = sub.bpi_id;


-- 2) Un-merge the 163 bad cross-agency rows.
--    For each bpi_id where:
--      - BPD employee_id is set
--      - mptc_id is set
--      - the POST agency is a named non-BPD MA agency (NOT "Unassociated Officer")
--    we hive off the POST identity into a fresh bpi_id row, move all
--    v2_post_* facts to that new row, and clear mptc_id/agency_at_post on
--    the BPD row.

WITH bad AS (
  SELECT DISTINCT
    m.bpi_id   AS old_bpi_id,
    m.mptc_id  AS mptc_id,
    m.first_name,
    m.last_name,
    m.middle_name,
    m.canonical_name
  FROM production.v2_officer_id_map m
  JOIN production.v2_post_certification p USING (bpi_id)
  WHERE m.employee_id IS NOT NULL
    AND m.mptc_id IS NOT NULL
    AND p.agency IS NOT NULL
    AND p.agency NOT ILIKE 'Boston Police%'
    AND p.agency <> 'Unassociated Officer'
),
new_rows AS (
  INSERT INTO production.v2_officer_id_map
    (mptc_id, first_name, last_name, middle_name, canonical_name, agency_at_post)
  SELECT b.mptc_id, b.first_name, b.last_name, b.middle_name, b.canonical_name,
         (SELECT agency FROM production.v2_post_certification p
            WHERE p.mptc_id = b.mptc_id
            ORDER BY as_of DESC LIMIT 1)
  FROM bad b
  RETURNING bpi_id AS new_bpi_id, mptc_id
)
-- v2_post_certification: rewrite bpi_id from old to new
UPDATE production.v2_post_certification p
SET bpi_id = nr.new_bpi_id
FROM new_rows nr, bad b
WHERE p.bpi_id = b.old_bpi_id
  AND p.mptc_id = b.mptc_id
  AND nr.mptc_id = b.mptc_id;

-- v2_post_decertification: same rewrite
WITH bad AS (
  SELECT DISTINCT
    m.bpi_id   AS old_bpi_id,
    m.mptc_id  AS mptc_id
  FROM production.v2_officer_id_map m
  JOIN production.v2_post_certification p USING (bpi_id)
  WHERE m.employee_id IS NOT NULL
    AND m.mptc_id IS NOT NULL
    AND p.agency IS NOT NULL
    AND p.agency NOT ILIKE 'Boston Police%'
    AND p.agency <> 'Unassociated Officer'
)
UPDATE production.v2_post_decertification d
SET bpi_id = (
  SELECT m.bpi_id FROM production.v2_officer_id_map m
   WHERE m.mptc_id = d.mptc_id
     AND m.employee_id IS NULL
   LIMIT 1
)
WHERE d.bpi_id IN (SELECT old_bpi_id FROM bad)
  AND EXISTS (
    SELECT 1 FROM production.v2_officer_id_map m
     WHERE m.mptc_id = d.mptc_id AND m.employee_id IS NULL
  );

-- Now clear mptc_id (and agency_at_post) on the BPD-side rows that we hived off.
UPDATE production.v2_officer_id_map m
SET mptc_id = NULL,
    agency_at_post = NULL,
    updated_at = now()
WHERE m.employee_id IS NOT NULL
  AND m.mptc_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM production.v2_post_certification p
    WHERE p.mptc_id = m.mptc_id
      AND p.bpi_id <> m.bpi_id  -- the POST cert was moved to a different bpi_id (the new one)
  );


-- 3) Tightened merge driver. Only auto-merges when:
--    - canonical_name matches
--    - hard ids don't conflict (employee_id, mptc_id, badge_no <= 1 distinct non-null each)
--    - AND if a POST agency is associated, it's "Boston Police Department" or
--      "Unassociated Officer". Anything else goes to the review queue.
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
                -- count of distinct non-Boston, non-Unassociated POST agencies across the group
                COUNT(DISTINCT agency_at_post) FILTER (
                    WHERE agency_at_post IS NOT NULL
                      AND agency_at_post NOT ILIKE 'Boston Police%'
                      AND agency_at_post <> 'Unassociated Officer'
                ) AS d_non_boston_agency,
                -- does the group include both a BPD employee_id AND a non-BPD POST agency?
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
    LOOP
        PERFORM production.merge_officer_ids(rec.bpi_ids[1], rec.bpi_ids[2:]);
        g_groups := g_groups + 1;
        g_rows   := g_rows + array_length(rec.bpi_ids, 1) - 1;
    END LOOP;

    -- Refresh the ambiguous review queue.
    DELETE FROM production.v2_reconciliation_review
    WHERE pipeline_name = 'identity_merge_ambiguous' AND resolved_bpi_id IS NULL;

    WITH ambiguous AS (
        SELECT
            canonical_name,
            array_agg(bpi_id ORDER BY created_at) AS bpi_ids,
            COUNT(DISTINCT employee_id) FILTER (WHERE employee_id IS NOT NULL) AS d_emp,
            COUNT(DISTINCT mptc_id)     FILTER (WHERE mptc_id     IS NOT NULL) AS d_mptc,
            COUNT(DISTINCT badge_no)    FILTER (WHERE badge_no    IS NOT NULL) AS d_badge,
            COUNT(DISTINCT agency_at_post) FILTER (
                WHERE agency_at_post IS NOT NULL
                  AND agency_at_post NOT ILIKE 'Boston Police%'
                  AND agency_at_post <> 'Unassociated Officer'
            ) AS d_non_boston_agency,
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
                'distinct_non_boston_agencies', d_non_boston_agency,
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


-- 4) The POST ingester should also keep agency_at_post fresh on each run.
-- Inline patch: after the post_certification INSERT, update v2_officer_id_map.
-- Existing bpi_ingest_post_certified workflow does the cert INSERT in its
-- reconcile step; we'll patch that workflow separately to add the agency
-- sync. For now this migration leaves the column populated from current data.
