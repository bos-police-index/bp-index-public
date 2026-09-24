# BP-Index — Design Review Backlog

Source: reviewer feedback (design review, WokeWindows parity). Living doc — Claude
updates checkboxes as items ship. Tackle one epic per working session.

**Status legend:** `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked on a data source/decision

---

## Reference answers (resolved questions from the review)

- **RMS** = Records Management System (BPD's central case/records DB). "not in RMS" = the record wasn't found there. → relabel in plain language.
- **Detail "tracking #"** = the paid-detail assignment's unique id (`tracking_no`). → label "Detail tracking #".
- **"key"** = legacy `/data` explorer view artifact, not real data. → drop/relabel when that table is rebuilt.
- **Media reports** = we only have a live Google-News keyword embed, not curated media. Curated = new source.
- **Non-attributed traffic** = exists as `production.unresolved_traffic_officer_ids` (citations we couldn't match to an officer). Surface as a clearly-labeled non-attributed table.
- **Overtime breakdown** = data present (`police_overtime` + `overtime_category`); Court / Special Events / Extended Day / Replacement Duty splits should be derivable.
- **Race/gender** = only ~619 officers (MPTC academy data). Broad coverage needs another source.
- **Incident #** = `incident_number` exists in our incident data, but the section is hidden (sample-only; needs internal journal exports).

---

## Epic 1 — Officer profile redesign  ← STARTING HERE
Target section order (top → bottom), visualizations where possible (WokeWindows-style):

- [x] **Section order** set to review spec (existing sections)
- [~] **Black box:** POST ID + employee ID + "Data through {year}" added; Citations→MVCs. `# Incidents` tile pending (section hidden)
- [x] **Earnings ranking** — per-year rank / population / percentile ("#762 of 2,551 · top 30%")
- [x] **Court Overtime** section — 75,838 records / 1,881 officers (2020–2024), employee-id matched
- [x] **"Time period updated" box** — top-right "Data through {latest year}"
- [x] Sections placed & renamed: Internal Affairs Cases, POST, FIOs, Traffic Citations (MVC), Paid Details, Agency & Separation, Academy, News
- [!] **Special Events / Other Overtime** — no comprehensive non-court OT source (`police_overtime` is only a 999-row sample). Needs a full OT dataset.
- [!] **Rank per assignment** (Organization card) — the assignment/tskprof data has **no rank column**. Needs a source with per-assignment rank.
- [~] **Tenure** section built — start = academy graduation (MPTC proxy, ~619 officers, clearly labeled), end/status from separation records, else "Active". Full-coverage *start* still needs a BPD hire-date / POST appointment-date source.
- [!] **Officer Identity race + gender** — only ~619 officers (academy). Needs a broader source.
- [!] **Incidents** — hidden; needs a fuller officer-linked source (internal journal exports).
- [x] **Visualizations** — earnings pay-by-year bar chart (overtime portion highlighted) in the Earnings section

## Epic 2 — Shared officer-identity columns on every /data table
Every table leads with the same block, then table-specific fields:
`name (first/last) · Badge # · POST ID · Employee ID · Rank · Current unit`

- [x] Court Overtime
- [x] Crime Incident (also fix scroll — see Epic 5)
- [x] Detail
- [x] FIO (then Field Contact #, Contact Date, Address…; relabel "RMS")
- [x] Traffic Citations (MVC) (renamed from Traffic Stops; relabel "RMS")
- [x] Internal Affairs Cases (then IA #, …)
- [x] Boston Arrests — N/A: source has no officer key (left non-attributed)
- [x] Incident Reports (separate first/last name; then Incident #, Date, …)

## Epic 3 — Renames & consistent labels
- [x] "Traffic Stops" → **"Traffic Citations (MVC)"** (explorer table title; profile section already MVC)
- [x] "Officer Misconduct (IAs)" → **"Internal Affairs Cases"** (explorer + profile)
- [~] "RMS" — appears in DATA values ("not in RMS"), not column headers; no rename needed (it is Records Management System)
- [x] "tracking #" → "Detail Tracking Number" (detail table)

## Epic 2 — execution blueprint (from the 8-agent analysis workflow)
Shared source built: `production.v2_officer_identity_block` (bpi_id → officer_name, badge, POST id,
employee_id, rank, current_unit). Apply centrally (views + queries + config are shared):

**Per table — prepend identity block, then existing columns:**
- `detail_record` (join ok): prepend all 6; DROP dup plain cols nameId/badgeNo/empRank (but officerName MUST keep the profile-link + fixNameOrdering the old nameId had). relabel trackingNo → "Detail Tracking Number".
- `court_overtime` (join ok): prepend all 6; drop dup name/rank (preserve profile link on officerName).
- `crime_incident` (join ok): prepend all 6; relabel incidentNumber → "Incident #"; **remove the internal "key" column**; **fix horizontal scroll** (too-wide/among columns).
- `fio_record` (join ok): prepend all 6; keep existing contactOfficerName link; relabel any "RMS" → "Records Mgmt System (RMS)".
- `traffic_stop` (join ok): prepend all 6; relabel "RMS"; (title already "Traffic Citations (MVC)").
- `officer_misconduct` (join ok): prepend badge/POST/emp/rank/unit (officerName already present).
- `ir_fall_2025` (join ok): prepend badge/POST/emp/rank/unit (officerName already present); ensure first/last split + Incident # present.
- `boston_arrest`: **NOT joinable** — view has no officer key; leave as non-officer-attributed (label it).

**Mechanics:** (1) migration extends the 7 joinable views with the identity-block cols (skip a col if the view already has that exact name, e.g. ir_fall_2025 officer_name); (2) add the new fields to each `GET_NEXT_PAGE_*` query in queries.ts; (3) shared `identityColumns` GridColDef[] in createMUIGrid.tsx (officerName renderCell links to /profile/[bpiId], matching the existing pattern) prepended per table; (4) relabels + crime-incident scroll/key fix; (5) tsc + verify.
**Decisions for reviewer:** existing per-event `rank`/`empRank` may be *rank at time of event* — keep (relabel "Rank at …") vs. drop in favor of current officerRank? Default: drop (current rank in identity block); flag if point-in-time needed.

## Epic 2 notes (recon done)
Column config lives in `utility/createMUIGrid.tsx` (`functionMapping`, per-table `field:` arrays);
titles in `utility/tableDefinitions.tsx`. Explorer views vary in identity coverage:
`vw_court_overtime` already has badge_no/employee_id/rank; `vw_traffic_stops_fall_2025` has only
`officer_id` → needs a LEFT JOIN to `v2_officer_id_map` for badge/POST/rank/unit. So each of the 8
tables = (view join where missing) + prepend the standard identity columns in functionMapping.

## Epic 4 — New columns / data
- [ ] Overtime-type breakdown (Court / Special Events / Extended Day / Replacement Duty / Other)
- [x] Non-attributed traffic table (2020–25) — new "Traffic Citations (MVC) — Unattributed" explorer table (~36k citations, officer not matched)
- [ ] Incident # column on Incident Reports
- [ ] Media reports `[!]` needs a curated source (vs current Google-News embed)
- [ ] "Time period updated" box on the core spreadsheet (top-right)

## Epic 5 — Bugs
- [x] Crime Incident: verified horizontal scroll works; removed internal "key" column

## Epic 6 — Data-availability decisions (unblock the `[!]` items)
- [ ] Race/gender source for all officers (WokeWindows? another FOIA?)
- [ ] Officer start/hire date source (for Tenure)
- [ ] More IAD/incident narrative + incident-# sources (internal journal exports)
- [ ] Media-report curation approach

---

# Review round 2 (client notes, Sep 2026)

Phases 1–4 implemented on branch `feature/review-phases-1-4`. DB migrations `2026_09_23_1`…`_4`
are applied (additive: new views/functions + appended columns only).

**Defaults chosen pending client answers** (easy to change):
- Home default sort = **last name A–Z**, with a "Sort by" menu (Last name / Most IA cases /
  Highest total pay / Most data on file) and a one-line explanation of the current order.
- Year filter = **pick any number of years**; pay AND activity counts switch to those years
  (summed when several). No year picked = latest pay year on file + all-time counts.
- Multi-select = **both** several values per filter (OR) and several filters at once (AND).
- IA split = **one record per officer per case**, allegations + findings listed inside it;
  IA counts everywhere = distinct cases.
- Relative pay = compared with **sworn officers** paid the same year (civilian titles are
  compared with other civilian employees); measures = rank, percentile ("Top X%"), peer
  average/median, × average — for every pay category.

## Phase 1 — quick fixes
- [x] Profile opens at the top after picking an officer (reset the `#wrapper` scroller on navigation)
- [x] Remove "Boston" from Boston Arrests (last user-facing string was the table description)
- [x] Home export fixed: This page / All matching rows / Entire database (4,994 officers)
- [x] Record counts on every /data card and a "Records" box (+ "N match your filters") on each table page
- [x] Home ranking explained + real default sort (see defaults above)

## Phase 2 — years + filters
- [x] Home: filter by individual year(s) (replaces the "Active 2020–2025" chip, which never checked the range)
- [x] Year column on every /data table (Employees: Pay Year); Time Period box now computed from real years
- [x] Multi-select filters on home + all /data tables (server-side `explore_*` functions; year, text, number and date ranges)
- [x] /data dates no longer show one day early (date-only values were parsed as UTC)

## Phase 3 — IA records
- [x] One record per officer per case (profile, /data table, `/ia/[iaNumber]` lists every officer on the case)
- [x] /data IA table now full history (6,922 officer-case records, 1993–2025) instead of the 626-row 2022+ extract
- [x] #127: home, search and profile all count distinct cases (e.g. John Conway 15 allegations → 13 cases)

## Phase 4 — relative measures
- [x] Profile "Pay Compared with Other Officers": every pay category vs sworn peers that year (rank, Top X%, avg, median, × avg)
- [x] Earnings by Year "Rank vs. peers" (sworn/civilian instead of whole payroll)
- [x] Home: Pay Rank (Top X%) + vs. Avg columns, for the latest year or the selected year(s)

## Phase 5 — data pipelines + bulk export (not started)
- [ ] Pick a scheduler (n8n instance vs GitHub Actions cron) and restart the stalled jobs (POST last ran 2026-07-07)
- [ ] POST current agency for officers who left BPD (Officer Data CSV, match on MPTC ID; keep monthly snapshots)
- [ ] Arrests automation from the BPD Crime Hub API (append-only; the feed looks like a rolling window)
- [ ] Civilian Review Board case reports (Google Sheet → profile section + /data table; PDF automation with human review)
- [ ] Bulk download of the whole database + data dictionary (server-generated files; SCHEMA.md/glossary refresh)
