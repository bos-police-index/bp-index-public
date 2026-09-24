-- Hide admin identities, and the admin review tables that hold them, from the public GraphQL API.
--
-- PostGraphile (dev-graphql.bpindex.org, unauthenticated, connected as the postgres
-- superuser) exposes every column of every table/view in `production` for reading. The
-- admin resolve routes (/api/admin/{reconcile,confirmations,earnings-review}-resolve)
-- write the signed-in researcher's email into `resolved_by`, so anyone could list admin
-- emails via allV2ReconciliationReviews, allV2NameMatchConfirmations,
-- allVwV2ReconciliationPendings, or V2OfficerIdMap.v2NameMatchConfirmationsByBpiId.
--
-- `resolved_by` is the only place admin/auth identity enters `production` (the `auth`
-- schema is not introspected; uploads record no uploader). The *_by columns on the
-- detail-record tables/views are BPD FOIA fields, not site admins, and are left alone.
--
-- Nothing on the frontend reads these through GraphQL: the admin UI reads them through
-- lib/admin/* over a direct pg connection, and the public views only derive a
-- `confirmed`/hidden flag from v2_name_match_confirmation (no resolved_by). So:
--   1. every `resolved_by` column in `production` gets `@omit` (a sweep, so a re-run also
--      catches any resolved_by column added later), and
--   2. the three relations that record admin decisions are omitted outright. The
--      column-level tags stay as a backstop if a table is ever un-omitted.
-- vw_v2_name_match_pending / vw_v2_earnings_review_pending carry no admin data and stay.
--
-- `@omit` goes at the start of the comment; any existing comment is kept as the
-- description below it. Something counts as already hidden only when its leading
-- smart-tag block has a bare `@omit` line (a partial `@omit create,update` still exposes
-- reads). Comments only, no data changes. Re-runnable.

DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT format('%I.%I.%I', n.nspname, c.relname, a.attname) AS col,
               col_description(c.oid, a.attnum) AS cmt
        FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'production'
          AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
          AND a.attnum > 0
          AND NOT a.attisdropped
          AND a.attname = 'resolved_by'
          AND coalesce(col_description(c.oid, a.attnum), '') !~ '^(@[^\n]*\n)*@omit(\n|$)'
        ORDER BY 1
    LOOP
        EXECUTE format('COMMENT ON COLUMN %s IS %L', r.col,
                       '@omit' || coalesce(E'\n' || nullif(r.cmt, ''), ''));
        RAISE NOTICE 'omitted from GraphQL: column %', r.col;
    END LOOP;

    FOR r IN
        SELECT format('%I.%I', n.nspname, c.relname) AS rel,
               CASE c.relkind WHEN 'v' THEN 'VIEW'
                              WHEN 'm' THEN 'MATERIALIZED VIEW'
                              ELSE 'TABLE' END AS kind,
               obj_description(c.oid, 'pg_class') AS cmt
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.oid IN (SELECT to_regclass(t) FROM unnest(ARRAY[
                  'production.v2_reconciliation_review',
                  'production.v2_name_match_confirmation',
                  'production.vw_v2_reconciliation_pending']) AS t)
          AND coalesce(obj_description(c.oid, 'pg_class'), '') !~ '^(@[^\n]*\n)*@omit(\n|$)'
        ORDER BY 1
    LOOP
        EXECUTE format('COMMENT ON %s %s IS %L', r.kind, r.rel,
                       '@omit' || coalesce(E'\n' || nullif(r.cmt, ''), ''));
        RAISE NOTICE 'omitted from GraphQL: % %', lower(r.kind), r.rel;
    END LOOP;
END
$$;
