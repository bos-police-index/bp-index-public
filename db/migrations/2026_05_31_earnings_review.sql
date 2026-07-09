-- Earnings ambiguity triage — surface & resolve held earnings
-- ===========================================================================
-- run_earnings_from_boston() (2026_05_30) HOLDS earnings whose name matches
-- multiple officers with no single hard-id tiebreak, logging them to
-- v2_reconciliation_review (pipeline 'earnings_ambiguous'). This migration lets
-- a researcher resolve those holds from /admin/earnings-review, and makes the
-- reconciler RESPECT their decisions across the weekly re-run (sticky), the same
-- way run_identity_merge() respects resolved identity reviews.
--
-- Adds:
--   1. vw_v2_earnings_review_pending — the unresolved earnings holds (for the API)
--   2. resolve_earnings_review(review_id, bpi_id, by) — assign the held earnings
--      to a chosen officer (NULL bpi_id = skip/unassign)
--   3. run_earnings_from_boston() rewritten to honor resolved reviews:
--      - assigned   -> attach to the chosen bpi_id every run
--      - skipped    -> stay unattached, never re-held
--      - new holds  -> logged as before

-- ---------------------------------------------------------------------------
-- 1. Pending-holds view (mirrors vw_v2_reconciliation_pending).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW production.vw_v2_earnings_review_pending AS
SELECT review_id, raw_row, candidate_bpi_ids, created_at
  FROM production.v2_reconciliation_review
 WHERE resolved_at IS NULL
   AND pipeline_name = 'earnings_ambiguous'
 ORDER BY (raw_row->>'total_pay')::numeric DESC NULLS LAST, created_at;

-- ---------------------------------------------------------------------------
-- 2. Resolve one earnings hold. p_bpi_id NULL = skip (mark unassigned).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION production.resolve_earnings_review(
    p_review_id  uuid,
    p_bpi_id     uuid,
    p_resolved_by text
)
RETURNS TABLE(ok boolean, message text) AS $$
DECLARE
    v_review production.v2_reconciliation_review%ROWTYPE;
    v_name text;
    v_year int;
BEGIN
    SELECT * INTO v_review FROM production.v2_reconciliation_review WHERE review_id = p_review_id;
    IF NOT FOUND THEN ok := false; message := 'review_not_found'; RETURN NEXT; RETURN; END IF;
    IF v_review.resolved_at IS NOT NULL THEN ok := false; message := 'already_resolved'; RETURN NEXT; RETURN; END IF;
    IF v_review.pipeline_name <> 'earnings_ambiguous' THEN ok := false; message := 'wrong_pipeline'; RETURN NEXT; RETURN; END IF;

    -- Skip / unassign
    IF p_bpi_id IS NULL THEN
        UPDATE production.v2_reconciliation_review
           SET resolved_at = now(), resolved_by = p_resolved_by, resolution = 'unassigned'
         WHERE review_id = p_review_id;
        ok := true; message := 'skipped'; RETURN NEXT; RETURN;
    END IF;

    IF NOT (p_bpi_id = ANY(v_review.candidate_bpi_ids)) THEN
        ok := false; message := 'bpi_not_a_candidate'; RETURN NEXT; RETURN;
    END IF;

    v_name := v_review.raw_row->>'name';
    v_year := (v_review.raw_row->>'year')::int;

    -- Attach the actual earnings record (from raw) to the chosen officer.
    INSERT INTO production.v2_earnings_year
        (bpi_id, year, department_name, title, regular_pay, retro_pay, other_pay,
         ot_pay, injured_pay, detail_pay, quinn_pay, total_pay, source, as_of)
    SELECT DISTINCT ON (r.name, r.year)
        p_bpi_id, r.year, r.department_name, r.title,
        production.parse_money(r.regular),  production.parse_money(r.retro),
        production.parse_money(r.other),    production.parse_money(r.overtime),
        production.parse_money(r.injured),  production.parse_money(r.detail),
        production.parse_money(r.quinn),    production.parse_money(r.total_earnings),
        'boston_open_data', now()
      FROM production.raw_v2_boston_earnings r
     WHERE r.name = v_name AND r.year = v_year
     ORDER BY r.name, r.year, production.parse_money(r.total_earnings) DESC NULLS LAST
    ON CONFLICT (bpi_id, year, source) DO UPDATE SET
        department_name = EXCLUDED.department_name, title = EXCLUDED.title,
        regular_pay = EXCLUDED.regular_pay, retro_pay = EXCLUDED.retro_pay,
        other_pay = EXCLUDED.other_pay, ot_pay = EXCLUDED.ot_pay,
        injured_pay = EXCLUDED.injured_pay, detail_pay = EXCLUDED.detail_pay,
        quinn_pay = EXCLUDED.quinn_pay, total_pay = EXCLUDED.total_pay, as_of = now();

    UPDATE production.v2_reconciliation_review
       SET resolved_at = now(), resolved_bpi_id = p_bpi_id,
           resolved_by = p_resolved_by, resolution = 'assigned'
     WHERE review_id = p_review_id;

    ok := true; message := 'assigned'; RETURN NEXT; RETURN;
END
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 3. run_earnings_from_boston() — now sticky-aware.
-- ---------------------------------------------------------------------------
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
    -- only clear UNRESOLVED holds; resolved decisions (assigned/skip) persist & are honored below
    DELETE FROM production.v2_reconciliation_review
     WHERE pipeline_name = 'earnings_ambiguous' AND resolved_at IS NULL;

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

    CREATE TEMP TABLE _e_people ON COMMIT DROP AS
    SELECT canon, year, COUNT(*) AS n_people FROM _e_raw GROUP BY canon, year;

    -- sticky: prior resolved decisions per (name, year)
    CREATE TEMP TABLE _e_resolved ON COMMIT DROP AS
    SELECT DISTINCT ON (raw_row->>'name', (raw_row->>'year')::int)
           raw_row->>'name'                                   AS name,
           (raw_row->>'year')::int                            AS year,
           resolved_bpi_id,
           (resolution = 'assigned' AND resolved_bpi_id IS NOT NULL) AS is_assigned
      FROM production.v2_reconciliation_review
     WHERE pipeline_name = 'earnings_ambiguous' AND resolved_at IS NOT NULL
     ORDER BY raw_row->>'name', (raw_row->>'year')::int, resolved_at DESC;

    CREATE TEMP TABLE _e_class ON COMMIT DROP AS
    SELECT r.*,
           p.n_people,
           COALESCE(o.n_officers, 0)   AS n_officers,
           COALESCE(o.n_with_empid, 0) AS n_with_empid,
           o.all_bpis,
           CASE
               WHEN res.is_assigned THEN res.resolved_bpi_id
               WHEN p.n_people = 1 AND COALESCE(o.n_officers,0) = 1 THEN o.any_bpi
               WHEN p.n_people = 1 AND COALESCE(o.n_officers,0) > 1 AND o.n_with_empid = 1 THEN o.hardid_bpi
               ELSE NULL
           END AS attach_bpi,
           CASE
               WHEN res.is_assigned THEN 'resolved_assignment'
               WHEN res.name IS NOT NULL THEN 'resolved_skip'   -- decision on file = skip; honor it
               WHEN p.n_people = 1 AND COALESCE(o.n_officers,0) = 1 THEN 'unambiguous'
               WHEN p.n_people = 1 AND COALESCE(o.n_officers,0) > 1 AND o.n_with_empid = 1 THEN 'hard_id_preferred'
               WHEN COALESCE(o.n_officers,0) = 0 THEN 'no_officer'
               ELSE 'ambiguous'
           END AS disposition
      FROM _e_raw r
      LEFT JOIN _e_off o      ON o.canon = r.canon
      LEFT JOIN _e_people p   ON p.canon = r.canon AND p.year = r.year
      LEFT JOIN _e_resolved res ON res.name = r.name AND res.year = r.year;

    INSERT INTO production.v2_earnings_year
        (bpi_id, year, department_name, title, regular_pay, retro_pay, other_pay,
         ot_pay, injured_pay, detail_pay, quinn_pay, total_pay, source, as_of)
    SELECT attach_bpi, year, department_name, title, regular_pay, retro_pay, other_pay,
           ot_pay, injured_pay, detail_pay, quinn_pay, total_pay, 'boston_open_data', now()
      FROM _e_class
     WHERE attach_bpi IS NOT NULL
    ON CONFLICT (bpi_id, year, source) DO NOTHING;
    GET DIAGNOSTICS v_att = ROW_COUNT;

    -- hold only genuinely-new ambiguity (a 'resolved_skip' decision is honored, not re-held)
    INSERT INTO production.v2_reconciliation_review
        (pipeline_name, raw_row, candidate_bpi_ids, created_at)
    SELECT 'earnings_ambiguous',
           jsonb_build_object('canonical_name', canon, 'name', name, 'year', year,
                              'total_pay', total_pay, 'reason', disposition),
           all_bpis, now()
      FROM _e_class
     WHERE disposition IN ('ambiguous', 'no_officer');

    SELECT COUNT(*) INTO v_held  FROM _e_class WHERE disposition = 'ambiguous';
    SELECT COUNT(*) INTO v_nooff FROM _e_class WHERE disposition = 'no_officer';

    raw_rows := v_raw; attached := v_att; held_ambiguous := v_held;
    no_officer := v_nooff; removed_old := v_old;
    RETURN NEXT;
END
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION production.resolve_earnings_review(uuid, uuid, text) IS
    'Resolve a held earnings_ambiguous review: attach the (name,year) earnings to the chosen '
    'officer (bpi_id), or skip (NULL bpi_id). Decisions are honored by run_earnings_from_boston() on re-run.';
