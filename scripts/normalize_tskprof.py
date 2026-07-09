#!/usr/bin/env python3
"""
Normalize the "by task profile ID 2010-2022" assignment CSV into a TSV ready for
COPY into production.raw_v2_tskprof_assignment.

Source columns: ID, Empl Record, Name, Workgroup, TskProfID, Descr, Eff Date
  ID        -> employee_id (the BPD officer identity; zero-padded in the file)
  Name      -> "Last,First M"  (split into last_name / first_name)
  TskProfID -> assignment/task-profile code (NOT an officer id; 155 distinct)
  Descr     -> unit/assignment description ("District 04", "A-1 Detective", ...)
  Eff Date  -> M/D/YYYY effective date of the assignment

One output row per assignment. This file is an officer's assignment HISTORY, so
the same employee_id appears many times with different TskProfIDs over 2010-2022.

Usage:
    python3 scripts/normalize_tskprof.py <input.csv> <output.tsv>
"""
import csv
import re
import sys


def clean(s):
    if s is None:
        return None
    s = s.replace("\t", " ").replace("\r", " ").replace("\n", " ").strip()
    return s or None


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


def split_name(name):
    """'Last,First M' -> (last, first). Splits on the FIRST comma only."""
    name = (name or "").strip()
    if not name:
        return None, None
    parts = name.split(",", 1)
    last = clean(parts[0])
    first = clean(parts[1]) if len(parts) > 1 else None
    return last, first


def tsv(v):
    return r"\N" if v is None else str(v)


def main():
    if len(sys.argv) != 3:
        sys.exit("usage: normalize_tskprof.py <input.csv> <output.tsv>")
    inp, outp = sys.argv[1], sys.argv[2]
    rows = list(csv.DictReader(open(inp, newline="", encoding="utf-8-sig")))

    out_cols = [
        "employee_id", "empl_record", "last_name", "first_name", "name_raw",
        "workgroup", "tskprof_id", "descr", "eff_date",
    ]
    n = 0
    skipped = 0
    with open(outp, "w", encoding="utf-8") as f:
        for r in rows:
            rid = (r.get("ID") or "").strip()
            if not rid or not rid.lstrip("0"):
                skipped += 1
                continue
            emp = int(rid)
            name_raw = clean(r.get("Name"))
            last, first = split_name(r.get("Name"))
            row = [
                emp,
                clean(r.get("Empl Record")),
                last, first, name_raw,
                clean(r.get("Workgroup")),
                clean(r.get("TskProfID")),
                clean(r.get("Descr")),
                iso_date(r.get("Eff Date")),
            ]
            f.write("\t".join(tsv(v) for v in row) + "\n")
            n += 1

    sys.stderr.write(f"assignments={n} skipped={skipped}\ncolumns: {', '.join(out_cols)}\n")


if __name__ == "__main__":
    main()
