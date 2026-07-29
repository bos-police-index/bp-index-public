-- Non-attributed MVC citations (review Epic 4): raw traffic citations whose issuing
-- officer_id does not match any roster officer. Surfaced as its own, clearly-labeled
-- explorer table ("Traffic Citations (MVC) — Unattributed") so the ~36k unmatched
-- citations are visible without implying an officer attribution we can't verify.
CREATE OR REPLACE VIEW production.vw_traffic_unattributed AS
SELECT r.local_id, r.issuing_agency, r.officer_id, r.event_date, r.time_hh, r.time_mm, r.am_pm,
       r.violator_type, r.citation_number, r.citation_type, r.offense_code, r.offense_description,
       r.location_name, r.race, r.gender, r.year_of_birth, r.searched, r.crash, r.plate_type, r.vehicle_state
FROM production.raw_traffic_tickets_fall_2025 r
WHERE r.officer_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM production.v2_officer_id_map m WHERE m.employee_id::text = r.officer_id);

COMMENT ON VIEW production.vw_traffic_unattributed IS 'MVC citations whose issuing officer_id does not match a roster officer — non-attributed.';
