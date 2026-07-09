import { useCallback, useEffect, useState } from "react";
import type { InferGetServerSidePropsType } from "next";
import AdminLayout from "@components/admin/AdminLayout";
import { withAdmin } from "@lib/auth/server";

export const getServerSideProps = withAdmin(async (_ctx, session) => {
	return { props: { userEmail: session!.user?.email ?? null } };
});

type Candidate = {
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
};

type ReviewRow = {
	review_id: string;
	name: string;
	year: number | null;
	total_pay: number | null;
	reason: string;
	created_at: string;
	candidates: Candidate[];
};

const PAGE_SIZE = 10;

const money = (n: number | null) =>
	n == null ? "—" : n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function EarningsReview({ userEmail }: InferGetServerSidePropsType<typeof getServerSideProps>) {
	const [rows, setRows] = useState<ReviewRow[]>([]);
	const [total, setTotal] = useState(0);
	const [offset, setOffset] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [acting, setActing] = useState<string | null>(null);
	const [picked, setPicked] = useState<Record<string, string>>({}); // review_id -> bpi_id

	const fetchPage = useCallback(async (newOffset = offset) => {
		setLoading(true); setError(null);
		try {
			const r = await fetch(`/api/admin/earnings-review-list?limit=${PAGE_SIZE}&offset=${newOffset}`);
			const j = await r.json();
			if (!r.ok) throw new Error(j.error || "load failed");
			setRows(j.rows); setTotal(j.total);
			// default pick = candidate with the most data attached (most likely the real officer)
			const picks: Record<string, string> = {};
			for (const row of j.rows as ReviewRow[]) {
				const best = [...row.candidates].sort((a, b) =>
					(b.earnings_rows + b.fio_rows + b.misconduct_rows + b.post_cert_rows) -
					(a.earnings_rows + a.fio_rows + a.misconduct_rows + a.post_cert_rows),
				)[0];
				if (best) picks[row.review_id] = best.bpi_id;
			}
			setPicked(picks);
		} catch (e: any) {
			setError(String(e?.message || e));
		} finally {
			setLoading(false);
		}
	}, [offset]);

	useEffect(() => { fetchPage(offset); }, [fetchPage, offset]);

	const resolve = async (review_id: string, action: "assign" | "skip") => {
		setActing(review_id); setError(null);
		try {
			const body: any = { review_id, action };
			if (action === "assign") body.bpi_id = picked[review_id];
			const r = await fetch("/api/admin/earnings-review-resolve", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			const j = await r.json();
			if (!r.ok || !j.ok) throw new Error(j.error || "resolve failed");
			setRows((rs) => rs.filter((r) => r.review_id !== review_id));
			setTotal((t) => Math.max(0, t - 1));
			if (rows.length <= 1) await fetchPage(offset);
		} catch (e: any) {
			setError(String(e?.message || e));
		} finally {
			setActing(null);
		}
	};

	return (
		<AdminLayout current="earnings-review" userEmail={userEmail}>
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Earnings review</h1>
					<p className="text-sm text-gray-600 mt-1">
						Pay records the auto-reconciler couldn&apos;t safely attach — the name on the data.boston.gov earnings file matches more than one officer. Pick the officer this record belongs to, or skip it. Decisions stick across the weekly refresh.
					</p>
				</div>
				<div className="text-right">
					<div className="text-3xl font-bold tabular-nums">{total.toLocaleString()}</div>
					<div className="text-xs text-gray-500">held</div>
				</div>
			</div>

			{error && (
				<div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
					<strong>Failed:</strong> {error}
				</div>
			)}

			{loading && rows.length === 0 ? (
				<div className="mt-8 text-sm text-gray-500 italic">Loading…</div>
			) : rows.length === 0 ? (
				<div className="mt-12 p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
					<div className="text-emerald-800 font-semibold">Nothing to review 🎉</div>
					<p className="text-xs text-emerald-700 mt-1">No earnings are waiting for officer assignment.</p>
				</div>
			) : (
				<div className="mt-6 space-y-4">
					{rows.map((row) => (
						<div key={row.review_id} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
							<div className="px-4 py-3 border-b border-gray-100 bg-amber-50 flex items-center justify-between">
								<div>
									<div className="text-sm font-semibold text-gray-900">
										{row.name} <span className="text-gray-500 font-normal">· {row.year ?? "—"}</span>
									</div>
									<div className="text-xs text-gray-600 mt-0.5">
										Total pay <span className="font-semibold text-gray-900">{money(row.total_pay)}</span>
										{" · "}{row.reason === "no_officer" ? "no officer matched this name" : `${row.candidates.length} same-named officers`}
									</div>
								</div>
								<div className="text-[10px] text-gray-400">held {new Date(row.created_at).toLocaleDateString()}</div>
							</div>

							{row.candidates.length === 0 ? (
								<div className="p-4 text-sm text-gray-500 italic">
									No candidate officers in the map for this name. Skip, or add the officer first via the identity tools.
								</div>
							) : (
								<div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
									{row.candidates.map((c) => {
										const isPicked = picked[row.review_id] === c.bpi_id;
										return (
											<label
												key={c.bpi_id}
												className={`block rounded-xl border p-3 cursor-pointer transition-colors ${
													isPicked ? "border-emerald-400 bg-emerald-50/40 ring-2 ring-emerald-100" : "border-gray-200 hover:border-gray-300"
												}`}
											>
												<div className="flex items-start gap-2">
													<input
														type="radio"
														name={`pick-${row.review_id}`}
														checked={isPicked}
														onChange={() => setPicked((s) => ({ ...s, [row.review_id]: c.bpi_id }))}
														className="mt-1"
													/>
													<div className="flex-1 min-w-0">
														<div className="text-sm font-semibold text-gray-900 truncate">
															{[c.first_name, c.middle_name, c.last_name].filter(Boolean).join(" ") || "(no name)"}
														</div>
														<div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-gray-600">
															<div>BPD emp: <span className="font-mono text-gray-900">{c.employee_id ?? "—"}</span></div>
															<div>Badge: <span className="font-mono text-gray-900">{c.badge_no ?? "—"}</span></div>
															<div>MPTC: <span className="font-mono text-gray-900">{c.mptc_id ?? "—"}</span></div>
															<div className="truncate" title={c.agency_at_post ?? ""}>Agency: <span className="text-gray-900">{c.agency_at_post ?? "—"}</span></div>
														</div>
														<div className="mt-2 flex flex-wrap gap-1 text-[10px]">
															{c.earnings_rows > 0 && <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">{c.earnings_rows} earnings</span>}
															{c.fio_rows > 0 && <span className="px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">{c.fio_rows} FIO</span>}
															{c.misconduct_rows > 0 && <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">{c.misconduct_rows} IA</span>}
															{c.post_cert_rows > 0 && <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">{c.post_cert_rows} POST</span>}
															{c.employee_id != null && <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">hard ID</span>}
															{c.earnings_rows + c.fio_rows + c.misconduct_rows + c.post_cert_rows === 0 && (
																<span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">no facts yet</span>
															)}
														</div>
														<div className="mt-1 text-[10px] text-gray-400 font-mono truncate" title={c.bpi_id}>{c.bpi_id}</div>
													</div>
												</div>
											</label>
										);
									})}
								</div>
							)}

							<div className="px-4 py-3 border-t border-gray-100 bg-slate-50 flex items-center justify-end gap-2">
								<button
									onClick={() => resolve(row.review_id, "skip")}
									disabled={acting === row.review_id}
									className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
								>
									Skip
								</button>
								<button
									onClick={() => resolve(row.review_id, "assign")}
									disabled={acting === row.review_id || !picked[row.review_id]}
									className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
								>
									{acting === row.review_id ? "Working…" : "Assign to selected"}
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{total > PAGE_SIZE && (
				<div className="mt-6 flex items-center justify-between text-sm">
					<button
						onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
						disabled={offset === 0 || loading}
						className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
					>
						← Previous
					</button>
					<span className="text-gray-600">
						{offset + 1} – {Math.min(offset + rows.length, total)} of {total.toLocaleString()}
					</span>
					<button
						onClick={() => setOffset(offset + PAGE_SIZE)}
						disabled={offset + PAGE_SIZE >= total || loading}
						className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
					>
						Next →
					</button>
				</div>
			)}
		</AdminLayout>
	);
}
