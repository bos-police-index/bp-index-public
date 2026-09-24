import React, { useMemo, useState } from "react";
import Link from "next/link";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import MissingData from "@components/MissingData";
import SourceBadgeV2 from "@components/SourceBadgeV2";
import NameMatchNotice from "@components/profileSections/NameMatchNotice";

interface Props {
	rows: V2IaCaseRow[];
}

function fmtDate(s: string | null | undefined): string {
	if (!s) return "—";
	try {
		return new Date(String(s).slice(0,10)+"T00:00:00Z").toLocaleDateString(undefined, { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" });
	} catch {
		return s;
	}
}

function findingClass(finding: string | null): string {
	const s = (finding || "").toLowerCase();
	if (s.includes("not sustained")) return "bg-orange-100 text-orange-800 border border-orange-200";
	if (s.includes("sustained")) return "bg-red-100 text-red-800 border border-red-200";
	if (s.includes("unfounded")) return "bg-blue-100 text-blue-800 border border-blue-200";
	if (s.includes("exonerated")) return "bg-green-100 text-green-800 border border-green-200";
	if (s.includes("pending")) return "bg-yellow-100 text-yellow-800 border border-yellow-200";
	if (s.includes("withdraw") || s.includes("filed")) return "bg-gray-100 text-gray-700 border border-gray-200";
	return "bg-gray-100 text-gray-800 border border-gray-200";
}

export function allegationsOf(r: V2IaCaseRow): V2IaAllegation[] {
	if (!r.allegationDetails) return [];
	if (Array.isArray(r.allegationDetails)) return r.allegationDetails;
	try {
		return JSON.parse(r.allegationDetails);
	} catch {
		return [];
	}
}

const OUTCOMES = ["Sustained", "Not Sustained", "Exonerated", "Unfounded", "Pending", "Filed/Withdrawn"];

/**
 * Internal Affairs cases for one officer — one row per CASE (review round 2: "Split each IA
 * into a single record for each officer"). Each row lists that officer's allegations in the
 * case with their findings; Outcome is the most serious finding among them.
 */
export default function OfficerMisconductTableV2({ rows }: Props) {
	const [showSustainedOnly, setShowSustainedOnly] = useState(false);
	const [openRow, setOpenRow] = useState<V2IaCaseRow | null>(null);
	const latest = rows && rows.length > 0 ? rows[0] : null;

	const columns: GridColDef[] = useMemo(() => [
		{
			field: "caseNumber",
			headerName: "IA #",
			width: 130,
			renderCell: (p) =>
				p.value ? (
					<Link href={{ pathname: "/ia/[iaNumber]", query: { iaNumber: p.value } }} className="text-red-700 hover:underline">
						{p.value}
					</Link>
				) : (
					"—"
				),
		},
		{ field: "receivedDate", headerName: "Received", width: 120, valueFormatter: (p) => fmtDate(p.value as string | null) },
		{ field: "incidentType", headerName: "Type", width: 150, valueFormatter: (p) => p.value || "—" },
		{
			field: "outcome",
			headerName: "Outcome",
			width: 130,
			renderCell: (p) => (
				<span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${findingClass(p.value as string | null)}`}>
					{p.value || "—"}
				</span>
			),
		},
		{
			field: "allegations",
			headerName: "Allegations & findings",
			flex: 1.4,
			minWidth: 280,
			sortable: false,
			renderCell: (p) => {
				const list = allegationsOf(p.row as V2IaCaseRow);
				if (list.length === 0) return <span className="text-gray-300">—</span>;
				return (
					<ul className="py-1 space-y-1">
						{list.map((a, i) => (
							<li key={i} className="text-xs leading-snug">
								<span className="text-gray-800">{a.allegation || "—"}</span>
								<span className={`ml-1.5 inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium ${findingClass(a.finding)}`}>{a.finding || "—"}</span>
							</li>
						))}
					</ul>
				);
			},
		},
		{ field: "actionsTaken", headerName: "Action Taken", width: 170, valueFormatter: (p) => p.value || "—" },
		{
			field: "narrative",
			headerName: "Summary",
			flex: 1,
			minWidth: 220,
			sortable: false,
			renderCell: (p) => {
				const v = p.value as string | null;
				if (!v) return <span className="text-gray-300">—</span>;
				if (v === "[redacted]") return <span className="text-gray-400 italic text-xs">[redacted]</span>;
				return (
					<button
						type="button"
						onClick={() => setOpenRow(p.row as V2IaCaseRow)}
						title="Read full summary"
						className="text-left text-xs text-gray-700 hover:text-red-700 leading-snug w-full"
						style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
					>
						{v}
					</button>
				);
			},
		},
	], []);

	const visibleRows = useMemo(() => {
		if (!showSustainedOnly) return rows;
		return rows.filter((r) => (r.numSustained ?? 0) > 0);
	}, [rows, showSustainedOnly]);

	const counts = useMemo(() => {
		const byOutcome: Record<string, number> = {};
		let allegations = 0;
		for (const r of rows) {
			allegations += r.numAllegations ?? 0;
			if (r.outcome) byOutcome[r.outcome] = (byOutcome[r.outcome] ?? 0) + 1;
		}
		return { cases: rows.length, allegations, byOutcome };
	}, [rows]);

	const withNarrative = useMemo(() => rows.filter((r) => r.narrative && r.narrative !== "[redacted]").length, [rows]);

	return (
		<div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
			<div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-rose-50">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<div className="flex items-center space-x-2 sm:space-x-3">
						<div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-red-100">
							<svg className="w-3 h-3 sm:w-4 sm:h-4 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
							</svg>
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h2 className="text-base sm:text-lg font-semibold text-gray-900">Internal Affairs Cases</h2>
								<span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs font-semibold border border-emerald-200">v2</span>
							</div>
							<p className="text-xs sm:text-sm text-gray-600">BPD-internal IAD complaints (one row per case, with each allegation&apos;s finding)</p>
						</div>
					</div>
					{latest && <SourceBadgeV2 source={latest.sources?.split(", ")[0] ?? ""} asOf={latest.asOf} />}
				</div>
			</div>

			<div className="px-4 sm:px-6 py-3 border-b border-gray-100 bg-gray-50">
				<div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
					<span className="font-medium text-gray-700">
						{counts.cases} case{counts.cases === 1 ? "" : "s"} · {counts.allegations} allegation{counts.allegations === 1 ? "" : "s"}
					</span>
					{OUTCOMES.filter((o) => counts.byOutcome[o]).map((o) => (
						<span key={o} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${findingClass(o)}`} title={`Cases whose most serious finding is ${o}`}>
							{counts.byOutcome[o]} {o}
						</span>
					))}
					{withNarrative > 0 && (
						<span className="inline-flex items-center gap-1 text-xs text-gray-500" title="Complaint summaries available — click a Summary cell to read">
							<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
							{withNarrative} with summary
						</span>
					)}
					<label className="ml-auto inline-flex items-center gap-1.5 cursor-pointer">
						<input
							type="checkbox"
							checked={showSustainedOnly}
							onChange={(e) => setShowSustainedOnly(e.target.checked)}
							className="rounded border-gray-300 text-red-600 focus:ring-red-500"
						/>
						<span className="text-xs text-gray-600">Cases with a sustained allegation</span>
					</label>
				</div>
			</div>

			<div className="p-3 sm:p-6">
				{!rows || rows.length === 0 ? (
					<MissingData
						variant="card"
						title="No IA cases on file (v2)"
						message="This officer has no BPD Internal Affairs cases in the v2 dataset. They may not have been the subject of a complaint, or this officer pre-dates the loaded IAD records."
					/>
				) : visibleRows.length === 0 ? (
					<div className="text-sm text-gray-500 italic py-6 text-center">
						{counts.cases} case{counts.cases === 1 ? "" : "s"} on file, none with a sustained allegation.
					</div>
				) : (
					<>
					<NameMatchNotice rows={visibleRows} />
					<DataGrid
						rows={visibleRows.map((r, i) => ({ id: i, ...r }))}
						columns={columns}
						autoHeight
						getRowHeight={() => "auto"}
						disableRowSelectionOnClick
						initialState={{
							sorting: { sortModel: [{ field: "receivedDate", sort: "desc" }] },
							pagination: { paginationModel: { pageSize: 10 } },
						}}
						pageSizeOptions={[10, 25, 50]}
						sx={{
							border: "none",
							"& .MuiDataGrid-columnHeaders": {
								backgroundColor: "#f8fafc",
								borderBottom: "2px solid #ef4444",
								fontWeight: 600,
							},
							"& .MuiDataGrid-row:hover": { backgroundColor: "#fef2f2" },
							"& .MuiDataGrid-cell": { borderColor: "rgba(0,0,0,0.06)", paddingTop: "8px", paddingBottom: "8px" },
							"& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": { outline: "none" },
						}}
					/>
				</>
				)}
			</div>

			{/* Full-summary reader */}
			{openRow && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
					role="dialog"
					aria-modal="true"
					onClick={() => setOpenRow(null)}
				>
					<div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
						<div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-rose-50 flex items-start justify-between gap-3">
							<div>
								<div className="flex items-center gap-2 flex-wrap">
									<span className="font-semibold text-gray-900">{openRow.caseNumber || "IA case"}</span>
									{openRow.outcome && (
										<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${findingClass(openRow.outcome)}`}>{openRow.outcome}</span>
									)}
									{openRow.linkMethod === "name" && !openRow.confirmed && (
										<span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-semibold">matched by name — unconfirmed</span>
									)}
								</div>
								<div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
									{openRow.allegations && <span><span className="text-gray-400">Allegations:</span> {openRow.allegations}</span>}
									{openRow.disposition && <span><span className="text-gray-400">Disposition:</span> {openRow.disposition}</span>}
									<span><span className="text-gray-400">Received:</span> {fmtDate(openRow.receivedDate)}</span>
									{openRow.occurredDate && <span><span className="text-gray-400">Occurred:</span> {fmtDate(openRow.occurredDate)}</span>}
								</div>
							</div>
							<button onClick={() => setOpenRow(null)} className="text-gray-400 hover:text-gray-700 flex-shrink-0" aria-label="Close">
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
							</button>
						</div>
						<div className="px-5 py-4 overflow-y-auto">
							<p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{openRow.narrative}</p>
							<p className="mt-4 text-[11px] text-gray-400 italic">
								Verbatim complaint summary from the BPD IAD 2020 records; spelling/wording as recorded in the source.
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
