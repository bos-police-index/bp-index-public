-- Canonical name normalization
--
-- Bug found: officers like Lawrence Welch were tracked as TWO separate bpi_id rows in
-- v2_officer_id_map because:
--   - migration backfill from production.bpi_unique_id used first_name="Lawrence"  -> canonical="welch,lawrence"
--   - POST/earnings ingest saw "Welch,Lawrence D"                                  -> canonical="welch,lawrence d"
-- The identity_merge driver couldn't fold them because the canonical_name strings differ.
--
-- Fix: a SQL helper that produces a stable canonical form by dropping anything after the
-- first space in the first-name part (so middle initials, suffixes like "Jr", and trailing
-- whitespace all collapse). Used by every ingester that touches v2_officer_id_map.
--
-- Limitation: compound first names like "Mary Ann" lose the "Ann". Acceptable tradeoff for
-- v1 — rare among BPD officers and would only cause incorrect merging if two people shared
-- the truncated name AND department, which the merge driver guards against by checking for
-- conflicting hard ids.

CREATE OR REPLACE FUNCTION production.canonicalize_name_parts(p_last text, p_first text)
RETURNS text AS $$
    SELECT NULLIF(
        LOWER(
            TRIM(COALESCE(p_last, ''))
            || ','
            || SPLIT_PART(TRIM(COALESCE(p_first, '')), ' ', 1)
        ),
        ','
    )
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION production.canonicalize_name(p_name text)
RETURNS text AS $$
    -- Accepts "Last, First M..." style strings; returns the canonical form.
    SELECT production.canonicalize_name_parts(
        TRIM(SPLIT_PART(p_name, ',', 1)),
        TRIM(SPLIT_PART(p_name, ',', 2))
    )
$$ LANGUAGE SQL IMMUTABLE;

-- Re-normalize every existing v2_officer_id_map row. After this update, identity_merge
-- will see duplicate canonical_names where the only difference was middle-initial format
-- and fold them together.
UPDATE production.v2_officer_id_map
SET canonical_name = production.canonicalize_name_parts(last_name, first_name)
WHERE canonical_name IS DISTINCT FROM production.canonicalize_name_parts(last_name, first_name);
