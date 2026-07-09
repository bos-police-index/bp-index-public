import React, { useMemo, useState } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import MissingData from "@components/MissingData";
import SourceBadgeV2 from "@components/SourceBadgeV2";
import NameMatchNotice from "@components/profileSections/NameMatchNotice";

interface V2MisconductRow {
	bpiId: string | null;
	caseNumber: string | null;
	incidentType: string | null;
	allegation: string | null;
	finding: string | null;
	actionTaken: string | null;
	receivedDate: string | null;
	completedDate: string | null;
	source: string;
	asOf: string;
	linkMethod?: string;
	confirmed?: boolean;
}

interface Props {
	rows: V2MisconductRow[];
}

function fmtDate(s: string | null): string {
	if (!s) return "—";
	try {
		return new Date(s).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
	} catch {
		return s;
	}
}

function findingClass(finding: string | null): string {
	const s = (finding || "").toLowerCase();
	if (s.includes("sustained b")) return "bg-red-100 text-red-800 border border-red-200";
	if (s === "sustained" || s.includes("sustained")) return "bg-red-100 text-red-800 border border-red-200";
	if (s.includes("not sustained")) return "bg-orange-100 text-orange-800 border border-orange-200";
	if (s.includes("unfounded")) return "bg-blue-100 text-blue-800 border border-blue-200";
	if (s.includes("exonerated")) return "bg-green-100 text-green-800 border border-green-200";
	if (s.includes("pending")) return "bg-yellow-100 text-yellow-800 border border-yellow-200";
	if (s.includes("withdraw") || s.includes("filed")) return "bg-gray-100 text-gray-700 border border-gray-200";
	return "bg-gray-100 text-gray-800 border border-gray-200";
}

const columns: GridColDef[] = [
	{
		field: "caseNumber",
		headerName: "IA #",
		width: 130,
		valueFormatter: (p) => p.value || "—",
	},
	{
		field: "receivedDate",
		headerName: "Received",
		width: 120,
		valueFormatter: (p) => fmtDate(p.value as string | null),
	},
	{
		field: "incidentType",
		headerName: "Type",
		width: 150,
		valueFormatter: (p) => p.value || "—",
	},
	{
		field: "allegation",
		headerName: "Allegation",
		flex: 1,
		minWidth: 220,
		valueFormatter: (p) => p.value || "—",
	},
	{
		field: "finding",
		headerName: "Finding",
		width: 150,
		renderCell: (p) => (
			<span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${findingClass(p.value as string | null)}`}>
				{p.value || "—"}
			</span>
		),
	},
	{
		field: "actionTaken",
		headerName: "Action Taken",
		flex: 0.8,
		minWidth: 160,
		valueFormatter: (p) => p.value || "—",
	},
];

export default function OfficerMisconductTableV2({ rows }: Props) {
	const [showSustainedOnly, setShowSustainedOnly] = useState(false);
	const latest = rows && rows.length > 0 ? rows[0] : null;

	const visibleRows = useMemo(() => {
		if (!showSustainedOnly) return rows;
		return rows.filter((r) => /^sustained/i.test(r.finding || ""));
	}, [rows, showSustainedOnly]);

	const counts = useMemo(() => {
		const c = { total: rows.length, sustained: 0, notSustained: 0, exonerated: 0, unfounded: 0, pending: 0 };
		for (const r of rows) {
			const f = (r.finding || "").toLowerCase();
			if (f.startsWith("sustained")) c.sustained++;
			else if (f.includes("not sustained")) c.notSustained++;
			else if (f.includes("exonerated")) c.exonerated++;
			else if (f.includes("unfounded")) c.unfounded++;
			else if (f.includes("pending")) c.pending++;
		}
		return c;
	}, [rows]);

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
							<p className="text-xs sm:text-sm text-gray-600">BPD-internal IAD complaints (one row per allegation)</p>
						</div>
					</div>
					{latest && <SourceBadgeV2 source={latest.source} asOf={latest.asOf} />}
				</div>
			</div>

			<div className="px-4 sm:px-6 py-3 border-b border-gray-100 bg-gray-50">
				<div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
					<span className="font-medium text-gray-700">{counts.total} allegation{counts.total === 1 ? "" : "s"}</span>
					{counts.sustained > 0 && (
						<span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 text-xs font-medium">
							{counts.sustained} Sustained
						</span>
					)}
					{counts.notSustained > 0 && (
						<span className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200 text-xs font-medium">
							{counts.notSustained} Not Sustained
						</span>
					)}
					{counts.exonerated > 0 && (
						<span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200 text-xs font-medium">
							{counts.exonerated} Exonerated
						</span>
					)}
					{counts.unfounded > 0 && (
						<span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 text-xs font-medium">
							{counts.unfounded} Unfounded
						</span>
					)}
					{counts.pending > 0 && (
						<span className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 text-xs font-medium">
							{counts.pending} Pending
						</span>
					)}
					<label className="ml-auto inline-flex items-center gap-1.5 cursor-pointer">
						<input
							type="checkbox"
							checked={showSustainedOnly}
							onChange={(e) => setShowSustainedOnly(e.target.checked)}
							className="rounded border-gray-300 text-red-600 focus:ring-red-500"
						/>
						<span className="text-xs text-gray-600">Sustained only</span>
					</label>
				</div>
			</div>

			<div className="p-3 sm:p-6">
				{!rows || rows.length === 0 ? (
					<MissingData
						variant="card"
						title="No IA cases on file (v2)"
						message="This officer has no BPD Internal Affairs cases in the v2 dataset. They may not have been the subject of a complaint, or this officer pre-dates the loaded IAD records (currently 2011 onward)."
					/>
				) : visibleRows.length === 0 ? (
					<div className="text-sm text-gray-500 italic py-6 text-center">
						{counts.total} allegation{counts.total === 1 ? "" : "s"} on file, none Sustained.
					</div>
				) : (
					<>
					<NameMatchNotice rows={visibleRows} />
					<DataGrid
						rows={visibleRows.map((r, i) => ({ id: i, ...r }))}
						columns={columns}
						autoHeight
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
							"& .MuiDataGrid-cell": { borderColor: "rgba(0,0,0,0.06)" },
						}}
					/>
				</>
				)}
			</div>
		</div>
	);
}
