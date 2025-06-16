import React from "react";
import { GridToolbar } from "@mui/x-data-grid";
import DataTable from "./DataTable";
import { GridColDef } from "@mui/x-data-grid";

interface HomePageDataGridProps {
	cols: GridColDef[];
	searchResData: any[];
	loading: boolean;
	keyword?: string;
	getRowsToExportHandler?: any;
}

export default function HomePageDataGrid({ 
	cols, 
	searchResData, 
	loading, 
	keyword,
	getRowsToExportHandler 
}: HomePageDataGridProps) {
	return (
		<DataTable
			cols={cols}
			table={searchResData}
			table_name="boston-police-index"
			pageSize={10}
			pageSizeOptions={[5, 10, 15, 20]}
			rowCount={searchResData.length}
			hide={[]}
			isServerSideRendered={false}
			keyword={keyword}
			customToolbar={GridToolbar}
			loading={loading}
			checkboxSelection={true}
			className="mx-auto min-h-[300px] bg-white"
			style={{ minWidth: "80%" }}
			initialState={{
				pagination: { paginationModel: { pageSize: 10 } },
				columns: {
					columnVisibilityModel: {},
				},
			}}
			exportOptions={{
				csvOptions: {
					getRowsToExport: getRowsToExportHandler,
					fileName: "boston-police-index-export",
				},
				printOptions: {
					getRowsToExport: getRowsToExportHandler,
					disableToolbarButton: true,
				},
			}}
		/>
	);
}
