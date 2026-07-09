-- SQL reconcilers for FIO + POST (so the admin upload can ingest them like the
-- other datasets). These mirror the logic that previously lived only in n8n.

-- FIO: contact_officer carries an embedded employee_id (hard key); fall back to
-- canonical name. Dedup on fc_num (the source-row key) so one contact = one row.
CREATE OR REPLACE FUNCTION production.run_fio_from_raw()
RETURNS TABLE(rows_in int, attached int) AS $$
DECLARE v_in int; v_att int;
BEGIN
    SELECT COUNT(*) INTO v_in FROM production.raw_v2_boston_fio;
    DELETE FROM production.v2_fio WHERE source = 'boston_fio';

    INSERT INTO production.v2_fio
        (bpi_id, fc_num, contact_date, location, frisked, vehicle_searched, basis, circumstance, narrative, source, as_of)
    SELECT DISTINCT ON (s.fc_num)
        m.bpi_id, s.fc_num,
        CASE WHEN s.contact_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN s.contact_date::timestamptz ELSE NULL END,
        NULLIF(CONCAT_WS(', ', NULLIF(s.street,''), NULLIF(s.city,''), NULLIF(s.state,''), NULLIF(s.zip,'')), ''),
        NULL::boolean, NULL::boolean, s.basis, s.circumstance, s.contact_reason, 'boston_fio', now()
    FROM (
        SELECT *, CASE WHEN contact_officer IS NOT NULL
                        AND length(regexp_replace(contact_officer, '[^0-9]', '', 'g')) BETWEEN 1 AND 9
                       THEN regexp_replace(contact_officer, '[^0-9]', '', 'g')::int END AS emp_id
        FROM production.raw_v2_boston_fio
    ) s
    LEFT JOIN production.v2_officer_id_map m ON
        (m.employee_id IS NOT NULL AND s.emp_id IS NOT NULL AND m.employee_id = s.emp_id)
        OR (s.emp_id IS NULL AND s.contact_officer_name IS NOT NULL
            AND m.canonical_name = production.canonicalize_name(s.contact_officer_name))
    WHERE s.fc_num IS NOT NULL
    ORDER BY s.fc_num, (m.employee_id IS NOT NULL) DESC, m.created_at NULLS LAST;
    GET DIAGNOSTICS v_att = ROW_COUNT;

    rows_in := v_in; attached := v_att; RETURN NEXT;
END
$$ LANGUAGE plpgsql;

-- POST certification: keyed by mptc_id; link to a BPD roster officer only when
-- the officer name maps to exactly one roster officer (else bpi_id NULL = statewide reference).
CREATE OR REPLACE FUNCTION production.run_post_cert_from_raw()
RETURNS TABLE(rows_in int, cert_rows int, bpd_linked int) AS $$
DECLARE v_in int; v_cert int; v_bpd int;
BEGIN
    SELECT COUNT(*) INTO v_in FROM production.raw_v2_post_certified;
    DELETE FROM production.v2_post_certification WHERE source = 'mass_post_commission';

    INSERT INTO production.v2_post_certification
        (bpi_id, mptc_id, certification, status, expiration, agency, additional_info, source, as_of)
    SELECT DISTINCT ON (r.mptc_id)
        (SELECT (array_agg(m.bpi_id))[1] FROM production.v2_officer_id_map m
          WHERE m.canonical_name = production.canonicalize_name(r.officer)
          HAVING COUNT(DISTINCT m.bpi_id) = 1),
        r.mptc_id, r.certification, r.status,
        CASE WHEN r.expiration ~ '^[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}$' THEN to_date(r.expiration, 'FMMM/FMDD/YYYY') ELSE NULL END,
        r.law_enforcement_agency, r.additional_information, 'mass_post_commission', now()
    FROM production.raw_v2_post_certified r
    WHERE r.mptc_id IS NOT NULL AND r.mptc_id <> ''
    ORDER BY r.mptc_id;
    GET DIAGNOSTICS v_cert = ROW_COUNT;

    SELECT COUNT(*) INTO v_bpd FROM production.v2_post_certification WHERE source='mass_post_commission' AND bpi_id IS NOT NULL;
    rows_in := v_in; cert_rows := v_cert; bpd_linked := v_bpd; RETURN NEXT;
END
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION production.run_fio_from_raw() IS 'Rebuild v2_fio from raw_v2_boston_fio (employee_id hard-match, dedup fc_num). For admin upload.';
COMMENT ON FUNCTION production.run_post_cert_from_raw() IS 'Rebuild v2_post_certification from raw_v2_post_certified (mptc_id; name-link to BPD roster where unambiguous). For admin upload.';
