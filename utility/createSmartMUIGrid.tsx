import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import { functionMapping } from "./createMUIGrid";
import DataTable from "@components/DataTable";
import LargeDataTable from "@components/LargeDataTable";

export const getSmartMUIGrid = (table: string, rows: any[], officerName: string, includesOnly = [], excludes = [], totalCount: number | undefined) => {
	const cols: GridColDef[] = functionMapping[table];
	if (!rows) {
		rows = [];
	}
	// if includesOnly contains anything, we remove all columns that are not in includesOnly
	// Except for the id column, which is always included
	let filteredCols: GridColDef[] = cols.filter((col: GridColDef) => {
		return includesOnly.length === 0 || includesOnly.includes(col.field) || col.field === "id";
	});

	// if excludes contains anything, we remove all columns that are in excludes
	// Except for the id column, which is always included
	filteredCols = filteredCols.filter((col: GridColDef) => {
		return !excludes.includes(col.field) || col.field === "id";
	});

	// 100vh - 7rem is for data-table, aka /data/tables/[table_name]
	// 100vh - 90px is for screen overlay table, inside the officer profile page

	const height = officerName !== "" ? "calc(100vh - 7rem)" : "calc(100vh - 90px)";

	return {
		fullTable: <LargeDataTable table={rows} cols={cols} table_name={`${officerName}-${table}`} height={height} pageSizeOptions={[25, 50, 75, 100]} pageSize={25} rowCount={totalCount} />,
		filteredTable: <LargeDataTable table={rows} cols={filteredCols} table_name={`${officerName}-${table}`} height={"auto"} pageSizeOptions={[5]} pageSize={5} rowCount={rows.length} />,
	};
};
