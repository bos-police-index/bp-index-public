-- Homepage officer table: WokeWindows-parity columns (review Epic 4).
-- Extends production.vw_v2_officer_search (the view behind the home-page roster grid)
-- with the columns the home page now surfaces alongside the existing ones:
--   * per-earnings-type breakdown for the LATEST year on file:
--       regular_pay, retro_pay, injured_pay, quinn_pay  (total/ot/detail/other already present)
--   * activity counts:  num_of_detail (paid details), num_of_fio (FIOs), num_of_mvc (traffic citations)
--   * identity:         mptc_id AS post_id (statewide POST cert id)
--   * start_date:       earliest academy class_end_date, used as a start-date proxy where available
--
-- The earnings block is a LATERAL that already picks the officer's most-recent year of
-- earnings, so every pay column is for that same latest year. Idempotent (CREATE OR REPLACE).
CREATE OR REPLACE VIEW production.vw_v2_officer_search AS
SELECT m.bpi_id,
    m.employee_id,
    NULLIF(TRIM(BOTH FROM concat_ws(' '::text, m.first_name, m.last_name)), ''::text) AS full_name,
    asg.org,
    m.badge_no,
    m.rank,
    demo.race,
    demo.sex,
    e.total_pay,
    e.ot_pay AS overtime_pay,
    e.detail_pay,
    e.other_pay,
    e.year,
    ( SELECT count(*) AS count
           FROM production.v2_officer_misconduct ia
          WHERE ia.bpi_id = m.bpi_id) AS num_of_ia,
    e.regular_pay,
    e.retro_pay,
    e.injured_pay,
    e.quinn_pay,
    ( SELECT count(*) AS count
           FROM production.v2_paid_detail d
          WHERE d.bpi_id = m.bpi_id) AS num_of_detail,
    ( SELECT count(*) AS count
           FROM production.v2_fio f
          WHERE f.bpi_id = m.bpi_id) AS num_of_fio,
    ( SELECT count(*) AS count
           FROM production.v2_traffic_citation t
          WHERE t.bpi_id = m.bpi_id) AS num_of_mvc,
    acad.start_date,
    m.mptc_id AS post_id
   FROM production.v2_officer_id_map m
     LEFT JOIN LATERAL ( SELECT e_1.total_pay,
            e_1.ot_pay,
            e_1.detail_pay,
            e_1.other_pay,
            e_1.regular_pay,
            e_1.retro_pay,
            e_1.injured_pay,
            e_1.quinn_pay,
            e_1.year
           FROM production.v2_earnings_year e_1
          WHERE e_1.bpi_id = m.bpi_id
          ORDER BY e_1.year DESC NULLS LAST
         LIMIT 1) e ON true
     LEFT JOIN LATERAL ( SELECT a.descr AS org
           FROM production.vw_v2_officer_assignment a
          WHERE a.bpi_id = m.bpi_id
          ORDER BY a.eff_date DESC NULLS LAST
         LIMIT 1) asg ON true
     LEFT JOIN LATERAL ( SELECT NULLIF(TRIM(BOTH FROM r.sex), ''::text) AS sex,
            NULLIF(TRIM(BOTH FROM r.ethnic_grp), ''::text) AS race
           FROM production.raw_responsive_records r
          WHERE r.employee_id = m.employee_id
          ORDER BY r.as_of DESC NULLS LAST
         LIMIT 1) demo ON true
     LEFT JOIN LATERAL ( SELECT min(ac.class_end_date) AS start_date
           FROM production.v2_officer_academy ac
          WHERE ac.bpi_id = m.bpi_id) acad ON true
  WHERE m.first_name IS NOT NULL OR m.last_name IS NOT NULL;

COMMENT ON VIEW production.vw_v2_officer_search IS 'Home-page officer roster grid. Identity + latest-year earnings breakdown + lifetime activity counts (IA/detail/FIO/MVC) + POST id + academy-grad start-date proxy.';
