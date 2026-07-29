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
- [ ] **Visualizations** per WokeWindows (earnings-over-time, etc.) — design work, data-ready

## Epic 2 — Shared officer-identity columns on every /data table
Every table leads with the same block, then table-specific fields:
`name (first/last) · Badge # · POST ID · Employee ID · Rank · Current unit`

- [ ] Court Overtime
- [ ] Crime Incident (also fix scroll — see Epic 5)
- [ ] Detail
- [ ] FIO (then Field Contact #, Contact Date, Address…; relabel "RMS")
- [ ] Traffic Citations (MVC) (renamed from Traffic Stops; relabel "RMS")
- [ ] Internal Affairs Cases (then IA #, …)
- [ ] Boston Arrests (then Arrest #, …)
- [ ] Incident Reports (separate first/last name; then Incident #, Date, …)

## Epic 3 — Renames & consistent labels
- [x] "Traffic Stops" → **"Traffic Citations (MVC)"** (explorer table title; profile section already MVC)
- [x] "Officer Misconduct (IAs)" → **"Internal Affairs Cases"** (explorer + profile)
- [ ] "RMS" → plain-language label — needs the column relabel in `createMUIGrid.tsx` functionMapping
- [ ] "tracking #" → "Detail tracking #" — same

## Epic 2 notes (recon done)
Column config lives in `utility/createMUIGrid.tsx` (`functionMapping`, per-table `field:` arrays);
titles in `utility/tableDefinitions.tsx`. Explorer views vary in identity coverage:
`vw_court_overtime` already has badge_no/employee_id/rank; `vw_traffic_stops_fall_2025` has only
`officer_id` → needs a LEFT JOIN to `v2_officer_id_map` for badge/POST/rank/unit. So each of the 8
tables = (view join where missing) + prepend the standard identity columns in functionMapping.

## Epic 4 — New columns / data
- [ ] Overtime-type breakdown (Court / Special Events / Extended Day / Replacement Duty / Other)
- [ ] Non-attributed traffic table (2020–25) — clearly labeled; consolidate with officer listings if feasible
- [ ] Incident # column on Incident Reports
- [ ] Media reports `[!]` needs a curated source (vs current Google-News embed)
- [ ] "Time period updated" box on the core spreadsheet (top-right)

## Epic 5 — Bugs
- [ ] Crime Incident table: horizontal scroll broken (can't scroll right); audit other tables

## Epic 6 — Data-availability decisions (unblock the `[!]` items)
- [ ] Race/gender source for all officers (WokeWindows? another FOIA?)
- [ ] Officer start/hire date source (for Tenure)
- [ ] More IAD/incident narrative + incident-# sources (internal journal exports)
- [ ] Media-report curation approach
