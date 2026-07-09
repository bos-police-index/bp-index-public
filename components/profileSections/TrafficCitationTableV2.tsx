import React from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import MissingData from "@components/MissingData";
import SourceBadgeV2 from "@components/SourceBadgeV2";

interface Props {
	rows: V2TrafficCitationRow[];
}

function fmtDate(s: string | null): string {
	if (!s) return "—";
	try {
		return new Date(s).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
	} catch {
		return s;
	}
}

const yn = (v: boolean | null) => (v === true ? "Yes" : v === false ? "No" : "—");

const columns: GridColDef[] = [
	{ field: "eventDate", headerName: "Date", width: 120, valueFormatter: (p) => fmtDate(p.value as string | null) },
	{ field: "citationType", headerName: "Type", width: 130, valueFormatter: (p) => p.value || "—" },
	{ field: "offenseDesc", headerName: "Offense", flex: 1.2, minWidth: 180, valueFormatter: (p) => p.value || "—" },
	{ field: "locationName", headerName: "Location", flex: 1, minWidth: 140, valueFormatter: (p) => p.value || "—" },
	{
		field: "subjectRace", headerName: "Driver", width: 130,
		valueGetter: (p) => [(p.row as V2TrafficCitationRow).subjectRace, (p.row as V2TrafficCitationRow).subjectGender].filter(Boolean).join(", ") || "—",
	},
	{ field: "searched", headerName: "Searched", width: 100, renderCell: (p) => yn(p.value as boolean | null) },
	{ field: "crash", headerName: "Crash", width: 90, renderCell: (p) => yn(p.value as boolean | null) },
];

export default function TrafficCitationTableV2({ rows }: Props) {
	const latest = rows && rows.length > 0 ? rows[0] : null;
	const searchedCount = (rows || []).filter((r) => r.searched === true).length;

	return (
		<div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
			<div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-yellow-50">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<div className="flex items-center space-x-2 sm:space-x-3">
						<div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-amber-100">
							<svg className="w-3 h-3 sm:w-4 sm:h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0z" />
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
							</svg>
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h2 className="text-base sm:text-lg font-semibold text-gray-900">Traffic Citations</h2>
								<span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs font-semibold border border-emerald-200">v2</span>
							</div>
							<p className="text-xs sm:text-sm text-gray-600">
								{rows?.length ? `${rows.length.toLocaleString()} citations · ${searchedCount} with a search` : "Motor vehicle citations issued"}
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
						title="No traffic citations on file (v2)"
						message="This officer has no motor-vehicle citations in the BPD traffic dataset (or their employee ID isn't in the loaded roster)."
					/>
				) : (
					<DataGrid
						rows={rows.map((r, i) => ({ id: i, ...r }))}
						columns={columns}
						autoHeight
						disableRowSelectionOnClick
						initialState={{
							sorting: { sortModel: [{ field: "eventDate", sort: "desc" }] },
							pagination: { paginationModel: { pageSize: 10 } },
						}}
						pageSizeOptions={[10, 25, 50]}
						sx={{
							border: "none",
							"& .MuiDataGrid-columnHeaders": { backgroundColor: "#f8fafc", borderBottom: "2px solid #f59e0b", fontWeight: 600 },
							"& .MuiDataGrid-row:hover": { backgroundColor: "#fffbeb" },
							"& .MuiDataGrid-cell": { borderColor: "rgba(0,0,0,0.06)" },
						}}
					/>
				)}
			</div>
		</div>
	);
}
