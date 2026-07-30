-- Arroyo backfills (per user scope): residence-city fallback + race backfill.
-- Rebuilds three views to draw on vw_v2_officer_arroyo where our primary source is missing:
--  * vw_v2_officer_residence  -> fall back to Arroyo latest city/state when there is no
--    earnings-report ZIP residence (adds ~1,538 officers); new residence_source column.
--  * vw_v2_officer_search (home) & vw_employee_roster_fall_2025_2 (explorer) -> COALESCE race
--    from responsive_records with the Arroyo 2018 Ethnic Grp (adds ~672 officers).
-- (Tenure serving-since/appointment is wired on the frontend from vw_v2_officer_arroyo.)

CREATE OR REPLACE VIEW production.vw_v2_officer_residence AS
WITH canon_single AS (
    SELECT canonical_name, (array_agg(bpi_id))[1] AS bpi_id
    FROM production.v2_officer_id_map
    WHERE canonical_name IS NOT NULL
    GROUP BY canonical_name
    HAVING count(*) = 1
),
zip_res AS (
    SELECT DISTINCT ON (c.bpi_id)
           c.bpi_id,
           NULLIF(TRIM(BOTH FROM e.postal), '') AS residence_zip,
           e.year AS residence_year
    FROM production.raw_v2_boston_earnings e
    JOIN canon_single c ON production.canonicalize_name(e.name) = c.canonical_name
    WHERE NULLIF(TRIM(BOTH FROM e.postal), '') IS NOT NULL
    ORDER BY c.bpi_id, e.year DESC NULLS LAST
),
arr AS (
    SELECT bpi_id, residence_city, residence_state
    FROM production.vw_v2_officer_arroyo
    WHERE residence_city IS NOT NULL
)
SELECT COALESCE(z.bpi_id, a.bpi_id) AS bpi_id,
       z.residence_zip,
       z.residence_year,
       COALESCE(zp.place, a.residence_city) AS residence_place,
       COALESCE(zp.state, a.residence_state) AS residence_state,
       CASE WHEN z.bpi_id IS NOT NULL THEN 'earnings_zip' ELSE 'arroyo_roster' END AS residence_source
FROM zip_res z
FULL JOIN arr a ON a.bpi_id = z.bpi_id
LEFT JOIN production.zip_place zp ON zp.zip5 = LEFT(z.residence_zip, 5);

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
    m.roster_source = 'fall_2025_roster'::text AS is_current_roster
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
  WHERE m.first_name IS NOT NULL OR m.last_name IS NOT NULL;

CREATE OR REPLACE VIEW production.vw_employee_roster_fall_2025_2 AS
 SELECT b.bpi_id,
    r.employee_id,
    r.name_id,
    r.last_name,
    r.first_name,
    r.sal_plan,
    r.job_title,
    COALESCE(rr.ethnic_grp, arr.race) AS race,
    rr.sex,
    m.badge_no,
    m.mptc_id AS post_id,
    m.rank,
    asg.current_unit,
    acad.start_date,
    res.residence_zip,
    ( SELECT count(*) AS count
           FROM production.v2_fio f
          WHERE f.bpi_id = b.bpi_id) AS num_of_fio,
    ( SELECT count(*) AS count
           FROM production.v2_incident i
          WHERE i.bpi_id = b.bpi_id) AS num_of_incident,
    ( SELECT count(*) AS count
           FROM production.v2_traffic_citation t
          WHERE t.bpi_id = b.bpi_id) AS num_of_mvc,
    e.ot_pay AS overtime_pay,
    cot.court_ot_hours,
    res.residence_place,
    res.residence_state
   FROM production.raw_employee_roster_fall_2025 r
     JOIN production.bpi_unique_id b ON r.employee_id = b.employee_id
     LEFT JOIN ( SELECT DISTINCT ON (raw_responsive_records.employee_id) raw_responsive_records.employee_id,
            raw_responsive_records.ethnic_grp,
            raw_responsive_records.sex
           FROM production.raw_responsive_records
          WHERE raw_responsive_records.employee_id IS NOT NULL
          ORDER BY raw_responsive_records.employee_id) rr ON r.employee_id = rr.employee_id
     LEFT JOIN production.v2_officer_id_map m ON m.bpi_id = b.bpi_id
     LEFT JOIN production.vw_v2_officer_arroyo arr ON arr.bpi_id = b.bpi_id
     LEFT JOIN LATERAL ( SELECT a.descr AS current_unit
           FROM production.vw_v2_officer_assignment a
          WHERE a.bpi_id = b.bpi_id
          ORDER BY a.eff_date DESC NULLS LAST
         LIMIT 1) asg ON true
     LEFT JOIN LATERAL ( SELECT min(ac.class_end_date) AS start_date
           FROM production.v2_officer_academy ac
          WHERE ac.bpi_id = b.bpi_id) acad ON true
     LEFT JOIN production.vw_v2_officer_residence res ON res.bpi_id = b.bpi_id
     LEFT JOIN LATERAL ( SELECT ey.ot_pay
           FROM production.v2_earnings_year ey
          WHERE ey.bpi_id = b.bpi_id
          ORDER BY ey.year DESC NULLS LAST
         LIMIT 1) e ON true
     LEFT JOIN ( SELECT co.bpi_id,
            round(sum(COALESCE(co.worked_hours, 0::numeric)), 1) AS court_ot_hours
           FROM production.v2_court_overtime co
          GROUP BY co.bpi_id) cot ON cot.bpi_id = b.bpi_id
  WHERE r.employee_id IS NOT NULL;
