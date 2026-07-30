-- Fix doubled middle initial in the officer identity block.
-- v2_officer_id_map.first_name often already carries the middle initial (e.g. "Robert K"),
-- and middle_name is separately populated (e.g. "Keith" or just "P"). concat_ws(first, middle,
-- last) then produced "Robert K Keith Connor" / "Dennis P P O'Rourke". Drop the middle token
-- when first_name already ends in a single-letter initial matching the middle's initial.
CREATE OR REPLACE VIEW production.v2_officer_identity_block AS
SELECT m.bpi_id,
    NULLIF(TRIM(BOTH FROM regexp_replace(
        CASE
          WHEN NULLIF(TRIM(BOTH FROM m.middle_name), '') IS NOT NULL
               AND m.first_name ~ '\s[A-Za-z]$'
               AND upper(right(TRIM(BOTH FROM m.first_name), 1)) = upper(left(TRIM(BOTH FROM m.middle_name), 1))
            THEN concat_ws(' '::text, m.first_name, m.last_name)
          ELSE concat_ws(' '::text, m.first_name, m.middle_name, m.last_name)
        END,
        '\s+'::text, ' '::text, 'g'::text)), ''::text) AS officer_name,
    m.first_name AS officer_first_name,
    m.last_name AS officer_last_name,
    m.badge_no AS officer_badge_no,
    m.mptc_id AS officer_post_id,
    m.employee_id AS officer_employee_id,
    m.rank AS officer_rank,
    ( SELECT a.descr
           FROM production.vw_v2_officer_assignment a
          WHERE a.bpi_id = m.bpi_id
          ORDER BY a.eff_date DESC NULLS LAST
         LIMIT 1) AS officer_current_unit
   FROM production.v2_officer_id_map m;
