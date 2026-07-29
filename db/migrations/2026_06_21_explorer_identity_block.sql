-- Shared officer-identity block for the /data explorer tables (review Epic 2).
-- Each joinable explorer view (vw_detail_records, vw_court_overtime,
-- vw_incidents_with_officer_details_ww, vw_field_interrogation_and_observation,
-- vw_traffic_stops_fall_2025, vw_employee_ia_fall_2025, vw_ir_fall_2025) was
-- extended in place to `LEFT JOIN production.v2_officer_identity_block idb ON
-- idb.bpi_id = <view>.bpi_id`, exposing officer_name/badge/post/employee/rank/
-- current_unit so every table can lead with a standardized officer-identity block.
-- (vw_boston_arrests is NOT joined — its source has no officer key.)
CREATE OR REPLACE VIEW production.v2_officer_identity_block AS
SELECT m.bpi_id,
    NULLIF(TRIM(regexp_replace(CONCAT_WS(' ', m.first_name, m.middle_name, m.last_name), '\s+', ' ', 'g')), '') AS officer_name,
    m.first_name AS officer_first_name,
    m.last_name  AS officer_last_name,
    m.badge_no   AS officer_badge_no,
    m.mptc_id    AS officer_post_id,
    m.employee_id AS officer_employee_id,
    m.rank       AS officer_rank,
    (SELECT a.descr FROM production.vw_v2_officer_assignment a
       WHERE a.bpi_id = m.bpi_id ORDER BY a.eff_date DESC NULLS LAST LIMIT 1) AS officer_current_unit
FROM production.v2_officer_id_map m;
