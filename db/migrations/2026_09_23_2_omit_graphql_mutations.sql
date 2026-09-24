-- Hide every write function in `production` from the public GraphQL API.
--
-- PostGraphile (dev-graphql.bpindex.org, unauthenticated, connected as the postgres
-- superuser) exposes each VOLATILE function in the `production` schema as a GraphQL
-- mutation. Before this migration anyone could call mergeOfficerIds, resolveNameMatch
-- (reject = hide an officer's records), resolveEarningsReview, or re-run any reconciler
-- (runIdentityMerge, buildOfficerRoster, run*From*, ...) — 22 mutations in total.
--
-- Nothing on the frontend calls these through GraphQL: the admin UI reaches them through
-- the session-checked /api/admin/* routes over a direct pg connection (lib/admin/*), and
-- the n8n reconcile workflows use Postgres nodes. So they are all omitted here.
--
-- This is a sweep, not a hard-coded list: every VOLATILE, non-trigger function in
-- `production` whose comment does not already lead with an @omit tag gets `@omit`
-- prepended; the existing comment text is kept as the description below the tag.
-- Re-running it hides any VOLATILE function added since (see README "GraphQL exposure").
--
-- Tables/views: no create/update/delete mutations are exposed (default CRUD mutations are
-- disabled on the PostGraphile server; no table carries smart tags), so they're untouched.
-- Re-runnable.

DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT format('%I.%I(%s)', n.nspname, p.proname,
                      pg_get_function_identity_arguments(p.oid)) AS sig,
               obj_description(p.oid, 'pg_proc') AS cmt
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'production'
          AND p.prokind = 'f'
          AND p.provolatile = 'v'
          AND p.prorettype <> 'trigger'::regtype
          -- already hidden: @omit in the leading smart-tag block
          AND coalesce(obj_description(p.oid, 'pg_proc'), '') !~ '^(@[^\n]*\n)*@omit(\s|$)'
        ORDER BY p.proname
    LOOP
        EXECUTE format('COMMENT ON FUNCTION %s IS %L', r.sig,
                       '@omit' || coalesce(E'\n' || nullif(r.cmt, ''), ''));
        RAISE NOTICE 'omitted from GraphQL: %', r.sig;
    END LOOP;
END
$$;
