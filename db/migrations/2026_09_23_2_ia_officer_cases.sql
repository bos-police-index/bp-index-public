-- IA cases: one record per officer per case (review round 2: "Split each IA into a
-- single record for each officer"; also GitHub #127, home vs profile IA counts).
--
-- v2_officer_misconduct is one row per officer per ALLEGATION, so an officer with three
-- allegations in one case showed as three "IA cases" (e.g. John Conway: 15 rows, 13 cases),
-- and the /data table used a separate 2022+ extract (vw_employee_ia_fall_2025, 626 rows).
--
--   vw_v2_officer_ia_case  — one row per (officer, case) across all IA sources:
--     v2 misconduct (internal 1993–2021, NLG 2011–2024, IAD-2020 PDF; rejected name matches
--     hidden via vw_v2_officer_misconduct) + fall-2025 extract cases not already in v2
--     (25 officer-cases, 2022–2025). Allegations roll up into allegation_details (jsonb) plus
--     text summaries; `outcome` is the most serious finding on the case.
--     Unmatched rows (no bpi_id) stay separate per source officer name.
--   vw_explore_ia_cases / explore_ia_cases(filters) — the /data "Internal Affairs Cases" table.
-- Re-runnable.

CREATE OR REPLACE VIEW production.vw_v2_officer_ia_case AS
WITH alleg AS (
    SELECT mc.bpi_id, mc.case_number, mc.received_date, mc.completed_date, mc.occurred_date,
           mc.incident_type, mc.allegation, mc.finding, mc.action_taken, mc.disposition,
           mc.narrative, mc.source, mc.link_method, mc.confirmed,
           mc.officer_first_name, mc.officer_last_name, mc.officer_rank,
           NULL::text AS days_hours_suspended, mc.as_of,
           CASE WHEN mc.bpi_id IS NULL
                THEN lower(coalesce(mc.officer_last_name, '') || ',' || coalesce(mc.officer_first_name, '')) END AS name_key
    FROM production.vw_v2_officer_misconduct mc
    UNION ALL
    SELECT f.bpi_id, f.ia_number, f.received_date, NULL::date, NULL::date,
           f.incident_type, f.allegation, f.finding, f.action_taken, NULL::text,
           NULL::text, 'bpd_iad_fall_2025', 'id', true,
           f.first_name, f.last_name, f.title_rank,
           NULLIF(btrim(f.days_hours_suspended), ''), NULL::timestamptz,
           CASE WHEN f.bpi_id IS NULL
                THEN lower(coalesce(f.last_name, '') || ',' || coalesce(f.first_name, '')) END
    FROM production.vw_employee_ia_fall_2025 f
    WHERE f.ia_number IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM production.v2_officer_misconduct m WHERE m.case_number = f.ia_number)
)
SELECT
    md5(a.case_number || '|' || coalesce(a.bpi_id::text, 'name:' || a.name_key)) AS ia_case_id,
    a.bpi_id,
    a.case_number,
    min(a.received_date) AS received_date,
    -- 2 fall-2025 cases have no received date; fall back to the year in "IAD2024-0045".
    coalesce(extract(year FROM min(a.received_date))::int,
             substring(a.case_number FROM '^IAD(\d{4})')::int) AS year,
    min(a.occurred_date) AS occurred_date,
    max(a.completed_date) AS completed_date,
    string_agg(DISTINCT a.incident_type, '; ') AS incident_type,
    count(*)::int AS num_allegations,
    (count(*) FILTER (WHERE a.finding ~* '^sustained'))::int AS num_sustained,
    CASE
        WHEN bool_or(a.finding ~* '^sustained')     THEN 'Sustained'
        WHEN bool_or(a.finding ~* 'pending')        THEN 'Pending'
        WHEN bool_or(a.finding ~* 'not sustained')  THEN 'Not Sustained'
        WHEN bool_or(a.finding ~* 'unfounded')      THEN 'Unfounded'
        WHEN bool_or(a.finding ~* 'exonerated')     THEN 'Exonerated'
        WHEN bool_or(a.finding ~* 'filed|withdraw') THEN 'Filed/Withdrawn'
    END AS outcome,
    string_agg(DISTINCT a.allegation, '; ') AS allegations,
    string_agg(DISTINCT a.finding, '; ') AS findings,
    string_agg(DISTINCT a.action_taken, '; ') AS actions_taken,
    string_agg(DISTINCT a.days_hours_suspended, '; ') AS days_hours_suspended,
    max(a.disposition) AS disposition,
    max(a.narrative) AS narrative,
    jsonb_agg(jsonb_build_object(
        'allegation', a.allegation, 'finding', a.finding, 'actionTaken', a.action_taken,
        'daysHoursSuspended', a.days_hours_suspended, 'source', a.source)
        ORDER BY a.allegation, a.finding) AS allegation_details,
    string_agg(DISTINCT a.source, ', ') AS sources,
    CASE WHEN bool_or(a.link_method = 'id') THEN 'id' ELSE 'name' END AS link_method,
    coalesce(bool_and(a.confirmed), false) AS confirmed,
    max(a.officer_first_name) AS officer_first_name,
    max(a.officer_last_name) AS officer_last_name,
    max(a.officer_rank) AS officer_rank,
    max(a.as_of) AS as_of
FROM alleg a
GROUP BY a.case_number, a.bpi_id, a.name_key;

COMMENT ON VIEW production.vw_v2_officer_ia_case IS
    'One row per officer per IA case (allegations rolled up). Profile IA section, home IA counts, /data IA table.';

CREATE OR REPLACE VIEW production.vw_explore_ia_cases AS
SELECT
    c.ia_case_id,
    c.bpi_id,
    coalesce(ib.officer_name, NULLIF(btrim(concat_ws(' ', c.officer_first_name, c.officer_last_name)), '')) AS officer_name,
    ib.officer_badge_no,
    ib.officer_post_id,
    ib.officer_employee_id,
    ib.officer_rank,
    ib.officer_current_unit,
    c.case_number AS ia_number,
    c.received_date,
    c.year,
    c.incident_type,
    c.num_allegations,
    c.allegations,
    c.outcome,
    c.findings,
    c.num_sustained,
    c.actions_taken,
    c.days_hours_suspended,
    c.completed_date,
    CASE WHEN c.bpi_id IS NULL THEN 'Not matched to an officer'
         WHEN c.link_method = 'name' THEN 'Matched by name'
         ELSE 'Matched by employee ID' END AS officer_match,
    c.sources AS source,
    -- Sort key: received date, else Jan 1 of the case year (so undated cases don't sort first).
    coalesce(c.received_date, make_date(c.year, 1, 1)) AS sort_date
FROM production.vw_v2_officer_ia_case c
LEFT JOIN production.v2_officer_identity_block ib ON ib.bpi_id = c.bpi_id;

SELECT production.explore_build('vw_explore_ia_cases', 'explore_ia_cases',
    'Internal Affairs cases, one row per officer per case (filterable).');
