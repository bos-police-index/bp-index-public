import Button, { ButtonProps } from "@mui/material/Button";
import { createSvgIcon } from "@mui/material";
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarFilterButton, GridToolbarDensitySelector, GridCsvExportOptions, useGridApiContext, GridColDef } from "@mui/x-data-grid";

export default function DataTable({ cols, table, table_name, height, pageSize, pageSizeOptions }: { cols: GridColDef[]; table: any[]; table_name: string; height: string; pageSize: number; pageSizeOptions: number[] }) {
	const ExportIcon = createSvgIcon(<path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z" />, "SaveAlt");
	const CustomToolbar = () => {
		const buttonBaseProps: ButtonProps = {
			color: "primary",
			size: "small",
			startIcon: <ExportIcon />,
		};

		const apiRef = useGridApiContext();
		const exportAll = (options: GridCsvExportOptions) => {
			const optionsForExport = {
				...options,
				allColumns: true,
			};
			apiRef.current.exportDataAsCsv(optionsForExport);
		};
		const handleExport = (allColumns?: boolean) => {
			let options = {
				fileName: `${table_name}.csv`,
			};
			if (allColumns) {
				exportAll(options);
				return;
			}

			apiRef.current.exportDataAsCsv(options);
		};
		return (
			<GridToolbarContainer>
				<GridToolbarColumnsButton />
				<GridToolbarFilterButton />
				<GridToolbarDensitySelector />
				<Button {...buttonBaseProps} onClick={() => handleExport()}>
					Export Current Columns
				</Button>
				<Button {...buttonBaseProps} onClick={() => handleExport(true)}>
					Export All Columns
				</Button>
			</GridToolbarContainer>
		);
	};
	return (
		<DataGrid
			className={"w-full bg-white"}
			sx={{ height: height }}
			columns={cols}
			rows={table}
			density={"compact"}
			slots={{ toolbar: CustomToolbar }}
			pageSizeOptions={pageSizeOptions}
			autoHeight={height === "auto"}
			initialState={{
				pagination: {
					paginationModel: {
						pageSize: pageSize,
					},
				},
			}}
		/>
	);
}
