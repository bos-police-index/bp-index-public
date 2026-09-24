import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Tooltip, Chip, Autocomplete, TextField, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
import { GridColDef, GridSortModel } from "@mui/x-data-grid";

import backgroundImage from "../public/fist-in-air.jpeg";
import FadeIn from "@components/FadeIn";
import DataTable from "@components/DataTable";
import AnimatedCounter from "@components/AnimatedCounter";
import apolloClient from "@lib/apollo-client";
import { GET_OFFICER_YEAR_LIST, GET_OFFICER_YEAR_STATS } from "@lib/graphql/queries";
import { officer_year_list_alias_name, officer_year_stats_alias_name } from "@utility/dataViewAliases";
import { downloadCsv, rowsToCsv } from "@utility/tableFilters";
import { fetchHompage } from "services/homepage/data_fetchers";
import { bpi_light_green } from "@styles/theme/lightTheme";

const num = (v: any): number | null => (v == null || v === "" || isNaN(Number(v)) ? null : Number(v));
const money = (v: number | null) => (v == null ? null : `$${Math.round(v).toLocaleString()}`);

const PAY_FIELDS = ["totalPay", "regularPay", "retroPay", "otherPay", "overtimePay", "injuredPay", "detailPay", "quinnPay"] as const;
const COUNT_FIELDS = ["numOfIaCases", "numOfDetail", "numOfFio", "numOfMvc"] as const;

// Data-richness score: how many attributes/activities back this officer (the "Most data on file" sort).
const coverageScore = (r: any): number => {
	let s = 0;
	if (r.badgeNo && r.badgeNo !== "Unknown Badge") s++;
	if (r.rank) s++;
	if (r.org) s++;
	if (r.postId) s++;
	if (r.startDate) s++;
	if (r.employeeId) s++;
	if (r.race) s++;
	if (r.sex) s++;
	if (r.payYear != null) s += 2; // has earnings on file (2020–2025)
	if (r.numOfIaCases > 0) s++;
	if (r.numOfDetail > 0) s++;
	if (r.numOfFio > 0) s++;
	if (r.numOfMvc > 0) s++;
	return s;
};

const lastFirst = (r: any) => `${r?.lastName || ""}, ${r?.firstName || ""}`.toLowerCase();

const SORT_OPTIONS: { key: string; label: string; explain: string; model: GridSortModel }[] = [
	{ key: "name", label: "Last name (A–Z)", explain: "alphabetically by last name", model: [{ field: "fullName", sort: "asc" }] },
	{ key: "ia", label: "Most IA cases", explain: "by number of Internal Affairs cases, most first", model: [{ field: "numOfIaCases", sort: "desc" }] },
	{ key: "pay", label: "Highest total pay", explain: "by total pay, highest first", model: [{ field: "totalPay", sort: "desc" }] },
	{ key: "coverage", label: "Most data on file", explain: "by how much data we hold on each officer (pay, IA, details, FIOs, MVCs, identity fields)", model: [{ field: "coverageScore", sort: "desc" }] },
];

const yearLabel = (years: number[]) => {
	if (years.length === 0) return null;
	const sorted = [...years].sort((a, b) => a - b);
	const contiguous = sorted.every((y, i) => i === 0 || y === sorted[i - 1] + 1);
	if (sorted.length === 1) return String(sorted[0]);
	return contiguous ? `${sorted[0]}–${sorted[sorted.length - 1]}` : sorted.join(", ");
};

/** Rank/percentile of each officer's summed total pay among peers (same definition as vw_v2_pay_rank_total). */
function rankAmongPeers(entries: { id: string; group: string | null; total: number | null }[]) {
	const out = new Map<string, { payRank: number; payPeers: number; payPercentile: number; payPeerAvg: number; payRatioToAvg: number | null }>();
	const groups = new Map<string, { id: string; total: number }[]>();
	for (const e of entries) {
		if (!e.group || e.total == null || e.total <= 0) continue;
		if (!groups.has(e.group)) groups.set(e.group, []);
		groups.get(e.group).push({ id: e.id, total: e.total });
	}
	for (const list of groups.values()) {
		const n = list.length;
		const sorted = list.map((x) => x.total).sort((a, b) => a - b);
		const avg = sorted.reduce((a, b) => a + b, 0) / n;
		const countLess = (v: number) => { let lo = 0, hi = n; while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] < v) lo = m + 1; else hi = m; } return lo; };
		const countLe = (v: number) => { let lo = 0, hi = n; while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] <= v) lo = m + 1; else hi = m; } return lo; };
		for (const x of list) {
			out.set(x.id, {
				payRank: n - countLe(x.total) + 1,
				payPeers: n,
				payPercentile: n > 1 ? Math.round((countLess(x.total) / (n - 1)) * 100) : 0,
				payPeerAvg: avg,
				payRatioToAvg: avg > 0 ? Math.round((x.total / avg) * 100) / 100 : null,
			});
		}
	}
	return out;
}

const header = (title: string) => (params) => (
	<Tooltip title={title}>
		<span className="font-semibold text-gray-700">{params.colDef.headerName}</span>
	</Tooltip>
);

export default function Home() {
	const [keyword] = useState<string>("");
	const [allData, setAllData] = useState<Array<any>>([]);
	const [loading, setLoading] = useState<boolean>(true);
	// Default view: current BPD roster, all years, sorted A–Z by last name.
	const [currentRosterOnly, setCurrentRosterOnly] = useState<boolean>(true);
	const [yearOptions, setYearOptions] = useState<{ year: number; officers: number; officersWithPay: number }[]>([]);
	const [years, setYears] = useState<number[]>([]);
	const [yearStats, setYearStats] = useState<Record<number, OfficerYearStats[]>>({});
	const [yearError, setYearError] = useState<string | null>(null);
	const [sortModel, setSortModel] = useState<GridSortModel>(SORT_OPTIONS[0].model);

	useEffect(() => {
		setLoading(true);
		fetchHompage({ keyword: keyword as string | string[] })
			.then((data) => setAllData(data.map((row) => ({ ...row, id: row.bpiId }))))
			.catch((error) => console.error("Failed to fetch data", error))
			.finally(() => setLoading(false));
		apolloClient
			.query({ query: GET_OFFICER_YEAR_LIST })
			.then(({ data }) => setYearOptions(data?.[officer_year_list_alias_name]?.nodes ?? []))
			.catch((e) => console.error("Failed to fetch year list", e));
	}, []);

	// Load per-officer stats for each newly selected year (cached per year).
	useEffect(() => {
		const missing = years.filter((y) => !yearStats[y]);
		if (missing.length === 0) return;
		setYearError(null);
		Promise.all(missing.map((y) => apolloClient.query({ query: GET_OFFICER_YEAR_STATS, variables: { year: y } }).then(({ data }) => [y, data?.[officer_year_stats_alias_name]?.nodes ?? []] as const)))
			.then((pairs) => setYearStats((prev) => ({ ...prev, ...Object.fromEntries(pairs) })))
			.catch((e) => {
				console.error("Failed to fetch year stats", e);
				setYearError("Couldn't load data for the selected year. Please try again.");
			});
	}, [years, yearStats]);

	// All-years rows: latest pay year on file + lifetime counts.
	const baseRows = useMemo(
		() =>
			allData
				.map((r) => {
					const row: any = { ...r, payYear: r.year ?? null, numOfIaCases: num(r.numOfIaCases) ?? 0, numOfDetail: num(r.numOfDetail) ?? 0, numOfFio: num(r.numOfFio) ?? 0, numOfMvc: num(r.numOfMvc) ?? 0 };
					for (const f of PAY_FIELDS) row[f] = num(r[f]);
					row.payPeerAvg = num(r.payPeerAvg);
					row.payRatioToAvg = num(r.payRatioToAvg);
					row.coverageScore = coverageScore(row);
					return row;
				})
				// Pre-sorted A–Z so ties in any other sort stay alphabetical.
				.sort((a, b) => lastFirst(a).localeCompare(lastFirst(b))),
		[allData],
	);

	const yearsLoaded = years.every((y) => yearStats[y]);

	// Year-scoped rows: officers with any data in the selected years; pay and counts summed over them.
	const scopedRows = useMemo(() => {
		if (years.length === 0) return baseRows;
		if (!yearsLoaded) return [];
		const agg = new Map<string, any>();
		for (const y of [...years].sort((a, b) => a - b)) {
			for (const s of yearStats[y]) {
				const a = agg.get(s.bpiId) ?? { group: null, pays: {}, counts: { numOfIaCases: 0, numOfDetail: 0, numOfFio: 0, numOfMvc: 0 }, single: null };
				for (const f of PAY_FIELDS) {
					const v = num(s[f]);
					if (v != null) a.pays[f] = (a.pays[f] ?? 0) + v;
				}
				for (const f of COUNT_FIELDS) a.counts[f] += num(s[f]) ?? 0;
				if (s.peerGroup) a.group = s.peerGroup; // latest selected year wins
				a.single = s;
				agg.set(s.bpiId, a);
			}
		}
		const ranks =
			years.length > 1
				? rankAmongPeers(Array.from(agg.entries()).map(([id, a]) => ({ id, group: a.group, total: a.pays.totalPay ?? null })))
				: null;
		return baseRows
			.filter((r) => agg.has(r.bpiId))
			.map((r) => {
				const a = agg.get(r.bpiId);
				const row: any = { ...r, ...a.counts, payYear: null };
				for (const f of PAY_FIELDS) row[f] = a.pays[f] == null ? null : Math.round(a.pays[f] * 100) / 100;
				const rk = ranks
					? ranks.get(r.bpiId)
					: a.single && a.single.payRank != null
					? { payRank: a.single.payRank, payPeers: a.single.payPeers, payPercentile: a.single.payPercentile, payPeerAvg: num(a.single.payPeerAvg), payRatioToAvg: num(a.single.payRatioToAvg) }
					: null;
				Object.assign(row, rk ?? { payRank: null, payPeers: null, payPercentile: null, payPeerAvg: null, payRatioToAvg: null });
				row.payPeerGroup = a.group;
				row.coverageScore = coverageScore(row);
				return row;
			});
	}, [baseRows, years, yearStats, yearsLoaded]);

	const searchResData = useMemo(() => (currentRosterOnly ? scopedRows.filter((r) => r.isCurrentRoster) : scopedRows), [scopedRows, currentRosterOnly]);

	const scope = yearLabel(years);
	const payScope = scope ? (years.length > 1 ? `total for ${scope}` : `for ${scope}`) : "for the latest year on file (see Pay Year)";
	const countScope = scope ? `in ${scope}` : "across all years on file";
	const peerLabel = (r: any) => (r.payPeerGroup === "civilian" ? "civilian BPD employees" : "sworn officers");

	const moneyCol = (field: string, headerName: string, title: string, color: string, width = 120): GridColDef => ({
		field,
		headerName,
		width,
		minWidth: 90,
		type: "number",
		renderCell: (params) => {
			const v = money(params.value as number | null);
			return v ? <span className={`font-medium ${color}`}>{v}</span> : <span className="text-gray-400">—</span>;
		},
		renderHeader: header(`${title} ${payScope}`),
	});
	const countCol = (field: string, headerName: string, title: string, width = 90): GridColDef => ({
		field,
		headerName,
		width,
		minWidth: 70,
		type: "number",
		renderCell: (params) => {
			const count = params.value ?? 0;
			return <span className={`font-medium ${count > 0 ? "text-gray-800" : "text-gray-400"}`}>{count}</span>;
		},
		renderHeader: header(`${title} ${countScope}`),
	});

	const cols: GridColDef[] = [
		{
			field: "fullName",
			headerName: "Full Name",
			width: 200,
			minWidth: 150,
			flex: 1,
			type: "string",
			// Displayed "First Last", sorted "Last, First".
			sortComparator: (_v1, _v2, p1, p2) => lastFirst(p1.api.getRow(p1.id)).localeCompare(lastFirst(p2.api.getRow(p2.id))),
			renderCell: (params) => (
				<Link
					href={{ pathname: `/profile/[bpiId]`, query: { bpiId: params.row.bpiId, keyword: params.row.fullName } }}
					style={{ color: bpi_light_green, textDecoration: "none" }}
					className="hover:opacity-80 font-medium"
				>
					{params.row.fullName}
				</Link>
			),
			renderHeader: header("The officer's full name (sorted by last name)"),
		},
		{
			field: "employeeId",
			headerName: "Emp #",
			width: 110,
			minWidth: 90,
			type: "string",
			renderCell: (params) => <span className="text-gray-700 font-mono text-sm">{params.value || "—"}</span>,
			renderHeader: header("The officer's BPD employee (payroll) number"),
		},
		{
			field: "badgeNo",
			headerName: "Badge No.",
			width: 120,
			minWidth: 100,
			type: "string",
			renderCell: (params) => {
				const { row } = params;
				const badgeText = row.badgeNo === "Unknown Badge" ? (row.rank === "Civilian" ? "Not Applicable" : "Unknown") : row.badgeNo;
				return <span style={badgeText === "Not Applicable" || badgeText === "Unknown" ? { color: "#9CA3AF" } : { fontWeight: 500 }}>{badgeText}</span>;
			},
			renderHeader: header("The badge number assigned to the police officer; used for identification"),
		},
		{ field: "race", headerName: "Race", width: 100, minWidth: 80, type: "string", renderCell: (p) => <span className="text-gray-800">{p.value}</span>, renderHeader: header("The race of the officer") },
		{ field: "sex", headerName: "Sex", width: 80, minWidth: 70, type: "string", renderCell: (p) => <span className="text-gray-800">{p.value}</span>, renderHeader: header("The sex of the officer") },
		{ field: "rank", headerName: "Rank", width: 150, minWidth: 120, type: "string", renderCell: (p) => <span className="text-gray-800 font-medium">{p.value}</span>, renderHeader: header("The job title or rank of the police officer") },
		{
			field: "postId",
			headerName: "POST ID",
			width: 130,
			minWidth: 110,
			type: "string",
			renderCell: (p) => <span className="text-gray-700 font-mono text-sm">{p.value || "—"}</span>,
			renderHeader: header("Statewide POST (Peace Officer Standards & Training) certification ID"),
		},
		{
			field: "org",
			headerName: "Organization",
			width: 250,
			minWidth: 200,
			flex: 1,
			type: "string",
			renderCell: (p) => <span className="text-gray-800 text-sm">{p.value}</span>,
			renderHeader: header("The department or unit within the Boston Police Department where the officer works"),
		},
		{
			field: "startDate",
			headerName: "Start Date",
			width: 120,
			minWidth: 100,
			type: "string",
			filterKind: "date",
			renderCell: (params) => {
				const v = params.value;
				if (!v) return <span className="text-gray-400">—</span>;
				const d = new Date(String(v).slice(0, 10) + "T00:00:00Z");
				return <span className="text-gray-700 text-sm">{d.toLocaleDateString(undefined, { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" })}</span>;
			},
			renderHeader: header("Academy graduation date (earliest known), used as a proxy for BPD start date where available"),
		} as GridColDef,
		{
			field: "numOfIaCases",
			headerName: "IA Cases",
			width: 100,
			minWidth: 90,
			type: "number",
			renderCell: (params) => {
				const count = params.value ?? 0;
				return <span className={`font-semibold ${count > 0 ? "text-red-600" : "text-gray-600"}`}>{count}</span>;
			},
			renderHeader: header(`Internal Affairs cases ${countScope} (one per case, even when a case has several allegations)`),
		},
		countCol("numOfDetail", "Details", "Paid-detail assignments", 100),
		countCol("numOfFio", "FIOs", "Field Interrogation & Observation reports"),
		countCol("numOfMvc", "MVCs", "Motor-vehicle citations (traffic stops)"),
		...(years.length === 0
			? [
					{
						field: "payYear",
						headerName: "Pay Year",
						width: 95,
						minWidth: 80,
						type: "number",
						valueFormatter: (p) => (p.value == null ? "" : String(p.value)),
						renderCell: (p) => (p.value == null ? <span className="text-gray-400">—</span> : <span className="text-gray-700">{p.value}</span>),
						renderHeader: header("The year the pay columns come from (latest year on file). Pick years above to see other years."),
					} as GridColDef,
			  ]
			: []),
		moneyCol("totalPay", scope ? `Total Pay (${scope})` : "Total Pay", "Total gross earnings", "font-semibold text-green-700", scope && scope.length > 4 ? 190 : 160),
		{
			field: "payPercentile",
			headerName: "Pay Rank",
			width: 120,
			minWidth: 100,
			type: "number",
			exportValue: (r) => (r.payPercentile == null || r.payRank == null ? "" : `Top ${Math.max(1, 100 - r.payPercentile)}% (#${r.payRank} of ${r.payPeers} ${peerLabel(r)})`),
			renderCell: (params) => {
				const r = params.row;
				if (r.payPercentile == null || r.payRank == null) return <span className="text-gray-400">—</span>;
				const top = Math.max(1, 100 - r.payPercentile);
				return (
					<Tooltip title={`#${r.payRank.toLocaleString()} of ${Number(r.payPeers).toLocaleString()} ${peerLabel(r)} paid ${scope ? `in ${scope}` : `in ${r.payYear}`} · average ${money(r.payPeerAvg)}`}>
						<span className={`text-sm font-medium ${top <= 10 ? "text-amber-700" : "text-gray-700"}`}>Top {top}%</span>
					</Tooltip>
				);
			},
			renderHeader: header(`Total pay compared with other sworn officers (or, for civilians, other civilian employees) paid ${scope ? `in ${scope}` : "that year"}`),
		} as GridColDef,
		{
			field: "payRatioToAvg",
			headerName: "vs. Avg",
			width: 90,
			minWidth: 80,
			type: "number",
			renderCell: (params) => {
				const v = params.value as number | null;
				if (v == null) return <span className="text-gray-400">—</span>;
				return <span className={`text-sm ${v >= 1.5 ? "text-amber-700 font-semibold" : "text-gray-700"}`}>{v.toFixed(2)}×</span>;
			},
			renderHeader: header(`Total pay divided by the average for peers (sworn or civilian) ${scope ? `in ${scope}` : "that year"}`),
		},
		moneyCol("regularPay", "Regular", "Regular (base salary) earnings", "text-gray-800"),
		moneyCol("retroPay", "Retro", "Retroactive pay (e.g. back pay from contract settlements)", "text-teal-600", 110),
		moneyCol("otherPay", "Other Pay", "Other earnings not classified elsewhere", "text-orange-600"),
		moneyCol("overtimePay", "Overtime", "Overtime earnings", "text-blue-600"),
		moneyCol("injuredPay", "Injured", "Injured-on-duty pay", "text-red-500", 110),
		moneyCol("detailPay", "Detail Pay", "Paid-detail earnings", "text-purple-600"),
		moneyCol("quinnPay", "Quinn", "Quinn Bill (educational incentive) pay", "text-amber-600", 110),
		{
			field: "coverageScore",
			headerName: "Data on File",
			width: 110,
			type: "number",
			renderHeader: header("How much data we hold on this officer (0–14): identity fields, pay, IA cases, details, FIOs and MVCs"),
		},
	];

	// "Entire database" download: every officer, fixed (not year-scoped) columns.
	const allOfficerExportCols: GridColDef[] = [
		{ field: "fullName", headerName: "Full Name" },
		{ field: "lastName", headerName: "Last Name" },
		{ field: "firstName", headerName: "First Name" },
		{ field: "employeeId", headerName: "Employee ID" },
		{ field: "badgeNo", headerName: "Badge No." },
		{ field: "postId", headerName: "POST ID" },
		{ field: "rank", headerName: "Rank" },
		{ field: "org", headerName: "Organization" },
		{ field: "race", headerName: "Race" },
		{ field: "sex", headerName: "Sex" },
		{ field: "startDate", headerName: "Start Date" },
		{ field: "isCurrentRoster", headerName: "On Current Roster" },
		{ field: "numOfIaCases", headerName: "IA Cases (all years)" },
		{ field: "numOfDetail", headerName: "Paid Details (all years)" },
		{ field: "numOfFio", headerName: "FIOs (all years)" },
		{ field: "numOfMvc", headerName: "MVCs (all years)" },
		{ field: "payYear", headerName: "Pay Year" },
		...PAY_FIELDS.map((f) => ({ field: f, headerName: `${cols.find((c) => c.field === f)?.headerName.replace(/ \(.*\)$/, "") ?? f} (pay year)` })),
		{ field: "payPercentile", headerName: "Pay Percentile vs. Peers (pay year)" },
		{ field: "payRank", headerName: "Pay Rank vs. Peers (pay year)" },
		{ field: "payPeers", headerName: "Peers Paid That Year" },
		{ field: "payPeerGroup", headerName: "Peer Group" },
		{ field: "payRatioToAvg", headerName: "Total Pay ÷ Peer Average" },
	];

	const activeSort = SORT_OPTIONS.find((o) => o.model[0]?.field === sortModel[0]?.field && o.model[0]?.sort === sortModel[0]?.sort);
	const sortExplanation = activeSort
		? `Sorted ${activeSort.explain}.`
		: sortModel[0]
		? `Sorted by ${cols.find((c) => c.field === sortModel[0].field)?.headerName ?? sortModel[0].field} (${sortModel[0].sort === "asc" ? "lowest / A–Z first" : "highest / Z–A first"}).`
		: "Unsorted.";

	return (
		<div className="min-h-screen bg-gray-50">
			<div 
				className="relative w-full border-b border-gray-200 md:bg-fixed"
				style={{
					backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.85) 100%), url(${backgroundImage.src})`,
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					backgroundAttachment: 'scroll',
					minHeight: '300px'
				}}
			>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-28">
					<div className="text-center mb-12 sm:mb-16">
						<h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 tracking-tight drop-shadow-lg">
							Boston Police Index
						</h1>
						<p className="text-lg sm:text-xl md:text-2xl text-white max-w-4xl mx-auto mb-8 sm:mb-10 leading-relaxed drop-shadow">
							Bringing transparency to law enforcement activities through public records and data.
						</p>
						<div className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-white/20 backdrop-blur-md border border-white/40 rounded-xl text-white font-medium text-base sm:text-lg shadow-lg">
							<svg className="min-w-5 w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<span className="font-semibold">
								{loading ? (
									<span className="text-emerald-300 font-bold">Loading...</span>
								) : (
									<>
										<AnimatedCounter
											endValue={allData.length}
											duration={2000}
											animation="easeInOut" 
											className="text-emerald-300 font-bold mr-1 sm:mr-2" 
										/>
										<span>Officers in Database</span>
									</>
								)}
							</span>
						</div>
					</div>

					{/* Info Cards */}
					<div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6 lg:gap-10">
						<div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 sm:p-8 hover:shadow-2xl transition-all duration-300 shadow-xl border border-gray-100 group">
							<div className="flex items-center mb-4 sm:mb-6">
								<div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
									<svg className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
									</svg>
								</div>
								<h3 className="text-lg sm:text-xl font-bold text-gray-900 ml-3 sm:ml-4">Data Transparency</h3>
							</div>
							<p className="text-gray-600 leading-relaxed text-sm sm:text-base">
								All information sourced from public sources and public records requests.
							</p>
						</div>

						<div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 sm:p-8 hover:shadow-2xl transition-all duration-300 shadow-xl border border-gray-100 group">
							<div className="flex items-center mb-4 sm:mb-6">
								<div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
									<svg className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
									</svg>
								</div>
								<h3 className="text-lg sm:text-xl font-bold text-gray-900 ml-3 sm:ml-4">Easy Search</h3>
							</div>
							<p className="text-gray-600 leading-relaxed text-sm sm:text-base">
								Powerful search and filtering capabilities to find specific officers and data points.
							</p>
						</div>

						<div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 sm:p-8 hover:shadow-2xl transition-all duration-300 shadow-xl border border-gray-100 group">
							<div className="flex items-center mb-4 sm:mb-6">
								<div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
									<svg className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
									</svg>
								</div>
								<h3 className="text-lg sm:text-xl font-bold text-gray-900 ml-3 sm:ml-4">Community Resource</h3>
							</div>
							<p className="text-gray-600 leading-relaxed text-sm sm:text-base">
								Supporting journalists, policy makers, and people in understanding police accountability.
							</p>
						</div>
					</div>
				</div>
			</div>
			{/* Main Content Section */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
				<FadeIn>
					{/* Data Table Container */}
					<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
						<div className="p-4 sm:p-6 md:p-8">
							<div className="mb-4 sm:mb-6">
								<h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Officer Database</h2>
								<p className="text-gray-600 text-sm sm:text-base">Search and explore comprehensive data on Boston Police Department officers.</p>
							</div>

							{/* Scope: roster + year(s), then sort */}
							<div className="mb-3 flex flex-wrap items-center gap-3">
								<Tooltip title="Only officers on the current (fall 2025) BPD roster. Turn off to include historical and public-records identities.">
									<Chip
										label={`${currentRosterOnly ? "✓ " : ""}Current roster`}
										onClick={() => setCurrentRosterOnly((v) => !v)}
										color={currentRosterOnly ? "success" : "default"}
										variant={currentRosterOnly ? "filled" : "outlined"}
									/>
								</Tooltip>
								<Autocomplete
									multiple
									size="small"
									sx={{ minWidth: 260, maxWidth: 480 }}
									options={yearOptions.map((y) => y.year)}
									getOptionLabel={(y) => String(y)}
									renderOption={(props, y) => {
										const info = yearOptions.find((o) => o.year === y);
										const { key: _key, ...liProps } = props as any;
										return (
											<li {...liProps} key={y}>
												<span className="font-medium">{y}</span>
												<span className="ml-2 text-xs text-gray-500">
													{info?.officers.toLocaleString()} officers{info && info.officersWithPay === 0 ? " · IA cases only" : ""}
												</span>
											</li>
										);
									}}
									value={years}
									onChange={(_e, v) => setYears((v as number[]).sort((a, b) => b - a))}
									filterSelectedOptions
									ChipProps={{ size: "small" }}
									renderInput={(params) => <TextField {...params} label="Year" placeholder={years.length ? "" : "All years"} />}
								/>
								<FormControl size="small" sx={{ minWidth: 200 }}>
									<InputLabel id="home-sort-label">Sort by</InputLabel>
									<Select
										labelId="home-sort-label"
										label="Sort by"
										value={activeSort?.key ?? "custom"}
										onChange={(e) => {
											const opt = SORT_OPTIONS.find((o) => o.key === e.target.value);
											if (opt) setSortModel(opt.model);
										}}
									>
										{SORT_OPTIONS.map((o) => (
											<MenuItem key={o.key} value={o.key}>
												{o.label}
											</MenuItem>
										))}
										{!activeSort && (
											<MenuItem value="custom" disabled>
												Column: {cols.find((c) => c.field === sortModel[0]?.field)?.headerName ?? "—"}
											</MenuItem>
										)}
									</Select>
								</FormControl>
							</div>
							<div className="mb-4 text-sm text-gray-600 space-y-0.5">
								<p>
									Showing <span className="font-semibold text-gray-900">{searchResData.length.toLocaleString()}</span> of {allData.length.toLocaleString()} officers
									{scope ? <> with data in <span className="font-semibold text-gray-900">{scope}</span></> : null}
									{currentRosterOnly ? " on the current roster" : ""}. {sortExplanation} Click any column header to sort by it instead.
								</p>
								<p className="text-xs text-gray-500">
									{scope
										? `Pay and counts are ${years.length > 1 ? "totals for" : "for"} ${scope}. Pay Rank compares total pay with other sworn officers (civilians: other civilian employees) paid in ${scope}.`
										: "Pay columns show each officer's latest year on file (Pay Year); IA cases, details, FIOs and MVCs are all-time counts. Pick one or more years to see a specific year."}
								</p>
								{yearError && <p className="text-xs text-red-600">{yearError}</p>}
							</div>
							<DataTable
								cols={cols}
								table={searchResData}
								table_name="boston-police-index"
								exportFileName={scope ? `boston-police-index_${scope.replace(/[^0-9]+/g, "-")}` : "boston-police-index"}
								pageSize={10}
								pageSizeOptions={[10, 25, 50, 100]}
								rowCount={searchResData.length}
								hide={["coverageScore"]}
								isServerSideRendered={false}
								keyword={keyword}
								loading={loading || (years.length > 0 && !yearsLoaded)}
								checkboxSelection={true}
								className="w-full min-h-[400px]"
								sortModel={sortModel}
								onSortModelChange={(m) => setSortModel(m.length ? m : SORT_OPTIONS[0].model)}
								extraExports={[
									{
										label: `Entire database (${allData.length.toLocaleString()} officers)`,
										hint: "Every officer, ignoring the roster/year/column filters — latest-year pay, all-time counts",
										run: () => downloadCsv(rowsToCsv(baseRows, allOfficerExportCols), "boston-police-index_all_officers"),
									},
								]}
							/>
						</div>
					</div>
				</FadeIn>
			</div>
		</div>
	);
}
