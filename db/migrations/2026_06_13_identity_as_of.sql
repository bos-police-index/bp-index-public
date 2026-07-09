-- Identity "as of" on the officer profile
-- ===========================================================================
-- Adds identity_confidence + roster_source + identity_as_of to
-- vw_v2_officer_profile so the identity card can show how current the officer's
-- info is. identity_as_of = the latest date the officer appears in a dated
-- roster/assignment source (tskprof assignment eff_date, responsive_records
-- as_of/eff_date, alpha_listing asof). Explains blank profiles (e.g. an officer
-- last seen in 2015 predates our pay/activity data windows). ~97% coverage.

CREATE OR REPLACE VIEW production.vw_v2_officer_profile AS
SELECT m.bpi_id, m.employee_id, m.mptc_id, m.badge_no, m.first_name, m.last_name, m.middle_name, m.canonical_name,
  (SELECT max(as_of) FROM production.v2_earnings_year      WHERE bpi_id = m.bpi_id) AS earnings_last_updated,
  (SELECT max(as_of) FROM production.v2_fio                WHERE bpi_id = m.bpi_id) AS fio_last_updated,
  (SELECT max(as_of) FROM production.v2_post_certification WHERE bpi_id = m.bpi_id) AS post_cert_last_updated,
  (SELECT max(as_of) FROM production.v2_post_decertification WHERE bpi_id = m.bpi_id) AS post_decert_last_updated,
  (SELECT max(as_of) FROM production.v2_officer_misconduct WHERE bpi_id = m.bpi_id) AS misconduct_last_updated,
  m.identity_confidence,
  m.roster_source,
  m.rank,
  m.hire_date,
  GREATEST(
    (SELECT MAX(a.eff_date)::date FROM production.vw_v2_officer_assignment a WHERE a.bpi_id = m.bpi_id),
    (SELECT MAX(COALESCE(r.as_of, r.eff_date))::date FROM production.raw_responsive_records r WHERE r.employee_id = m.employee_id),
    (SELECT MAX(al.asof)::date FROM production.raw_alpha_listing al WHERE al.employee_id = m.employee_id)
  ) AS identity_as_of
FROM production.v2_officer_id_map m;
