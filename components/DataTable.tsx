import Button, { ButtonProps } from "@mui/material/Button";
import { createSvgIcon } from "@mui/material";
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer, GridToolbarFilterButton, GridToolbarDensitySelector, GridCsvExportOptions, useGridApiContext, GridColDef } from "@mui/x-data-grid";
import { StyledGridOverlay } from "@styles/reusedStyledComponents";
import { bpi_light_green } from "@styles/theme/lightTheme";

export default function DataTable({ cols, table, table_name, height, pageSize, pageSizeOptions, rowCount, hide }: { cols: GridColDef[]; table: any[]; table_name: string; height: string; pageSize: number; pageSizeOptions: number[]; rowCount: number | undefined; hide: string[] }) {
	const hidingColumnsMap = hide.reduce((acc, item) => {
		acc[item] = false;
		return acc;
	}, {});


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

	function noRowsOverlay() {
		return (
			<StyledGridOverlay style={{ margin: "3rem" }}>
				<svg width="120" height="100" viewBox="0 0 184 152" aria-hidden focusable="false">
					<g fill="none" fillRule="evenodd">
						<g transform="translate(24 31.67)">
							<ellipse className="ant-empty-img-5" cx="67.797" cy="106.89" rx="67.797" ry="12.668" />
							<path className="ant-empty-img-1" d="M122.034 69.674L98.109 40.229c-1.148-1.386-2.826-2.225-4.593-2.225h-51.44c-1.766 0-3.444.839-4.592 2.225L13.56 69.674v15.383h108.475V69.674z" />
							<path className="ant-empty-img-2" d="M33.83 0h67.933a4 4 0 0 1 4 4v93.344a4 4 0 0 1-4 4H33.83a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4z" />
							<path
								className="ant-empty-img-3"
								d="M42.678 9.953h50.237a2 2 0 0 1 2 2V36.91a2 2 0 0 1-2 2H42.678a2 2 0 0 1-2-2V11.953a2 2 0 0 1 2-2zM42.94 49.767h49.713a2.262 2.262 0 1 1 0 4.524H42.94a2.262 2.262 0 0 1 0-4.524zM42.94 61.53h49.713a2.262 2.262 0 1 1 0 4.525H42.94a2.262 2.262 0 0 1 0-4.525zM121.813 105.032c-.775 3.071-3.497 5.36-6.735 5.36H20.515c-3.238 0-5.96-2.29-6.734-5.36a7.309 7.309 0 0 1-.222-1.79V69.675h26.318c2.907 0 5.25 2.448 5.25 5.42v.04c0 2.971 2.37 5.37 5.277 5.37h34.785c2.907 0 5.277-2.421 5.277-5.393V75.1c0-2.972 2.343-5.426 5.25-5.426h26.318v33.569c0 .617-.077 1.216-.221 1.789z"
							/>
						</g>
						<path className="ant-empty-img-3" d="M149.121 33.292l-6.83 2.65a1 1 0 0 1-1.317-1.23l1.937-6.207c-2.589-2.944-4.109-6.534-4.109-10.408C138.802 8.102 148.92 0 161.402 0 173.881 0 184 8.102 184 18.097c0 9.995-10.118 18.097-22.599 18.097-4.528 0-8.744-1.066-12.28-2.902z" />
						<g className="ant-empty-img-4" transform="translate(149.65 15.383)">
							<ellipse cx="20.654" cy="3.167" rx="2.849" ry="2.815" />
							<path d="M5.698 5.63H0L2.898.704zM9.259.704h4.985V5.63H9.259z" />
						</g>
					</g>
				</svg>
				According to available data, this individual has no <b>{table_name.substring(table_name.lastIndexOf("-") + 1)}</b>
			</StyledGridOverlay>
		);
	}

	function noResultsOverlay() {
		return (
			<StyledGridOverlay style={{ marginTop: "3rem" }}>
				<svg width="120" height="100" viewBox="0 0 184 152" aria-hidden focusable="false">
					<g fill="none" fillRule="evenodd">
						<g transform="translate(24 31.67)">
							<ellipse className="ant-empty-img-5" cx="67.797" cy="106.89" rx="67.797" ry="12.668" />
							<path className="ant-empty-img-1" d="M122.034 69.674L98.109 40.229c-1.148-1.386-2.826-2.225-4.593-2.225h-51.44c-1.766 0-3.444.839-4.592 2.225L13.56 69.674v15.383h108.475V69.674z" />
							<path className="ant-empty-img-2" d="M33.83 0h67.933a4 4 0 0 1 4 4v93.344a4 4 0 0 1-4 4H33.83a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4z" />
							<path
								className="ant-empty-img-3"
								d="M42.678 9.953h50.237a2 2 0 0 1 2 2V36.91a2 2 0 0 1-2 2H42.678a2 2 0 0 1-2-2V11.953a2 2 0 0 1 2-2zM42.94 49.767h49.713a2.262 2.262 0 1 1 0 4.524H42.94a2.262 2.262 0 0 1 0-4.524zM42.94 61.53h49.713a2.262 2.262 0 1 1 0 4.525H42.94a2.262 2.262 0 0 1 0-4.525zM121.813 105.032c-.775 3.071-3.497 5.36-6.735 5.36H20.515c-3.238 0-5.96-2.29-6.734-5.36a7.309 7.309 0 0 1-.222-1.79V69.675h26.318c2.907 0 5.25 2.448 5.25 5.42v.04c0 2.971 2.37 5.37 5.277 5.37h34.785c2.907 0 5.277-2.421 5.277-5.393V75.1c0-2.972 2.343-5.426 5.25-5.426h26.318v33.569c0 .617-.077 1.216-.221 1.789z"
							/>
						</g>
						<path className="ant-empty-img-3" d="M149.121 33.292l-6.83 2.65a1 1 0 0 1-1.317-1.23l1.937-6.207c-2.589-2.944-4.109-6.534-4.109-10.408C138.802 8.102 148.92 0 161.402 0 173.881 0 184 8.102 184 18.097c0 9.995-10.118 18.097-22.599 18.097-4.528 0-8.744-1.066-12.28-2.902z" />
						<g className="ant-empty-img-4" transform="translate(149.65 15.383)">
							<ellipse cx="20.654" cy="3.167" rx="2.849" ry="2.815" />
							<path d="M5.698 5.63H0L2.898.704zM9.259.704h4.985V5.63H9.259z" />
						</g>
					</g>
				</svg>

				<p className="mt-1">No records for this filter given available data</p>
			</StyledGridOverlay>
		);
	}
	return (
		<DataGrid
			className={"w-full bg-white"}
			sx={{
				"& .MuiSwitch-switchBase.Mui-checked": {
					backgroundColor: bpi_light_green,
				},
				"& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
					backgroundColor: bpi_light_green,
				},
				"& .MuiButtonBase-root": {
					color: bpi_light_green,
				},
			}}
			columns={cols}
			rows={table}
			density={"compact"}
			slots={{
				toolbar: CustomToolbar,
				noRowsOverlay: () => noRowsOverlay(),
				noResultsOverlay: () => noResultsOverlay(),
			}}
			pageSizeOptions={pageSizeOptions}
			autoHeight={true}
			style={{ minHeight: "20rem" }}
			initialState={{
				sorting: {
					sortModel: [{ field: "year", sort: "desc" }],
				},
				pagination: {
					paginationModel: {
						pageSize: pageSize,
					},
				},
			}}
			rowCount={rowCount}
			columnVisibilityModel={hidingColumnsMap}
		/>
	);
}
