-- Identity merge functions
--
-- The v2_officer_id_map can accumulate duplicate rows for the same officer when
-- different ingesters seed it from different sources (e.g. POST adds a row by
-- mptc_id, the migration backfill adds another by employee_id, both with the
-- same canonical_name). This file defines two functions:
--
--   production.merge_officer_ids(survivor, duplicates)  -- low-level primitive
--   production.run_identity_merge()                     -- driver: finds safe-to-merge groups
--                                                          and pushes ambiguous ones to the
--                                                          v2_reconciliation_review queue
--
-- Safety:
--   - Two rows are eligible to merge ONLY when they share canonical_name AND none of
--     (employee_id, mptc_id, badge_no) has CONFLICTING non-null values across the group.
--     Anything ambiguous goes to the review queue, not auto-merged.
--   - The merge is atomic: each call to merge_officer_ids runs inside a single statement,
--     so partial-merge rollback is automatic on error.
--
-- Foreign-key cascades handled:
--   v2_earnings_year (PK includes bpi_id+year+source — has to delete-then-update to avoid PK collision)
--   v2_fio
--   v2_post_certification
--   v2_post_decertification
--   v2_officer_misconduct
--   v2_news_article

CREATE OR REPLACE FUNCTION production.merge_officer_ids(
    survivor   uuid,
    duplicates uuid[]
) RETURNS void AS $$
DECLARE
    best_employee_id integer;
    best_mptc_id     text;
    best_badge_no    integer;
    best_middle_name text;
BEGIN
    IF survivor IS NULL OR duplicates IS NULL OR array_length(duplicates, 1) = 0 THEN
        RETURN;
    END IF;

    -- 1. Capture the strongest non-null identity fields from the duplicates so we can fold
    --    them into the survivor AFTER the duplicates are gone (otherwise the partial unique
    --    indexes on (mptc_id) and (employee_id) flag a transient collision).
    SELECT employee_id INTO best_employee_id
    FROM production.v2_officer_id_map
    WHERE bpi_id = ANY(duplicates) AND employee_id IS NOT NULL
    ORDER BY created_at LIMIT 1;

    SELECT mptc_id INTO best_mptc_id
    FROM production.v2_officer_id_map
    WHERE bpi_id = ANY(duplicates) AND mptc_id IS NOT NULL
    ORDER BY created_at LIMIT 1;

    SELECT badge_no INTO best_badge_no
    FROM production.v2_officer_id_map
    WHERE bpi_id = ANY(duplicates) AND badge_no IS NOT NULL
    ORDER BY created_at LIMIT 1;

    SELECT middle_name INTO best_middle_name
    FROM production.v2_officer_id_map
    WHERE bpi_id = ANY(duplicates) AND middle_name IS NOT NULL
    ORDER BY created_at LIMIT 1;

    -- 2. Move FKs from duplicates onto the survivor.
    --    v2_earnings_year — PK is (bpi_id, year, source). For each (year, source) that
    --    appears across {survivor, ...duplicates}, keep exactly one row, preferring the
    --    survivor's row when present then the highest total_pay. Drop the rest before the
    --    UPDATE so the PK doesn't fire. (Earlier version only dedup'd between survivor and
    --    each duplicate, missing the case where two duplicates each carried the same year.)
    DELETE FROM production.v2_earnings_year
    WHERE bpi_id = ANY(ARRAY[survivor] || duplicates)
      AND (bpi_id, year, source) NOT IN (
          SELECT DISTINCT ON (year, source) bpi_id, year, source
          FROM production.v2_earnings_year
          WHERE bpi_id = ANY(ARRAY[survivor] || duplicates)
          ORDER BY year, source, (bpi_id = survivor) DESC, total_pay DESC NULLS LAST
      );
    UPDATE production.v2_earnings_year SET bpi_id = survivor WHERE bpi_id = ANY(duplicates);

    --    Other fact tables: bpi_id is not in any unique index, so a straight UPDATE works.
    UPDATE production.v2_post_certification    SET bpi_id = survivor WHERE bpi_id = ANY(duplicates);
    UPDATE production.v2_post_decertification  SET bpi_id = survivor WHERE bpi_id = ANY(duplicates);
    UPDATE production.v2_fio                   SET bpi_id = survivor WHERE bpi_id = ANY(duplicates);
    UPDATE production.v2_officer_misconduct    SET bpi_id = survivor WHERE bpi_id = ANY(duplicates);
    UPDATE production.v2_news_article          SET bpi_id = survivor WHERE bpi_id = ANY(duplicates);

    -- 3. Drop the duplicate identity rows BEFORE folding their fields into the survivor —
    --    otherwise the partial unique index on (mptc_id) / (employee_id) sees a brief collision.
    DELETE FROM production.v2_officer_id_map WHERE bpi_id = ANY(duplicates);

    -- 4. Now safely fold the captured fields into the survivor (don't overwrite existing
    --    non-null values). updated_at is bumped so the merge is auditable.
    UPDATE production.v2_officer_id_map s
    SET
        employee_id = COALESCE(s.employee_id, best_employee_id),
        mptc_id     = COALESCE(s.mptc_id,     best_mptc_id),
        badge_no    = COALESCE(s.badge_no,    best_badge_no),
        middle_name = COALESCE(s.middle_name, best_middle_name),
        updated_at  = now()
    WHERE s.bpi_id = survivor;
END
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION production.run_identity_merge()
RETURNS TABLE(
    merged_groups   int,
    merged_rows     int,
    ambiguous_added int
) AS $$
DECLARE
    rec record;
    g_groups   int := 0;
    g_rows     int := 0;
    g_ambig    int := 0;
BEGIN
    -- Walk safe-to-merge groups (no conflicting non-null hard ids) and merge each.
    FOR rec IN
        SELECT canonical_name, bpi_ids
        FROM (
            SELECT
                canonical_name,
                array_agg(bpi_id ORDER BY
                    (employee_id IS NOT NULL) DESC,
                    (mptc_id     IS NOT NULL) DESC,
                    (badge_no    IS NOT NULL) DESC,
                    created_at) AS bpi_ids,
                COUNT(DISTINCT employee_id) FILTER (WHERE employee_id IS NOT NULL) AS d_emp,
                COUNT(DISTINCT mptc_id)     FILTER (WHERE mptc_id     IS NOT NULL) AS d_mptc,
                COUNT(DISTINCT badge_no)    FILTER (WHERE badge_no    IS NOT NULL) AS d_badge
            FROM production.v2_officer_id_map
            WHERE canonical_name IS NOT NULL AND canonical_name <> ','
            GROUP BY canonical_name
            HAVING COUNT(*) > 1
        ) g
        WHERE d_emp <= 1 AND d_mptc <= 1 AND d_badge <= 1
    LOOP
        PERFORM production.merge_officer_ids(rec.bpi_ids[1], rec.bpi_ids[2:]);
        g_groups := g_groups + 1;
        g_rows   := g_rows + array_length(rec.bpi_ids, 1) - 1;
    END LOOP;

    -- Refresh the ambiguous review queue: clear unresolved entries for this pipeline,
    -- then insert the current set of conflicts.
    DELETE FROM production.v2_reconciliation_review
    WHERE pipeline_name = 'identity_merge_ambiguous' AND resolved_bpi_id IS NULL;

    WITH ambiguous AS (
        SELECT
            canonical_name,
            array_agg(bpi_id ORDER BY created_at) AS bpi_ids,
            COUNT(DISTINCT employee_id) FILTER (WHERE employee_id IS NOT NULL) AS d_emp,
            COUNT(DISTINCT mptc_id)     FILTER (WHERE mptc_id     IS NOT NULL) AS d_mptc,
            COUNT(DISTINCT badge_no)    FILTER (WHERE badge_no    IS NOT NULL) AS d_badge
        FROM production.v2_officer_id_map
        WHERE canonical_name IS NOT NULL AND canonical_name <> ','
        GROUP BY canonical_name
        HAVING COUNT(*) > 1
           AND (COUNT(DISTINCT employee_id) FILTER (WHERE employee_id IS NOT NULL) > 1
             OR COUNT(DISTINCT mptc_id)     FILTER (WHERE mptc_id     IS NOT NULL) > 1
             OR COUNT(DISTINCT badge_no)    FILTER (WHERE badge_no    IS NOT NULL) > 1)
    ),
    inserted AS (
        INSERT INTO production.v2_reconciliation_review
            (pipeline_name, raw_row, candidate_bpi_ids)
        SELECT
            'identity_merge_ambiguous',
            jsonb_build_object(
                'canonical_name', canonical_name,
                'distinct_employee_ids', d_emp,
                'distinct_mptc_ids',     d_mptc,
                'distinct_badge_nos',    d_badge
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
