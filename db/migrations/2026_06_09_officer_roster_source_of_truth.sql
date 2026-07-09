-- Officer roster = source of truth
-- ===========================================================================
-- Establishes an authoritative BPD officer roster as the anchor for identity.
-- Matching of all OTHER data stays canonical-name based (per client); the roster
-- just defines WHO the real officers are, so name-matches resolve against a
-- curated list instead of inventing phantom officers, and so the UI can mark an
-- officer's identity as confirmed (in an official HR roster) vs provisional
-- (seen only via name-matched data like earnings/IAD).
--
-- Source of truth = the UNION of the official HR sources, keyed by employee_id
-- (the stable within-BPD id present in all of them), layered by authority:
--   fall_2025 roster  -> current force + freshest names + title
--   alpha_listing     -> badge numbers (only source that has them)
--   responsive_records-> demographics
--   tskprof 2010-2022 -> historical officers + longest span
-- Covers ~99% of officers we hold records for. Re-runnable.

ALTER TABLE production.v2_officer_id_map
    ADD COLUMN IF NOT EXISTS identity_confidence text,   -- 'confirmed' | 'provisional'
    ADD COLUMN IF NOT EXISTS roster_source        text;  -- which HR source(s) backed it

CREATE OR REPLACE FUNCTION production.build_officer_roster()
RETURNS TABLE(roster_officers int, confirmed int, provisional int, with_badge int) AS $$
DECLARE
    v_roster int; v_conf int; v_prov int; v_badge int;
BEGIN
    -- union of official HR employee_ids (the source-of-truth membership)
    CREATE TEMP TABLE _roster_ids ON COMMIT DROP AS
    SELECT employee_id FROM production.raw_employee_roster_fall_2025 WHERE employee_id IS NOT NULL
    UNION SELECT employee_id FROM production.raw_alpha_listing        WHERE employee_id IS NOT NULL
    UNION SELECT employee_id FROM production.raw_responsive_records    WHERE employee_id IS NOT NULL
    UNION SELECT employee_id FROM production.raw_v2_tskprof_assignment WHERE employee_id IS NOT NULL;

    -- best NAME per employee_id (most recent / cleanest split-name source first)
    CREATE TEMP TABLE _nm ON COMMIT DROP AS
    WITH cand AS (
        SELECT employee_id, last_name, first_name, 1 AS ord, NULL::date AS eff, 'fall_2025_roster' AS src
          FROM production.raw_employee_roster_fall_2025 WHERE employee_id IS NOT NULL AND last_name IS NOT NULL
        UNION ALL
        SELECT employee_id, last_name, first_name, 2, eff_date, 'responsive_records'
          FROM production.raw_responsive_records WHERE employee_id IS NOT NULL AND last_name IS NOT NULL
        UNION ALL
        SELECT employee_id, last_name, first_name, 3, eff_date, 'tskprof_2010_2022'
          FROM production.raw_v2_tskprof_assignment WHERE employee_id IS NOT NULL AND last_name IS NOT NULL
        UNION ALL
        SELECT employee_id, TRIM(SPLIT_PART(name_id, ',', 1)), TRIM(SPLIT_PART(name_id, ',', 2)), 4, asof, 'alpha_listing'
          FROM production.raw_alpha_listing WHERE employee_id IS NOT NULL AND name_id IS NOT NULL
    ),
    ranked AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY employee_id ORDER BY ord, eff DESC NULLS LAST) rn FROM cand)
    SELECT employee_id, last_name, first_name, src FROM ranked WHERE rn = 1;

    -- badge (alpha only), rank (fall_2025 > alpha > responsive)
    CREATE TEMP TABLE _bg ON COMMIT DROP AS
    SELECT DISTINCT ON (employee_id) employee_id, badge AS badge_no
      FROM production.raw_alpha_listing WHERE employee_id IS NOT NULL AND badge IS NOT NULL
     ORDER BY employee_id, asof DESC NULLS LAST;
    CREATE TEMP TABLE _rk ON COMMIT DROP AS
    WITH r AS (
        SELECT employee_id, job_title AS rank, 1 ord FROM production.raw_employee_roster_fall_2025 WHERE employee_id IS NOT NULL AND job_title IS NOT NULL
        UNION ALL SELECT employee_id, title, 2 FROM production.raw_alpha_listing WHERE employee_id IS NOT NULL AND title IS NOT NULL
        UNION ALL SELECT employee_id, job_title, 3 FROM production.raw_responsive_records WHERE employee_id IS NOT NULL AND job_title IS NOT NULL
    ), ranked AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY employee_id ORDER BY ord) rn FROM r)
    SELECT employee_id, rank FROM ranked WHERE rn = 1;

    CREATE TEMP TABLE _roster ON COMMIT DROP AS
    SELECT n.employee_id, n.last_name, n.first_name, n.src AS roster_source, b.badge_no, rk.rank,
           production.canonicalize_name_parts(n.last_name, n.first_name) AS canon
      FROM _nm n LEFT JOIN _bg b USING (employee_id) LEFT JOIN _rk rk USING (employee_id);

    -- enrich existing officers + confirm them (fill missing/garbage names; badge/rank always)
    UPDATE production.v2_officer_id_map m
       SET badge_no       = COALESCE(r.badge_no, m.badge_no),
           rank           = COALESCE(r.rank, m.rank),
           roster_source  = r.roster_source,
           identity_confidence = 'confirmed',
           first_name     = CASE WHEN (m.last_name IS NULL OR m.last_name='' OR length(m.last_name)>30) THEN r.first_name ELSE m.first_name END,
           last_name      = CASE WHEN (m.last_name IS NULL OR m.last_name='' OR length(m.last_name)>30) THEN r.last_name  ELSE m.last_name  END,
           canonical_name = CASE WHEN (m.last_name IS NULL OR m.last_name='' OR length(m.last_name)>30) THEN r.canon      ELSE m.canonical_name END,
           updated_at     = now()
      FROM _roster r WHERE m.employee_id = r.employee_id;

    -- add roster officers missing from the map
    INSERT INTO production.v2_officer_id_map
        (employee_id, first_name, last_name, canonical_name, badge_no, rank, identity_confidence, roster_source)
    SELECT r.employee_id, r.first_name, r.last_name, r.canon, r.badge_no, r.rank, 'confirmed', r.roster_source
      FROM _roster r
     WHERE NOT EXISTS (SELECT 1 FROM production.v2_officer_id_map m WHERE m.employee_id = r.employee_id);

    -- everyone else = provisional (exists only via name-matched data: earnings/IAD name-only, etc.)
    UPDATE production.v2_officer_id_map
       SET identity_confidence = 'provisional'
     WHERE identity_confidence IS DISTINCT FROM 'confirmed'
       AND (employee_id IS NULL OR employee_id NOT IN (SELECT employee_id FROM _roster_ids));

    SELECT COUNT(*) INTO v_roster FROM _roster;
    SELECT COUNT(*) INTO v_conf  FROM production.v2_officer_id_map WHERE identity_confidence = 'confirmed';
    SELECT COUNT(*) INTO v_prov  FROM production.v2_officer_id_map WHERE identity_confidence = 'provisional';
    SELECT COUNT(*) INTO v_badge FROM production.v2_officer_id_map WHERE identity_confidence='confirmed' AND badge_no IS NOT NULL;
    roster_officers := v_roster; confirmed := v_conf; provisional := v_prov; with_badge := v_badge;
    RETURN NEXT;
END
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION production.build_officer_roster() IS
    'Source-of-truth BPD roster: marks officers found in the official HR sources (by employee_id) '
    'as identity_confidence=confirmed (enriching badge/rank/name); officers seen only via '
    'name-matched data are provisional. Matching of other data stays canonical-name based. Re-runnable.';
