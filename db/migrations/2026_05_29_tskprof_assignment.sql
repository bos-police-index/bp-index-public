-- Officer assignment history — "by task profile ID 2010-2022" (student datascience extract)
-- ===========================================================================
-- This file is keyed by ASSIGNMENT (TskProfID), but the officer key inside it
-- is the BPD employee_id ("ID" column). It is, in effect, a clean
-- name <-> employee_id bridge plus a unit-assignment history:
--
--   * 3,321 distinct employee_ids, each mapping to exactly ONE name.
--   * Verified same employee_id namespace as v2_officer_id_map (2,254/2,605
--     overlapping last names agree; the rest are suffix/maiden-name drift).
--   * TskProfID is the assignment code (155 distinct units like "District 04"),
--     NOT an officer identity — a single officer has many over 2010-2022.
--
-- Value this migration extracts:
--   1. +716 officers with a hard employee_id + name that v2_officer_id_map lacks.
--   2. Backfills names on ~326 officers we have by employee_id but with no name,
--      and repairs garbage names (e.g. a misconduct narrative that leaked into
--      employee_id 8511's name field).
--   3. Becomes a name->employee_id BRIDGE inside run_iad_from_nlg(), so the
--      name-only NLG IAD complaints we couldn't tie before now resolve to real
--      officers (~128 of 180 unmatched names).
--   4. vw_v2_officer_assignment exposes the per-officer unit history (the
--      "Organization" data point) for a future profile section.
--
-- Additive + re-runnable. Officers are added with a hard employee_id, so the
-- identity-merge driver's conflict guards prevent any wrong same-name merges.

-- ---------------------------------------------------------------------------
-- 1. Raw landing table (mirrors scripts/normalize_tskprof.py output).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS production.raw_v2_tskprof_assignment (
    raw_id         bigserial PRIMARY KEY,
    employee_id    integer,
    empl_record    text,
    last_name      text,
    first_name     text,
    name_raw       text,
    workgroup      text,
    tskprof_id     text,
    descr          text,
    eff_date       date,
    canonical_name text,        -- computed post-load for the bridge
    source         text NOT NULL DEFAULT 'tskprof_2010_2022',
    loaded_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS raw_v2_tskprof_emp_idx   ON production.raw_v2_tskprof_assignment (employee_id);
CREATE INDEX IF NOT EXISTS raw_v2_tskprof_canon_idx ON production.raw_v2_tskprof_assignment (canonical_name);

-- ---------------------------------------------------------------------------
-- 2. Identity backfill: add new officers + fill missing/garbage names.
--    Picks the most recent name per employee_id (latest eff_date).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION production.run_officer_identity_from_tskprof()
RETURNS TABLE(new_officers int, names_backfilled int, assignments int) AS $$
DECLARE
    v_new int;
    v_fill int;
    v_assign int;
BEGIN
    -- latest known name per officer in the assignment file
    CREATE TEMP TABLE _tp_latest ON COMMIT DROP AS
    SELECT DISTINCT ON (employee_id)
           employee_id, first_name, last_name,
           production.canonicalize_name_parts(last_name, first_name) AS canonical_name
      FROM production.raw_v2_tskprof_assignment
     WHERE employee_id IS NOT NULL
     ORDER BY employee_id, eff_date DESC NULLS LAST;

    -- 2a. Insert officers we don't have at all (employee_id is a hard key).
    WITH ins AS (
        INSERT INTO production.v2_officer_id_map
            (employee_id, first_name, last_name, canonical_name)
        SELECT l.employee_id, l.first_name, l.last_name, l.canonical_name
          FROM _tp_latest l
         WHERE NOT EXISTS (
             SELECT 1 FROM production.v2_officer_id_map m
              WHERE m.employee_id = l.employee_id
         )
        RETURNING 1
    )
    SELECT COUNT(*) INTO v_new FROM ins;

    -- 2b. Backfill names where we have the officer (by employee_id) but the
    --     name is missing OR clearly garbage (real surnames are never > 30 chars;
    --     the 8511 case is a leaked narrative ~50 chars long).
    WITH upd AS (
        UPDATE production.v2_officer_id_map m
           SET first_name     = l.first_name,
               last_name      = l.last_name,
               canonical_name = l.canonical_name,
               updated_at     = now()
          FROM _tp_latest l
         WHERE m.employee_id = l.employee_id
           AND ( m.last_name IS NULL
                 OR m.last_name = ''
                 OR length(m.last_name) > 30 )
        RETURNING 1
    )
    SELECT COUNT(*) INTO v_fill FROM upd;

    SELECT COUNT(*) INTO v_assign FROM production.raw_v2_tskprof_assignment;
    new_officers := v_new; names_backfilled := v_fill; assignments := v_assign;
    RETURN NEXT;
END
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 3. Per-officer unit/assignment history, for a future "Organization" section.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW production.vw_v2_officer_assignment AS
SELECT m.bpi_id,
       a.employee_id,
       a.workgroup,
       a.tskprof_id,
       a.descr,
       a.eff_date
  FROM production.raw_v2_tskprof_assignment a
  JOIN production.v2_officer_id_map m ON m.employee_id = a.employee_id;

-- ---------------------------------------------------------------------------
-- 4. Enhance run_iad_from_nlg() with a tskprof name->employee_id BRIDGE.
--    New match priority:
--      a) IA-backfill            (internal extract already resolved this officer)
--      b) tskprof bridge         (HR file: unique name -> employee_id -> bpi_id)
--      c) canonical-unique       (exactly one officer in v2_officer_id_map)
--    The bridge captures officers whose v2_officer_id_map name spelling differs
--    from the NLG spelling — the employee_id resolves them anyway.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION production.run_iad_from_nlg()
RETURNS TABLE(
    rows_in      int,
    inserted     int,
    linked       int,
    unlinked     int,
    skipped_dupe int
) AS $$
DECLARE
    v_in int; v_ins int; v_link int; v_unl int; v_skip int;
BEGIN
    SELECT COUNT(*) INTO v_in FROM production.raw_v2_iad_nlg;

    DELETE FROM production.v2_officer_misconduct WHERE source = 'bpd_iad_nlg_2025';

    WITH resolved AS (
        SELECT
            r.*,
            -- (a) IA-backfill from the internal employee_id-keyed extract
            ( SELECT m.bpi_id
                FROM production.raw_employee_ia o
                JOIN production.v2_officer_id_map m ON m.employee_id = o.employee_id
               WHERE o.ia_no = r.ia_no
                 AND lower(btrim(o.last_name)) = lower(btrim(r.last_name))
               LIMIT 1
            ) AS backfill_bpi,
            -- (b) tskprof bridge: unique name in the HR file -> employee_id -> bpi_id
            ( SELECT (array_agg(DISTINCT m2.bpi_id))[1]
                FROM production.raw_v2_tskprof_assignment a
                JOIN production.v2_officer_id_map m2 ON m2.employee_id = a.employee_id
               WHERE a.canonical_name
                     = production.canonicalize_name_parts(r.last_name, r.first_name)
              HAVING COUNT(DISTINCT a.employee_id) = 1
            ) AS tskprof_bpi,
            -- (c) canonical-unique match against the officer map
            ( SELECT (array_agg(DISTINCT m.bpi_id))[1]
                FROM production.v2_officer_id_map m
               WHERE m.canonical_name
                     = production.canonicalize_name_parts(r.last_name, r.first_name)
              HAVING COUNT(DISTINCT m.bpi_id) = 1
            ) AS canon_bpi
        FROM production.raw_v2_iad_nlg r
    ),
    tagged AS (
        SELECT
            res.*,
            COALESCE(res.backfill_bpi, res.tskprof_bpi, res.canon_bpi) AS bpi_id,
            CASE
                WHEN res.backfill_bpi IS NOT NULL THEN 'ia_backfill'
                WHEN res.tskprof_bpi  IS NOT NULL THEN 'tskprof_bridge'
                WHEN res.canon_bpi    IS NOT NULL THEN 'canonical_name'
                ELSE 'unmatched'
            END AS match_method
        FROM resolved res
    ),
    to_insert AS (
        SELECT t.*
        FROM tagged t
        WHERE NOT EXISTS (
            SELECT 1
              FROM production.v2_officer_misconduct ex
              JOIN production.v2_officer_id_map em ON em.bpi_id = ex.bpi_id
             WHERE ex.case_number = t.ia_no
               AND ex.source = 'bpd_iad_internal'
               AND lower(btrim(em.last_name)) = lower(btrim(t.last_name))
        )
    ),
    ins AS (
        INSERT INTO production.v2_officer_misconduct
            (bpi_id, case_number, incident_type, allegation, finding, action_taken,
             received_date, completed_date, source, as_of,
             officer_first_name, officer_last_name, officer_rank, officer_seq, match_method)
        SELECT
            t.bpi_id, t.ia_no, t.incident_type, t.allegation, t.finding,
            COALESCE(t.action_taken, t.case_action_taken),
            t.received_date, t.action_taken_date,
            'bpd_iad_nlg_2025', now(),
            t.first_name, t.last_name, t.title_rank, t.officer_seq, t.match_method
        FROM to_insert t
        RETURNING bpi_id
    )
    SELECT
        COUNT(*)::int,
        COUNT(*) FILTER (WHERE bpi_id IS NOT NULL)::int,
        COUNT(*) FILTER (WHERE bpi_id IS NULL)::int
      INTO v_ins, v_link, v_unl
      FROM ins;

    v_skip := v_in - v_ins;
    rows_in := v_in; inserted := v_ins; linked := v_link; unlinked := v_unl; skipped_dupe := v_skip;
    RETURN NEXT;
END
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION production.run_officer_identity_from_tskprof() IS
    'Backfills v2_officer_id_map from raw_v2_tskprof_assignment: adds officers by hard employee_id '
    'and fills missing/garbage names (most-recent name per officer). Re-runnable.';
COMMENT ON VIEW production.vw_v2_officer_assignment IS
    'Per-officer unit/assignment history (TskProfID + Descr + eff_date) joined to bpi_id.';
