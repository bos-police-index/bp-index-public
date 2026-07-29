-- BPD Employees explorer table (review): bring /data/tables/employee up to WokeWindows parity.
-- The explorer "employee" grid was still backed by the bare fall-2025 roster view
-- (name/title/race/sex only). This migration enriches it in place — same row set
-- (current roster), same PostGraphile alias — by appending the requested columns via
-- LEFT JOINs onto the v2 identity/activity/earnings data.
--
-- Requested fields and how each is sourced (gaps called out in the app + commit message):
--   Badge #            -> v2_officer_id_map.badge_no
--   POST ID #          -> v2_officer_id_map.mptc_id
--   Current unit       -> latest assignment descr (vw_v2_officer_assignment)
--   Start date         -> earliest academy class_end_date (proxy; real hire date not sourced)
--   Residence (ZIP)    -> latest-year postal from the Boston earnings report, matched by
--                         canonical name (unambiguous matches only) — see vw_v2_officer_residence
--   FIOs               -> count(v2_fio)
--   Incidents          -> count(v2_incident)
--   Traffic Cit. (MVC) -> count(v2_traffic_citation)
--   Overtime ($)       -> latest-year ot_pay (v2_earnings_year)
--   Court OT (hrs)     -> sum(worked_hours) (v2_court_overtime)  [source has hours, not $]
-- NOT sourced (no data): Media reports (v2_news_article empty); Special Events / Extended Day /
--   Replacement Duty overtime (only court OT is broken out; earnings carry one total ot_pay);
--   neighborhood name (we surface the ZIP; ZIP->neighborhood map not yet loaded).

-- 1) Residence: latest-year ZIP from the earnings report, attached only where a canonical
--    name maps to exactly one officer (conservative — avoids wrong attribution on shared names).
CREATE OR REPLACE VIEW production.vw_v2_officer_residence AS
WITH canon_single AS (
    SELECT canonical_name, (array_agg(bpi_id))[1] AS bpi_id
    FROM production.v2_officer_id_map
    WHERE canonical_name IS NOT NULL
    GROUP BY canonical_name
    HAVING count(*) = 1
)
SELECT DISTINCT ON (c.bpi_id)
       c.bpi_id,
       NULLIF(TRIM(BOTH FROM e.postal), '') AS residence_zip,
       e.year AS residence_year
FROM production.raw_v2_boston_earnings e
JOIN canon_single c ON production.canonicalize_name(e.name) = c.canonical_name
WHERE NULLIF(TRIM(BOTH FROM e.postal), '') IS NOT NULL
ORDER BY c.bpi_id, e.year DESC NULLS LAST;

COMMENT ON VIEW production.vw_v2_officer_residence IS 'Latest-year residence ZIP from the Boston earnings report, matched by canonical name (unambiguous matches only).';

-- 2) Enrich the employee explorer view in place (first 9 columns unchanged for CREATE OR REPLACE).
--    NOTE: the /data/tables/employee grid reads the `_2` twin view (alias allVwEmployeeRosterFall20252S),
--    not the near-identical vw_employee_roster_fall_2025 — so enrich the `_2` view.
CREATE OR REPLACE VIEW production.vw_employee_roster_fall_2025_2 AS
SELECT b.bpi_id,
    r.employee_id,
    r.name_id,
    r.last_name,
    r.first_name,
    r.sal_plan,
    r.job_title,
    rr.ethnic_grp AS race,
    rr.sex,
    -- appended enrichment columns:
    m.badge_no,
    m.mptc_id AS post_id,
    m.rank,
    asg.current_unit,
    acad.start_date,
    res.residence_zip,
    ( SELECT count(*) FROM production.v2_fio f WHERE f.bpi_id = b.bpi_id) AS num_of_fio,
    ( SELECT count(*) FROM production.v2_incident i WHERE i.bpi_id = b.bpi_id) AS num_of_incident,
    ( SELECT count(*) FROM production.v2_traffic_citation t WHERE t.bpi_id = b.bpi_id) AS num_of_mvc,
    e.ot_pay AS overtime_pay,
    cot.court_ot_hours
   FROM production.raw_employee_roster_fall_2025 r
     JOIN production.bpi_unique_id b ON r.employee_id = b.employee_id
     LEFT JOIN ( SELECT DISTINCT ON (raw_responsive_records.employee_id) raw_responsive_records.employee_id,
            raw_responsive_records.ethnic_grp,
            raw_responsive_records.sex
           FROM production.raw_responsive_records
          WHERE raw_responsive_records.employee_id IS NOT NULL
          ORDER BY raw_responsive_records.employee_id) rr ON r.employee_id = rr.employee_id
     LEFT JOIN production.v2_officer_id_map m ON m.bpi_id = b.bpi_id
     LEFT JOIN LATERAL ( SELECT a.descr AS current_unit
           FROM production.vw_v2_officer_assignment a
          WHERE a.bpi_id = b.bpi_id
          ORDER BY a.eff_date DESC NULLS LAST LIMIT 1) asg ON true
     LEFT JOIN LATERAL ( SELECT min(ac.class_end_date) AS start_date
           FROM production.v2_officer_academy ac WHERE ac.bpi_id = b.bpi_id) acad ON true
     LEFT JOIN production.vw_v2_officer_residence res ON res.bpi_id = b.bpi_id
     LEFT JOIN LATERAL ( SELECT ey.ot_pay
           FROM production.v2_earnings_year ey WHERE ey.bpi_id = b.bpi_id
          ORDER BY ey.year DESC NULLS LAST LIMIT 1) e ON true
     LEFT JOIN ( SELECT co.bpi_id, round(sum(COALESCE(co.worked_hours, 0))::numeric, 1) AS court_ot_hours
           FROM production.v2_court_overtime co GROUP BY co.bpi_id) cot ON cot.bpi_id = b.bpi_id
  WHERE r.employee_id IS NOT NULL;
