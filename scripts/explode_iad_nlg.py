#!/usr/bin/env python3
"""
Explode the BPD IAD "National Lawyers Guild" complaints CSV into one row per
(officer, allegation) and emit a TSV ready for COPY into
production.raw_v2_iad_nlg.

Why this exists
---------------
The NLG extract is shaped one-row-per-IA-CASE, with multiple officers and
allegations packed into single cells, newline-separated. Unlike the older
employee_id-keyed extract, it carries NO employee_id — only name + rank. This
script normalizes it into flat officer-allegation rows so the SQL reconciler
(production.run_iad_from_nlg) can tie each row to an officer.

Column model (verified against the Dec-2025 file, 3,253 cases):
  Per-CASE (always single-valued):
    Inc: IA No, Inc: Incident type, Inc: Received date, Inc: Occurred date
  Per-OFFICER (parallel arrays, positionally aligned in 98.7% of cases):
    OffSnp: Title/rank, Off: First name, Off: Last name,
    Alg: Allegation, Alg: Finding, Act: Days/hours suspended
  NOT reliably aligned (sparse — only non-blank where an action occurred):
    Act: Action taken, Act: Action taken date
    -> attributed per-officer ONLY when the raw line count matches the officer
       count; otherwise left NULL per-officer and preserved whole in
       case_action_taken so nothing is lost.

Usage:
    python3 scripts/explode_iad_nlg.py <input.csv> <output.tsv>
"""
import csv
import re
import sys

# Canonical column headers in the source file.
C_IA = "Inc: IA No"
C_INCTYPE = "Inc: Incident type"
C_RECV = "Inc: Received date"
C_OCC = "Inc: Occurred date"
C_RANK = "OffSnp: Title/rank"
C_FIRST = "Off: First name"
C_LAST = "Off: Last name"
C_ALLEG = "Alg: Allegation"
C_FIND = "Alg: Finding"
C_DAYS = "Act: Days/hours suspended"
C_ACTION = "Act: Action taken"
C_ACTDATE = "Act: Action taken date"

# Finding normalization: collapse typos / case / trailing punctuation.
FINDING_MAP = {
    "sustained": "Sustained",
    "not sustained": "Not Sustained",
    "not sustianed": "Not Sustained",  # observed typo
    "unfounded": "Unfounded",
    "exonerated": "Exonerated",
    "filed": "Filed",
    "withdrawn": "Withdrawn",
    "sustained a": "Sustained A",
    "sustained b": "Sustained B",
    "pending": "Pending",
}


def raw_lines(v):
    """Split a cell into lines, KEEPING blank lines (positional alignment)."""
    return (v if v is not None else "").split("\n")


def clean(s):
    """Trim and squash internal tabs/newlines so the value is TSV-safe."""
    if s is None:
        return None
    s = s.replace("\t", " ").replace("\r", " ").replace("\n", " ").strip()
    return s or None


def norm_finding(v):
    if not v:
        return None
    k = " ".join(v.strip().rstrip(".").lower().split())
    return FINDING_MAP.get(k, v.strip().rstrip("."))


def iso_date(v):
    v = (v or "").strip()
    if not v:
        return None
    m = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{2,4})$", v)
    if m:
        mm, dd, yy = m.groups()
        if len(yy) == 2:
            yy = ("19" if int(yy) > 50 else "20") + yy
        try:
            return f"{int(yy):04d}-{int(mm):02d}-{int(dd):02d}"
        except ValueError:
            return None
    if re.match(r"^\d{4}-\d{2}-\d{2}", v):
        return v[:10]
    return None


def tsv(val):
    """Render a value for COPY: None -> \\N."""
    return r"\N" if val is None else str(val)


def main():
    if len(sys.argv) != 3:
        sys.exit("usage: explode_iad_nlg.py <input.csv> <output.tsv>")
    inp, outp = sys.argv[1], sys.argv[2]

    rows = list(csv.DictReader(open(inp, newline="", encoding="utf-8-sig")))
    out_cols = [
        "ia_no", "incident_type", "received_date", "occurred_date",
        "officer_seq", "title_rank", "first_name", "last_name",
        "allegation", "finding", "finding_raw", "action_taken",
        "days_suspended", "action_taken_date", "case_action_taken", "parse_flag",
    ]

    n_cases = 0
    n_rows = 0
    n_misaligned = 0
    with open(outp, "w", encoding="utf-8") as f:
        for r in rows:
            ia = clean(r.get(C_IA))
            if not ia:
                continue
            n_cases += 1
            inc = clean(r.get(C_INCTYPE))
            recv = iso_date(r.get(C_RECV))
            occ = iso_date(r.get(C_OCC))

            last = raw_lines(r.get(C_LAST))
            first = raw_lines(r.get(C_FIRST))
            rank = raw_lines(r.get(C_RANK))
            alleg = raw_lines(r.get(C_ALLEG))
            find = raw_lines(r.get(C_FIND))
            days = raw_lines(r.get(C_DAYS))
            action = raw_lines(r.get(C_ACTION))
            actdate = raw_lines(r.get(C_ACTDATE))

            n = len(last)  # last name is the officer-count anchor
            core_counts = {len(last), len(first), len(rank), len(alleg), len(find), len(days)}
            misaligned = len(core_counts) > 1
            if misaligned:
                n_misaligned += 1
            action_aligned = len(action) == n
            actdate_aligned = len(actdate) == n
            # Preserve the full case-level action text when we can't attribute it.
            case_action = "; ".join(a.strip() for a in action if a.strip()) or None

            def at(arr, i):
                return clean(arr[i]) if i < len(arr) else None

            for i in range(n):
                ln = at(last, i)
                fn = at(first, i)
                if not ln and not fn:
                    continue  # fully blank officer line = noise
                row = [
                    ia, inc, recv, occ,
                    i + 1,
                    at(rank, i), fn, ln,
                    at(alleg, i),
                    norm_finding(at(find, i)), at(find, i),
                    (at(action, i) if action_aligned else None),
                    at(days, i),
                    (iso_date(actdate[i]) if (actdate_aligned and i < len(actdate)) else None),
                    case_action,
                    ("misaligned" if misaligned else None),
                ]
                f.write("\t".join(tsv(v) for v in row) + "\n")
                n_rows += 1

    sys.stderr.write(
        f"cases={n_cases} officer_rows={n_rows} misaligned_cases={n_misaligned}\n"
        f"columns: {', '.join(out_cols)}\n"
    )


if __name__ == "__main__":
    main()
