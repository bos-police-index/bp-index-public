import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useQuery } from "@apollo/client";

import Button, { ButtonProps } from "@mui/material/Button";
import { createSvgIcon } from "@mui/material";
import Chip from "@mui/material/Chip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import {
	DataGrid,
	GridToolbarContainer,
	useGridApiContext,
	GridColDef,
	GridSortModel,
	GridPaginationModel,
	GridColumnVisibilityModel,
	gridFilteredSortedRowIdsSelector,
	gridPaginationModelSelector,
	selectedGridRowsCountSelector,
	useGridSelector,
	GridDensity,
} from "@mui/x-data-grid";

import apolloClient from "@lib/apollo-client";
import { bpi_light_green } from "@styles/theme/lightTheme";
import { dataToColumns } from "@pages/data/tables/[table_name]";
import { EXPLORE_DISTINCT, exploreFilterJson, exploreOrderBy, exploreTables, sqlColumnOf } from "@utility/exploreTables";
import { FilterState, FilterableColDef, applyClientFilters, describeFilter, distinctValues, downloadCsv, filterKindOf, isFilterActive, rowsToCsv } from "@utility/tableFilters";
import { table_name_to_alias_map } from "@utility/dataViewAliases";

import FilterPanel, { OptionsLoader } from "./table/FilterPanel";
import EmptyState from "./EmptyState";

/** Largest "all matching rows" download fetched page by page in the browser. */
const EXPORT_ROW_CAP = 100_000;
const EXPORT_CHUNK = 5_000;

const ExportIcon = createSvgIcon(<path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z" />, "SaveAlt");
const ColumnsIcon = createSvgIcon(<path d="M3 3h18v2H3zm0 16h18v2H3zm0-8h18v2H3z" />, "ViewColumns");
const FilterIcon = createSvgIcon(<path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />, "FilterList");
const DensityIcon = createSvgIcon(<path d="M4 14h4v-4H4v4zm0 5h4v-4H4v4zm0-10h4V5H4v4zm5 5h12v-4H9v4zm0 5h12v-4H9v4zm0-10h12V5H9v4z" />, "ViewCompact");
const CsvIcon = createSvgIcon(<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />, "Description");

const buttonBaseProps: ButtonProps = {
	size: "medium",
	sx: {
		textTransform: "none",
		fontSize: "0.875rem",
		fontWeight: 500,
		borderRadius: "8px",
		padding: "6px 12px",
		marginRight: "8px",
		color: "#374151",
		backgroundColor: "#f8fafc",
		border: "1px solid #e5e7eb",
		"&:hover": { backgroundColor: "#f1f5f9", borderColor: bpi_light_green },
		"&:active": { backgroundColor: `${bpi_light_green}15` },
	},
};

const gridSx = (style?: React.CSSProperties) => ({
	border: "none",
	"& .MuiDataGrid-root": { border: "none" },
	"& .MuiDataGrid-main": { borderRadius: "8px" },
	"& .MuiDataGrid-columnHeaders": {
		backgroundColor: "#f8fafc",
		borderBottom: "2px solid #e2e8f0",
		borderRadius: "8px 8px 0 0",
		"& .MuiDataGrid-columnHeader": { fontWeight: 600, fontSize: "0.875rem", color: "#374151" },
	},
	"& .MuiDataGrid-cell": { borderBottom: "1px solid #f1f5f9", fontSize: "0.875rem", color: "#4b5563" },
	"& .MuiDataGrid-row": {
		"&:hover": { backgroundColor: "#f8fafc" },
		"&.Mui-selected": { backgroundColor: `${bpi_light_green}15`, "&:hover": { backgroundColor: `${bpi_light_green}25` } },
	},
	"& .MuiDataGrid-footerContainer": { borderTop: "2px solid #e2e8f0", backgroundColor: "#f8fafc", borderRadius: "0 0 8px 8px" },
	"& .MuiButtonBase-root": { color: bpi_light_green },
	"& .MuiCheckbox-root.Mui-checked": { color: bpi_light_green },
	"& .MuiDataGrid-toolbarContainer": {
		padding: "16px",
		backgroundColor: "#f8fafc",
		borderBottom: "1px solid #e2e8f0",
		"@media print": { display: "none !important" },
		"& .MuiButton-root": { color: "#374151", fontWeight: 500, "&:hover": { backgroundColor: "#e5e7eb" } },
	},
	...(style as any),
});

// ---------------------------------------------------------------------------
// Toolbar (module-level so it keeps its state across grid re-renders)
// ---------------------------------------------------------------------------

interface ExportAction {
	label: string;
	hint?: string;
	run: () => Promise<void> | void;
}

interface TableToolbarProps {
	cols: FilterableColDef[];
	columnVisibilityModel: GridColumnVisibilityModel;
	onColumnVisibilityChange: (m: GridColumnVisibilityModel) => void;
	filters: FilterState;
	onFiltersChange: (f: FilterState) => void;
	loadOptions: OptionsLoader;
	density: GridDensity;
	onDensityChange: (d: GridDensity) => void;
	fileName: string;
	matchingCount: number | null;
	/** Client grids get the rows in the grid's current filter + sort order. */
	exportMatching: (sortedRows?: any[]) => Promise<void> | void;
	extraExports?: ExportAction[];
	filterable: boolean;
}

function TableToolbar(props: TableToolbarProps) {
	const { cols, columnVisibilityModel, onColumnVisibilityChange, filters, onFiltersChange, loadOptions, onDensityChange, fileName, matchingCount, exportMatching, extraExports = [], filterable } = props;
	const apiRef = useGridApiContext();
	const [columnsMenuAnchor, setColumnsMenuAnchor] = useState<null | HTMLElement>(null);
	const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
	const [filtersAnchor, setFiltersAnchor] = useState<null | HTMLElement>(null);
	const [densityMenuAnchor, setDensityMenuAnchor] = useState<null | HTMLElement>(null);
	const [busy, setBusy] = useState<string | null>(null);

	const activeFilters = Object.entries(filters).filter(([, f]) => isFilterActive(f));

	const selectedCount = useGridSelector(apiRef, selectedGridRowsCountSelector);
	const exportVisible = () => {
		const selected = Array.from(apiRef.current.getSelectedRows().keys());
		const ids = selected.length > 0 ? selected : (() => {
			const { page, pageSize } = gridPaginationModelSelector(apiRef);
			const all = gridFilteredSortedRowIdsSelector(apiRef);
			// Server-paginated grids only hold the current page; client grids hold everything.
			return all.length > pageSize ? all.slice(page * pageSize, (page + 1) * pageSize) : all;
		})();
		const rows = ids.map((id) => apiRef.current.getRow(id)).filter(Boolean);
		const visibleCols = cols.filter((c) => columnVisibilityModel[c.field] !== false);
		downloadCsv(rowsToCsv(rows, visibleCols), selected.length > 0 ? `${fileName}_selected` : `${fileName}_page`);
	};

	const run = async (key: string, fn: () => Promise<void> | void) => {
		setBusy(key);
		try {
			await fn();
		} catch (e) {
			console.error("Export failed", e);
			alert("Export failed. Please try again, or narrow your filters.");
		} finally {
			setBusy(null);
			setExportMenuAnchor(null);
		}
	};

	const colLabel = (field: string) => cols.find((c) => c.field === field)?.headerName || field;

	return (
		<GridToolbarContainer sx={{ flexDirection: "column", alignItems: "stretch", gap: 1 }}>
			<Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", rowGap: 1 }}>
				<Tooltip title="Choose columns">
					<Button {...buttonBaseProps} startIcon={<ColumnsIcon />} onClick={(e) => setColumnsMenuAnchor(e.currentTarget)}>
						Columns
					</Button>
				</Tooltip>
				<Menu
					anchorEl={columnsMenuAnchor}
					open={Boolean(columnsMenuAnchor)}
					onClose={() => setColumnsMenuAnchor(null)}
					PaperProps={{ elevation: 3, sx: { mt: 1, minWidth: 220, maxHeight: 400, borderRadius: "8px" } }}
				>
					{cols
						.filter((c) => c.field !== "id")
						.map((col) => {
							const visible = columnVisibilityModel[col.field] !== false;
							return (
								<MenuItem key={col.field} onClick={() => onColumnVisibilityChange({ ...columnVisibilityModel, [col.field]: !visible })} sx={{ py: 0.25 }}>
									<FormControlLabel
										control={<Checkbox size="small" checked={visible} sx={{ "&.Mui-checked": { color: bpi_light_green } }} />}
										label={col.headerName || col.field}
										sx={{ m: 0, pointerEvents: "none", "& .MuiFormControlLabel-label": { fontSize: "0.875rem", color: "#374151" } }}
									/>
								</MenuItem>
							);
						})}
				</Menu>

				{filterable && (
					<>
						<Tooltip title="Filter by any column — pick several values, several columns, or a year">
							<Button {...buttonBaseProps} startIcon={<FilterIcon />} onClick={(e) => setFiltersAnchor(e.currentTarget)}>
								Filters{activeFilters.length > 0 ? ` (${activeFilters.length})` : ""}
							</Button>
						</Tooltip>
						<FilterPanel anchorEl={filtersAnchor} onClose={() => setFiltersAnchor(null)} cols={cols} filters={filters} onApply={onFiltersChange} loadOptions={loadOptions} />
					</>
				)}

				<Tooltip title="Adjust table density">
					<Button {...buttonBaseProps} startIcon={<DensityIcon />} onClick={(e) => setDensityMenuAnchor(e.currentTarget)}>
						Density
					</Button>
				</Tooltip>
				<Menu anchorEl={densityMenuAnchor} open={Boolean(densityMenuAnchor)} onClose={() => setDensityMenuAnchor(null)} PaperProps={{ elevation: 3, sx: { mt: 1, minWidth: 180, borderRadius: "8px" } }}>
					{(["compact", "standard", "comfortable"] as GridDensity[]).map((d) => (
						<MenuItem
							key={d}
							onClick={() => {
								onDensityChange(d);
								setDensityMenuAnchor(null);
							}}
						>
							<ListItemText sx={{ textTransform: "capitalize" }}>{d}</ListItemText>
						</MenuItem>
					))}
				</Menu>

				<Tooltip title="Download as CSV">
					<Button {...buttonBaseProps} startIcon={busy ? <CircularProgress size={16} /> : <ExportIcon />} onClick={(e) => setExportMenuAnchor(e.currentTarget)}>
						{busy ? "Exporting…" : "Export"}
					</Button>
				</Tooltip>
				<Menu
					anchorEl={exportMenuAnchor}
					open={Boolean(exportMenuAnchor)}
					onClose={() => setExportMenuAnchor(null)}
					PaperProps={{ elevation: 3, sx: { mt: 1, minWidth: 340, borderRadius: "8px" } }}
				>
					<MenuItem onClick={() => run("visible", exportVisible)} disabled={!!busy}>
						<ListItemIcon>
							<CsvIcon fontSize="small" />
						</ListItemIcon>
						<ListItemText
							primary={selectedCount > 0 ? `Selected rows (${selectedCount.toLocaleString()})` : "This page"}
							secondary="Visible columns only"
						/>
					</MenuItem>
					<MenuItem
						onClick={() => run("matching", () => exportMatching(gridFilteredSortedRowIdsSelector(apiRef).map((id) => apiRef.current.getRow(id)).filter(Boolean)))}
						disabled={!!busy || matchingCount === 0}
					>
						<ListItemIcon>{busy === "matching" ? <CircularProgress size={18} /> : <CsvIcon fontSize="small" />}</ListItemIcon>
						<ListItemText
							primary={`All ${activeFilters.length > 0 ? "matching " : ""}rows${matchingCount != null ? ` (${matchingCount.toLocaleString()})` : ""}`}
							secondary={
								matchingCount != null && matchingCount > EXPORT_ROW_CAP
									? `Too large to download here (max ${EXPORT_ROW_CAP.toLocaleString()}) — add a filter, e.g. a year`
									: activeFilters.length > 0
									? "Every row matching your filters, all columns"
									: "Every row in this table, all columns"
							}
						/>
					</MenuItem>
					{extraExports.map((x) => (
						<MenuItem key={x.label} onClick={() => run(x.label, x.run)} disabled={!!busy}>
							<ListItemIcon>{busy === x.label ? <CircularProgress size={18} /> : <CsvIcon fontSize="small" />}</ListItemIcon>
							<ListItemText primary={x.label} secondary={x.hint} />
						</MenuItem>
					))}
				</Menu>
			</Box>

			{activeFilters.length > 0 && (
				<Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75 }}>
					<Typography variant="caption" sx={{ color: "#6b7280", mr: 0.5 }}>
						Filtered by:
					</Typography>
					{activeFilters.map(([field, f]) => {
						const col = cols.find((c) => c.field === field);
						const kind = col ? filterKindOf(col) : null;
						return (
							<Chip
								key={field}
								size="small"
								label={`${colLabel(field)}: ${describeFilter(f, kind || "text")}`}
								onDelete={() => {
									const next = { ...filters };
									delete next[field];
									onFiltersChange(next);
								}}
								sx={{ maxWidth: 420, backgroundColor: `${bpi_light_green}20`, "& .MuiChip-deleteIcon": { color: "#6b7280" } }}
							/>
						);
					})}
					<Button size="small" onClick={() => onFiltersChange({})} sx={{ textTransform: "none", fontSize: "0.75rem", color: "#6b7280", minWidth: 0 }}>
						Clear all
					</Button>
				</Box>
			)}
		</GridToolbarContainer>
	);
}

// ---------------------------------------------------------------------------
// DataTable
// ---------------------------------------------------------------------------

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
	loading = false,
	checkboxSelection = true,
	className = "w-full bg-white",
	style,
	initialState,
	sortModel: controlledSortModel,
	onSortModelChange,
	filterable = true,
	extraExports,
	exportFileName,
	onRowClick,
	onTotalCountChange,
	getRowHeight,
}: {
	cols: FilterableColDef[];
	table: any[];
	table_name: string;
	pageSize: number;
	pageSizeOptions: number[];
	rowCount: number;
	hide: string[];
	isServerSideRendered: boolean;
	query?: any;
	keyword?: string;
	loading?: boolean;
	checkboxSelection?: boolean;
	className?: string;
	style?: React.CSSProperties;
	initialState?: any;
	/** Controlled sort (client-side tables). */
	sortModel?: GridSortModel;
	onSortModelChange?: (m: GridSortModel) => void;
	filterable?: boolean;
	/** Additional export menu entries (e.g. "Entire roster"). */
	extraExports?: ExportAction[];
	exportFileName?: string;
	onRowClick?: (params: any) => void;
	/** Server-side tables: reports the total matching the current filters. */
	onTotalCountChange?: (n: number) => void;
	getRowHeight?: () => number | "auto";
}) {
	const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>(() => {
		const m: GridColumnVisibilityModel = {};
		cols.forEach((c) => (m[c.field] = true));
		hide.forEach((f) => (m[f] = false));
		return m;
	});
	const [filters, setFilters] = useState<FilterState>({});
	const [density, setDensity] = useState<GridDensity>("comfortable");
	const fileName = (exportFileName || table_name).replace(/[^A-Za-z0-9_-]+/g, "_");

	const noRowsOverlay = useCallback(
		() => <EmptyState message={`According to available data, this individual has no ${table_name.substring(table_name.lastIndexOf("-") + 1)}`} keyword={keyword} />,
		[table_name, keyword],
	);
	const noResultsOverlay = useCallback(() => <EmptyState message="No records for this filter given available data" />, []);

	const common = {
		cols,
		columnVisibilityModel,
		setColumnVisibilityModel,
		filters,
		setFilters,
		density,
		setDensity,
		fileName,
		className,
		style,
		checkboxSelection,
		pageSizeOptions,
		onRowClick,
		noRowsOverlay,
		noResultsOverlay,
		filterable,
		extraExports,
	};

	return isServerSideRendered ? (
		<ServerGrid {...common} table_name={table_name} query={query} onTotalCountChange={onTotalCountChange} />
	) : (
		<ClientGrid
			{...common}
			table={table}
			pageSize={pageSize}
			loading={loading}
			initialState={initialState}
			sortModel={controlledSortModel}
			onSortModelChange={onSortModelChange}
			getRowHeight={getRowHeight}
		/>
	);
}

interface CommonGridProps {
	cols: FilterableColDef[];
	columnVisibilityModel: GridColumnVisibilityModel;
	setColumnVisibilityModel: (m: GridColumnVisibilityModel) => void;
	filters: FilterState;
	setFilters: (f: FilterState) => void;
	density: GridDensity;
	setDensity: (d: GridDensity) => void;
	fileName: string;
	className?: string;
	style?: React.CSSProperties;
	checkboxSelection: boolean;
	pageSizeOptions: number[];
	onRowClick?: (params: any) => void;
	noRowsOverlay: () => React.ReactElement;
	noResultsOverlay: () => React.ReactElement;
	filterable: boolean;
	extraExports?: ExportAction[];
}

function ClientGrid(
	props: CommonGridProps & {
		table: any[];
		pageSize: number;
		loading: boolean;
		initialState?: any;
		sortModel?: GridSortModel;
		onSortModelChange?: (m: GridSortModel) => void;
		getRowHeight?: () => number | "auto";
	},
) {
	const { cols, table, filters, fileName } = props;
	const rows = useMemo(() => applyClientFilters(table ?? [], filters, cols), [table, filters, cols]);
	const loadOptions = useCallback<OptionsLoader>((col) => distinctValues(table ?? [], col), [table]);
	const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: props.pageSize });
	useEffect(() => setPaginationModel((m) => ({ ...m, page: 0 })), [filters]);

	const toolbarProps: TableToolbarProps = {
		cols,
		columnVisibilityModel: props.columnVisibilityModel,
		onColumnVisibilityChange: props.setColumnVisibilityModel,
		filters,
		onFiltersChange: props.setFilters,
		loadOptions,
		density: props.density,
		onDensityChange: props.setDensity,
		fileName,
		matchingCount: rows.length,
		exportMatching: (sortedRows) => downloadCsv(rowsToCsv(sortedRows?.length ? sortedRows : rows, cols), Object.keys(filters).length ? `${fileName}_filtered` : fileName),
		extraExports: props.extraExports,
		filterable: props.filterable,
	};

	return (
		<DataGrid
			className={props.className}
			sx={gridSx(props.style)}
			columns={cols}
			rows={rows}
			density={props.density}
			slots={{ toolbar: TableToolbar as any, noRowsOverlay: props.noRowsOverlay, noResultsOverlay: props.noResultsOverlay }}
			slotProps={{ toolbar: toolbarProps as any }}
			pageSizeOptions={props.pageSizeOptions}
			paginationModel={paginationModel}
			onPaginationModelChange={setPaginationModel}
			autoHeight
			style={{ minHeight: "20rem", ...props.style }}
			initialState={props.initialState || { sorting: { sortModel: cols.some((c) => c.field === "year") ? [{ field: "year", sort: "desc" }] : [] } }}
			{...(props.sortModel ? { sortModel: props.sortModel, onSortModelChange: props.onSortModelChange } : {})}
			checkboxSelection={props.checkboxSelection}
			columnVisibilityModel={props.columnVisibilityModel}
			onColumnVisibilityModelChange={props.setColumnVisibilityModel}
			loading={props.loading}
			onRowClick={props.onRowClick}
			getRowHeight={props.getRowHeight}
			disableColumnMenu
			disableColumnFilter
		/>
	);
}

function ServerGrid(props: CommonGridProps & { table_name: string; query: any; onTotalCountChange?: (n: number) => void }) {
	const { cols, table_name, query, filters, fileName, onTotalCountChange } = props;
	const explore = exploreTables[table_name];
	const defaultSort: GridSortModel = table_name === "officer_misconduct" ? [{ field: "receivedDate", sort: "desc" }] : [];
	const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
	const [sortModel, setSortModel] = useState<GridSortModel>(defaultSort);

	// New filters or sort → back to the first page.
	useEffect(() => setPaginationModel((m) => ({ ...m, page: 0 })), [filters, sortModel]);

	const filterJson = useMemo(() => exploreFilterJson(table_name, filters), [table_name, filters]);
	const orderBy = useMemo(() => exploreOrderBy(table_name, sortModel), [table_name, sortModel]);

	const { data, previousData, loading, error } = useQuery(query, {
		variables: {
			offset: paginationModel.page * paginationModel.pageSize,
			page_size: paginationModel.pageSize,
			order_by: orderBy,
			filters: filterJson,
		},
		fetchPolicy: "cache-first",
	});
	const { formattedData, rowCount } = dataToColumns(data ?? previousData ?? {}, table_name);

	useEffect(() => {
		if (data && onTotalCountChange) onTotalCountChange(rowCount);
	}, [data, rowCount, onTotalCountChange]);

	// Only columns the explore view actually has can be filtered/sorted server-side.
	const serverCols = useMemo<FilterableColDef[]>(
		() => cols.map((c) => (sqlColumnOf(table_name, c.field) ? c : { ...c, filterKind: false as const, sortable: false })),
		[cols, table_name],
	);

	const optionCache = useRef<Record<string, string[]>>({});
	const loadOptions = useCallback<OptionsLoader>(
		async (col) => {
			const column = sqlColumnOf(table_name, col.field);
			if (!explore || !column) return [];
			if (optionCache.current[column]) return optionCache.current[column];
			const res = await apolloClient.query({ query: EXPLORE_DISTINCT, variables: { view: explore.view, column, limit: 300 } });
			const values = (res.data?.exploreDistinct?.nodes ?? []).map((n) => n.value);
			optionCache.current[column] = values;
			return values;
		},
		[explore, table_name],
	);

	const exportMatching = async () => {
		if (rowCount > EXPORT_ROW_CAP) {
			alert(`This would download ${rowCount.toLocaleString()} rows. Please add a filter (for example a single year) to get under ${EXPORT_ROW_CAP.toLocaleString()} rows.`);
			return;
		}
		const alias = table_name_to_alias_map[table_name];
		const all: any[] = [];
		for (let offset = 0; offset < rowCount; offset += EXPORT_CHUNK) {
			const res = await apolloClient.query({
				query,
				variables: { offset, page_size: EXPORT_CHUNK, order_by: orderBy, filters: filterJson },
				fetchPolicy: "no-cache",
			});
			const nodes = res.data?.[alias]?.nodes ?? res.data?.[alias]?.edges?.map((e) => e.node) ?? [];
			all.push(...nodes);
			if (nodes.length < EXPORT_CHUNK) break;
		}
		downloadCsv(rowsToCsv(all, cols), Object.keys(filters).length ? `${fileName}_filtered` : `${fileName}_all`);
	};

	const toolbarProps: TableToolbarProps = {
		cols: serverCols,
		columnVisibilityModel: props.columnVisibilityModel,
		onColumnVisibilityChange: props.setColumnVisibilityModel,
		filters,
		onFiltersChange: props.setFilters,
		loadOptions,
		density: props.density,
		onDensityChange: props.setDensity,
		fileName,
		matchingCount: data || previousData ? rowCount : null,
		exportMatching,
		extraExports: props.extraExports,
		filterable: props.filterable && !!explore,
	};

	return (
		<>
			{error && (
				<div className="px-4 py-2 text-sm text-red-700 bg-red-50 border-b border-red-100">
					Couldn&apos;t load this table ({error.message}). Try removing a filter or reloading the page.
				</div>
			)}
			<DataGrid
				className={props.className}
				sx={gridSx(props.style)}
				columns={serverCols}
				rows={formattedData || []}
				density={props.density}
				slots={{ toolbar: TableToolbar as any, noRowsOverlay: props.noRowsOverlay, noResultsOverlay: props.noResultsOverlay }}
				slotProps={{ toolbar: toolbarProps as any }}
				pageSizeOptions={props.pageSizeOptions}
				autoHeight
				style={{ minHeight: "64rem", ...props.style }}
				loading={loading}
				rowCount={rowCount}
				checkboxSelection={props.checkboxSelection}
				columnVisibilityModel={props.columnVisibilityModel}
				onColumnVisibilityModelChange={props.setColumnVisibilityModel}
				paginationMode="server"
				paginationModel={paginationModel}
				onPaginationModelChange={setPaginationModel}
				filterMode="server"
				sortingMode="server"
				sortModel={sortModel}
				onSortModelChange={setSortModel}
				onRowClick={props.onRowClick}
				disableColumnMenu
				disableColumnFilter
			/>
		</>
	);
}
