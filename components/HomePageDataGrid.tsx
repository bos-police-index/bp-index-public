import React from "react";
import { GridToolbar } from "@mui/x-data-grid";
import DataTable from "./DataTable";
import { GridColDef } from "@mui/x-data-grid";
import { styled } from "@mui/material/styles";
import { Paper } from "@mui/material";

interface HomePageDataGridProps {
	cols: GridColDef[];
	searchResData: any[];
	loading: boolean;
	keyword?: string;
	getRowsToExportHandler?: any;
}

const StyledGridContainer = styled(Paper)(({ theme }) => ({
  padding: '1.5rem',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-md)',
  transition: 'var(--transition-default)',
  background: 'var(--white)',
  
  '&:hover': {
    boxShadow: 'var(--shadow-lg)',
  },

  '.MuiDataGrid-root': {
    border: 'none',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
  },

  '.MuiDataGrid-columnHeaders': {
    backgroundColor: 'var(--light_gray)',
    borderBottom: '2px solid var(--bpi_deep_green)',
  },

  '.MuiDataGrid-cell': {
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },

  '.MuiDataGrid-row:hover': {
    backgroundColor: 'var(--light_gray)',
  },

  '.MuiDataGrid-toolbarContainer': {
    padding: '1rem',
    gap: '0.5rem',
  },

  '.MuiButton-root': {
    borderRadius: 'var(--radius-md)',
    textTransform: 'none',
    fontWeight: 500,
  },
}));

export default function HomePageDataGrid({ 
	cols, 
	searchResData, 
	loading, 
	keyword,
	getRowsToExportHandler 
}: HomePageDataGridProps) {
	return (
		<StyledGridContainer elevation={0}>
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
				className="mx-auto min-h-[300px]"
				style={{ 
					minWidth: "100%",
					height: "calc(100vh - 200px)",
					maxHeight: "800px"
				}}
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
		</StyledGridContainer>
	);
}
