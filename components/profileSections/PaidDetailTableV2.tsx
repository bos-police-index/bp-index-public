import React from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import MissingData from "@components/MissingData";
import SourceBadgeV2 from "@components/SourceBadgeV2";
import { formatMoneyNoCents } from "@utility/textFormatHelpers";

interface Props {
	rows: V2PaidDetailRow[];
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
	{ field: "startDate", headerName: "Date", width: 120, valueFormatter: (p) => fmtDate(p.value as string | null) },
	{ field: "customerName", headerName: "Customer", flex: 1.2, minWidth: 180, valueFormatter: (p) => p.value || "—" },
	{ field: "street", headerName: "Location", flex: 1, minWidth: 140, valueFormatter: (p) => p.value || "—" },
	{ field: "orgDesc", headerName: "Unit", width: 150, valueFormatter: (p) => p.value || "—" },
	{ field: "hoursWorked", headerName: "Hrs", width: 70, align: "right", headerAlign: "right", valueFormatter: (p) => (p.value == null ? "—" : String(p.value)) },
	{
		field: "payAmount", headerName: "Pay", width: 110, align: "right", headerAlign: "right",
		valueFormatter: (p) => (p.value == null ? "—" : `$${formatMoneyNoCents(p.value as number)}`),
		cellClassName: "font-semibold",
	},
];

export default function PaidDetailTableV2({ rows }: Props) {
	const latest = rows && rows.length > 0 ? rows[0] : null;
	const totalPay = (rows || []).reduce((s, r) => s + (Number(r.payAmount) || 0), 0);

	return (
		<div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
			<div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-cyan-50 to-sky-50">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<div className="flex items-center space-x-2 sm:space-x-3">
						<div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-cyan-100">
							<svg className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h2 className="text-base sm:text-lg font-semibold text-gray-900">Paid Details</h2>
								<span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs font-semibold border border-emerald-200">v2</span>
							</div>
							<p className="text-xs sm:text-sm text-gray-600">
								{rows?.length ? `${rows.length.toLocaleString()} details · $${formatMoneyNoCents(totalPay)} total` : "Private-detail work assignments"}
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
						title="No paid details on file (v2)"
						message="This officer has no paid-detail records in the BPD detail dataset."
					/>
				) : (
					<DataGrid
						rows={rows.map((r, i) => ({ id: i, ...r }))}
						columns={columns}
						autoHeight
						disableRowSelectionOnClick
						initialState={{
							sorting: { sortModel: [{ field: "startDate", sort: "desc" }] },
							pagination: { paginationModel: { pageSize: 10 } },
						}}
						pageSizeOptions={[10, 25, 50]}
						sx={{
							border: "none",
							"& .MuiDataGrid-columnHeaders": { backgroundColor: "#f8fafc", borderBottom: "2px solid #06b6d4", fontWeight: 600 },
							"& .MuiDataGrid-row:hover": { backgroundColor: "#f1f5f9" },
							"& .MuiDataGrid-cell": { borderColor: "rgba(0,0,0,0.06)" },
						}}
					/>
				)}
			</div>
		</div>
	);
}
