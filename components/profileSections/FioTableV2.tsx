import React from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import MissingData from "@components/MissingData";
import SourceBadgeV2 from "@components/SourceBadgeV2";
import { bpi_deep_green, bpi_light_green } from "@styles/theme/lightTheme";

interface V2FioRow {
	bpiId: string | null;
	fcNum: string | null;
	contactDate: string | null;
	location: string | null;
	frisked: boolean | null;
	vehicleSearched: boolean | null;
	basis: string | null;
	circumstance: string | null;
	narrative: string | null;
	source: string;
	asOf: string;
}

interface Props {
	rows: V2FioRow[];
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
	{ field: "fcNum", headerName: "FC #", width: 120, valueFormatter: (p) => p.value || "—" },
	{
		field: "contactDate",
		headerName: "Date",
		width: 130,
		valueFormatter: (p) => fmtDate(p.value as string | null),
	},
	{ field: "circumstance", headerName: "Circumstance", width: 160, valueFormatter: (p) => p.value || "—" },
	{ field: "basis", headerName: "Basis", width: 200, valueFormatter: (p) => p.value || "—" },
	{ field: "location", headerName: "Location", flex: 1, minWidth: 200, valueFormatter: (p) => p.value || "—" },
	{
		field: "narrative",
		headerName: "Narrative",
		flex: 2,
		minWidth: 300,
		valueFormatter: (p) => (p.value ? String(p.value).slice(0, 200) + (String(p.value).length > 200 ? "…" : "") : "—"),
		renderCell: (p) => (
			<span title={p.value as string | undefined} className="whitespace-pre-wrap line-clamp-2">
				{p.value || "—"}
			</span>
		),
	},
];

export default function FioTableV2({ rows }: Props) {
	const latest = rows && rows.length > 0 ? rows[0] : null;

	return (
		<div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
			<div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<div className="flex items-center space-x-2 sm:space-x-3">
						<div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-orange-100">
							<svg className="w-3 h-3 sm:w-4 sm:h-4 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h2 className="text-base sm:text-lg font-semibold text-gray-900">Field Interrogations &amp; Observations</h2>
								<span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs font-semibold border border-emerald-200">v2</span>
							</div>
							<p className="text-xs sm:text-sm text-gray-600">Pedestrian / vehicle stops where this officer was the contact officer</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						{rows && rows.length > 0 && (
							<span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold border border-orange-200">
								{rows.length} {rows.length === 1 ? "stop" : "stops"}
							</span>
						)}
						{latest && <SourceBadgeV2 source={latest.source} asOf={latest.asOf} />}
					</div>
				</div>
			</div>
			<div className="p-3 sm:p-6">
				{!rows || rows.length === 0 ? (
					<MissingData
						variant="card"
						title="No FIO records (v2)"
						message="This officer has no field interrogation/observation reports in the data.boston.gov dataset for the years currently ingested. The pipeline is capped to recent years; raise MAX_YEARS to backfill."
					/>
				) : (
					<DataGrid
						rows={rows.map((r, i) => ({ id: i, ...r }))}
						columns={columns}
						autoHeight
						disableRowSelectionOnClick
						initialState={{
							sorting: { sortModel: [{ field: "contactDate", sort: "desc" }] },
							pagination: { paginationModel: { pageSize: 10 } },
						}}
						pageSizeOptions={[10, 25, 50]}
						getRowHeight={() => "auto"}
						sx={{
							border: "none",
							"& .MuiDataGrid-columnHeaders": {
								backgroundColor: "#f8fafc",
								borderBottom: "2px solid #f97316",
								fontWeight: 600,
							},
							"& .MuiDataGrid-row:hover": { backgroundColor: "#fff7ed" },
							"& .MuiDataGrid-cell": {
								borderColor: "rgba(0,0,0,0.06)",
								padding: "8px 12px",
							},
						}}
					/>
				)}
			</div>
		</div>
	);
}
