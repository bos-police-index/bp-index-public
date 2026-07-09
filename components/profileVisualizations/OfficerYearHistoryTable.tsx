"use client";
import React from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { formatMoneyNoCents } from "@utility/textFormatHelpers";

interface Props {
	rows: OfficerYearHistoryRow[];
}

const moneyCell = (value: number | null) =>
	value == null ? "—" : `$${formatMoneyNoCents(value)}`;

const fallback = (...vals: (string | null | undefined)[]) =>
	vals.find((v) => v != null && v !== "") ?? "—";

const columns: GridColDef[] = [
	{
		field: "year",
		headerName: "Year",
		width: 90,
		align: "left",
		headerAlign: "left",
		valueFormatter: (p) => (p.value == null ? "—" : String(p.value)),
	},
	{
		field: "badgeNo",
		headerName: "Badge",
		width: 100,
		align: "left",
		headerAlign: "left",
		valueFormatter: (p) => (p.value == null || p.value === "" ? "—" : `#${p.value}`),
	},
	{
		field: "assignment",
		headerName: "Assignment (Task Profile)",
		flex: 1.6,
		minWidth: 220,
		valueGetter: (params) =>
			fallback(
				params.row.tskprofDescs as string | null,
				params.row.units as string | null,
			),
	},
	{
		field: "jobTitle",
		headerName: "Job Title",
		flex: 1.2,
		minWidth: 180,
		valueGetter: (params) =>
			fallback(
				params.row.jobTitles as string | null,
				params.row.rank as string | null,
			),
	},
	{
		field: "regularPay",
		headerName: "Regular",
		width: 120,
		align: "right",
		headerAlign: "right",
		valueFormatter: (p) => moneyCell(p.value as number | null),
	},
	{
		field: "otPay",
		headerName: "Overtime",
		width: 120,
		align: "right",
		headerAlign: "right",
		valueFormatter: (p) => moneyCell(p.value as number | null),
	},
	{
		field: "detailPay",
		headerName: "Detail",
		width: 110,
		align: "right",
		headerAlign: "right",
		valueFormatter: (p) => moneyCell(p.value as number | null),
	},
	{
		field: "otherPay",
		headerName: "Other",
		width: 110,
		align: "right",
		headerAlign: "right",
		valueFormatter: (p) => moneyCell(p.value as number | null),
	},
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

export default function OfficerYearHistoryTable({ rows }: Props) {
	if (!rows || rows.length === 0) {
		return <div className="p-4 text-sm text-gray-500">No year-by-year history available.</div>;
	}

	const gridRows = rows.map((r, i) => ({ id: i, ...r }));

	return (
		<DataGrid
			rows={gridRows}
			columns={columns}
			autoHeight
			disableRowSelectionOnClick
			initialState={{
				sorting: { sortModel: [{ field: "year", sort: "desc" }] },
				pagination: { paginationModel: { pageSize: 25 } },
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
	);
}
