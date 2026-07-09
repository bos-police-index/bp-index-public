import { useCallback, useEffect, useState } from "react";
import type { InferGetServerSidePropsType } from "next";
import AdminLayout from "@components/admin/AdminLayout";
import { withAdmin } from "@lib/auth/server";

export const getServerSideProps = withAdmin(async (_ctx, session) => {
	return { props: { userEmail: session!.user?.email ?? null } };
});

type Row = {
	bpi_id: string;
	source: string;
	kind: string;
	records: number;
	first_name: string | null;
	last_name: string | null;
	badge_no: number | null;
	identity_confidence: string | null;
};

const PAGE_SIZE = 15;

export default function Confirmations({ userEmail }: InferGetServerSidePropsType<typeof getServerSideProps>) {
	const [rows, setRows] = useState<Row[]>([]);
	const [total, setTotal] = useState(0);
	const [offset, setOffset] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [acting, setActing] = useState<string | null>(null);

	const key = (r: Row) => `${r.bpi_id}:${r.source}`;

	const fetchPage = useCallback(async (newOffset = offset) => {
		setLoading(true); setError(null);
		try {
			const r = await fetch(`/api/admin/confirmations-list?limit=${PAGE_SIZE}&offset=${newOffset}`);
			const j = await r.json();
			if (!r.ok) throw new Error(j.error || "load failed");
			setRows(j.rows); setTotal(j.total);
		} catch (e: any) {
			setError(String(e?.message || e));
		} finally {
			setLoading(false);
		}
	}, [offset]);

	useEffect(() => { fetchPage(offset); }, [fetchPage, offset]);

	const resolve = async (row: Row, decision: "confirmed" | "rejected") => {
		setActing(key(row)); setError(null);
		try {
			const r = await fetch("/api/admin/confirmations-resolve", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ bpi_id: row.bpi_id, source: row.source, decision }),
			});
			const j = await r.json();
			if (!r.ok || !j.ok) throw new Error(j.error || "resolve failed");
			setRows((rs) => rs.filter((x) => key(x) !== key(row)));
			setTotal((t) => Math.max(0, t - 1));
			if (rows.length <= 1) await fetchPage(offset);
		} catch (e: any) {
			setError(String(e?.message || e));
		} finally {
			setActing(null);
		}
	};

	return (
		<AdminLayout current="confirmations" userEmail={userEmail}>
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Confirm name matches</h1>
					<p className="text-sm text-gray-600 mt-1">
						Data matched to an officer by <strong>name</strong> (no verified officer ID) — earnings, IAD complaints, and POST records. Confirm that a record set really belongs to the officer, or reject it to hide it from their profile. Decisions stick across refreshes.
					</p>
				</div>
				<div className="text-right">
					<div className="text-3xl font-bold tabular-nums">{total.toLocaleString()}</div>
					<div className="text-xs text-gray-500">pending</div>
				</div>
			</div>

			{error && (
				<div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"><strong>Failed:</strong> {error}</div>
			)}

			{loading && rows.length === 0 ? (
				<div className="mt-8 text-sm text-gray-500 italic">Loading…</div>
			) : rows.length === 0 ? (
				<div className="mt-12 p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
					<div className="text-emerald-800 font-semibold">All caught up 🎉</div>
					<p className="text-xs text-emerald-700 mt-1">No name-matched data awaiting confirmation.</p>
				</div>
			) : (
				<div className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white overflow-hidden">
					{rows.map((row) => (
						<div key={key(row)} className="px-4 py-3 flex items-center gap-3">
							<div className="flex-1 min-w-0">
								<a href={`/profile/${row.bpi_id}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-gray-900 hover:text-emerald-700 truncate">
									{[row.first_name, row.last_name].filter(Boolean).join(" ") || "(no name)"}
								</a>
								<div className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
									<span>Badge <span className="font-mono text-gray-700">{row.badge_no ?? "—"}</span></span>
									<span className={`px-1.5 rounded-full text-[10px] ${row.identity_confidence === "confirmed" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>{row.identity_confidence ?? "?"}</span>
								</div>
							</div>
							<div className="text-right">
								<div className="text-sm font-medium text-gray-800">{row.kind}</div>
								<div className="text-xs text-gray-500">{row.records.toLocaleString()} record{row.records === 1 ? "" : "s"}</div>
							</div>
							<div className="flex items-center gap-2 ml-2">
								<button
									onClick={() => resolve(row, "rejected")}
									disabled={acting === key(row)}
									className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-700 hover:bg-red-50 hover:border-red-300 disabled:opacity-50"
									title="Not this officer — hide from their profile"
								>
									Reject
								</button>
								<button
									onClick={() => resolve(row, "confirmed")}
									disabled={acting === key(row)}
									className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
								>
									{acting === key(row) ? "…" : "Confirm"}
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{total > PAGE_SIZE && (
				<div className="mt-6 flex items-center justify-between text-sm">
					<button onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} disabled={offset === 0 || loading}
						className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50">← Previous</button>
					<span className="text-gray-600">{offset + 1} – {Math.min(offset + rows.length, total)} of {total.toLocaleString()}</span>
					<button onClick={() => setOffset(offset + PAGE_SIZE)} disabled={offset + PAGE_SIZE >= total || loading}
						className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50">Next →</button>
				</div>
			)}
		</AdminLayout>
	);
}
