import React from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import MissingData from "@components/MissingData";
import SourceBadgeV2 from "@components/SourceBadgeV2";
import NameMatchNotice from "@components/profileSections/NameMatchNotice";
import { formatMoneyNoCents } from "@utility/textFormatHelpers";
import { bpi_deep_green, bpi_light_green } from "@styles/theme/lightTheme";

interface Props {
	rows: V2EarningsRow[];
}

const moneyCell = (v: number | null) => (v == null ? "—" : `$${formatMoneyNoCents(v)}`);

const columns: GridColDef[] = [
	{
		field: "year",
		headerName: "Year",
		width: 90,
		align: "left",
		headerAlign: "left",
		valueFormatter: (p) => (p.value == null ? "—" : String(p.value)),
	},
	{ field: "title", headerName: "Title", flex: 1.2, minWidth: 160, valueFormatter: (p) => p.value || "—" },
	{ field: "regularPay", headerName: "Regular", width: 120, align: "right", headerAlign: "right", valueFormatter: (p) => moneyCell(p.value as number | null) },
	{ field: "otPay", headerName: "Overtime", width: 120, align: "right", headerAlign: "right", valueFormatter: (p) => moneyCell(p.value as number | null) },
	{ field: "detailPay", headerName: "Detail", width: 110, align: "right", headerAlign: "right", valueFormatter: (p) => moneyCell(p.value as number | null) },
	{ field: "injuredPay", headerName: "Injured", width: 110, align: "right", headerAlign: "right", valueFormatter: (p) => moneyCell(p.value as number | null) },
	{ field: "otherPay", headerName: "Other", width: 110, align: "right", headerAlign: "right", valueFormatter: (p) => moneyCell(p.value as number | null) },
	{ field: "quinnPay", headerName: "Quinn", width: 110, align: "right", headerAlign: "right", valueFormatter: (p) => moneyCell(p.value as number | null) },
	{ field: "retroPay", headerName: "Retro", width: 110, align: "right", headerAlign: "right", valueFormatter: (p) => moneyCell(p.value as number | null) },
	{
		field: "totalPay",
		headerName: "Total",
		width: 130,
		align: "right",
		headerAlign: "right",
		valueFormatter: (p) => moneyCell(p.value as number | null),
		cellClassName: "font-semibold",
	},
];

export default function EarningsByYearTableV2({ rows }: Props) {
	const latest = rows && rows.length > 0 ? rows[0] : null;

	return (
		<div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
			<div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-blue-50">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<div className="flex items-center space-x-2 sm:space-x-3">
						<div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${bpi_light_green}30` }}>
							<svg className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: bpi_deep_green }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
							</svg>
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h2 className="text-base sm:text-lg font-semibold text-gray-900">Earnings by Year</h2>
								<span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs font-semibold border border-emerald-200">v2</span>
							</div>
							<p className="text-xs sm:text-sm text-gray-600">Year-by-year compensation breakdown</p>
						</div>
					</div>
					{latest && <SourceBadgeV2 source={latest.source} asOf={latest.asOf} />}
				</div>
			</div>
			<div className="p-3 sm:p-6">
				{!rows || rows.length === 0 ? (
					<MissingData
						variant="card"
						title="No earnings on file (v2)"
						message="This officer doesn't appear in the data.boston.gov Employee Earnings dataset for the years currently ingested. The pipeline is capped to the most recent 3 years; older years can be backfilled by raising MAX_YEARS."
					/>
				) : (
					<>
					<NameMatchNotice rows={rows} />
					<DataGrid
						rows={rows.map((r, i) => ({ id: i, ...r }))}
						columns={columns}
						autoHeight
						disableRowSelectionOnClick
						initialState={{
							sorting: { sortModel: [{ field: "year", sort: "desc" }] },
							pagination: { paginationModel: { pageSize: 10 } },
						}}
						pageSizeOptions={[10, 25, 50]}
						sx={{
							border: "none",
							"& .MuiDataGrid-columnHeaders": {
								backgroundColor: "#f8fafc",
								borderBottom: "2px solid #10b981",
								fontWeight: 600,
							},
							"& .MuiDataGrid-row:hover": { backgroundColor: "#f1f5f9" },
							"& .MuiDataGrid-cell": { borderColor: "rgba(0,0,0,0.06)" },
						}}
					/>
					</>
				)}
			</div>
		</div>
	);
}
