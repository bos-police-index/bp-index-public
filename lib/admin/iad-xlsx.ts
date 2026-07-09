import * as XLSX from "xlsx";

/**
 * Parse an uploaded BPD IAD xlsx into normalized rows ready for
 * production.raw_employee_ia.
 *
 * Schema mapping (case-insensitive header lookup; tolerates spaces/underscores):
 *   employee_id, name_id, first_name, last_name, ia_no, finding,
 *   incident_type, allegation, action_taken, date_received,
 *   admin_leave, days_or_hours_suspended
 *
 * Returns: normalized rows + the detected header->canonical map + counts.
 */

export type IadRow = {
	employee_id: number | null;
	name_id: string | null;
	first_name: string | null;
	last_name: string | null;
	ia_no: string | null;
	finding: string | null;
	incident_type: string | null;
	allegation: string | null;
	action_taken: string | null;
	date_received: string | null; // ISO date or null
	admin_leave: string | null;
	days_or_hours_suspended: string | null;
};

const CANONICAL_FIELDS = [
	"employee_id",
	"name_id",
	"first_name",
	"last_name",
	"ia_no",
	"finding",
	"incident_type",
	"allegation",
	"action_taken",
	"date_received",
	"admin_leave",
	"days_or_hours_suspended",
] as const;
export type CanonicalField = (typeof CANONICAL_FIELDS)[number];

// Known header variants. The team's xlsx headers drift slightly between years —
// this list grows. Use lowercased+normalized form as key.
const HEADER_ALIASES: Record<string, CanonicalField> = {
	"employee id": "employee_id",
	"employee_id": "employee_id",
	"empid": "employee_id",
	"empno": "employee_id",
	"name id": "name_id",
	"name_id": "name_id",
	"name": "name_id",
	"first name": "first_name",
	"first_name": "first_name",
	"firstname": "first_name",
	"last name": "last_name",
	"last_name": "last_name",
	"lastname": "last_name",
	"ia no": "ia_no",
	"ia_no": "ia_no",
	"ia number": "ia_no",
	"ia_number": "ia_no",
	"finding": "finding",
	"disposition": "finding",
	"incident type": "incident_type",
	"incident_type": "incident_type",
	"type": "incident_type",
	"allegation": "allegation",
	"action taken": "action_taken",
	"action_taken": "action_taken",
	"date received": "date_received",
	"date_received": "date_received",
	"received": "date_received",
	"received date": "date_received",
	"admin leave": "admin_leave",
	"admin_leave": "admin_leave",
	"days or hours suspended": "days_or_hours_suspended",
	"days/hours suspended": "days_or_hours_suspended",
	"days_or_hours_suspended": "days_or_hours_suspended",
	"days hours suspended": "days_or_hours_suspended",
};

function normHeader(h: string): string {
	return String(h || "")
		.toLowerCase()
		.replace(/[ \s]+/g, " ")
		.replace(/[._\-]+/g, " ")
		.trim();
}

export interface DetectedMapping {
	sheetName: string;
	headers: string[];
	mapping: Partial<Record<CanonicalField, string>>; // canonical field -> source column name
	unmapped: string[]; // source columns we couldn't map
	missing: CanonicalField[]; // canonical fields not detected (informational; only ia_no is required)
}

export interface ParseResult {
	detection: DetectedMapping;
	rows: IadRow[];
	totalRows: number;
}

function parseDate(v: unknown): string | null {
	if (v == null || v === "") return null;
	if (typeof v === "number") {
		// xlsx serial date
		const d = XLSX.SSF.parse_date_code(v);
		if (!d) return null;
		return `${d.y.toString().padStart(4, "0")}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
	}
	const s = String(v).trim();
	if (!s) return null;
	// already ISO
	if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
	// MM/DD/YYYY or M/D/YY
	const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
	if (m) {
		const mm = m[1].padStart(2, "0");
		const dd = m[2].padStart(2, "0");
		let yyyy = m[3];
		if (yyyy.length === 2) yyyy = (parseInt(yyyy, 10) > 50 ? "19" : "20") + yyyy;
		return `${yyyy}-${mm}-${dd}`;
	}
	// fall back to Date parsing
	const t = Date.parse(s);
	if (!isNaN(t)) {
		const d = new Date(t);
		return d.toISOString().slice(0, 10);
	}
	return null;
}

function parseInt0(v: unknown): number | null {
	if (v == null || v === "") return null;
	const n = parseInt(String(v).replace(/[^0-9-]/g, ""), 10);
	return Number.isFinite(n) ? n : null;
}

function txt(v: unknown): string | null {
	if (v == null) return null;
	const s = String(v).trim();
	return s ? s : null;
}

export function parseIadXlsx(buffer: Buffer): ParseResult {
	const wb = XLSX.read(buffer, { type: "buffer", cellDates: false });
	const sheetName = wb.SheetNames[0];
	if (!sheetName) throw new Error("Workbook has no sheets");
	const ws = wb.Sheets[sheetName];
	// Use raw rows so we can inspect/normalize headers
	const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false });
	if (aoa.length < 2) throw new Error(`Sheet "${sheetName}" appears empty (need a header row + data)`);

	const headerRow = aoa[0].map((h) => String(h ?? ""));
	const mapping: Partial<Record<CanonicalField, string>> = {};
	const unmapped: string[] = [];
	headerRow.forEach((h) => {
		const key = HEADER_ALIASES[normHeader(h)];
		if (key && !mapping[key]) mapping[key] = h;
		else if (!key) unmapped.push(h);
	});
	const missing = CANONICAL_FIELDS.filter((f) => !mapping[f]);

	// Build a column-index lookup for each canonical field
	const colIdx: Partial<Record<CanonicalField, number>> = {};
	for (const [field, header] of Object.entries(mapping)) {
		const idx = headerRow.indexOf(header!);
		if (idx >= 0) colIdx[field as CanonicalField] = idx;
	}
	const get = (row: unknown[], field: CanonicalField): unknown => {
		const i = colIdx[field];
		return i == null ? null : row[i];
	};

	const rows: IadRow[] = [];
	for (let r = 1; r < aoa.length; r++) {
		const row = aoa[r];
		if (!Array.isArray(row) || row.every((c) => c == null || c === "")) continue;
		const out: IadRow = {
			employee_id: parseInt0(get(row, "employee_id")),
			name_id: txt(get(row, "name_id")),
			first_name: txt(get(row, "first_name")),
			last_name: txt(get(row, "last_name")),
			ia_no: txt(get(row, "ia_no")),
			finding: txt(get(row, "finding")),
			incident_type: txt(get(row, "incident_type")),
			allegation: txt(get(row, "allegation")),
			action_taken: txt(get(row, "action_taken")),
			date_received: parseDate(get(row, "date_received")),
			admin_leave: txt(get(row, "admin_leave")),
			days_or_hours_suspended: txt(get(row, "days_or_hours_suspended")),
		};
		// skip rows missing both ia_no and employee_id — those are just noise
		if (!out.ia_no && out.employee_id == null) continue;
		rows.push(out);
	}

	return {
		detection: { sheetName, headers: headerRow, mapping, unmapped, missing },
		rows,
		totalRows: rows.length,
	};
}
