-- BPD IAD complaints — "National Lawyers Guild" extract (Updated December 2025)
-- ===========================================================================
-- A SECOND IAD extract, structurally different from the employee_id-keyed file
-- already loaded as source='bpd_iad_internal':
--   * spans 2011-2024 (vs 1993-2021 for the internal extract)
--   * carries NO employee_id — only officer name + rank
--   * one row per IA CASE, with multiple officers/allegations packed into
--     newline-separated cells (exploded out by scripts/explode_iad_nlg.py)
--
-- Why both: neither extract is a superset. Comparing by IA number:
--   2,044 shared · 1,762 only-internal (mostly pre-2011) · 1,209 only-NLG.
-- And within shared cases, the NLG file lists officers the internal extract
-- silently DROPPED (it could only keep officers it resolved to an employee_id),
-- including redacted "Unknown" officers and co-named officers on group
-- complaints. So the merge strategy is: keep the internal rows authoritative
-- where they exist, and ADD the officers/cases the NLG file uniquely contributes.
--
-- This migration is additive and re-runnable. It does NOT touch the internal
-- extract's rows.

-- ---------------------------------------------------------------------------
-- 1. v2_officer_misconduct: carry the officer's NAME + RANK on the row.
--    The table previously only had bpi_id. Because the NLG file has no
--    employee_id, a meaningful fraction of rows will be name-matched (or
--    unmatched). Storing the name/rank means an unlinked complaint is still
--    attributable and searchable, and even linked rows gain rank context.
-- ---------------------------------------------------------------------------
ALTER TABLE production.v2_officer_misconduct
    ADD COLUMN IF NOT EXISTS officer_first_name text,
    ADD COLUMN IF NOT EXISTS officer_last_name  text,
    ADD COLUMN IF NOT EXISTS officer_rank       text,
    ADD COLUMN IF NOT EXISTS officer_seq        integer,
    ADD COLUMN IF NOT EXISTS match_method       text;  -- how bpi_id was resolved

-- ---------------------------------------------------------------------------
-- 2. Raw landing table — mirrors the exploded TSV 1:1 (no transformation).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS production.raw_v2_iad_nlg (
    raw_id             bigserial PRIMARY KEY,
    ia_no              text,
    incident_type      text,
    received_date      date,
    occurred_date      date,
    officer_seq        integer,
    title_rank         text,
    first_name         text,
    last_name          text,
    allegation         text,
    finding            text,        -- normalized
    finding_raw        text,        -- original, for audit
    action_taken       text,        -- per-officer, only when positionally aligned
    days_suspended     text,
    action_taken_date  date,
    case_action_taken  text,        -- full case-level action text (when not attributable)
    parse_flag         text,        -- 'misaligned' on the 43 cases needing review
    source             text NOT NULL DEFAULT 'bpd_iad_nlg_2025',
    loaded_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS raw_v2_iad_nlg_ia_idx   ON production.raw_v2_iad_nlg (ia_no);
CREATE INDEX IF NOT EXISTS raw_v2_iad_nlg_name_idx ON production.raw_v2_iad_nlg (lower(last_name), lower(first_name));

-- ---------------------------------------------------------------------------
-- 3. Reconciler: pipe raw_v2_iad_nlg -> v2_officer_misconduct, tying each row
--    to an officer by the strongest available signal.
--
--    bpi_id resolution priority (per exploded row):
--      a) IA-backfill   — the internal extract already resolved this officer
--         (same ia_no + last name) to an employee_id; reuse its bpi_id.
--         Highest confidence: it's a hard-id link the team already trusts.
--      b) canonical-unique — canonicalize_name_parts(last, first) matches
--         EXACTLY ONE officer in v2_officer_id_map. (If a BPD and a non-BPD
--         officer share the name, that's 2 -> not unique -> no link, which is
--         the safe outcome.)
--      c) else NULL — left unlinked but NAMED. Not pushed into the identity-
--         merge reconcile queue: that queue answers "are these the same person",
--         not "which same-named officer does this complaint belong to", and a
--         merge there would wrongly fuse distinct officers.
--
--    Dedup / merge: skip any (ia_no, last name) already present for that case
--    from the internal extract — those rows have employee_id linkage and stay
--    authoritative. Everything else (dropped officers, 1,209 NLG-only cases,
--    2022-2024) is inserted.
--
--    Re-runnable: deletes its own source rows first; never touches other sources.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION production.run_iad_from_nlg()
RETURNS TABLE(
    rows_in      int,
    inserted     int,
    linked       int,
    unlinked     int,
    skipped_dupe int
) AS $$
DECLARE
    v_in    int;
    v_ins   int;
    v_link  int;
    v_unl   int;
    v_skip  int;
BEGIN
    SELECT COUNT(*) INTO v_in FROM production.raw_v2_iad_nlg;

    DELETE FROM production.v2_officer_misconduct WHERE source = 'bpd_iad_nlg_2025';

    WITH resolved AS (
        SELECT
            r.*,
            -- (a) IA-backfill from the internal employee_id-keyed extract
            ( SELECT m.bpi_id
                FROM production.raw_employee_ia o
                JOIN production.v2_officer_id_map m ON m.employee_id = o.employee_id
               WHERE o.ia_no = r.ia_no
                 AND lower(btrim(o.last_name)) = lower(btrim(r.last_name))
               LIMIT 1
            ) AS backfill_bpi,
            -- (b) canonical-unique match (only when exactly one officer has the name).
            --     array_agg + HAVING returns the single bpi_id, or no row (-> NULL)
            --     when zero or >1 distinct officers share the canonical name.
            ( SELECT (array_agg(DISTINCT m.bpi_id))[1]
                FROM production.v2_officer_id_map m
               WHERE m.canonical_name
                     = production.canonicalize_name_parts(r.last_name, r.first_name)
              HAVING COUNT(DISTINCT m.bpi_id) = 1
            ) AS canon_bpi
        FROM production.raw_v2_iad_nlg r
    ),
    tagged AS (
        SELECT
            res.*,
            COALESCE(res.backfill_bpi, res.canon_bpi) AS bpi_id,
            CASE
                WHEN res.backfill_bpi IS NOT NULL THEN 'ia_backfill'
                WHEN res.canon_bpi    IS NOT NULL THEN 'canonical_name'
                ELSE 'unmatched'
            END AS match_method
        FROM resolved res
    ),
    to_insert AS (
        SELECT t.*
        FROM tagged t
        WHERE NOT EXISTS (
            -- officer already recorded for this case by the internal extract
            SELECT 1
              FROM production.v2_officer_misconduct ex
              JOIN production.v2_officer_id_map em ON em.bpi_id = ex.bpi_id
             WHERE ex.case_number = t.ia_no
               AND ex.source = 'bpd_iad_internal'
               AND lower(btrim(em.last_name)) = lower(btrim(t.last_name))
        )
    ),
    ins AS (
        INSERT INTO production.v2_officer_misconduct
            (bpi_id, case_number, incident_type, allegation, finding, action_taken,
             received_date, completed_date, source, as_of,
             officer_first_name, officer_last_name, officer_rank, officer_seq, match_method)
        SELECT
            t.bpi_id, t.ia_no, t.incident_type, t.allegation, t.finding,
            COALESCE(t.action_taken, t.case_action_taken),
            t.received_date, t.action_taken_date,
            'bpd_iad_nlg_2025', now(),
            t.first_name, t.last_name, t.title_rank, t.officer_seq, t.match_method
        FROM to_insert t
        RETURNING bpi_id
    )
    SELECT
        COUNT(*)::int,
        COUNT(*) FILTER (WHERE bpi_id IS NOT NULL)::int,
        COUNT(*) FILTER (WHERE bpi_id IS NULL)::int
      INTO v_ins, v_link, v_unl
      FROM ins;

    v_skip := v_in - v_ins;

    rows_in      := v_in;
    inserted     := v_ins;
    linked       := v_link;
    unlinked     := v_unl;
    skipped_dupe := v_skip;
    RETURN NEXT;
END
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION production.run_iad_from_nlg() IS
    'Pipes production.raw_v2_iad_nlg (NLG IAD extract, name-keyed) into v2_officer_misconduct. '
    'Links by IA-backfill then canonical-unique name; dedups against the bpd_iad_internal extract '
    'by (case, officer last name); leaves unmatched rows NAMED but unlinked. Re-runnable.';

-- ---------------------------------------------------------------------------
-- 4. Refresh the public view so PostGraphile re-introspects the new
--    officer_first_name / officer_last_name / officer_rank / match_method
--    columns. (The original view was created with SELECT *, which froze its
--    column list before these columns existed.) Additive — existing GraphQL
--    fields are unchanged; new optional fields appear alongside them.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW production.vw_v2_officer_misconduct AS
SELECT
    misconduct_id, bpi_id, case_number, incident_type, allegation, finding,
    action_taken, received_date, completed_date, source, as_of,
    officer_first_name, officer_last_name, officer_rank, officer_seq, match_method
FROM production.v2_officer_misconduct;
