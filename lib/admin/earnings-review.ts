import { pool } from "@lib/auth/db";

/**
 * Triage for earnings the auto-reconciler couldn't confidently attach
 * (run_earnings_from_boston holds same-name-ambiguous rows in
 * v2_reconciliation_review, pipeline 'earnings_ambiguous'). The researcher picks
 * which same-named officer a pay record belongs to; the decision is sticky —
 * run_earnings_from_boston() honors it on the weekly re-run.
 */

export interface EarningsCandidate {
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

export interface EarningsReviewRow {
	review_id: string;
	name: string;        // raw earnings name, e.g. "Doyle,Michael R"
	year: number | null;
	total_pay: number | null;
	reason: string;      // 'ambiguous' | 'no_officer'
	created_at: string;
	candidates: EarningsCandidate[];
}

export async function listPendingEarningsReviews(limit = 25, offset = 0): Promise<{
	rows: EarningsReviewRow[];
	total: number;
}> {
	const totalRes = await pool.query(
		`SELECT COUNT(*)::int AS n FROM production.vw_v2_earnings_review_pending`,
	);
	const total = totalRes.rows[0].n;

	const reviewsRes = await pool.query(
		`SELECT review_id, raw_row, candidate_bpi_ids, created_at
		   FROM production.vw_v2_earnings_review_pending
		   LIMIT $1 OFFSET $2`,
		[limit, offset],
	);
	if (reviewsRes.rows.length === 0) return { rows: [], total };

	const allCandidateIds = Array.from(
		new Set(reviewsRes.rows.flatMap((r) => r.candidate_bpi_ids ?? [])),
	);

	const candidatesById = new Map<string, EarningsCandidate>();
	if (allCandidateIds.length > 0) {
		const candRes = await pool.query(
			`SELECT m.bpi_id, m.employee_id, m.mptc_id, m.badge_no,
			        m.first_name, m.last_name, m.middle_name, m.canonical_name, m.agency_at_post,
			        (SELECT COUNT(*) FROM production.v2_earnings_year      WHERE bpi_id = m.bpi_id) AS earnings_rows,
			        (SELECT COUNT(*) FROM production.v2_fio                WHERE bpi_id = m.bpi_id) AS fio_rows,
			        (SELECT COUNT(*) FROM production.v2_officer_misconduct WHERE bpi_id = m.bpi_id) AS misconduct_rows,
			        (SELECT COUNT(*) FROM production.v2_post_certification WHERE bpi_id = m.bpi_id) AS post_cert_rows
			   FROM production.v2_officer_id_map m
			  WHERE m.bpi_id = ANY($1::uuid[])`,
			[allCandidateIds],
		);
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
	}

	const rows: EarningsReviewRow[] = reviewsRes.rows.map((r) => ({
		review_id: r.review_id,
		name: r.raw_row?.name ?? "",
		year: r.raw_row?.year != null ? Number(r.raw_row.year) : null,
		total_pay: r.raw_row?.total_pay != null ? Number(r.raw_row.total_pay) : null,
		reason: r.raw_row?.reason ?? "ambiguous",
		created_at: r.created_at.toISOString(),
		candidates: (r.candidate_bpi_ids ?? [])
			.map((id: string) => candidatesById.get(id))
			.filter(Boolean) as EarningsCandidate[],
	}));

	return { rows, total };
}

export async function resolveEarningsReview(opts: {
	review_id: string;
	bpi_id: string | null; // null = skip / unassign
	resolved_by: string;
}): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
	const { review_id, bpi_id, resolved_by } = opts;
	try {
		const res = await pool.query(
			`SELECT * FROM production.resolve_earnings_review($1, $2, $3)`,
			[review_id, bpi_id, resolved_by],
		);
		const row = res.rows[0];
		if (!row?.ok) return { ok: false, error: row?.message || "resolve_failed" };
		return { ok: true, message: row.message };
	} catch (e: any) {
		return { ok: false, error: String(e?.message || e) };
	}
}
