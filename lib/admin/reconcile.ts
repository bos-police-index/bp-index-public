import { pool } from "@lib/auth/db";

export interface CandidateOfficer {
	bpi_id: string;
	employee_id: number | null;
	mptc_id: string | null;
	badge_no: number | null;
	first_name: string | null;
	last_name: string | null;
	middle_name: string | null;
	canonical_name: string | null;
	agency_at_post: string | null;
	earnings_rows: number;
	fio_rows: number;
	misconduct_rows: number;
	post_cert_rows: number;
}

export interface ReviewRow {
	review_id: string;
	canonical_name: string;
	reason: string;
	created_at: string;
	candidates: CandidateOfficer[];
}

/**
 * List pending review rows with their candidate officer details + per-candidate
 * data footprint, so the researcher can see what they're voting on.
 */
export async function listPendingReviews(limit = 25, offset = 0): Promise<{
	rows: ReviewRow[];
	total: number;
}> {
	const totalRes = await pool.query(
		`SELECT COUNT(*)::int AS n FROM production.vw_v2_reconciliation_pending`,
	);
	const total = totalRes.rows[0].n;

	const reviewsRes = await pool.query(
		`SELECT review_id, raw_row, candidate_bpi_ids, created_at
		   FROM production.vw_v2_reconciliation_pending
		   LIMIT $1 OFFSET $2`,
		[limit, offset],
	);

	if (reviewsRes.rows.length === 0) return { rows: [], total };

	const allCandidateIds = Array.from(
		new Set(reviewsRes.rows.flatMap((r) => r.candidate_bpi_ids ?? [])),
	);

	const candRes = await pool.query(
		`SELECT m.bpi_id, m.employee_id, m.mptc_id, m.badge_no,
		        m.first_name, m.last_name, m.middle_name, m.canonical_name,
		        m.agency_at_post,
		        (SELECT COUNT(*) FROM production.v2_earnings_year      WHERE bpi_id = m.bpi_id) AS earnings_rows,
		        (SELECT COUNT(*) FROM production.v2_fio                WHERE bpi_id = m.bpi_id) AS fio_rows,
		        (SELECT COUNT(*) FROM production.v2_officer_misconduct WHERE bpi_id = m.bpi_id) AS misconduct_rows,
		        (SELECT COUNT(*) FROM production.v2_post_certification WHERE bpi_id = m.bpi_id) AS post_cert_rows
		   FROM production.v2_officer_id_map m
		  WHERE m.bpi_id = ANY($1::uuid[])`,
		[allCandidateIds],
	);
	const candidatesById = new Map<string, CandidateOfficer>();
	for (const c of candRes.rows) {
		candidatesById.set(c.bpi_id, {
			bpi_id: c.bpi_id,
			employee_id: c.employee_id,
			mptc_id: c.mptc_id,
			badge_no: c.badge_no,
			first_name: c.first_name,
			last_name: c.last_name,
			middle_name: c.middle_name,
			canonical_name: c.canonical_name,
			agency_at_post: c.agency_at_post,
			earnings_rows: Number(c.earnings_rows),
			fio_rows: Number(c.fio_rows),
			misconduct_rows: Number(c.misconduct_rows),
			post_cert_rows: Number(c.post_cert_rows),
		});
	}

	const rows: ReviewRow[] = reviewsRes.rows.map((r) => ({
		review_id: r.review_id,
		canonical_name: r.raw_row?.canonical_name ?? "",
		reason: r.raw_row?.reason ?? "unknown",
		created_at: r.created_at.toISOString(),
		candidates: (r.candidate_bpi_ids ?? [])
			.map((id: string) => candidatesById.get(id))
			.filter(Boolean) as CandidateOfficer[],
	}));

	return { rows, total };
}

export type ResolveAction = "keep_separate" | "merge";

export async function resolveReview(opts: {
	review_id: string;
	action: ResolveAction;
	survivor?: string;
	duplicates?: string[];
	resolved_by: string;
}): Promise<{ ok: true; merged?: number } | { ok: false; error: string }> {
	const { review_id, action, survivor, duplicates, resolved_by } = opts;

	const reviewRes = await pool.query(
		`SELECT review_id, candidate_bpi_ids, resolved_at
		   FROM production.v2_reconciliation_review WHERE review_id = $1`,
		[review_id],
	);
	if (reviewRes.rows.length === 0) return { ok: false, error: "review_not_found" };
	const review = reviewRes.rows[0];
	if (review.resolved_at) return { ok: false, error: "already_resolved" };

	if (action === "keep_separate") {
		await pool.query(
			`UPDATE production.v2_reconciliation_review
			    SET resolved_at = now(),
			        resolved_by = $2,
			        resolution  = 'kept_separate'
			  WHERE review_id = $1`,
			[review_id, resolved_by],
		);
		return { ok: true };
	}

	// action === "merge"
	if (!survivor) return { ok: false, error: "merge_requires_survivor" };
	const candidateSet = new Set<string>(review.candidate_bpi_ids ?? []);
	if (!candidateSet.has(survivor)) return { ok: false, error: "survivor_not_in_candidates" };

	let dups: string[];
	if (duplicates && duplicates.length > 0) {
		// caller specified an explicit subset to merge in
		dups = duplicates.filter((d) => candidateSet.has(d) && d !== survivor);
	} else {
		// default: merge ALL other candidates into the survivor
		dups = Array.from(candidateSet).filter((id) => id !== survivor);
	}
	if (dups.length === 0) return { ok: false, error: "no_duplicates_to_merge" };

	const client = await pool.connect();
	try {
		await client.query("BEGIN");
		await client.query(`SELECT production.merge_officer_ids($1, $2::uuid[])`, [survivor, dups]);
		await client.query(
			`UPDATE production.v2_reconciliation_review
			    SET resolved_at = now(),
			        resolved_bpi_id = $2,
			        resolved_by = $3,
			        resolution = 'merged'
			  WHERE review_id = $1`,
			[review_id, survivor, resolved_by],
		);
		await client.query("COMMIT");
		return { ok: true, merged: dups.length };
	} catch (e: any) {
		await client.query("ROLLBACK").catch(() => {});
		return { ok: false, error: String(e?.message || e) };
	} finally {
		client.release();
	}
}
