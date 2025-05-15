"use client";
import { GridColDef } from "@mui/x-data-grid";


/*
Returns a mapping of all columns in a given table to their descriptions when given those cols
*/
const getHeaderWithDescription = (cols: GridColDef[]): any[] => {
	if (!cols || cols.length === 0) {
		return [];
	}
	return cols.map((col) => {
		if (col.description) {
			return { name: col.headerName, description: col.description };
		} else {
			return { name: col.headerName, description: "..." };
		}
	});
};

export default getHeaderWithDescription;
