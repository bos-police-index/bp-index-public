# n8n/workflows

Exported JSON of the bp-index ingest workflows running on `n8n-preaa-staging.sail.codes`.

These are checked in for version control. The live workflows on the n8n instance are the source of truth at runtime; these JSON files are the reviewable record of what's deployed.

## Importing a workflow into n8n

In the n8n UI: **Workflows → ⋮ → Import from File** and select the JSON.

Or via the API:

```sh
N8N_KEY=...   # the same key in .mcp.json / .cursor/mcp.json
curl -X POST -H "X-N8N-API-KEY: $N8N_KEY" \
     -H "Content-Type: application/json" \
     --data @bpi_ingest_post_certified.json \
     https://n8n-preaa-staging.sail.codes/api/v1/workflows
```

After import, attach the appropriate Postgres credential (`bp-index Railway Postgres`) to each Postgres node and activate.

## Workflows

| File | Purpose | Schedule | Source |
|---|---|---|---|
| `bpi_ingest_post_certified.json` | Loads MA POST Commission officer certification CSV into `production.raw_v2_post_certified` and `v2_post_certification`; reconciles into `v2_officer_id_map` by `mptc_id` | Daily 06:00 UTC | https://mapostcommission.gov/list-of-officer-status/ |
| `bpi_ingest_boston_earnings.json` | Loads Boston open-data Employee Earnings CSVs (filtered to BPD only) into `production.raw_v2_boston_earnings` and `v2_earnings_year`; reconciles into `v2_officer_id_map` by canonical_name. Capped to most recent N years (configurable in the Code node, default 3) — raise the cap to backfill earlier years. Requires the `production.parse_money()` helper from migration `2026_04_28_parse_money_helper.sql`. | Weekly Mon 03:00 UTC | https://data.boston.gov/dataset/employee-earnings-report (CKAN) |
| `bpi_reconcile_identity_merge.json` | Walks `v2_officer_id_map` for duplicate-canonical-name groups, merges those with no conflicting hard ids (employee_id / mptc_id / badge_no), and pushes the rest to `v2_reconciliation_review`. Wraps `production.run_identity_merge()` from migration `2026_04_28_identity_merge.sql`. Run after the ingesters so cross-source links (POST mptc_id × Boston employee_id) get folded onto a single `bpi_id`. | Daily 04:30 UTC | (no external source) |
| `bpi_ingest_boston_fio.json` | Loads BPD Field Interrogation & Observation CSVs (FieldContact tables only — the FieldContact_Name table contains civilian subjects, not officers) into `production.raw_v2_boston_fio` and `v2_fio`; reconciles by `contact_officer` (= `employee_id`) with canonical_name fallback. Capped to most recent N years (default 3). Multi-line-aware CSV parser (FIO narratives contain embedded newlines inside quoted cells, which a naive line-split would misalign). | Weekly Sun 04:00 UTC | https://data.boston.gov/dataset/boston-police-department-fio (CKAN) |
| `bpi_reconcile_misconduct_from_legacy.json` | Pipes the existing FOIA-loaded `production.raw_employee_ia` (BPD-internal IAD case data, ~8.6K allegation rows) into `production.v2_officer_misconduct` via the `production.run_misconduct_from_legacy()` SQL function. No external HTTP fetch. Re-fires daily so when the team uploads a refreshed `BPD COMPLAINTS - IAD CASES *.xlsx` (Phase 2 admin UI) the canonical view picks it up automatically. | Daily 05:30 UTC | (no external source — reads `production.raw_employee_ia`) |
