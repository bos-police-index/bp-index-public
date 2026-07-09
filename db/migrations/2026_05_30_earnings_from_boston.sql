-- Earnings reconciler — fix same-name fan-out in v2_earnings_year
-- ===========================================================================
-- Bug: the data.boston.gov Employee Earnings file has only a NAME (no
-- employee_id). The prior ingest matched that name to v2_officer_id_map by
-- canonicalized name and attached the earnings row to EVERY officer sharing the
-- name. With duplicate identity fragments in the map, one raw row fanned out to
-- many bpi_ids — e.g. one "Doyle,Michael R" row (no regular pay) landed on 5
-- officers. Net: ~3,400 spurious duplicate rows (28% of the table) and earnings
-- attributed to the wrong same-named officers. Some of the "missing regular pay"
-- is real (officers paid only via other/OT/detail that year), but the fan-out
-- multiplied those rows and spread them across people.
--
-- Fix: a deterministic reconciler that attaches each (name, year) to a SINGLE
-- officer, or holds it. Resolution policy (per the data team's call):
--   * exactly one officer with the name           -> attach (unambiguous)
--   * many officers, exactly one has a hard id     -> attach to that one
--     (employee_id/badge); prefer the real identity over nameless fragments
--   * otherwise (>1 plausible, or >1 real person    -> HOLD: do not attach, log
--     sharing the name that year, or no match)        to v2_reconciliation_review
--                                                      (pipeline 'earnings_ambiguous')
--
-- Run production.run_identity_merge() FIRST to fold no-conflict duplicate
-- fragments, so fewer names are ambiguous before this runs.
--
-- Re-runnable: replaces all source='boston_open_data' rows and its own
-- unresolved 'earnings_ambiguous' review rows.

CREATE OR REPLACE FUNCTION production.run_earnings_from_boston()
RETURNS TABLE(
    raw_rows       int,
    attached       int,
    held_ambiguous int,
    no_officer     int,
    removed_old    int
) AS $$
DECLARE
    v_raw int; v_att int; v_held int; v_nooff int; v_old int;
BEGIN
    SELECT COUNT(*) INTO v_old FROM production.v2_earnings_year WHERE source = 'boston_open_data';
    DELETE FROM production.v2_earnings_year WHERE source = 'boston_open_data';
    DELETE FROM production.v2_reconciliation_review
     WHERE pipeline_name = 'earnings_ambiguous' AND resolved_at IS NULL;

    -- 1. Dedupe exact (name, year) duplicates; keep the row with the largest total.
    --    Parse the $1,234.56 / (92) / - money strings via parse_money().
    CREATE TEMP TABLE _e_raw ON COMMIT DROP AS
    SELECT DISTINCT ON (name, year)
           production.canonicalize_name(name) AS canon,
           name, year, department_name, title,
           production.parse_money(regular)        AS regular_pay,
           production.parse_money(retro)          AS retro_pay,
           production.parse_money(other)          AS other_pay,
           production.parse_money(overtime)       AS ot_pay,
           production.parse_money(injured)        AS injured_pay,
           production.parse_money(detail)         AS detail_pay,
           production.parse_money(quinn)          AS quinn_pay,
           production.parse_money(total_earnings) AS total_pay
      FROM production.raw_v2_boston_earnings
     WHERE name IS NOT NULL AND year IS NOT NULL
     ORDER BY name, year, production.parse_money(total_earnings) DESC NULLS LAST;
    SELECT COUNT(*) INTO v_raw FROM _e_raw;

    -- 2. Officer candidates per canonical name.
    CREATE TEMP TABLE _e_off ON COMMIT DROP AS
    SELECT canonical_name AS canon,
           COUNT(*)                                                       AS n_officers,
           COUNT(*) FILTER (WHERE employee_id IS NOT NULL)                AS n_with_empid,
           (array_agg(bpi_id) FILTER (WHERE employee_id IS NOT NULL))[1]  AS hardid_bpi,
           (array_agg(bpi_id ORDER BY bpi_id))[1]                         AS any_bpi,
           array_agg(bpi_id)                                              AS all_bpis
      FROM production.v2_officer_id_map
     WHERE canonical_name IS NOT NULL
     GROUP BY canonical_name;

    -- 3. Real-person count per (canon, year): >1 distinct name = genuinely ambiguous.
    CREATE TEMP TABLE _e_people ON COMMIT DROP AS
    SELECT canon, year, COUNT(*) AS n_people FROM _e_raw GROUP BY canon, year;

    -- 4. Classify each raw row.
    CREATE TEMP TABLE _e_class ON COMMIT DROP AS
    SELECT r.*,
           p.n_people,
           COALESCE(o.n_officers, 0)  AS n_officers,
           COALESCE(o.n_with_empid, 0) AS n_with_empid,
           o.all_bpis,
           CASE
               WHEN p.n_people = 1 AND COALESCE(o.n_officers, 0) = 1 THEN o.any_bpi
               WHEN p.n_people = 1 AND COALESCE(o.n_officers, 0) > 1 AND o.n_with_empid = 1 THEN o.hardid_bpi
               ELSE NULL
           END AS attach_bpi,
           CASE
               WHEN p.n_people = 1 AND COALESCE(o.n_officers, 0) = 1 THEN 'unambiguous'
               WHEN p.n_people = 1 AND COALESCE(o.n_officers, 0) > 1 AND o.n_with_empid = 1 THEN 'hard_id_preferred'
               WHEN COALESCE(o.n_officers, 0) = 0 THEN 'no_officer'
               ELSE 'ambiguous'
           END AS disposition
      FROM _e_raw r
      LEFT JOIN _e_off o    ON o.canon = r.canon
      LEFT JOIN _e_people p ON p.canon = r.canon AND p.year = r.year;

    -- 5. Attach the confident matches.
    INSERT INTO production.v2_earnings_year
        (bpi_id, year, department_name, title, regular_pay, retro_pay, other_pay,
         ot_pay, injured_pay, detail_pay, quinn_pay, total_pay, source, as_of)
    SELECT attach_bpi, year, department_name, title, regular_pay, retro_pay, other_pay,
           ot_pay, injured_pay, detail_pay, quinn_pay, total_pay, 'boston_open_data', now()
      FROM _e_class
     WHERE attach_bpi IS NOT NULL;
    GET DIAGNOSTICS v_att = ROW_COUNT;

    -- 6. Hold everything else (ambiguous / no officer) for review — never guess.
    INSERT INTO production.v2_reconciliation_review
        (pipeline_name, raw_row, candidate_bpi_ids, created_at)
    SELECT 'earnings_ambiguous',
           jsonb_build_object(
               'canonical_name', canon, 'name', name, 'year', year,
               'total_pay', total_pay, 'reason', disposition),
           all_bpis,
           now()
      FROM _e_class
     WHERE disposition IN ('ambiguous', 'no_officer');

    SELECT COUNT(*) INTO v_held  FROM _e_class WHERE disposition = 'ambiguous';
    SELECT COUNT(*) INTO v_nooff FROM _e_class WHERE disposition = 'no_officer';

    raw_rows := v_raw; attached := v_att; held_ambiguous := v_held;
    no_officer := v_nooff; removed_old := v_old;
    RETURN NEXT;
END
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION production.run_earnings_from_boston() IS
    'Rebuilds source=boston_open_data rows in v2_earnings_year from raw_v2_boston_earnings, '
    'attaching each (name,year) to a SINGLE officer (unambiguous, or the lone hard-id match). '
    'Ambiguous / no-match rows are held in v2_reconciliation_review (pipeline earnings_ambiguous). '
    'Run run_identity_merge() first to fold duplicate fragments. Re-runnable.';
