-- Roster-first cleanup + canonical-name officer search
-- ===========================================================================
-- The roster-first detour (former migrations 2026_06_01–2026_06_06) was reverted
-- in code, but its DB objects remained as orphans. This drops them and repoints
-- officer search at the canonical-name identity table.
--
-- DROP: roster views, roster functions, v2_post_officer, and the roster/match-
-- confidence COLUMNS. KEEP: badge_no / rank / hire_date on v2_officer_id_map
-- (useful officer attributes, not machinery) and officer_*/match_method on
-- v2_officer_misconduct (from the kept IAD-NLG work).

-- 1. Drop roster views (reference is_bpd / v2_post_officer).
DROP VIEW IF EXISTS production.vw_v2_bpd_roster;
DROP VIEW IF EXISTS production.vw_v2_post_officer;
DROP VIEW IF EXISTS production.vw_v2_homepage;

-- 2. Recreate the fact views WITHOUT match_confidence/match_candidates
--    (CREATE OR REPLACE can't drop columns, so drop + create).
DROP VIEW IF EXISTS production.vw_v2_earnings_by_year;
CREATE VIEW production.vw_v2_earnings_by_year AS
SELECT bpi_id, year, department_name, title, regular_pay, retro_pay, other_pay,
       ot_pay, injured_pay, detail_pay, quinn_pay, total_pay, source, as_of
  FROM production.v2_earnings_year;

DROP VIEW IF EXISTS production.vw_v2_fio;
CREATE VIEW production.vw_v2_fio AS
SELECT fio_id, bpi_id, fc_num, contact_date, location, frisked, vehicle_searched,
       basis, circumstance, narrative, source, as_of
  FROM production.v2_fio;

DROP VIEW IF EXISTS production.vw_v2_officer_misconduct;
CREATE VIEW production.vw_v2_officer_misconduct AS
SELECT misconduct_id, bpi_id, case_number, incident_type, allegation, finding,
       action_taken, received_date, completed_date, source, as_of,
       officer_first_name, officer_last_name, officer_rank, officer_seq, match_method
  FROM production.v2_officer_misconduct;

DROP VIEW IF EXISTS production.vw_v2_post_certification;
CREATE VIEW production.vw_v2_post_certification AS
SELECT bpi_id, mptc_id, certification, status, expiration, agency, additional_info, source, as_of
  FROM production.v2_post_certification;

-- 3. Drop roster functions.
DROP FUNCTION IF EXISTS production.build_bpd_roster();
DROP FUNCTION IF EXISTS production.fold_bpd_name_fragments();
DROP FUNCTION IF EXISTS production.run_post_certified_from_raw();

-- 4. Drop the statewide POST reference table.
DROP TABLE IF EXISTS production.v2_post_officer;

-- 5. Drop roster/match-confidence columns.
ALTER TABLE production.v2_officer_id_map
    DROP COLUMN IF EXISTS is_bpd,
    DROP COLUMN IF EXISTS name_source,
    DROP COLUMN IF EXISTS badge_source;
ALTER TABLE production.v2_earnings_year     DROP COLUMN IF EXISTS match_confidence, DROP COLUMN IF EXISTS match_candidates;
ALTER TABLE production.v2_fio               DROP COLUMN IF EXISTS match_confidence, DROP COLUMN IF EXISTS match_candidates;
ALTER TABLE production.v2_post_certification DROP COLUMN IF EXISTS match_confidence, DROP COLUMN IF EXISTS match_candidates;
ALTER TABLE production.v2_officer_misconduct DROP COLUMN IF EXISTS match_confidence, DROP COLUMN IF EXISTS match_candidates;

-- 6. Canonical-name officer search over v2_officer_id_map (all merged officers),
--    so home-page search results link to v2 bpi_ids (v2 profile sections populate).
--    Mirrors the GET_HOMEPAGE_DATA node shape.
CREATE VIEW production.vw_v2_officer_search AS
SELECT
    m.bpi_id,
    m.employee_id,
    NULLIF(TRIM(CONCAT_WS(' ', m.first_name, m.last_name)), '') AS full_name,
    asg.org,
    m.badge_no,
    m.rank,
    demo.race,
    demo.sex,
    e.total_pay,
    e.ot_pay      AS overtime_pay,
    e.detail_pay,
    e.other_pay,
    e.year,
    (SELECT COUNT(*) FROM production.v2_officer_misconduct ia WHERE ia.bpi_id = m.bpi_id) AS num_of_ia
  FROM production.v2_officer_id_map m
  LEFT JOIN LATERAL (
      SELECT total_pay, ot_pay, detail_pay, other_pay, year
        FROM production.v2_earnings_year e
       WHERE e.bpi_id = m.bpi_id ORDER BY year DESC NULLS LAST LIMIT 1
  ) e ON true
  LEFT JOIN LATERAL (
      SELECT descr AS org FROM production.vw_v2_officer_assignment a
       WHERE a.bpi_id = m.bpi_id ORDER BY eff_date DESC NULLS LAST LIMIT 1
  ) asg ON true
  LEFT JOIN LATERAL (
      SELECT NULLIF(TRIM(sex),'') AS sex, NULLIF(TRIM(ethnic_grp),'') AS race
        FROM production.raw_responsive_records r
       WHERE r.employee_id = m.employee_id ORDER BY as_of DESC NULLS LAST LIMIT 1
  ) demo ON true
 WHERE m.first_name IS NOT NULL OR m.last_name IS NOT NULL;

COMMENT ON VIEW production.vw_v2_officer_search IS
    'Home-page officer search over the canonical-name-merged v2_officer_id_map. '
    'Results carry v2 bpi_ids so profile links resolve to the v2 sections.';
