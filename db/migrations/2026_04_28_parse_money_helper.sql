-- Helper function for ingest pipelines: parse messy money strings.
-- Used by bpi_ingest_boston_earnings (and any future workflow that imports
-- payroll-style data) so the n8n SQL stays simple and consistent.
--
-- Behavior:
--   $1,234.56  -> 1234.56
--   (92.23)    -> -92.23     (accountant negative)
--   $(92.23)   -> -92.23     (accountant negative with currency prefix)
--   -500       -> -500
--   ''         -> NULL
--   NULL       -> NULL
--   '-'        -> NULL       (placeholder for missing)
--   anything not parseable -> NULL

CREATE OR REPLACE FUNCTION production.parse_money(v text) RETURNS numeric AS $$
DECLARE
    trimmed text;
    cleaned text;
BEGIN
    IF v IS NULL OR TRIM(v) = '' THEN
        RETURN NULL;
    END IF;
    -- strip leading currency symbols / whitespace before checking parens
    trimmed := REGEXP_REPLACE(v, '^[\$\s]+', '');
    cleaned := (CASE WHEN trimmed ~ '^\(.+\)$' THEN '-' ELSE '' END)
               || REGEXP_REPLACE(trimmed, '[^0-9.\-]', '', 'g');
    IF cleaned ~ '^-?[0-9]+(\.[0-9]+)?$' THEN
        RETURN cleaned::numeric;
    END IF;
    RETURN NULL;
END
$$ LANGUAGE plpgsql IMMUTABLE;
