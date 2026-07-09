-- Canonical-name merging with middle initial "where available"
-- ===========================================================================
-- Per client direction, identity merging is canonical-name based, now using the
-- middle initial to DISAMBIGUATE when it's present on both records, without
-- re-splitting the same officer when one record lacks it. Two-part rule:
--   * canonical_name now includes the middle initial when present
--     ("welch,lawrence d") — so two different Lawrence Welches (D vs A) stay apart
--   * run_name_compat_merge() folds a no-initial record ("welch,lawrence") INTO
--     the single initialed variant when there's exactly one — so the officer
--     recorded sometimes as "Lawrence" and sometimes "Lawrence D" stays ONE person
--     (this is the "where available" part; it fixes the original Lawrence-Welch bug)
--
-- Supersedes 2026_04_28_canonical_name_normalize (which STRIPPED the initial).

-- 1. Middle-initial-aware canonical form.
CREATE OR REPLACE FUNCTION production.canonicalize_name_parts(p_last text, p_first text)
RETURNS text AS $$
    WITH n AS (
        SELECT lower(btrim(coalesce(p_last, '')))                              AS ln,
               lower(split_part(btrim(coalesce(p_first, '')), ' ', 1))         AS fn,
               -- middle initial = first letter of the 2nd token, only if it's a
               -- real initial (single letter, optionally with a dot). Ignores
               -- suffixes like "Jr"/"III".
               (SELECT lower(left(tok, 1))
                  FROM (SELECT split_part(btrim(coalesce(p_first, '')), ' ', 2) AS tok) t
                 WHERE tok ~ '^[A-Za-z]\.?$')                                    AS mi
    )
    SELECT NULLIF(
        ln || ',' || fn || CASE WHEN mi IS NOT NULL AND mi <> '' THEN ' ' || mi ELSE '' END,
        ','
    )
    FROM n
$$ LANGUAGE SQL IMMUTABLE;

-- canonicalize_name(text) wrapper is unchanged (delegates to _parts).

-- 2. Re-normalize every officer's canonical_name to the new form.
UPDATE production.v2_officer_id_map
   SET canonical_name = production.canonicalize_name_parts(last_name, first_name)
 WHERE canonical_name IS DISTINCT FROM production.canonicalize_name_parts(last_name, first_name);

-- 3. "Where available" recovery: fold a no-initial officer group into the single
--    initialed variant of the same last,first — but only when there's exactly one
--    initialed variant and no conflicting hard id / agency. If two initialed
--    variants exist (Lawrence D AND Lawrence A), the no-initial record is
--    genuinely ambiguous and is left alone.
CREATE OR REPLACE FUNCTION production.run_name_compat_merge()
RETURNS TABLE(folded_groups int, folded_rows int) AS $$
DECLARE
    rec record;
    v_groups int := 0;
    v_rows int := 0;
    v_survivor uuid;
    v_dups uuid[];
BEGIN
    FOR rec IN
        WITH officer AS (
            SELECT canonical_name,
                   regexp_replace(canonical_name, ' [a-z]$', '') AS base,
                   (canonical_name ~ ' [a-z]$')                  AS has_mi
              FROM production.v2_officer_id_map
             WHERE canonical_name IS NOT NULL AND canonical_name <> ','
        ),
        bases AS (
            SELECT base,
                   COUNT(*) FILTER (WHERE NOT has_mi)                   AS n_nomi,
                   COUNT(DISTINCT canonical_name) FILTER (WHERE has_mi) AS n_withmi_variants
              FROM officer GROUP BY base
        )
        SELECT base FROM bases WHERE n_nomi > 0 AND n_withmi_variants = 1
    LOOP
        -- survivor: the initialed officer (prefer one with a hard id)
        SELECT bpi_id INTO v_survivor
          FROM production.v2_officer_id_map
         WHERE regexp_replace(canonical_name, ' [a-z]$', '') = rec.base
           AND canonical_name ~ ' [a-z]$'
         ORDER BY (employee_id IS NOT NULL) DESC, (mptc_id IS NOT NULL) DESC, created_at
         LIMIT 1;

        -- dups: the no-initial officers, only where hard ids / agency don't conflict
        SELECT array_agg(o.bpi_id) INTO v_dups
          FROM production.v2_officer_id_map o
          JOIN production.v2_officer_id_map s ON s.bpi_id = v_survivor
         WHERE regexp_replace(o.canonical_name, ' [a-z]$', '') = rec.base
           AND NOT (o.canonical_name ~ ' [a-z]$')
           AND o.bpi_id <> v_survivor
           AND (o.employee_id IS NULL OR s.employee_id IS NULL OR o.employee_id = s.employee_id)
           AND (o.mptc_id     IS NULL OR s.mptc_id     IS NULL OR o.mptc_id     = s.mptc_id)
           AND (o.agency_at_post IS NULL OR s.agency_at_post IS NULL OR o.agency_at_post = s.agency_at_post);

        IF v_dups IS NOT NULL AND array_length(v_dups, 1) > 0 THEN
            PERFORM production.merge_officer_ids(v_survivor, v_dups);
            v_groups := v_groups + 1;
            v_rows := v_rows + array_length(v_dups, 1);
        END IF;
    END LOOP;

    folded_groups := v_groups; folded_rows := v_rows;
    RETURN NEXT;
END
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION production.run_name_compat_merge() IS
    'Folds a no-middle-initial officer into the single initialed variant of the same last,first '
    '(the "use middle initial where available" rule). Run after run_identity_merge(). Re-runnable.';
