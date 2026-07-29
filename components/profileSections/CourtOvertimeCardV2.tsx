import React, { useMemo } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import MissingData from "@components/MissingData";
import SourceBadgeV2 from "@components/SourceBadgeV2";

interface Props {
	rows: V2CourtOvertimeRow[];
}

function fmtDate(s: string | null): string {
	if (!s) return "—";
	try {
		return new Date(String(s).slice(0,10)+"T00:00:00Z").toLocaleDateString(undefined, { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" });
	} catch {
		return s;
	}
}

const columns: GridColDef[] = [
	{ field: "otDate", headerName: "Date", width: 130, valueFormatter: (p) => fmtDate(p.value as string | null) },
	{ field: "description", headerName: "Type", flex: 1, minWidth: 220, valueFormatter: (p) => p.value || "—" },
	{ field: "chargedDesc", headerName: "Charged to", flex: 1, minWidth: 160, valueFormatter: (p) => p.value || "—" },
	{ field: "workedHours", headerName: "Hours", width: 100, align: "right", headerAlign: "right", valueFormatter: (p) => (p.value == null ? "—" : Number(p.value).toFixed(2)) },
];

export default function CourtOvertimeCardV2({ rows }: Props) {
	const latest = rows && rows.length > 0 ? rows[0] : null;

	const summary = useMemo(() => {
		const hours = rows.reduce((s, r) => s + (Number(r.workedHours) || 0), 0);
		const years = rows.map((r) => (r.otDate ? new Date(r.otDate).getFullYear() : null)).filter(Boolean) as number[];
		const byYear: Record<number, number> = {};
		for (const r of rows) {
			const y = r.otDate ? new Date(r.otDate).getFullYear() : null;
			if (y) byYear[y] = (byYear[y] || 0) + (Number(r.workedHours) || 0);
		}
		return {
			count: rows.length,
			hours,
			minYear: years.length ? Math.min(...years) : null,
			maxYear: years.length ? Math.max(...years) : null,
			byYear,
		};
	}, [rows]);

	return (
		<div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
			<div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-slate-50">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<div className="flex items-center space-x-2 sm:space-x-3">
						<div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-amber-100">
							<svg className="w-3 h-3 sm:w-4 sm:h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3M9 9v.01M9 12v.01M9 15v.01M9 18v.01" />
							</svg>
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h2 className="text-base sm:text-lg font-semibold text-gray-900">Court Overtime</h2>
								<span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs font-semibold border border-emerald-200">v2</span>
							</div>
							<p className="text-xs sm:text-sm text-gray-600">Court-related overtime shifts (matched by employee id)</p>
						</div>
					</div>
					{latest && <SourceBadgeV2 source={latest.source} asOf={latest.asOf} />}
				</div>
			</div>

			<div className="p-3 sm:p-6">
				{!rows || rows.length === 0 ? (
					<MissingData
						variant="card"
						title="No court overtime on file"
						message="This officer has no court-overtime records in the dataset (currently covering 2020–2024)."
					/>
				) : (
					<>
						<div className="flex flex-wrap items-center gap-x-6 gap-y-1 mb-4 text-sm">
							<span><span className="text-gray-400">Shifts:</span> <span className="font-semibold text-gray-900">{summary.count.toLocaleString()}</span></span>
							<span><span className="text-gray-400">Total hours:</span> <span className="font-semibold text-gray-900">{summary.hours.toFixed(1)}</span></span>
							{summary.minYear && <span className="text-gray-500">{summary.minYear === summary.maxYear ? summary.minYear : `${summary.minYear}–${summary.maxYear}`}</span>}
						</div>
						<DataGrid
							rows={rows.map((r, i) => ({ id: i, ...r }))}
							columns={columns}
							autoHeight
							disableRowSelectionOnClick
							initialState={{
								sorting: { sortModel: [{ field: "otDate", sort: "desc" }] },
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
					</>
				)}
			</div>
		</div>
	);
}
