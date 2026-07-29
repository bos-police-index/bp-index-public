-- Earnings ranking (review Epic 1: "Earnings — including their ranking compared
-- to others"). Add per-year pay rank + percentile + population, computed across the
-- full officer population, so a profile can show "#12 of 2,551 · top 8%".
CREATE OR REPLACE VIEW production.vw_v2_earnings_by_year AS
SELECT
    e.bpi_id, e.year, e.department_name, e.title, e.regular_pay, e.retro_pay,
    e.other_pay, e.ot_pay, e.injured_pay, e.detail_pay, e.quinn_pay, e.total_pay,
    e.source, e.as_of,
    'name'::text AS link_method,
    (EXISTS (SELECT 1 FROM production.v2_name_match_confirmation c
              WHERE c.bpi_id = e.bpi_id AND c.source = e.source AND c.decision = 'confirmed')) AS confirmed,
    rank()  OVER (PARTITION BY e.year ORDER BY e.total_pay DESC NULLS LAST) AS pay_rank,
    count(*) OVER (PARTITION BY e.year) AS pay_pop,
    round((percent_rank() OVER (PARTITION BY e.year ORDER BY e.total_pay))::numeric * 100)::int AS pay_percentile
FROM production.v2_earnings_year e
WHERE NOT (EXISTS (SELECT 1 FROM production.v2_name_match_confirmation c
                    WHERE c.bpi_id = e.bpi_id AND c.source = e.source AND c.decision = 'rejected'));
