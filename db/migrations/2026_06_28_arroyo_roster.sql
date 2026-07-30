-- "Order of Councilor Arroyo" — 13 annual BPD roster snapshots (2010–2022), public records.
-- Used to backfill (per user scope): residence city, tenure "serving since" + appointment date,
-- and race where missing. Org is intentionally NOT sourced from here (already covered by
-- raw_v2_tskprof_assignment). Hard-matched to officers by employee_id (the ID column).
-- ~28,299 rows, 3,107 officers (99.97% match). Birthdate is loaded but deliberately NOT surfaced.

CREATE TABLE IF NOT EXISTS production.raw_v2_arroyo_roster (
  raw_id             bigserial PRIMARY KEY,
  employee_id        bigint,
  last_name          text,
  first_name         text,
  middle_name        text,
  city               text,
  state              text,
  sex                text,
  birthdate          date,
  sal_plan           text,
  pay_status         text,
  job_title          text,
  task_profile_id    text,
  task_profile_descr text,
  ethnic_grp         text,
  grade_date         date,
  as_of              date,
  ingested_at        timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_arroyo_empid ON production.raw_v2_arroyo_roster(employee_id);

-- Per-officer rollup (hard-matched to bpi_id). Latest-snapshot residence/rank + tenure span
-- + appointment (grade) date + race. Birthdate intentionally excluded from this view.
CREATE OR REPLACE VIEW production.vw_v2_officer_arroyo AS
WITH base AS (
    SELECT r.*, m.bpi_id, EXTRACT(YEAR FROM r.as_of)::int AS yr
    FROM production.raw_v2_arroyo_roster r
    JOIN production.v2_officer_id_map m ON m.employee_id = r.employee_id
),
latest AS (
    SELECT DISTINCT ON (bpi_id)
        bpi_id,
        NULLIF(TRIM(city), '')  AS residence_city,
        NULLIF(TRIM(state), '') AS residence_state,
        NULLIF(TRIM(job_title), '') AS latest_rank
    FROM base
    ORDER BY bpi_id, as_of DESC NULLS LAST
),
agg AS (
    SELECT bpi_id,
           min(yr)                                                     AS serving_since,
           max(yr)                                                     AS last_seen_year,
           min(grade_date) FILTER (WHERE grade_date IS NOT NULL)       AS appointment_date,
           max(NULLIF(TRIM(ethnic_grp), '')) FILTER (WHERE NULLIF(TRIM(ethnic_grp), '') IS NOT NULL) AS race
    FROM base GROUP BY bpi_id
)
SELECT a.bpi_id, a.serving_since, a.last_seen_year, a.appointment_date, a.race,
       l.residence_city, l.residence_state, l.latest_rank
FROM agg a JOIN latest l USING (bpi_id);

COMMENT ON VIEW production.vw_v2_officer_arroyo IS 'Per-officer rollup of the 2010–2022 Arroyo roster snapshots: tenure span, appointment (grade) date, latest residence city, race.';
