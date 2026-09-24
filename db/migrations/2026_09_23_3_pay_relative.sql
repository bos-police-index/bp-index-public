-- Relative pay measures by category (review round 2: "Relative ranking by category e.g.
-- annual average — payroll data: add relative measures compared to other officers that year").
--
-- vw_v2_earnings_by_year ranks total pay only, against every BPD employee on the payroll
-- (civilians included). This view compares each person with their PEERS that year:
--   peer_group = 'sworn' (police officer → superintendent titles) or 'civilian' (everyone
--   else on the BPD payroll), from that year's job title (is_sworn_title()).
-- For every pay category (total, regular, overtime, detail, other, retro, injured, quinn):
--   amount, rank (1 = highest), peers (people in the group paid that year), percentile
--   (share of peers earning less, 0–100), the peer average and median, and ratio_to_avg.
-- Everyone paid that year counts, with a missing category treated as $0, so "overtime
-- percentile 90" means more OT than 90% of sworn officers paid that year.
-- Re-runnable.

CREATE OR REPLACE FUNCTION production.is_sworn_title(t text) RETURNS boolean
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
    SELECT coalesce(t ~* '^(police (off|detective|sergeant|lieut|captain)|policesergeant|sergeant/|lieut-|captain/|dep supn|supn bpd|supn-in chief)', false)
$$;
COMMENT ON FUNCTION production.is_sworn_title(text) IS '@omit';

CREATE OR REPLACE VIEW production.vw_v2_pay_relative AS
WITH e AS (
    SELECT ey.bpi_id, ey.year, ey.title,
           CASE WHEN production.is_sworn_title(ey.title) THEN 'sworn' ELSE 'civilian' END AS peer_group,
           ey.total_pay, ey.regular_pay, ey.ot_pay, ey.detail_pay, ey.other_pay,
           ey.retro_pay, ey.injured_pay, ey.quinn_pay
    FROM production.v2_earnings_year ey
    WHERE coalesce(ey.total_pay, 0) > 0
      AND NOT EXISTS (SELECT 1 FROM production.v2_name_match_confirmation c
                      WHERE c.bpi_id = ey.bpi_id AND c.source = ey.source AND c.decision = 'rejected')
),
long AS (
    SELECT e.bpi_id, e.year, e.title, e.peer_group, c.category, c.sort_order, c.label,
           coalesce(c.amount, 0) AS amount
    FROM e
    CROSS JOIN LATERAL (VALUES
        ('total',    1, 'Total pay',   e.total_pay),
        ('regular',  2, 'Regular',     e.regular_pay),
        ('overtime', 3, 'Overtime',    e.ot_pay),
        ('detail',   4, 'Detail',      e.detail_pay),
        ('other',    5, 'Other',       e.other_pay),
        ('retro',    6, 'Retro',       e.retro_pay),
        ('injured',  7, 'Injured',     e.injured_pay),
        ('quinn',    8, 'Quinn Bill',  e.quinn_pay)
    ) AS c(category, sort_order, label, amount)
),
med AS (
    SELECT year, peer_group, category,
           round((percentile_cont(0.5) WITHIN GROUP (ORDER BY amount))::numeric, 2) AS peer_median
    FROM long
    GROUP BY 1, 2, 3
)
SELECT
    l.bpi_id, l.year, l.title, l.peer_group, l.category, l.label AS category_label, l.sort_order,
    l.amount,
    -- one ordered window: rank (1 = highest) = peers - (# earning <= me) + 1
    (count(*) OVER w - count(*) OVER w_asc + 1)::int AS rank,
    (count(*) OVER w)::int AS peers,
    round((percent_rank() OVER w_asc * 100)::numeric)::int AS percentile,
    round(avg(l.amount) OVER w, 2) AS peer_avg,
    m.peer_median,
    CASE WHEN avg(l.amount) OVER w > 0 THEN round(l.amount / (avg(l.amount) OVER w), 2) END AS ratio_to_avg
FROM long l
JOIN med m ON m.year = l.year AND m.peer_group = l.peer_group AND m.category = l.category
WINDOW w     AS (PARTITION BY l.year, l.peer_group, l.category),
       w_asc AS (PARTITION BY l.year, l.peer_group, l.category ORDER BY l.amount
                 RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW);

COMMENT ON VIEW production.vw_v2_pay_relative IS
    'Per officer, year and pay category: rank, percentile, peer average/median vs sworn (or civilian) peers paid that year.';

-- Total-pay rank only (same peer groups/formulas as vw_v2_pay_relative, category 'total'),
-- cheap enough to join into the home roster (vw_v2_officer_search / vw_v2_officer_year_stats).
CREATE OR REPLACE VIEW production.vw_v2_pay_rank_total AS
SELECT p.bpi_id, p.year, p.title, p.peer_group, p.total_pay,
       (count(*) OVER w - count(*) OVER w_asc + 1)::int AS pay_rank,
       (count(*) OVER w)::int AS pay_peers,
       round((percent_rank() OVER w_asc * 100)::numeric)::int AS pay_percentile,
       round(avg(p.total_pay) OVER w, 2) AS pay_peer_avg,
       round(p.total_pay / nullif(avg(p.total_pay) OVER w, 0), 2) AS pay_ratio_to_avg
FROM (
    SELECT ey.bpi_id, ey.year, ey.title, ey.total_pay,
           CASE WHEN production.is_sworn_title(ey.title) THEN 'sworn' ELSE 'civilian' END AS peer_group
    FROM production.v2_earnings_year ey
    WHERE coalesce(ey.total_pay, 0) > 0
      AND NOT EXISTS (SELECT 1 FROM production.v2_name_match_confirmation c
                      WHERE c.bpi_id = ey.bpi_id AND c.source = ey.source AND c.decision = 'rejected')
) p
WINDOW w     AS (PARTITION BY p.year, p.peer_group),
       w_asc AS (PARTITION BY p.year, p.peer_group ORDER BY p.total_pay
                 RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW);
