-- Home roster: filter by individual year, distinct IA case counts, last-name sort,
-- relative pay (review round 2 items: filter by YEAR not year batches; data visible by
-- year; explain/default sort; relative ranking; split IAs per officer).
--
--   vw_v2_officer_year_stats — one row per (officer, year) with that year's pay (all
--     categories, peer rank/percentile for total pay) and that year's activity counts:
--     IA cases (by received date), paid details, FIOs, MVC citations. The home page loads
--     it for the selected year(s) and sums across years client-side.
--   vw_v2_officer_year_list  — the years offered in the home year filter.
--   vw_v2_officer_search     — appends first_name / last_name (A–Z sort), num_of_ia_cases
--     (distinct cases, matching the profile), and the latest pay year's peer rank. Existing
--     columns are unchanged (num_of_ia stays = allegation rows, for compatibility).
-- Depends on 2026_09_23_2 (vw_v2_officer_ia_case) and 2026_09_23_3 (vw_v2_pay_rank_total).
-- Re-runnable.

CREATE OR REPLACE VIEW production.vw_v2_officer_year_stats AS
SELECT f.bpi_id,
       f.year,
       max(f.title) AS title,
       max(f.peer_group) AS peer_group,
       sum(f.total_pay) AS total_pay,
       sum(f.regular_pay) AS regular_pay,
       sum(f.retro_pay) AS retro_pay,
       sum(f.other_pay) AS other_pay,
       sum(f.ot_pay) AS overtime_pay,
       sum(f.injured_pay) AS injured_pay,
       sum(f.detail_pay) AS detail_pay,
       sum(f.quinn_pay) AS quinn_pay,
       max(f.pay_rank) AS pay_rank,
       max(f.pay_peers) AS pay_peers,
       max(f.pay_percentile) AS pay_percentile,
       max(f.pay_peer_avg) AS pay_peer_avg,
       max(f.pay_ratio_to_avg) AS pay_ratio_to_avg,
       count(DISTINCT f.ia_case)::int AS num_of_ia_cases,
       sum(f.is_detail)::int AS num_of_detail,
       sum(f.is_fio)::int AS num_of_fio,
       sum(f.is_mvc)::int AS num_of_mvc
FROM (
    SELECT ey.bpi_id, ey.year, ey.title, r.peer_group,
           ey.total_pay, ey.regular_pay, ey.retro_pay, ey.other_pay, ey.ot_pay,
           ey.injured_pay, ey.detail_pay, ey.quinn_pay,
           r.pay_rank, r.pay_peers, r.pay_percentile, r.pay_peer_avg, r.pay_ratio_to_avg,
           NULL::text AS ia_case, 0 AS is_detail, 0 AS is_fio, 0 AS is_mvc
    FROM production.v2_earnings_year ey
    LEFT JOIN production.vw_v2_pay_rank_total r ON r.bpi_id = ey.bpi_id AND r.year = ey.year
    WHERE NOT EXISTS (SELECT 1 FROM production.v2_name_match_confirmation c
                      WHERE c.bpi_id = ey.bpi_id AND c.source = ey.source AND c.decision = 'rejected')
    UNION ALL
    SELECT c.bpi_id, c.year, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
           NULL, NULL, NULL, NULL, NULL, c.case_number, 0, 0, 0
    FROM production.vw_v2_officer_ia_case c
    WHERE c.bpi_id IS NOT NULL
    UNION ALL
    SELECT d.bpi_id, extract(year FROM d.start_date)::int, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
           NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 0
    FROM production.v2_paid_detail d
    WHERE d.bpi_id IS NOT NULL
    UNION ALL
    SELECT fi.bpi_id, extract(year FROM fi.contact_date AT TIME ZONE 'America/New_York')::int,
           NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
           NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, 0
    FROM production.v2_fio fi
    WHERE fi.bpi_id IS NOT NULL
    UNION ALL
    SELECT t.bpi_id, extract(year FROM t.event_date)::int, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
           NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1
    FROM production.v2_traffic_citation t
    WHERE t.bpi_id IS NOT NULL
) f
WHERE f.year IS NOT NULL
GROUP BY f.bpi_id, f.year;

COMMENT ON VIEW production.vw_v2_officer_year_stats IS
    'Per officer per year: pay by category, total-pay peer rank, and IA case / detail / FIO / MVC counts. Home year filter.';

CREATE OR REPLACE VIEW production.vw_v2_officer_year_list AS
SELECT s.year,
       count(*)::int AS officers,
       (count(*) FILTER (WHERE s.total_pay IS NOT NULL))::int AS officers_with_pay
FROM production.vw_v2_officer_year_stats s
GROUP BY s.year;

CREATE OR REPLACE VIEW production.vw_v2_officer_search AS
 SELECT m.bpi_id,
    m.employee_id,
    NULLIF(TRIM(BOTH FROM concat_ws(' '::text, m.first_name, m.last_name)), ''::text) AS full_name,
    asg.org,
    m.badge_no,
    m.rank,
    COALESCE(demo.race, arr.race) AS race,
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
    m.mptc_id AS post_id,
    m.roster_source = 'fall_2025_roster'::text AS is_current_roster,
    -- appended 2026-09-23
    m.first_name,
    m.last_name,
    COALESCE(iac.num_of_ia_cases, 0) AS num_of_ia_cases,
    pr.peer_group AS pay_peer_group,
    pr.pay_rank,
    pr.pay_peers,
    pr.pay_percentile,
    pr.pay_peer_avg,
    pr.pay_ratio_to_avg
   FROM production.v2_officer_id_map m
     LEFT JOIN production.vw_v2_officer_arroyo arr ON arr.bpi_id = m.bpi_id
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
     LEFT JOIN ( SELECT c.bpi_id, count(*)::int AS num_of_ia_cases
           FROM production.vw_v2_officer_ia_case c
          WHERE c.bpi_id IS NOT NULL
          GROUP BY c.bpi_id) iac ON iac.bpi_id = m.bpi_id
     LEFT JOIN production.vw_v2_pay_rank_total pr ON pr.bpi_id = m.bpi_id AND pr.year = e.year
  WHERE m.first_name IS NOT NULL OR m.last_name IS NOT NULL;
