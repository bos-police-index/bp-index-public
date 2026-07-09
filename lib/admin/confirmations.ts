import { pool } from "@lib/auth/db";

/**
 * Name-matched data awaiting an admin decision. Each row is an (officer, source)
 * pair whose data was matched by canonical name (earnings / NLG complaints /
 * POST) and not yet confirmed or rejected.
 */
export interface PendingConfirmation {
	bpi_id: string;
	source: string;
	kind: string;
	records: number;
	first_name: string | null;
	last_name: string | null;
	badge_no: number | null;
	identity_confidence: string | null;
}

export async function listPendingConfirmations(limit = 25, offset = 0): Promise<{
	rows: PendingConfirmation[];
	total: number;
}> {
	const totalRes = await pool.query(`SELECT COUNT(*)::int AS n FROM production.vw_v2_name_match_pending`);
	const res = await pool.query(
		`SELECT bpi_id, source, kind, records, first_name, last_name, badge_no, identity_confidence
		   FROM production.vw_v2_name_match_pending
		   LIMIT $1 OFFSET $2`,
		[limit, offset],
	);
	return {
		total: totalRes.rows[0].n,
		rows: res.rows.map((r) => ({ ...r, records: Number(r.records) })),
	};
}

export async function resolveConfirmation(opts: {
	bpi_id: string;
	source: string;
	decision: "confirmed" | "rejected";
	resolved_by: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
	const { bpi_id, source, decision, resolved_by } = opts;
	try {
		await pool.query(`SELECT production.resolve_name_match($1, $2, $3, $4)`, [bpi_id, source, decision, resolved_by]);
		return { ok: true };
	} catch (e: any) {
		return { ok: false, error: String(e?.message || e) };
	}
}
