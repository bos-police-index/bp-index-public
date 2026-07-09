import * as XLSX from "xlsx";
import { UploadDataset, normalizeHeader } from "./upload-datasets";

/**
 * Generic file → rows parser for the schema-first admin upload. Handles CSV and
 * XLSX (first sheet). Rows are returned as objects keyed by the file's ORIGINAL
 * header text; header→canonical mapping is resolved separately against a dataset
 * schema so the same parser serves every dataset.
 */

export type ParsedFile = {
	sheetName: string;
	headers: string[];
	rows: Record<string, any>[];
};

export function parseFile(buffer: Buffer): ParsedFile {
	// XLSX.read auto-detects CSV vs XLSX from the buffer contents.
	const wb = XLSX.read(buffer, { type: "buffer", cellDates: false, raw: false });
	const sheetName = wb.SheetNames[0];
	if (!sheetName) throw new Error("File has no sheets/rows.");
	const sheet = wb.Sheets[sheetName];
	// defval:"" so every column key exists on every row (stable UNNEST arrays).
	const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "", raw: false });
	const headers = (XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, blankrows: false })[0] as any[])?.map((h) => String(h ?? "")) ?? [];
	return { sheetName, headers: headers.filter((h) => h.trim() !== ""), rows };
}

export type SchemaValidation = {
	/** canonical column name -> the file header that supplies it (or null if absent) */
	mapping: Record<string, string | null>;
	/** required canonical columns with no matching header */
	missingRequired: string[];
	/** file headers that don't map to any schema column (ignored on load) */
	unmapped: string[];
	rowCount: number;
	/** true when every required column is present */
	ok: boolean;
};

/**
 * Match the file's headers against a dataset schema. Matching is tolerant:
 * case/space/underscore-insensitive (via normalizeHeader).
 */
export function validateAgainstSchema(dataset: UploadDataset, parsed: ParsedFile): SchemaValidation {
	// normalized file header -> original header
	const fileByNorm = new Map<string, string>();
	for (const h of parsed.headers) fileByNorm.set(normalizeHeader(h), h);

	const mapping: Record<string, string | null> = {};
	const missingRequired: string[] = [];
	const usedNorm = new Set<string>();

	for (const col of dataset.columns) {
		const norm = normalizeHeader(col.name);
		const hit = fileByNorm.get(norm) ?? null;
		mapping[col.name] = hit;
		if (hit) usedNorm.add(norm);
		if (!hit && col.required) missingRequired.push(col.name);
	}

	const unmapped = parsed.headers.filter((h) => !usedNorm.has(normalizeHeader(h)));

	return {
		mapping,
		missingRequired,
		unmapped,
		rowCount: parsed.rows.length,
		ok: missingRequired.length === 0,
	};
}

/** Pull a value from a row by the file header a canonical column mapped to. */
export function cellFor(row: Record<string, any>, header: string | null): string | null {
	if (!header) return null;
	const v = row[header];
	if (v === undefined || v === null) return null;
	const s = String(v).trim();
	return s === "" ? null : s;
}
