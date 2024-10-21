"use client";
import { GridColDef } from "@mui/x-data-grid";

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
