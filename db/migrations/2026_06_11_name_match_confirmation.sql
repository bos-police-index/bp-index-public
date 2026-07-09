-- Name-match confidence + admin confirmation
-- ===========================================================================
-- Hard-matched data (employee_id: IA-internal, FIO, paid details, traffic) links
-- to officers confidently. Name-matched data (earnings, NLG complaints, POST)
-- links by canonical name and may be wrong. This lets the UI flag name-matched
-- data as "unconfirmed" and lets an admin confirm an officer's data per source.
--
-- No churn to the fact tables: "how did this link" (id vs name) is computed in
-- the views; admin confirmations live in one sticky table keyed by (bpi_id,
-- source), so they survive reconciler re-runs.

-- 1. Admin confirmations (presence = confirmed for that officer + data source).
CREATE TABLE IF NOT EXISTS production.v2_name_match_confirmation (
    bpi_id      uuid NOT NULL REFERENCES production.v2_officer_id_map(bpi_id),
    source      text NOT NULL,          -- fact source string, e.g. 'boston_open_data'
    decision    text NOT NULL DEFAULT 'confirmed',   -- 'confirmed' | 'rejected'
    resolved_by text,
    resolved_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (bpi_id, source)
);
ALTER TABLE production.v2_name_match_confirmation ADD COLUMN IF NOT EXISTS decision text NOT NULL DEFAULT 'confirmed';

-- Confirm ('confirmed') or reject ('rejected') a name-matched (officer, source).
-- A rejection hides that officer's rows for the source from the views (sticky),
-- so a wrong attribution stays hidden even after the reconciler re-runs.
CREATE OR REPLACE FUNCTION production.resolve_name_match(p_bpi_id uuid, p_source text, p_decision text, p_by text)
RETURNS void AS $$
    INSERT INTO production.v2_name_match_confirmation (bpi_id, source, decision, resolved_by)
    VALUES (p_bpi_id, p_source, p_decision, p_by)
    ON CONFLICT (bpi_id, source) DO UPDATE SET decision = EXCLUDED.decision, resolved_by = EXCLUDED.resolved_by, resolved_at = now();
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION production.unconfirm_name_match(p_bpi_id uuid, p_source text)
RETURNS void AS $$
    DELETE FROM production.v2_name_match_confirmation WHERE bpi_id = p_bpi_id AND source = p_source;
$$ LANGUAGE SQL;

-- 2. Recreate the name-matchable fact views to expose:
--      link_method : 'id' (hard key) | 'name' (canonical-name match)
--      confirmed   : an admin has confirmed this (officer, source)
DROP VIEW IF EXISTS production.vw_v2_earnings_by_year;
CREATE VIEW production.vw_v2_earnings_by_year AS
SELECT e.bpi_id, e.year, e.department_name, e.title, e.regular_pay, e.retro_pay, e.other_pay,
       e.ot_pay, e.injured_pay, e.detail_pay, e.quinn_pay, e.total_pay, e.source, e.as_of,
       'name'::text AS link_method,
       EXISTS (SELECT 1 FROM production.v2_name_match_confirmation c WHERE c.bpi_id = e.bpi_id AND c.source = e.source AND c.decision='confirmed') AS confirmed
  FROM production.v2_earnings_year e
 WHERE NOT EXISTS (SELECT 1 FROM production.v2_name_match_confirmation c WHERE c.bpi_id = e.bpi_id AND c.source = e.source AND c.decision='rejected');

DROP VIEW IF EXISTS production.vw_v2_officer_misconduct;
CREATE VIEW production.vw_v2_officer_misconduct AS
SELECT mc.misconduct_id, mc.bpi_id, mc.case_number, mc.incident_type, mc.allegation, mc.finding,
       mc.action_taken, mc.received_date, mc.completed_date, mc.source, mc.as_of,
       mc.officer_first_name, mc.officer_last_name, mc.officer_rank, mc.officer_seq, mc.match_method,
       CASE WHEN mc.source = 'bpd_iad_internal' OR mc.match_method IN ('ia_backfill','tskprof_bridge')
            THEN 'id' ELSE 'name' END AS link_method,
       EXISTS (SELECT 1 FROM production.v2_name_match_confirmation c WHERE c.bpi_id = mc.bpi_id AND c.source = mc.source AND c.decision='confirmed') AS confirmed
  FROM production.v2_officer_misconduct mc
 WHERE NOT EXISTS (SELECT 1 FROM production.v2_name_match_confirmation c WHERE c.bpi_id = mc.bpi_id AND c.source = mc.source AND c.decision='rejected');

DROP VIEW IF EXISTS production.vw_v2_post_certification;
CREATE VIEW production.vw_v2_post_certification AS
SELECT p.bpi_id, p.mptc_id, p.certification, p.status, p.expiration, p.agency, p.additional_info, p.source, p.as_of,
       'name'::text AS link_method,
       EXISTS (SELECT 1 FROM production.v2_name_match_confirmation c WHERE c.bpi_id = p.bpi_id AND c.source = p.source AND c.decision='confirmed') AS confirmed
  FROM production.v2_post_certification p
 WHERE NOT EXISTS (SELECT 1 FROM production.v2_name_match_confirmation c WHERE c.bpi_id = p.bpi_id AND c.source = p.source AND c.decision='rejected');

-- 3. Admin queue: name-matched (officer, source) pairs not yet confirmed.
CREATE OR REPLACE VIEW production.vw_v2_name_match_pending AS
WITH nm AS (
    SELECT bpi_id, source, 'Earnings' AS kind, COUNT(*) AS records
      FROM production.v2_earnings_year WHERE bpi_id IS NOT NULL GROUP BY bpi_id, source
    UNION ALL
    SELECT bpi_id, source, 'Internal Affairs (complaint)', COUNT(*)
      FROM production.v2_officer_misconduct
     WHERE bpi_id IS NOT NULL AND source = 'bpd_iad_nlg_2025'
       AND (match_method IS NULL OR match_method NOT IN ('ia_backfill','tskprof_bridge'))
     GROUP BY bpi_id, source
    UNION ALL
    SELECT bpi_id, source, 'POST certification', COUNT(*)
      FROM production.v2_post_certification WHERE bpi_id IS NOT NULL GROUP BY bpi_id, source
)
SELECT nm.bpi_id, nm.source, nm.kind, nm.records,
       m.first_name, m.last_name, m.badge_no, m.identity_confidence
  FROM nm
  JOIN production.v2_officer_id_map m ON m.bpi_id = nm.bpi_id
 WHERE NOT EXISTS (SELECT 1 FROM production.v2_name_match_confirmation c WHERE c.bpi_id = nm.bpi_id AND c.source = nm.source)
 ORDER BY nm.records DESC;

COMMENT ON TABLE production.v2_name_match_confirmation IS
    'Admin confirmations that a name-matched (officer, data source) attribution is correct. '
    'Sticky across reconciler re-runs. Presence = confirmed.';
