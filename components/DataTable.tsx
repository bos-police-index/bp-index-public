import { useCallback, useEffect, useState } from "react";

import { useQuery } from "@apollo/client";

import Button, { ButtonProps } from "@mui/material/Button";
import { createSvgIcon } from "@mui/material";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { 
	DataGrid, 
	GridToolbarContainer,
	GridCsvExportOptions, 
	useGridApiContext, 
	GridColDef, 
	GridFilterModel, 
	GridSortModel, 
	gridFilteredSortedRowIdsSelector, 
	gridPaginationModelSelector,
	GridDensity
} from "@mui/x-data-grid";

import { bpi_light_green, bpi_deep_green } from "@styles/theme/lightTheme";
import { dataToColumns } from "@pages/data/tables/[table_name]";
import { functionMapping } from "@utility/createMUIGrid";

import EmptyState from "./EmptyState";

export default function DataTable({
	cols,
	table,
	table_name,
	pageSize,
	pageSizeOptions,
	rowCount,
	hide,
	isServerSideRendered,
	query,
	keyword,
	customToolbar,
	loading = false,
	checkboxSelection = true,
	className = "w-full bg-white",
	style,
	initialState,
	exportOptions,
	onRowClick,
}: {
	cols: GridColDef[];
	table: any[];
	table_name: string;
	pageSize: number;
	pageSizeOptions: number[];
	rowCount: number;
	hide: string[];
	isServerSideRendered: boolean;
	query?: any;
	keyword?: string;
	customToolbar?: React.ComponentType;
	loading?: boolean;
	checkboxSelection?: boolean;
	className?: string;
	style?: React.CSSProperties;
	initialState?: any;
	exportOptions?: any;
	onRowClick?: (params: any) => void;
}) {
	const [columnVisibilityModel, setColumnVisibilityModel] = useState(() => {
		const allVisible = cols.reduce((acc, col) => {
			acc[col.field] = true;
			return acc;
		}, {});
		
		hide.forEach(field => {
			allVisible[field] = false;
		});
		
		return allVisible;
	});

	const CustomToolbar = () => {
		const [density, setDensity] = useState<GridDensity>("comfortable");
		const [columnsMenuAnchor, setColumnsMenuAnchor] = useState<null | HTMLElement>(null);
		const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
		const [filtersMenuAnchor, setFiltersMenuAnchor] = useState<null | HTMLElement>(null);
		const [densityMenuAnchor, setDensityMenuAnchor] = useState<null | HTMLElement>(null);
		const [filterValues, setFilterValues] = useState<Record<string, string>>({});
		const [pendingFilterValues, setPendingFilterValues] = useState<Record<string, string>>({});

		// Custom icons
		const ExportIcon = createSvgIcon(<path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z" />, "SaveAlt");
		const ColumnsIcon = createSvgIcon(<path d="M3 3h18v2H3zm0 16h18v2H3zm0-8h18v2H3z"/>, "ViewColumns");
		const FilterIcon = createSvgIcon(<path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>, "FilterList");
		const DensityIcon = createSvgIcon(<path d="M4 14h4v-4H4v4zm0 5h4v-4H4v4zm0-10h4V5H4v4zm5 5h12v-4H9v4zm0 5h12v-4H9v4zm0-10h12V5H9v4z"/>, "ViewCompact");
		const CsvIcon = createSvgIcon(<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>, "Description");

		
		const buttonBaseProps: ButtonProps = {
			size: "medium",
			sx: {
				textTransform: 'none',
				fontSize: '0.875rem',
				fontWeight: 500,
				borderRadius: '8px',
				padding: '6px 12px',
				marginRight: '8px',
				color: '#374151',
				backgroundColor: '#f8fafc',
				border: '1px solid #e5e7eb',
				'&:hover': {
					backgroundColor: '#f1f5f9',
					borderColor: bpi_light_green,
				},
				'&:active': {
					backgroundColor: `${bpi_light_green}15`,
				},
			}
		};

		const apiRef = useGridApiContext();

		const getRowsToExportHandler = () => {
			const selectedRowKeys = apiRef.current.getSelectedRows().keys();
			const selectedRowIds = Array.from(selectedRowKeys);

			if (selectedRowIds && selectedRowIds.length > 0) {
				return selectedRowIds;
			}

			const filteredSortedRowIds = gridFilteredSortedRowIdsSelector(apiRef);
			const { page, pageSize } = gridPaginationModelSelector(apiRef);
			const pagedRowIds = filteredSortedRowIds.slice(
				page * pageSize,
				(page + 1) * pageSize,
			);
			return pagedRowIds;
		};

		const handleExport = (exportAllColumns?: boolean) => {
			const csvExportOptions: GridCsvExportOptions = {
				fileName: `${table_name}.csv`,
				getRowsToExport: getRowsToExportHandler,
				allColumns: exportAllColumns === true, 
			};
			apiRef.current.exportDataAsCsv(csvExportOptions);
		};



		const handleColumnVisibilityChange = (field: string, isCurrentlyVisible: boolean) => {
			const newModel = {
				...columnVisibilityModel,
				[field]: !isCurrentlyVisible
			};
			setColumnVisibilityModel(newModel);
			apiRef.current.setColumnVisibilityModel(newModel);
		};

		const handleDensityChange = (newDensity: GridDensity) => {
			setDensity(newDensity);
			apiRef.current.setDensity(newDensity);
			setDensityMenuAnchor(null);
		};

		return (
			<GridToolbarContainer>
				<Tooltip title="Choose columns">
					<Button
						{...buttonBaseProps}
						startIcon={<ColumnsIcon />}
						onClick={(e) => setColumnsMenuAnchor(e.currentTarget)}
					>
						Columns
					</Button>
				</Tooltip>
				<Menu
					anchorEl={columnsMenuAnchor}
					open={Boolean(columnsMenuAnchor)}
					onClose={() => setColumnsMenuAnchor(null)}
					PaperProps={{
						elevation: 3,
						sx: {
							mt: 1,
							minWidth: 220,
							maxHeight: 400,
							borderRadius: '8px',
							backgroundColor: '#ffffff',
							'& .MuiList-root': {
								padding: 2,
								overflow: 'auto',
								maxHeight: 'calc(400px - 16px)',
								backgroundColor: '#ffffff',
								'&::-webkit-scrollbar': {
									width: '8px',
								},
								'&::-webkit-scrollbar-track': {
									background: '#f1f5f9',
									borderRadius: '4px',
								},
								'&::-webkit-scrollbar-thumb': {
									background: '#cbd5e1',
									borderRadius: '4px',
									'&:hover': {
										background: '#94a3b8',
									},
								},
							},
							'& .MuiMenuItem-root': {
								py: 0.5,
								px: 2,
								'&:hover': {
									backgroundColor: `${bpi_light_green}15`,
								},
							},
						},
					}}
				>
					{cols.map((col) => (
						<MenuItem
							key={col.field}
							onClick={(e) => {
								e.preventDefault();
								handleColumnVisibilityChange(col.field, columnVisibilityModel[col.field]);
							}}
							sx={{ width: '100%' }}
						>
							<FormControlLabel
								control={
									<Checkbox
										checked={columnVisibilityModel[col.field]}
										sx={{
											'&.Mui-checked': {
												color: bpi_light_green,
											},
											'&:hover': {
												backgroundColor: `${bpi_light_green}15`,
											},
										}}
									/>
								}
								label={col.headerName || col.field}
								sx={{ 
									width: '100%',
									m: 0,
									'& .MuiFormControlLabel-label': {
										fontSize: '0.875rem',
										color: '#374151',
									}
								}}
							/>
						</MenuItem>
					))}
				</Menu>

				<Tooltip title="Filter data">
					<Button
						{...buttonBaseProps}
						startIcon={<FilterIcon />}
						onClick={(e) => setFiltersMenuAnchor(e.currentTarget)}
					>
						Filters
					</Button>
				</Tooltip>
				<Menu
					anchorEl={filtersMenuAnchor}
					open={Boolean(filtersMenuAnchor)}				onClose={() => {
					setFiltersMenuAnchor(null);
					setPendingFilterValues(filterValues);
				}}
				PaperProps={{
					elevation: 3,
					sx: {
						mt: 1,
						width: 320,
						maxHeight: '80vh',
						borderRadius: '8px',
						'& .MuiList-root': {
							padding: 2,
						},
						},
					}}
				>
					<Box 
						sx={{ 
							display: 'flex', 
							flexDirection: 'column', 
							gap: 2,
							overflow: 'auto',
							maxHeight: 'calc(80vh - 32px)', 
							'&::-webkit-scrollbar': {
								width: '8px',
							},
							'&::-webkit-scrollbar-track': {
								background: '#f1f5f9',
								borderRadius: '4px',
							},
							'&::-webkit-scrollbar-thumb': {
								background: '#cbd5e1',
								borderRadius: '4px',
								'&:hover': {
									background: '#94a3b8',
								},
							},
						}}
					>
						<Box sx={{ 
							position: 'sticky', 
							top: 0, 
							backgroundColor: 'white',
							zIndex: 1,
							pb: 2,
							borderBottom: '1px solid #e2e8f0'
						}}>
							<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#374151', mb: 1 }}>
								Filter Data
							</Typography>
							<Box sx={{ display: 'flex', gap: 1 }}>
								<Button
									size="small"
									onClick={() => {
										setPendingFilterValues({});
										setFilterValues({});
										apiRef.current.setFilterModel({ items: [] });
									}}
									sx={{
										textTransform: 'none',
										color: '#374151',
										backgroundColor: '#f8fafc',
										border: '1px solid #e5e7eb',
										'&:hover': {
											backgroundColor: '#f1f5f9',
											borderColor: bpi_light_green,
										},
									}}
								>
									Clear All Filters
								</Button>
								<Button
									size="small"
									variant="contained"
									onClick={() => {
										setFilterValues(pendingFilterValues);
										const filterItems = Object.entries(pendingFilterValues)
											.filter(([_, value]) => value !== '')
											.map(([field, value]) => ({
												field,
												operator: cols.find(col => col.field === field)?.type === 'number' ? '=' : 'contains',
												value
											}));
										apiRef.current.setFilterModel({ items: filterItems });
										setFiltersMenuAnchor(null);
									}}
									sx={{
										textTransform: 'none',
										backgroundColor: bpi_light_green,
										'&:hover': {
											backgroundColor: bpi_deep_green,
										},
									}}
								>
									Apply Filters
								</Button>
							</Box>
						</Box>

						{cols.map((col) => (
							<Box key={col.field} sx={{ px: 1 }}>
								<Typography variant="caption" sx={{ fontWeight: 500, color: '#374151', mb: 0.5, display: 'block' }}>
									{col.headerName}
								</Typography>
								<TextField
									fullWidth
									size="small"
									placeholder={col.type === 'number' ? 'Enter a number' : 'Type to filter...'}
									value={pendingFilterValues[col.field] || ''}
									onChange={(e) => {
										const value = e.target.value;
										setPendingFilterValues(prev => ({
											...prev,
											[col.field]: value
										}));
									}}
									sx={{
										backgroundColor: '#ffffff',
										'& .MuiOutlinedInput-root': {
											fontSize: '0.875rem',
											'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
												borderColor: bpi_light_green,
											},
											'&:hover .MuiOutlinedInput-notchedOutline': {
												borderColor: bpi_light_green,
											},
										},
									}}
									inputProps={{
										type: col.type === 'number' ? 'number' : 'text',
									}}
								/>
							</Box>
						))}
					</Box>
				</Menu>

				<Tooltip title="Adjust table density">
					<Button
						{...buttonBaseProps}
						startIcon={<DensityIcon />}
						onClick={(e) => setDensityMenuAnchor(e.currentTarget)}
					>
						Density
					</Button>
				</Tooltip>
				<Menu
					anchorEl={densityMenuAnchor}
					open={Boolean(densityMenuAnchor)}
					onClose={() => setDensityMenuAnchor(null)}
					PaperProps={{
						elevation: 3,
						sx: {
							mt: 1,
							minWidth: 180,
							borderRadius: '8px',
						},
					}}
				>
					<MenuItem onClick={() => handleDensityChange('compact')}>
						<ListItemText>Compact</ListItemText>
					</MenuItem>
					<MenuItem onClick={() => handleDensityChange('comfortable')}>
						<ListItemText>Comfortable</ListItemText>
					</MenuItem>
					<MenuItem onClick={() => handleDensityChange('standard')}>
						<ListItemText>Standard</ListItemText>
					</MenuItem>
				</Menu>

				<Tooltip title="Export data">
					<Button
						{...buttonBaseProps}
						startIcon={<ExportIcon />}
						onClick={(e) => setExportMenuAnchor(e.currentTarget)}
					>
						Export
					</Button>
				</Tooltip>
				<Menu
					anchorEl={exportMenuAnchor}
					open={Boolean(exportMenuAnchor)}
					onClose={() => setExportMenuAnchor(null)}
					PaperProps={{
						elevation: 3,
						sx: {
							mt: 1,
							minWidth: 320,
							borderRadius: '8px',
							'& .MuiMenuItem-root': {
								py: 1,
								'&:hover': {
									backgroundColor: `${bpi_light_green}15`,
								},
							},
						},
					}}
				>
					<Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0' }}>
						<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151', mb: 1 }}>
							Export Options
						</Typography>
						<Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
							• If rows are selected: Only selected rows will be exported
						</Typography>
						<Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
							• If no selection: Current page will be exported
						</Typography>
						<Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
							• If all rows selected: Entire dataset will be exported
						</Typography>
					</Box>
					<MenuItem onClick={() => {
						handleExport(false);
						setExportMenuAnchor(null);
					}}>
						<ListItemIcon>
							<CsvIcon fontSize="small" />
						</ListItemIcon>
						<ListItemText>Export as CSV</ListItemText>
					</MenuItem>
				</Menu>
			</GridToolbarContainer>
		);
	};

	function noRowsOverlay() {
		return <EmptyState message={`According to available data, this individual has no ${table_name.substring(table_name.lastIndexOf("-") + 1)}`} keyword={keyword} />;
	}

	function noResultsOverlay() {
		return <EmptyState message="No records for this filter given available data" />;
	}

	const DataGridClientSidePaginated = () => {
		const ToolbarComponent = customToolbar || CustomToolbar;
		
		return (
			<DataGrid
				className={className}
				sx={{
					border: 'none',
					'& .MuiDataGrid-root': {
						border: 'none',
					},
					'& .MuiDataGrid-main': {
						borderRadius: '8px',
					},
					'& .MuiDataGrid-columnHeaders': {
						backgroundColor: '#f8fafc',
						borderBottom: '2px solid #e2e8f0',
						borderRadius: '8px 8px 0 0',
						'& .MuiDataGrid-columnHeader': {
							fontWeight: 600,
							fontSize: '0.875rem',
							color: '#374151',
						},
					},
					'& .MuiDataGrid-cell': {
						borderBottom: '1px solid #f1f5f9',
						fontSize: '0.875rem',
						color: '#4b5563',
					},
					'& .MuiDataGrid-row': {
						'&:hover': {
							backgroundColor: '#f8fafc',
						},
						'&.Mui-selected': {
							backgroundColor: `${bpi_light_green}15`, 
							'&:hover': {
								backgroundColor: `${bpi_light_green}25`, 
							},
						},
					},
					'& .MuiDataGrid-footerContainer': {
						borderTop: '2px solid #e2e8f0',
						backgroundColor: '#f8fafc',
						borderRadius: '0 0 8px 8px',
					},
					'& .MuiSwitch-switchBase.Mui-checked': {
						color: bpi_light_green,
					},
					'& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
						backgroundColor: bpi_light_green,
					},
					'& .MuiButtonBase-root': {
						color: bpi_light_green,
					},
					'& .MuiCheckbox-root.Mui-checked': { 
						color: bpi_light_green, 
					},
					'& .MuiDataGrid-toolbarContainer': {
						padding: '16px',
						backgroundColor: '#f8fafc',
						borderBottom: '1px solid #e2e8f0',
						'@media print': {
							display: 'none !important',
						},
						'& .MuiButton-root': {
							color: '#374151',
							fontWeight: 500,
							'&:hover': {
								backgroundColor: '#e5e7eb',
							},
						},
					},
					...style,
				}}
				columns={cols}
				rows={table}
				density={"comfortable"}
				slots={{
					toolbar: ToolbarComponent,
					noRowsOverlay: () => noRowsOverlay(),
					noResultsOverlay: () => noResultsOverlay(),
				}}
				slotProps={{
					toolbar: exportOptions,
				}}
				pageSizeOptions={pageSizeOptions}
				autoHeight={true}
				style={{ minHeight: "20rem", ...style }}
				initialState={initialState || {
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
				checkboxSelection={checkboxSelection}
				columnVisibilityModel={columnVisibilityModel}
				onColumnVisibilityModelChange={(model) => setColumnVisibilityModel(model)}
				loading={loading}
				onRowClick={onRowClick}
				disableColumnMenu={true}
			/>
		);
	};

	const DataGridServerSidePaginated = () => {
		const [paginationModel, setPaginationModel] = useState({
			page: 0,
			pageSize: 25,
		});
		const [queryOptions, setQueryOptions] = useState<any>();

		const getFieldType = (fieldName: string): string => {
			const fieldType = functionMapping[table_name].find((field) => field.field === fieldName)?.type;
			if (!fieldType) {
				console.warn(`Field type for ${fieldName} not found in functionMapping`);
				return "unknown";
			}
			if (fieldType === "string") {
				return "string";
			} else if (fieldType === "number") {
				return "number";
			}
			return "unknown";
		};

		const onFilterChange = useCallback((filterModel: GridFilterModel) => {
			const filters = {} as string[];
			filterModel.items.forEach((item) => {
				if (item.field && item.value !== undefined && item.value !== null && item.value !== "") {
					const FieldType = getFieldType(item.field);
					switch (FieldType) {
						case "string":
							filters[item.field] = item.value.toString(); 
							break;
						case "number":
							filters[item.field] = parseInt(item.value) || item.value; 
							break;
						default:
							console.warn(`Unsupported field type for ${item.field}: ${FieldType}`);
							break;
					}
				}
			});

			setQueryOptions((prev) => ({
				...prev,
				filters: filters,
			}));
		}, []);

		const handleSortModelChange = useCallback((sortModel: GridSortModel) => {
			let orderBy = ["NATURAL"];

			if (sortModel.length > 0) {
				const { field, sort } = sortModel[0];

				orderBy = [
					field
						.split(/(?=[A-Z])/)
						.join("_")
						.toUpperCase() + (sort === "desc" ? "_DESC" : "_ASC"),
				];
			}

			setQueryOptions((prev) => ({
				...prev,
				orderBy,
			}));
		}, []);

		const { loading, error, data, refetch } = useQuery(query, {
			variables: {
				offset: paginationModel.page * paginationModel.pageSize,
				page_size: paginationModel.pageSize,
				order_by: queryOptions?.orderBy || ["NATURAL"],
				filters: queryOptions?.filters || {},
			},
			fetchPolicy: "network-only",
		});

		const handlePaginationChange = (newModel) => {
			setPaginationModel(newModel);
			refetch({ offset: newModel.page * newModel.pageSize, page_size: paginationModel.pageSize, ...queryOptions });
		};

		useEffect(() => {
			refetch({
				offset: paginationModel.page * paginationModel.pageSize,
				page_size: paginationModel.pageSize,
				order_by: queryOptions?.orderBy ?? ["NATURAL"],
			});
		}, [queryOptions, paginationModel.page, paginationModel.pageSize, refetch]);

		let { formattedData, rowCount } = dataToColumns(data, table_name);
		const ToolbarComponent = customToolbar || CustomToolbar;

		return (
			<DataGrid
				className={className}
				sx={{
					border: 'none',
					'& .MuiDataGrid-root': {
						border: 'none',
					},
					'& .MuiDataGrid-main': {
						borderRadius: '8px',
					},
					'& .MuiDataGrid-columnHeaders': {
						backgroundColor: '#f8fafc',
						borderBottom: '2px solid #e2e8f0',
						borderRadius: '8px 8px 0 0',
						'& .MuiDataGrid-columnHeader': {
							fontWeight: 600,
							fontSize: '0.875rem',
							color: '#374151',
						},
					},
					'& .MuiDataGrid-cell': {
						borderBottom: '1px solid #f1f5f9',
						fontSize: '0.875rem',
						color: '#4b5563',
					},
					'& .MuiDataGrid-row': {
						'&:hover': {
							backgroundColor: '#f8fafc',
						},
						'&.Mui-selected': {
							backgroundColor: `${bpi_light_green}15`,
							'&:hover': {
								backgroundColor: `${bpi_light_green}25`,
							},
						},
					},
					'& .MuiDataGrid-footerContainer': {
						borderTop: '2px solid #e2e8f0',
						backgroundColor: '#f8fafc',
						borderRadius: '0 0 8px 8px',
					},
					'& .MuiSwitch-switchBase.Mui-checked': {
						color: bpi_light_green,
					},
					'& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
						backgroundColor: bpi_light_green,
					},
					'& .MuiButtonBase-root': {
						color: bpi_light_green,
					},
					'& .MuiCheckbox-root.Mui-checked': { 
						color: bpi_light_green, 
					},
					'& .MuiDataGrid-toolbarContainer': {
						padding: '16px',
						backgroundColor: '#f8fafc',
						borderBottom: '1px solid #e2e8f0',
						'@media print': {
							display: 'none !important',
						},
						'& .MuiButton-root': {
							color: '#374151',
							fontWeight: 500,
							'&:hover': {
								backgroundColor: '#e5e7eb',
							},
						},
					},
					...style,
				}}
				columns={cols}
				rows={formattedData || []}
				density={"comfortable"}
				slots={{
					toolbar: ToolbarComponent,
					noRowsOverlay: () => noRowsOverlay(),
					noResultsOverlay: () => noResultsOverlay(),
				}}
				slotProps={{
					toolbar: exportOptions,
				}}
				pageSizeOptions={pageSizeOptions}
				autoHeight={true}
				style={{ minHeight: "64rem", ...style }}
				loading={loading}
				rowCount={rowCount}
				checkboxSelection={checkboxSelection}
				columnVisibilityModel={columnVisibilityModel}
				onColumnVisibilityModelChange={(model) => setColumnVisibilityModel(model)}
				paginationMode="server"
				paginationModel={paginationModel}
				onPaginationModelChange={handlePaginationChange}
				filterMode="server"
				onFilterModelChange={onFilterChange}
				sortingMode="server"
				onSortModelChange={handleSortModelChange}
				onRowClick={onRowClick}
				disableColumnMenu={true}
			/>
		);
	};

	return isServerSideRendered ? <DataGridServerSidePaginated /> : <DataGridClientSidePaginated />;
}