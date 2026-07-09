import type { InferGetServerSidePropsType } from "next";
import AdminLayout from "@components/admin/AdminLayout";
import { withAdmin } from "@lib/auth/server";
import { pool } from "@lib/auth/db";

export const getServerSideProps = withAdmin(async (_ctx, session) => {
	// Pull the last successful run per pipeline + overall sitewide stats.
	const runsRes = await pool.query(`
		SELECT DISTINCT ON (pipeline_name)
			pipeline_name, status, rows_in, rows_out, finished_at
		FROM production.v2_ingest_run
		ORDER BY pipeline_name, started_at DESC
	`);
	const statsRes = await pool.query(`
		SELECT
			(SELECT COUNT(*) FROM production.v2_officer_id_map) AS officers_total,
			(SELECT COUNT(*) FROM production.v2_officer_id_map WHERE employee_id IS NOT NULL AND mptc_id IS NOT NULL) AS officers_both_ids,
			(SELECT COUNT(*) FROM production.v2_earnings_year WHERE source = 'boston_open_data') AS earnings_rows,
			(SELECT COUNT(*) FROM production.v2_fio WHERE source = 'boston_fio') AS fio_rows,
			(SELECT COUNT(*) FROM production.v2_officer_misconduct WHERE source = 'bpd_iad_internal') AS misconduct_rows,
			(SELECT COUNT(*) FROM production.v2_post_certification) AS post_cert_rows,
			(SELECT COUNT(*) FROM production.v2_reconciliation_review WHERE resolved_bpi_id IS NULL) AS review_queue_size
	`);
	return {
		props: {
			userEmail: session!.user?.email ?? null,
			runs: runsRes.rows.map((r) => ({
				pipeline_name: r.pipeline_name,
				status: r.status,
				rows_in: r.rows_in,
				rows_out: r.rows_out,
				finished_at: r.finished_at ? new Date(r.finished_at).toISOString() : null,
			})),
			stats: {
				officers_total: Number(statsRes.rows[0].officers_total),
				officers_both_ids: Number(statsRes.rows[0].officers_both_ids),
				earnings_rows: Number(statsRes.rows[0].earnings_rows),
				fio_rows: Number(statsRes.rows[0].fio_rows),
				misconduct_rows: Number(statsRes.rows[0].misconduct_rows),
				post_cert_rows: Number(statsRes.rows[0].post_cert_rows),
				review_queue_size: Number(statsRes.rows[0].review_queue_size),
			},
		},
	};
});

export default function AdminHome({
	userEmail,
	runs,
	stats,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
	return (
		<AdminLayout current="home" userEmail={userEmail}>
			<h1 className="text-2xl font-bold text-gray-900">Pipeline overview</h1>
			<p className="text-sm text-gray-600 mt-1">
				The v2 ingest pipelines run on a schedule. Use the upload page to refresh FOIA-loaded data on demand.
			</p>

			<div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
				<Stat label="Officers tracked" value={stats.officers_total.toLocaleString()} />
				<Stat label="With both employee + MPTC IDs" value={stats.officers_both_ids.toLocaleString()} hint="cross-source merged" />
				<Stat label="POST certifications" value={stats.post_cert_rows.toLocaleString()} />
				<Stat label="Earnings rows" value={stats.earnings_rows.toLocaleString()} />
				<Stat label="FIO records" value={stats.fio_rows.toLocaleString()} />
				<Stat label="IA allegations" value={stats.misconduct_rows.toLocaleString()} />
			</div>

			{stats.review_queue_size > 0 && (
				<div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
					<div className="text-sm font-semibold text-amber-900">
						{stats.review_queue_size} duplicate-name groups in the reconcile review queue
					</div>
					<p className="mt-1 text-xs text-amber-800">
						These are canonical_name collisions where the auto-merge declined to fold (multiple distinct hard ids). The Reconcile queue UI is on the roadmap.
					</p>
				</div>
			)}

			<h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">Last run per pipeline</h2>
			<div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
				<table className="w-full text-sm">
					<thead className="bg-gray-50 border-b border-gray-200">
						<tr>
							<th className="text-left px-3 py-2 font-medium text-gray-700">Pipeline</th>
							<th className="text-left px-3 py-2 font-medium text-gray-700">Status</th>
							<th className="text-right px-3 py-2 font-medium text-gray-700">Rows in</th>
							<th className="text-right px-3 py-2 font-medium text-gray-700">Rows out</th>
							<th className="text-left px-3 py-2 font-medium text-gray-700">Finished</th>
						</tr>
					</thead>
					<tbody>
						{runs.length === 0 ? (
							<tr><td colSpan={5} className="px-3 py-6 text-center text-gray-500 italic">No runs logged yet.</td></tr>
						) : (
							runs.map((r) => (
								<tr key={r.pipeline_name} className="border-b border-gray-100 last:border-0">
									<td className="px-3 py-2 font-mono text-xs">{r.pipeline_name}</td>
									<td className="px-3 py-2">
										<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
											r.status === "success" ? "bg-green-100 text-green-800" :
											r.status === "fail" ? "bg-red-100 text-red-800" :
											"bg-gray-100 text-gray-800"
										}`}>{r.status}</span>
									</td>
									<td className="px-3 py-2 text-right tabular-nums">{r.rows_in?.toLocaleString() ?? "—"}</td>
									<td className="px-3 py-2 text-right tabular-nums">{r.rows_out?.toLocaleString() ?? "—"}</td>
									<td className="px-3 py-2 text-xs text-gray-600">{r.finished_at ? new Date(r.finished_at).toLocaleString() : "—"}</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</AdminLayout>
	);
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
	return (
		<div className="rounded-xl border border-gray-200 bg-white p-4">
			<div className="text-2xl font-bold text-gray-900 tabular-nums">{value}</div>
			<div className="text-xs font-medium text-gray-600 mt-1">{label}</div>
			{hint && <div className="text-[10px] text-gray-400 mt-0.5">{hint}</div>}
		</div>
	);
}
