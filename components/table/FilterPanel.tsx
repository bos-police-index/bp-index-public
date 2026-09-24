import React, { useEffect, useMemo, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Popover from "@mui/material/Popover";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { bpi_deep_green, bpi_light_green } from "@styles/theme/lightTheme";
import { ColumnFilter, FilterKind, FilterState, FilterableColDef, cleanFilters, filterKindOf } from "@utility/tableFilters";

export type OptionsLoader = (col: FilterableColDef) => string[] | Promise<string[]>;

const inputSx = {
	backgroundColor: "#ffffff",
	"& .MuiOutlinedInput-root": {
		fontSize: "0.875rem",
		"&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: bpi_light_green },
		"&:hover .MuiOutlinedInput-notchedOutline": { borderColor: bpi_light_green },
	},
};

/** Options for one column, loaded lazily the first time its dropdown opens. */
function useColumnOptions(col: FilterableColDef, loadOptions: OptionsLoader, kind: FilterKind) {
	const [options, setOptions] = useState<string[] | null>(null);
	const [loading, setLoading] = useState(false);
	const load = () => {
		if (options || loading) return;
		setLoading(true);
		Promise.resolve(loadOptions(col))
			.then((opts) => {
				const list = [...(opts ?? [])];
				if (kind === "year") list.sort((a, b) => Number(b) - Number(a));
				setOptions(list);
			})
			.catch(() => setOptions([]))
			.finally(() => setLoading(false));
	};
	return { options: options ?? [], loading, load };
}

function TextFilterInput({ col, kind, value, onChange, loadOptions }: { col: FilterableColDef; kind: FilterKind; value: ColumnFilter; onChange: (f: ColumnFilter) => void; loadOptions: OptionsLoader }) {
	const { options, loading, load } = useColumnOptions(col, loadOptions, kind);
	const isYear = kind === "year";
	const selected = [...(value.in ?? []).map(String), ...(value.contains ?? [])];
	return (
		<Autocomplete
			multiple
			freeSolo={!isYear}
			size="small"
			fullWidth
			options={options}
			loading={loading}
			onOpen={load}
			filterSelectedOptions
			value={selected}
			onChange={(_e, vals) => {
				const known = new Set(options);
				const picked = (vals as string[]).map((v) => String(v).trim()).filter(Boolean);
				onChange({
					in: picked.filter((v) => known.has(v)).map((v) => (isYear ? Number(v) : v)),
					contains: isYear ? [] : picked.filter((v) => !known.has(v)),
				});
			}}
			ChipProps={{ size: "small" }}
			renderInput={(params) => (
				<TextField
					{...params}
					placeholder={selected.length ? "" : isYear ? "Any year — pick one or more" : "Pick values, or type text + Enter"}
					sx={inputSx}
					InputProps={{
						...params.InputProps,
						endAdornment: (
							<>
								{loading ? <CircularProgress color="inherit" size={16} /> : null}
								{params.InputProps.endAdornment}
							</>
						),
					}}
				/>
			)}
		/>
	);
}

function RangeFilterInput({ kind, value, onChange }: { kind: FilterKind; value: ColumnFilter; onChange: (f: ColumnFilter) => void }) {
	const type = kind === "date" ? "date" : "number";
	return (
		<Box sx={{ display: "flex", gap: 1 }}>
			<TextField
				size="small"
				type={type}
				label={kind === "date" ? "From" : "Min"}
				InputLabelProps={{ shrink: true }}
				value={value.gte ?? ""}
				onChange={(e) => onChange({ ...value, gte: e.target.value })}
				sx={{ ...inputSx, flex: 1 }}
			/>
			<TextField
				size="small"
				type={type}
				label={kind === "date" ? "To" : "Max"}
				InputLabelProps={{ shrink: true }}
				value={value.lte ?? ""}
				onChange={(e) => onChange({ ...value, lte: e.target.value })}
				sx={{ ...inputSx, flex: 1 }}
			/>
		</Box>
	);
}

/**
 * Multi-column, multi-value filter editor. Edits are staged and only committed on Apply.
 * Text columns: pick any number of values (exact match) and/or type free text (contains).
 * Year columns: pick any number of years. Number/date columns: min/max range.
 */
export default function FilterPanel({
	anchorEl,
	onClose,
	cols,
	filters,
	onApply,
	loadOptions,
}: {
	anchorEl: HTMLElement | null;
	onClose: () => void;
	cols: FilterableColDef[];
	filters: FilterState;
	onApply: (f: FilterState) => void;
	loadOptions: OptionsLoader;
}) {
	const [pending, setPending] = useState<FilterState>(filters);
	const [search, setSearch] = useState("");
	const open = Boolean(anchorEl);

	useEffect(() => {
		if (open) setPending(filters);
	}, [open, filters]);

	const filterable = useMemo(() => {
		const list = cols.map((col) => ({ col, kind: filterKindOf(col) })).filter((x) => x.kind);
		// Year first — it's the most common filter.
		return [...list.filter((x) => x.kind === "year"), ...list.filter((x) => x.kind !== "year")];
	}, [cols]);

	const shown = filterable.filter(({ col }) => !search || (col.headerName || col.field).toLowerCase().includes(search.toLowerCase()));

	return (
		<Popover
			open={open}
			anchorEl={anchorEl}
			onClose={(_e, reason) => {
				// Escape inside an open dropdown should only close that dropdown, not the whole panel.
				if (reason === "escapeKeyDown" && document.activeElement?.getAttribute("aria-expanded") === "true") return;
				onClose();
			}}
			anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
			PaperProps={{ elevation: 3, sx: { mt: 1, width: 380, maxHeight: "80vh", borderRadius: "8px", display: "flex", flexDirection: "column" } }}
		>
			<Box sx={{ p: 2, borderBottom: "1px solid #e2e8f0" }}>
				<Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#374151" }}>
					Filter data
				</Typography>
				<Typography variant="caption" sx={{ color: "#6b7280", display: "block", mb: 1 }}>
					Rows must match every filter below. Within one filter, any of the chosen values matches.
				</Typography>
				<TextField size="small" fullWidth placeholder="Find a column…" value={search} onChange={(e) => setSearch(e.target.value)} sx={inputSx} />
			</Box>
			<Box sx={{ overflow: "auto", px: 2, py: 1.5, display: "flex", flexDirection: "column", gap: 1.5, flex: 1 }}>
				{shown.map(({ col, kind }) => {
					const value = pending[col.field] ?? {};
					const set = (f: ColumnFilter) => setPending((prev) => ({ ...prev, [col.field]: f }));
					return (
						<Box key={col.field}>
							<Typography variant="caption" sx={{ fontWeight: 500, color: "#374151", mb: 0.5, display: "block" }}>
								{col.headerName || col.field}
							</Typography>
							{kind === "text" || kind === "year" ? (
								<TextFilterInput col={col} kind={kind} value={value} onChange={set} loadOptions={loadOptions} />
							) : (
								<RangeFilterInput kind={kind} value={value} onChange={set} />
							)}
						</Box>
					);
				})}
				{shown.length === 0 && (
					<Typography variant="body2" sx={{ color: "#9ca3af", py: 2, textAlign: "center" }}>
						No matching columns
					</Typography>
				)}
			</Box>
			<Box sx={{ p: 1.5, borderTop: "1px solid #e2e8f0", display: "flex", gap: 1, justifyContent: "flex-end" }}>
				<Button
					size="small"
					onClick={() => {
						setPending({});
						onApply({});
						onClose();
					}}
					sx={{ textTransform: "none", color: "#374151" }}
				>
					Clear all
				</Button>
				<Button
					size="small"
					variant="contained"
					onClick={() => {
						onApply(cleanFilters(pending));
						onClose();
					}}
					sx={{ textTransform: "none", backgroundColor: bpi_light_green, "&:hover": { backgroundColor: bpi_deep_green } }}
				>
					Apply filters
				</Button>
			</Box>
		</Popover>
	);
}
