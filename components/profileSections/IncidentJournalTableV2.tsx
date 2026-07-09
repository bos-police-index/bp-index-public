import React from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import MissingData from "@components/MissingData";
import SourceBadgeV2 from "@components/SourceBadgeV2";

interface Props {
	rows: V2IncidentRow[];
}

function fmtDate(s: string | null): string {
	if (!s) return "—";
	try {
		return new Date(s).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
	} catch {
		return s;
	}
}

const columns: GridColDef[] = [
	{ field: "occurredOnDate", headerName: "Date", width: 120, valueFormatter: (p) => fmtDate(p.value as string | null) },
	{ field: "natureOfIncident", headerName: "Nature", flex: 1.2, minWidth: 180, valueFormatter: (p) => p.value || "—" },
	{ field: "location", headerName: "Location", flex: 1, minWidth: 150, valueFormatter: (p) => p.value || "—" },
	{ field: "district", headerName: "District", width: 110, valueFormatter: (p) => p.value || "—" },
	{ field: "incidentClearance", headerName: "Clearance", width: 130, valueFormatter: (p) => p.value || "—" },
	{
		field: "shooting", headerName: "Shooting", width: 100,
		renderCell: (p) => (p.value === true
			? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">Yes</span>
			: <span className="text-gray-400">—</span>),
	},
];

export default function IncidentJournalTableV2({ rows }: Props) {
	const latest = rows && rows.length > 0 ? rows[0] : null;
	const shootings = (rows || []).filter((r) => r.shooting === true).length;

	return (
		<div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
			<div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-100">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<div className="flex items-center space-x-2 sm:space-x-3">
						<div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-slate-200">
							<svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
							</svg>
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h2 className="text-base sm:text-lg font-semibold text-gray-900">Incident Journal</h2>
								<span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs font-semibold border border-emerald-200">v2</span>
							</div>
							<p className="text-xs sm:text-sm text-gray-600">
								{rows?.length ? `${rows.length.toLocaleString()} incidents${shootings ? ` · ${shootings} shooting${shootings === 1 ? "" : "s"}` : ""}` : "Incidents where this officer is the journaling officer"}
							</p>
						</div>
					</div>
					{latest && <SourceBadgeV2 source={latest.source} asOf={latest.asOf} />}
				</div>
			</div>
			<div className="p-3 sm:p-6">
				{!rows || rows.length === 0 ? (
					<MissingData
						variant="card"
						title="No incident-journal records (v2)"
						message="This officer is not the journaling officer on any incident in the loaded window (Dec 2020 – Jan 2021)."
					/>
				) : (
					<DataGrid
						rows={rows.map((r, i) => ({ id: i, ...r }))}
						columns={columns}
						autoHeight
						disableRowSelectionOnClick
						initialState={{
							sorting: { sortModel: [{ field: "occurredOnDate", sort: "desc" }] },
							pagination: { paginationModel: { pageSize: 10 } },
						}}
						pageSizeOptions={[10, 25, 50]}
						sx={{
							border: "none",
							"& .MuiDataGrid-columnHeaders": { backgroundColor: "#f8fafc", borderBottom: "2px solid #64748b", fontWeight: 600 },
							"& .MuiDataGrid-row:hover": { backgroundColor: "#f1f5f9" },
							"& .MuiDataGrid-cell": { borderColor: "rgba(0,0,0,0.06)" },
						}}
					/>
				)}
			</div>
		</div>
	);
}
