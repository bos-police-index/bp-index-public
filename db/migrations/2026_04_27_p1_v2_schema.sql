-- =========================================================================
-- bp-index Phase 1 — Auto-fed canonical tables
-- Adds production.v2_* and production.raw_v2_* alongside existing tables.
-- Nothing existing is dropped or altered. Idempotent (IF NOT EXISTS).
-- =========================================================================

-- ----- Officer identity map -----------------------------------------------
CREATE TABLE IF NOT EXISTS production.v2_officer_id_map (
    bpi_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     integer,
    badge_no        integer,
    mptc_id         text,
    first_name      text,
    last_name       text,
    middle_name     text,
    canonical_name  text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS v2_officer_id_map_employee_id_uq
    ON production.v2_officer_id_map (employee_id) WHERE employee_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS v2_officer_id_map_mptc_id_uq
    ON production.v2_officer_id_map (mptc_id) WHERE mptc_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS v2_officer_id_map_canonical_name_idx
    ON production.v2_officer_id_map (canonical_name);
CREATE INDEX IF NOT EXISTS v2_officer_id_map_badge_no_idx
    ON production.v2_officer_id_map (badge_no);

-- ----- Earnings (per officer per year per source) -------------------------
CREATE TABLE IF NOT EXISTS production.v2_earnings_year (
    bpi_id        uuid NOT NULL REFERENCES production.v2_officer_id_map(bpi_id),
    year          integer NOT NULL,
    department_name text,
    title           text,
    regular_pay     numeric,
    retro_pay       numeric,
    other_pay       numeric,
    ot_pay          numeric,
    injured_pay     numeric,
    detail_pay      numeric,
    quinn_pay       numeric,
    total_pay       numeric,
    source          text NOT NULL,
    as_of           timestamptz NOT NULL,
    PRIMARY KEY (bpi_id, year, source)
);
CREATE INDEX IF NOT EXISTS v2_earnings_year_bpi_idx
    ON production.v2_earnings_year (bpi_id);

-- ----- FIO (field interrogation/observation) ------------------------------
CREATE TABLE IF NOT EXISTS production.v2_fio (
    fio_id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bpi_id           uuid REFERENCES production.v2_officer_id_map(bpi_id),
    fc_num           text,
    contact_date     timestamptz,
    location         text,
    frisked          boolean,
    vehicle_searched boolean,
    basis            text,
    circumstance     text,
    narrative        text,
    source           text NOT NULL,
    as_of            timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS v2_fio_bpi_idx ON production.v2_fio (bpi_id);
CREATE INDEX IF NOT EXISTS v2_fio_contact_date_idx ON production.v2_fio (contact_date);
CREATE UNIQUE INDEX IF NOT EXISTS v2_fio_fc_num_source_uq
    ON production.v2_fio (fc_num, source) WHERE fc_num IS NOT NULL;

-- ----- POST Commission certifications -------------------------------------
CREATE TABLE IF NOT EXISTS production.v2_post_certification (
    bpi_id          uuid REFERENCES production.v2_officer_id_map(bpi_id),
    mptc_id         text NOT NULL,
    certification   text,
    status          text,
    expiration      date,
    agency          text,
    additional_info text,
    source          text NOT NULL,
    as_of           timestamptz NOT NULL,
    PRIMARY KEY (mptc_id, source, as_of)
);
CREATE INDEX IF NOT EXISTS v2_post_certification_bpi_idx
    ON production.v2_post_certification (bpi_id);

-- ----- POST Commission decertifications -----------------------------------
CREATE TABLE IF NOT EXISTS production.v2_post_decertification (
    bpi_id              uuid REFERENCES production.v2_officer_id_map(bpi_id),
    mptc_id             text NOT NULL,
    decertification_date date,
    reason              text,
    agency              text,
    source              text NOT NULL,
    as_of               timestamptz NOT NULL,
    PRIMARY KEY (mptc_id, decertification_date, source)
);
CREATE INDEX IF NOT EXISTS v2_post_decertification_bpi_idx
    ON production.v2_post_decertification (bpi_id);

-- ----- Officer misconduct (statewide, from Mass.gov) ----------------------
CREATE TABLE IF NOT EXISTS production.v2_officer_misconduct (
    misconduct_id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bpi_id          uuid REFERENCES production.v2_officer_id_map(bpi_id),
    case_number     text,
    incident_type   text,
    allegation      text,
    finding         text,
    action_taken    text,
    received_date   date,
    completed_date  date,
    source          text NOT NULL,
    as_of           timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS v2_officer_misconduct_bpi_idx
    ON production.v2_officer_misconduct (bpi_id);
CREATE UNIQUE INDEX IF NOT EXISTS v2_officer_misconduct_case_source_uq
    ON production.v2_officer_misconduct (case_number, source) WHERE case_number IS NOT NULL;

-- ----- Crime incidents (officer-less, contextual) -------------------------
CREATE TABLE IF NOT EXISTS production.v2_crime_incident (
    incident_number  text NOT NULL,
    source           text NOT NULL,
    occurred_on_date timestamptz,
    district         text,
    offenses         text[],
    location_lat     numeric,
    location_lon     numeric,
    shooting         boolean,
    as_of            timestamptz NOT NULL,
    PRIMARY KEY (incident_number, source)
);
CREATE INDEX IF NOT EXISTS v2_crime_incident_district_idx
    ON production.v2_crime_incident (district);
CREATE INDEX IF NOT EXISTS v2_crime_incident_date_idx
    ON production.v2_crime_incident (occurred_on_date);

-- ----- Shootings ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS production.v2_shooting_report (
    shooting_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    occurred_on_date timestamptz,
    district         text,
    location_lat     numeric,
    location_lon     numeric,
    victims          integer,
    fatal            boolean,
    source           text NOT NULL,
    as_of            timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS v2_shooting_report_district_idx
    ON production.v2_shooting_report (district);
CREATE INDEX IF NOT EXISTS v2_shooting_report_date_idx
    ON production.v2_shooting_report (occurred_on_date);

-- ----- Police districts (geometry stored as GeoJSON; no PostGIS) ----------
CREATE TABLE IF NOT EXISTS production.v2_district (
    district_code text PRIMARY KEY,
    district_name text,
    geometry      jsonb,
    source        text NOT NULL,
    as_of         timestamptz NOT NULL
);

-- ----- News articles (P3 will populate; P1 has the table ready) -----------
CREATE TABLE IF NOT EXISTS production.v2_news_article (
    article_id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bpi_id             uuid REFERENCES production.v2_officer_id_map(bpi_id),
    title              text,
    url                text,
    source_publication text,
    published_at       timestamptz,
    excerpt            text,
    relevance_score    numeric,
    fetched_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS v2_news_article_bpi_idx
    ON production.v2_news_article (bpi_id);
CREATE UNIQUE INDEX IF NOT EXISTS v2_news_article_url_uq
    ON production.v2_news_article (url) WHERE url IS NOT NULL;

-- ----- Reconciliation review queue ----------------------------------------
CREATE TABLE IF NOT EXISTS production.v2_reconciliation_review (
    review_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_name      text,
    raw_row            jsonb,
    candidate_bpi_ids  uuid[],
    candidate_scores   numeric[],
    created_at         timestamptz NOT NULL DEFAULT now(),
    resolved_bpi_id    uuid,
    resolved_at        timestamptz,
    resolved_by        text
);
CREATE INDEX IF NOT EXISTS v2_reconciliation_review_unresolved_idx
    ON production.v2_reconciliation_review (created_at)
    WHERE resolved_bpi_id IS NULL;

-- ----- Pipeline observability ---------------------------------------------
CREATE TABLE IF NOT EXISTS production.v2_ingest_run (
    run_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_name text NOT NULL,
    started_at    timestamptz NOT NULL DEFAULT now(),
    finished_at   timestamptz,
    status        text NOT NULL,                -- 'running' | 'success' | 'fail' | 'partial'
    rows_in       integer,
    rows_out      integer,
    error         text
);
CREATE INDEX IF NOT EXISTS v2_ingest_run_pipeline_idx
    ON production.v2_ingest_run (pipeline_name, started_at DESC);

-- =========================================================================
-- RAW LANDING TABLES — mirror source CSV columns 1:1, no transformations.
-- Each ingester truncates+loads its raw table on every run.
-- =========================================================================

CREATE TABLE IF NOT EXISTS production.raw_v2_post_certified (
    raw_id              bigserial PRIMARY KEY,
    officer             text,
    mptc_id             text,
    certification       text,
    status              text,
    law_enforcement_agency text,
    expiration          text,
    additional_information text,
    ingest_run_id       uuid,
    ingested_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS production.raw_v2_post_decertified (
    raw_id              bigserial PRIMARY KEY,
    officer             text,
    mptc_id             text,
    decertification_date text,
    reason              text,
    agency              text,
    ingest_run_id       uuid,
    ingested_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS production.raw_v2_officer_misconduct (
    raw_id          bigserial PRIMARY KEY,
    officer         text,
    mptc_id         text,
    case_number     text,
    incident_type   text,
    allegation      text,
    finding         text,
    action_taken    text,
    received_date   text,
    completed_date  text,
    agency          text,
    ingest_run_id   uuid,
    ingested_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS production.raw_v2_boston_earnings (
    raw_id          bigserial PRIMARY KEY,
    name            text,
    department_name text,
    title           text,
    regular         text,
    retro           text,
    other           text,
    overtime        text,
    injured         text,
    detail          text,
    quinn           text,
    total_earnings  text,
    postal          text,
    year            integer,
    source_filename text,
    ingest_run_id   uuid,
    ingested_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS production.raw_v2_boston_fio (
    raw_id              bigserial PRIMARY KEY,
    fc_num              text,
    contact_date        text,
    contact_officer_name text,
    supervisor_name     text,
    street              text,
    city                text,
    state               text,
    zip                 text,
    basis               text,
    circumstance        text,
    frisked             text,
    vehicle_searched    text,
    narrative           text,
    year                integer,
    source_filename     text,
    ingest_run_id       uuid,
    ingested_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS production.raw_v2_boston_incidents (
    raw_id              bigserial PRIMARY KEY,
    incident_number     text,
    offense_code        text,
    offense_description text,
    district            text,
    reporting_area      text,
    shooting            text,
    occurred_on_date    text,
    year                integer,
    month               integer,
    day_of_week         text,
    hour                integer,
    street              text,
    lat                 text,
    long                text,
    source_filename     text,
    ingest_run_id       uuid,
    ingested_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS production.raw_v2_boston_shootings (
    raw_id          bigserial PRIMARY KEY,
    incident_num    text,
    occurred_on_date text,
    district        text,
    lat             text,
    long            text,
    victims         text,
    fatal           text,
    source_filename text,
    ingest_run_id   uuid,
    ingested_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS production.raw_v2_personnel_roster (
    raw_id          bigserial PRIMARY KEY,
    employee_id     text,
    badge_no        text,
    last_name       text,
    first_name      text,
    middle_name     text,
    rank            text,
    organization    text,
    title           text,
    employment_date text,
    dob             text,
    residence_zip   text,
    source_filename text,
    ingest_run_id   uuid,
    ingested_at     timestamptz NOT NULL DEFAULT now()
);

-- =========================================================================
-- VIEWS — what PostGraphile exposes to the frontend
-- =========================================================================

CREATE OR REPLACE VIEW production.vw_v2_officer_profile AS
SELECT
    m.bpi_id,
    m.employee_id,
    m.mptc_id,
    m.badge_no,
    m.first_name,
    m.last_name,
    m.middle_name,
    m.canonical_name,
    (SELECT MAX(as_of) FROM production.v2_earnings_year       WHERE bpi_id = m.bpi_id) AS earnings_last_updated,
    (SELECT MAX(as_of) FROM production.v2_fio                 WHERE bpi_id = m.bpi_id) AS fio_last_updated,
    (SELECT MAX(as_of) FROM production.v2_post_certification  WHERE bpi_id = m.bpi_id) AS post_cert_last_updated,
    (SELECT MAX(as_of) FROM production.v2_post_decertification WHERE bpi_id = m.bpi_id) AS post_decert_last_updated,
    (SELECT MAX(as_of) FROM production.v2_officer_misconduct  WHERE bpi_id = m.bpi_id) AS misconduct_last_updated
FROM production.v2_officer_id_map m;

CREATE OR REPLACE VIEW production.vw_v2_earnings_by_year     AS SELECT * FROM production.v2_earnings_year;
CREATE OR REPLACE VIEW production.vw_v2_fio                  AS SELECT * FROM production.v2_fio;
CREATE OR REPLACE VIEW production.vw_v2_post_certification   AS SELECT * FROM production.v2_post_certification;
CREATE OR REPLACE VIEW production.vw_v2_post_decertification AS SELECT * FROM production.v2_post_decertification;
CREATE OR REPLACE VIEW production.vw_v2_officer_misconduct   AS SELECT * FROM production.v2_officer_misconduct;
CREATE OR REPLACE VIEW production.vw_v2_crime_incident       AS SELECT * FROM production.v2_crime_incident;
CREATE OR REPLACE VIEW production.vw_v2_shooting_report      AS SELECT * FROM production.v2_shooting_report;
CREATE OR REPLACE VIEW production.vw_v2_district             AS SELECT * FROM production.v2_district;
CREATE OR REPLACE VIEW production.vw_v2_news_article         AS SELECT * FROM production.v2_news_article;

-- =========================================================================
-- IDENTITY BACKFILL — seed v2_officer_id_map from existing tables.
-- Safe to re-run: ON CONFLICT DO NOTHING preserves existing rows.
-- =========================================================================

-- 1) Pull from production.bpi_unique_id (already has bpi_id UUIDs)
INSERT INTO production.v2_officer_id_map
    (bpi_id, employee_id, badge_no, first_name, last_name, middle_name, canonical_name)
SELECT
    bpi_id,
    employee_id,
    badge_no,
    first_name,
    last_name,
    middle_name,
    LOWER(TRIM(COALESCE(last_name, '') || ',' || COALESCE(first_name, '')))
FROM production.bpi_unique_id
ON CONFLICT (bpi_id) DO NOTHING;

-- 2) Fill in employees that exist in production.employee but not yet mapped
INSERT INTO production.v2_officer_id_map
    (employee_id, badge_no, first_name, last_name, middle_name, canonical_name)
SELECT
    e.employee_id,
    e.badge_no,
    e.first_name,
    e.last_name,
    e.name_mi,
    LOWER(TRIM(COALESCE(e.last_name, '') || ',' || COALESCE(e.first_name, '')))
FROM production.employee e
WHERE e.employee_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM production.v2_officer_id_map m WHERE m.employee_id = e.employee_id
  );
