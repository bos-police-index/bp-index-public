import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import { promises as fs } from "fs";
import { getAdminSession } from "@lib/auth/server";
import { parseIadXlsx } from "@lib/admin/iad-xlsx";
import { pool } from "@lib/auth/db";

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
	const session = await getAdminSession({ req, res });
	if (!session) return res.status(401).json({ error: "unauthorized" });

	let buffer: Buffer;
	let filename: string;
	try {
		const form = formidable({ maxFileSize: 50 * 1024 * 1024 });
		const [, files] = await form.parse(req);
		const f = Array.isArray(files.file) ? files.file[0] : files.file;
		if (!f) return res.status(400).json({ error: "no_file" });
		buffer = await fs.readFile(f.filepath);
		filename = f.originalFilename || "upload.xlsx";
		await fs.unlink(f.filepath).catch(() => {});
	} catch (e: any) {
		return res.status(400).json({ error: "upload_failed", detail: String(e?.message || e) });
	}

	let parsed;
	try {
		parsed = parseIadXlsx(buffer);
	} catch (e: any) {
		return res.status(400).json({ error: "parse_failed", detail: String(e?.message || e) });
	}
	const { rows } = parsed;
	if (rows.length === 0) {
		return res.status(400).json({ error: "no_rows", detail: "Parsed file contained 0 usable rows (need ia_no or employee_id on each)." });
	}

	const client = await pool.connect();
	let runId: string | null = null;
	let rowsOut = 0;
	try {
		await client.query("BEGIN");

		// Open the run log first so failures land somewhere visible.
		const runRes = await client.query(
			`INSERT INTO production.v2_ingest_run (pipeline_name, started_at, status, rows_in)
			 VALUES ('bpi_admin_upload_iad', now(), 'running', $1) RETURNING run_id`,
			[rows.length],
		);
		runId = runRes.rows[0].run_id;

		await client.query("TRUNCATE production.raw_employee_ia RESTART IDENTITY");

		// Bulk insert via UNNEST — fastest way to push many rows in one round-trip.
		const cols = [
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
		];
		const types = ["int8", "text", "text", "text", "text", "text", "text", "text", "text", "date", "text", "text"];
		const tuples: any[][] = cols.map(() => []);
		for (const r of rows) {
			tuples[0].push(r.employee_id);
			tuples[1].push(r.name_id);
			tuples[2].push(r.first_name);
			tuples[3].push(r.last_name);
			tuples[4].push(r.ia_no);
			tuples[5].push(r.finding);
			tuples[6].push(r.incident_type);
			tuples[7].push(r.allegation);
			tuples[8].push(r.action_taken);
			tuples[9].push(r.date_received);
			tuples[10].push(r.admin_leave);
			tuples[11].push(r.days_or_hours_suspended);
		}
		const placeholders = cols.map((_, i) => `$${i + 1}::${types[i]}[]`).join(", ");
		const unnest = cols.map((_, i) => `unnest($${i + 1}::${types[i]}[])`).join(", ");
		const ins = await client.query(
			`INSERT INTO production.raw_employee_ia (${cols.join(", ")})
			 SELECT ${unnest}`,
			tuples,
		);
		void placeholders; // (placeholders unused here; we used unnest pattern)
		rowsOut = ins.rowCount ?? 0;

		// Re-run the legacy->canonical reconcile so v2_officer_misconduct picks up the new data.
		const reconcile = await client.query(`SELECT * FROM production.run_misconduct_from_legacy()`);
		const reconciledOut = reconcile.rows[0]?.rows_out ?? null;

		await client.query(
			`UPDATE production.v2_ingest_run
			   SET status = 'success', finished_at = now(), rows_out = $1, error = $2
			 WHERE run_id = $3`,
			[reconciledOut ?? rowsOut, `uploaded=${filename}; canonical_rows=${reconciledOut}`, runId],
		);

		await client.query("COMMIT");
		return res.status(200).json({
			runId,
			rowsIn: rows.length,
			rowsInsertedRaw: rowsOut,
			rowsReconciledCanonical: reconciledOut,
			filename,
		});
	} catch (e: any) {
		await client.query("ROLLBACK").catch(() => {});
		if (runId) {
			await pool
				.query(
					`UPDATE production.v2_ingest_run SET status='fail', finished_at=now(), error=$1 WHERE run_id=$2`,
					[String(e?.message || e).slice(0, 500), runId],
				)
				.catch(() => {});
		}
		return res.status(500).json({ error: "commit_failed", detail: String(e?.message || e) });
	} finally {
		client.release();
	}
}
