import { GridColDef } from "@mui/x-data-grid";

/*
 * Shared filter model for DataTable (home roster, /data explorer, profile overlays).
 *
 * One entry per column (keyed by the grid field, camelCase). Different columns AND
 * together; values inside one column OR together:
 *   { rank: { in: ["Sergeant", "Lieutenant"] }, officerName: { contains: ["walsh"] }, year: { in: [2023] } }
 *
 * Client-side tables apply this in JS (applyClientFilters). Server-side tables send it to
 * the explore_<table>(filters jsonb) SQL functions (toServerFilters → snake_case keys),
 * see db/migrations/2026_09_23_1_explorer_filters.sql.
 */

export type FilterKind = "text" | "number" | "date" | "year";

export interface ColumnFilter {
	in?: (string | number)[];
	contains?: string[];
	gte?: string | number;
	lte?: string | number;
}

export type FilterState = Record<string, ColumnFilter>;

const YEAR_FIELDS = new Set(["year", "fy", "payYear"]);

/** Columns can opt in/out explicitly with `filterKind` (or `filterable: false`). */
export type FilterableColDef = GridColDef & { filterKind?: FilterKind | false };

export function filterKindOf(col: FilterableColDef): FilterKind | null {
	if (col.filterable === false || col.filterKind === false || col.field === "id") return null;
	if (col.filterKind) return col.filterKind;
	if (YEAR_FIELDS.has(col.field)) return "year";
	if (col.type === "number") return "number";
	if (col.type === "date" || col.type === "dateTime") return "date";
	return "text";
}

export function isFilterActive(f: ColumnFilter | undefined): boolean {
	if (!f) return false;
	return (
		(f.in?.length ?? 0) > 0 ||
		(f.contains?.length ?? 0) > 0 ||
		(f.gte !== undefined && f.gte !== "") ||
		(f.lte !== undefined && f.lte !== "")
	);
}

export function cleanFilters(state: FilterState): FilterState {
	const out: FilterState = {};
	for (const [field, f] of Object.entries(state)) {
		if (!isFilterActive(f)) continue;
		const c: ColumnFilter = {};
		if (f.in?.length) c.in = f.in;
		if (f.contains?.length) c.contains = f.contains;
		if (f.gte !== undefined && f.gte !== "") c.gte = f.gte;
		if (f.lte !== undefined && f.lte !== "") c.lte = f.lte;
		out[field] = c;
	}
	return out;
}

export const camelToSnake = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/([A-Z])([A-Z][a-z])/g, "$1_$2").toLowerCase();

/** Server filters: snake_case column keys, as the explore_* SQL functions expect. */
export function toServerFilters(state: FilterState): Record<string, ColumnFilter> {
	const out: Record<string, ColumnFilter> = {};
	for (const [field, f] of Object.entries(cleanFilters(state))) out[camelToSnake(field)] = f;
	return out;
}

/** Cell value used for filtering/export: the column's valueGetter if it has one, else row[field]. */
export function cellValue(row: any, col: GridColDef): any {
	if (col.valueGetter) {
		try {
			return (col.valueGetter as any)({ row, value: row?.[col.field], field: col.field, id: row?.id, colDef: col });
		} catch {
			return row?.[col.field];
		}
	}
	return row?.[col.field];
}

const dateKey = (v: any): string | null => {
	if (v == null || v === "") return null;
	if (v instanceof Date) return isNaN(v.getTime()) ? null : v.toISOString().slice(0, 10);
	const s = String(v);
	if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
	const d = new Date(s);
	return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

function matches(value: any, f: ColumnFilter, kind: FilterKind): boolean {
	if (kind === "number" || kind === "year") {
		const n = value == null || value === "" ? NaN : Number(value);
		if (f.in?.length && !f.in.some((x) => Number(x) === n)) return false;
		if (f.gte !== undefined && f.gte !== "" && !(n >= Number(f.gte))) return false;
		if (f.lte !== undefined && f.lte !== "" && !(n <= Number(f.lte))) return false;
		return true;
	}
	if (kind === "date") {
		const d = dateKey(value);
		if (f.gte && !(d && d >= String(f.gte))) return false;
		if (f.lte && !(d && d <= String(f.lte))) return false;
		return true;
	}
	const s = value == null ? "" : String(value);
	const hasIn = (f.in?.length ?? 0) > 0;
	const hasContains = (f.contains?.length ?? 0) > 0;
	if (!hasIn && !hasContains) return true;
	const lower = s.toLowerCase();
	return (hasIn && f.in.some((x) => String(x) === s)) || (hasContains && f.contains.some((x) => lower.includes(x.toLowerCase())));
}

export function applyClientFilters<T>(rows: T[], state: FilterState, cols: FilterableColDef[]): T[] {
	const active = Object.entries(cleanFilters(state))
		.map(([field, f]) => {
			const col = cols.find((c) => c.field === field);
			const kind = col ? filterKindOf(col) : null;
			return col && kind ? { col, kind, f } : null;
		})
		.filter(Boolean);
	if (active.length === 0) return rows;
	return rows.filter((row) => active.every(({ col, kind, f }) => matches(cellValue(row, col), f, kind)));
}

/** Distinct non-empty values of a column in loaded rows, most frequent first (for dropdowns). */
export function distinctValues(rows: any[], col: GridColDef, limit = 500): string[] {
	const counts = new Map<string, number>();
	for (const row of rows) {
		const v = cellValue(row, col);
		if (v == null || v === "") continue;
		const s = String(v);
		counts.set(s, (counts.get(s) ?? 0) + 1);
	}
	return Array.from(counts.entries())
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], undefined, { numeric: true }))
		.slice(0, limit)
		.map(([v]) => v);
}

export function describeFilter(f: ColumnFilter, kind: FilterKind): string {
	const parts: string[] = [];
	if (f.in?.length) parts.push(f.in.join(", "));
	if (f.contains?.length) parts.push(f.contains.map((c) => `contains “${c}”`).join(", "));
	const has = (v) => v !== undefined && v !== "";
	if (has(f.gte) && has(f.lte)) parts.push(`${f.gte} – ${f.lte}`);
	else if (has(f.gte)) parts.push(kind === "date" ? `from ${f.gte}` : `≥ ${f.gte}`);
	else if (has(f.lte)) parts.push(kind === "date" ? `until ${f.lte}` : `≤ ${f.lte}`);
	return parts.join(" or ");
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

const csvEscape = (v: any): string => {
	if (v == null) return "";
	const s = typeof v === "object" ? JSON.stringify(v) : String(v);
	return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * Build a CSV from rows using the columns' header names and cell values (skips `id`).
 * A column may define `exportValue(row)` when its raw value isn't what a reader should see.
 */
export function rowsToCsv(rows: any[], cols: GridColDef[]): string {
	const exportCols = cols.filter((c) => c.field !== "id" && c.field !== "__check__" && (c as any).disableExport !== true);
	const value = (row: any, c: GridColDef) => ((c as any).exportValue ? (c as any).exportValue(row) : cellValue(row, c));
	const lines = [exportCols.map((c) => csvEscape(c.headerName || c.field)).join(",")];
	for (const row of rows) lines.push(exportCols.map((c) => csvEscape(value(row, c))).join(","));
	return lines.join("\r\n");
}

export function downloadCsv(csv: string, fileName: string) {
	// BOM so Excel opens UTF-8 (names with accents) correctly.
	const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;
	link.style.display = "none";
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
