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

- [x] **Section order set to review spec** (existing sections). Tenure, split-overtime, Incidents still pending.
- [~] **Black box (summary header):** added POST ID + employee ID + renamed Citations→MVCs. Existing tiles: Pay, IA, FIO, Paid Details, MVCs. `# Incidents` tile pending (section hidden).
- [ ] **Tenure:** start date → end date, or current status (retired / active). `[!]` start date blocked — no hire-date source (hire_date empty); end can come from separation_date
- [ ] **Officer Identity:** add **race + gender** `[!]` only ~619 officers have it (academy) — needs source decision
- [ ] **Organization & Assignments:** add **rank per assignment** + flag when things changed
- [ ] **Internal Affairs Cases** (renamed from Officer Misconduct/IA)
- [ ] **POST Commission Status**
- [ ] **FIOs**
- [ ] **Incidents** `[!]` currently hidden — needs fuller officer-linked source
- [ ] **Traffic Citations (MVC)** (from WokeWindows if we lack it — we have it)
- [ ] **Earnings** — including **ranking vs other officers** (percentile)
- [ ] **Court Overtime** `[!]` new section — wire `police_overtime`/`overtime_category`
- [ ] **Special Events Overtime** `[!]` new section
- [ ] **Other Overtime** `[!]` new section
- [ ] **Paid Details**
- [ ] **Agency & Separation History** (built)
- [ ] **Academy & Trainings** (built)
- [ ] **News & Articles**
- [ ] **"Time period updated" box** (top-right) — coverage/as-of indicator
- [ ] Add **visualizations** per WokeWindows where sensible

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
- [ ] "Traffic Stops" → **"Traffic Citations (MVC)"** everywhere
- [ ] "Officer Misconduct / IA" → **"Internal Affairs Cases"**
- [ ] "RMS" → plain-language label ("Records Management System")
- [ ] "tracking #" → "Detail tracking #"

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
