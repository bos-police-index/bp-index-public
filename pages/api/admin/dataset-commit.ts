import type { NextApiRequest, NextApiResponse } from "next";
import { getAdminSession } from "@lib/auth/server";
import { getDataset } from "@lib/admin/upload-datasets";
import { parseFile, validateAgainstSchema, cellFor } from "@lib/admin/parse-upload";
import { readMultipart } from "@lib/admin/read-multipart";
import { pool } from "@lib/auth/db";

export const config = { api: { bodyParser: false } };

const BATCH = 5000;

/**
 * Validate the file against the dataset schema, TRUNCATE the raw table, bulk-load
 * the mapped columns (type-cast per the table's real column types), then run the
 * dataset's reconciler to rebuild the officer-facing v2 tables. All in one txn.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
	const session = await getAdminSession({ req, res });
	if (!session) return res.status(401).json({ error: "unauthorized" });

	let upload;
	try {
		upload = await readMultipart(req);
	} catch (e: any) {
		return res.status(400).json({ error: "upload_failed", detail: String(e?.message || e) });
	}

	const dataset = getDataset(upload.fields.dataset || "");
	if (!dataset) return res.status(400).json({ error: "unknown_dataset", detail: `dataset=${upload.fields.dataset}` });

	let parsed;
	try {
		parsed = parseFile(upload.buffer);
	} catch (e: any) {
		return res.status(400).json({ error: "parse_failed", detail: String(e?.message || e) });
	}

	const validation = validateAgainstSchema(dataset, parsed);
	if (!validation.ok) {
		return res.status(400).json({ error: "schema_mismatch", detail: `Missing required column(s): ${validation.missingRequired.join(", ")}`, validation });
	}
	if (parsed.rows.length === 0) {
		return res.status(400).json({ error: "no_rows", detail: "File parsed to 0 data rows." });
	}

	// Canonical columns actually supplied by the file (in registry order).
	const present = dataset.columns.filter((c) => validation.mapping[c.name]);
	const [, tableName] = dataset.rawTable.split(".");

	const client = await pool.connect();
	let runId: string | null = null;
	try {
		// Real column types so we cast text -> int/date where the table demands it.
		const typeRes = await client.query(
			`SELECT column_name, data_type FROM information_schema.columns
			  WHERE table_schema = 'production' AND table_name = $1`,
			[tableName],
		);
		const typeByCol = new Map<string, string>(typeRes.rows.map((r: any) => [r.column_name, r.data_type]));
		// Only load columns that both the file supplies AND the table actually has.
		const cols = present.filter((c) => typeByCol.has(c.name));
		if (cols.length === 0) throw new Error("No mappable columns match the target table.");

		const castExpr = (colName: string, i: number) => {
			const base = `NULLIF(btrim(u.c${i}), '')`;
			const t = typeByCol.get(colName) || "text";
			if (["integer", "bigint", "smallint"].includes(t)) return `${base}::bigint`;
			if (t === "date") return `${base}::date`;
			return base;
		};
		const fromArrays = cols.map((_, i) => `$${i + 1}::text[]`).join(", ");
		const fromAliases = cols.map((_, i) => `c${i}`).join(", ");
		const selectExprs = cols.map((c, i) => castExpr(c.name, i)).join(", ");
		const insertSql =
			`INSERT INTO ${dataset.rawTable} (${cols.map((c) => c.name).join(", ")}) ` +
			`SELECT ${selectExprs} FROM unnest(${fromArrays}) AS u(${fromAliases})`;

		await client.query("BEGIN");

		const runRes = await client.query(
			`INSERT INTO production.v2_ingest_run (pipeline_name, started_at, status, rows_in)
			 VALUES ($1, now(), 'running', $2) RETURNING run_id`,
			[`bpi_admin_upload_${dataset.key}`, parsed.rows.length],
		);
		runId = runRes.rows[0].run_id;

		await client.query(`TRUNCATE ${dataset.rawTable} RESTART IDENTITY`);

		let rowsInserted = 0;
		for (let start = 0; start < parsed.rows.length; start += BATCH) {
			const slice = parsed.rows.slice(start, start + BATCH);
			const arrays: (string | null)[][] = cols.map(() => []);
			for (const row of slice) {
				cols.forEach((c, i) => arrays[i].push(cellFor(row, validation.mapping[c.name])));
			}
			const ins = await client.query(insertSql, arrays);
			rowsInserted += ins.rowCount ?? 0;
		}

		// Rebuild the officer-facing v2 tables from the fresh raw data.
		const reconcile = await client.query(`SELECT * FROM ${dataset.reconciler}`);
		const summary = reconcile.rows[0] ?? {};

		await client.query(
			`UPDATE production.v2_ingest_run SET status='success', finished_at=now(), rows_out=$1, error=$2 WHERE run_id=$3`,
			[rowsInserted, `uploaded=${upload.filename}; reconcile=${JSON.stringify(summary)}`.slice(0, 500), runId],
		);
		await client.query("COMMIT");

		return res.status(200).json({
			runId,
			dataset: dataset.key,
			filename: upload.filename,
			rowsIn: parsed.rows.length,
			rowsInsertedRaw: rowsInserted,
			columnsLoaded: cols.map((c) => c.name),
			ignoredHeaders: validation.unmapped,
			reconcile: summary,
		});
	} catch (e: any) {
		await client.query("ROLLBACK").catch(() => {});
		if (runId) {
			await pool
				.query(`UPDATE production.v2_ingest_run SET status='fail', finished_at=now(), error=$1 WHERE run_id=$2`, [String(e?.message || e).slice(0, 500), runId])
				.catch(() => {});
		}
		return res.status(500).json({ error: "commit_failed", detail: String(e?.message || e) });
	} finally {
		client.release();
	}
}
