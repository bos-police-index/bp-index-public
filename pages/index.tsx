import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Tooltip, Chip } from "@mui/material";
import { 
	GridColDef, 
	gridFilteredSortedRowIdsSelector, 
	gridPaginationModelSelector
} from "@mui/x-data-grid";

import backgroundImage from "../public/fist-in-air.jpeg";
import FadeIn from "@components/FadeIn";
import DataTable from "@components/DataTable";
import AnimatedCounter from "@components/AnimatedCounter";
import { fetchHompage } from "services/homepage/data_fetchers";
import { bpi_light_green } from "@styles/theme/lightTheme";

export default function Home() {
	const [keyword, setKeyword] = useState<string>("");
	const [allData, setAllData] = useState<Array<any>>([]);
	const [loading, setLoading] = useState<boolean>(true);
	// Default view: current BPD roster, officers with data in our targeted 2020–2025 range.
	const [currentRosterOnly, setCurrentRosterOnly] = useState<boolean>(true);
	const [activeRecentOnly, setActiveRecentOnly] = useState<boolean>(true);

	useEffect(() => {
		setLoading(true);
		fetchHompage({ keyword: keyword as string | string[] })
			.then((data) => {
				const formattedData = data.map((row) => ({
					...row,
					id: row.bpiId
				}));
				setAllData(formattedData);
			})
			.catch((error) => {
				console.error("Failed to fetch data", error);
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	// Data-richness score: how many attributes/activities back this officer.
	// Drives the default sort so complete profiles surface above sparse historical rows.
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
		if (r.year != null) s += 2; // has earnings on file (2020–2025)
		if (r.numOfIa > 0) s++;
		if (r.numOfDetail > 0) s++;
		if (r.numOfFio > 0) s++;
		if (r.numOfMvc > 0) s++;
		return s;
	};

	// Displayed rows = filters (current roster / active 2020–2025) + coverage sort.
	// Coverage order is the default; clicking any column header overrides it in the grid.
	const searchResData = useMemo(() => {
		let rows = allData;
		if (currentRosterOnly) rows = rows.filter((r) => r.isCurrentRoster);
		if (activeRecentOnly) rows = rows.filter((r) => r.year != null);
		return [...rows].sort((a, b) => coverageScore(b) - coverageScore(a));
	}, [allData, currentRosterOnly, activeRecentOnly]);

	const cols: GridColDef[] = [
		{
			field: "fullName",
			headerName: "Full Name",
			width: 200,
			minWidth: 150,
			flex: 1,
			type: "string",
			renderCell: (params) => {
				const properCasedName = params.row.fullName;
				return (
					<Link
						href={{
							pathname: `/profile/[bpiId]`,
							query: { bpiId: params.row.bpiId, keyword: params.row.fullName },
						}}
						style={{ color: bpi_light_green, textDecoration: "none" }}
						className="hover:opacity-80 font-medium"
					>
						{properCasedName}
					</Link>
				);
			},
			renderHeader: (params) => (
				<Tooltip title="The full name of the police officer">
					<span className="font-semibold text-gray-700">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
			field: "employeeId",
			headerName: "Emp #",
			width: 110,
			minWidth: 90,
			type: "string",
			renderCell: (params) => (
				<span className="text-gray-700 font-mono text-sm">{params.value || "—"}</span>
			),
			renderHeader: (params) => (
				<Tooltip title="The officer's BPD employee (payroll) number">
					<span className="font-semibold text-gray-700">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
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
			renderHeader: (params) => (
				<Tooltip title="The badge number assigned to the police officer; used for identification">
					<span className="font-semibold text-gray-700">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
			field: "race",
			headerName: "Race",
			width: 100,
			minWidth: 80,
			type: "string",
			renderCell: (params) => (
				<span className="text-gray-800">{params.value}</span>
			),
			renderHeader: (params) => (
				<Tooltip title="The race of the officer">
					<span className="font-semibold text-gray-700">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
			field: "sex",
			headerName: "Sex",
			width: 80,
			minWidth: 70,
			type: "string",
			renderCell: (params) => (
				<span className="text-gray-800">{params.value}</span>
			),
			renderHeader: (params) => (
				<Tooltip title="The sex of the officer">
					<span className="font-semibold text-gray-700">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
			field: "rank",
			headerName: "Rank",
			width: 150,
			minWidth: 120,
			type: "string",
			renderCell: (params) => (
				<span className="text-gray-800 font-medium">{params.value}</span>
			),
			renderHeader: (params) => (
				<Tooltip title="The job title or rank of the police officer">
					<span className="font-semibold text-gray-700">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
			field: "postId",
			headerName: "POST ID",
			width: 130,
			minWidth: 110,
			type: "string",
			renderCell: (params) => (
				<span className="text-gray-700 font-mono text-sm">{params.value || "—"}</span>
			),
			renderHeader: (params) => (
				<Tooltip title="Statewide POST (Peace Officer Standards & Training) certification ID">
					<span className="font-semibold text-gray-700">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
			field: "org",
			headerName: "Organization",
			width: 250,
			minWidth: 200,
			flex: 1,
			type: "string",
			renderCell: (params) => (
				<span className="text-gray-800 text-sm">{params.value}</span>
			),
			renderHeader: (params) => (
				<Tooltip title="The department or unit within the Boston Police Department where the officer works">
					<span className="font-semibold text-gray-700">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
			field: "startDate",
			headerName: "Start Date",
			width: 120,
			minWidth: 100,
			type: "string",
			renderCell: (params) => {
				const v = params.value;
				if (!v) return <span className="text-gray-400">—</span>;
				const d = new Date(String(v).slice(0, 10) + "T00:00:00Z");
				return <span className="text-gray-700 text-sm">{d.toLocaleDateString(undefined, { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" })}</span>;
			},
			renderHeader: (params) => (
				<Tooltip title="Academy graduation date (earliest known), used as a proxy for BPD start date where available">
					<span className="font-semibold text-gray-700">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
			field: "numOfIa",
			headerName: "IA Cases",
			width: 100,
			minWidth: 90,
			type: "number",
			renderCell: (params) => {
				const { row } = params;
				const count = row.numOfIa;
				return (
					<span className={`font-semibold ${count > 0 ? 'text-red-600' : 'text-gray-600'}`}>
						{count}
					</span>
				);
			},
			renderHeader: (params) => (
				<Tooltip title="The cumulative number of Internal Affairs complaints linked to the officer">
					<span className="font-semibold text-gray-700">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
			field: "numOfDetail",
			headerName: "Details",
			width: 100,
			minWidth: 80,
			type: "number",
			renderCell: (params) => {
				const count = params.row.numOfDetail;
				return <span className={`font-medium ${count > 0 ? "text-gray-800" : "text-gray-400"}`}>{count ?? 0}</span>;
			},
			renderHeader: (params) => (
				<Tooltip title="Number of paid-detail assignments linked to the officer">
					<span className="font-semibold text-gray-700">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
			field: "numOfFio",
			headerName: "FIOs",
			width: 90,
			minWidth: 70,
			type: "number",
			renderCell: (params) => {
				const count = params.row.numOfFio;
				return <span className={`font-medium ${count > 0 ? "text-gray-800" : "text-gray-400"}`}>{count ?? 0}</span>;
			},
			renderHeader: (params) => (
				<Tooltip title="Number of Field Interrogation & Observation reports linked to the officer">
					<span className="font-semibold text-gray-700">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
			field: "numOfMvc",
			headerName: "MVCs",
			width: 90,
			minWidth: 70,
			type: "number",
			renderCell: (params) => {
				const count = params.row.numOfMvc;
				return <span className={`font-medium ${count > 0 ? "text-gray-800" : "text-gray-400"}`}>{count ?? 0}</span>;
			},
			renderHeader: (params) => (
				<Tooltip title="Number of motor-vehicle citations (traffic stops) linked to the officer">
					<span className="font-semibold text-gray-700">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
			field: "totalPay",
			headerName: "Total Pay",
			width: 130,
			minWidth: 110,
			type: "number",
			renderCell: (params) => {
				const { row } = params;
				if (row.totalPay != null && row.totalPay !== undefined) {
					return <span className="font-semibold text-green-700">${row.totalPay.toLocaleString()}</span>;
				}
				return <span className="text-gray-400">—</span>;
			},
			renderHeader: (params) => (
				<Tooltip title="Total gross earnings for the latest year we have on file">
					<span className="font-semibold text-gray-700">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
			field: "regularPay",
			headerName: "Regular",
			width: 120,
			minWidth: 100,
			type: "number",
			renderCell: (params) => {
				const { row } = params;
				if (row.regularPay != null && row.regularPay !== undefined) {
					return <span className="font-medium text-gray-800">${row.regularPay.toLocaleString()}</span>;
				}
				return <span className="text-gray-400">—</span>;
			},
			renderHeader: (params) => (
				<Tooltip title="Regular (base salary) earnings for the latest year on file">
					<span className="font-semibold text-gray-700">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
			field: "retroPay",
			headerName: "Retro",
			width: 110,
			minWidth: 90,
			type: "number",
			renderCell: (params) => {
				const { row } = params;
				if (row.retroPay != null && row.retroPay !== undefined) {
					return <span className="font-medium text-teal-600">${row.retroPay.toLocaleString()}</span>;
				}
				return <span className="text-gray-400">—</span>;
			},
			renderHeader: (params) => (
				<Tooltip title="Retroactive pay (e.g. back pay from contract settlements) for the latest year on file">
					<span className="font-semibold text-gray-700">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
			field: "otherPay",
			headerName: "Other Pay",
			width: 120,
			minWidth: 100,
			type: "number",
			renderCell: (params) => {
				const { row } = params;
				if (row.otherPay != null && row.otherPay !== undefined) {
					return <span className="font-medium text-orange-600">${row.otherPay.toLocaleString()}</span>;
				}
				return <span className="text-gray-400">—</span>;
			},
			renderHeader: (params) => (
				<Tooltip title="Other earnings not classified elsewhere, for the latest year on file">
					<span className="font-semibold text-gray-700">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
			field: "overtimePay",
			headerName: "Overtime",
			width: 120,
			minWidth: 100,
			type: "number",
			renderCell: (params) => {
				const { row } = params;
				if (row.overtimePay != null && row.overtimePay !== undefined) {
					return <span className="font-medium text-blue-600">${row.overtimePay.toLocaleString()}</span>;
				}
				return <span className="text-gray-400">—</span>;
			},
			renderHeader: (params) => (
				<Tooltip title="Overtime earnings for the latest year on file">
					<span className="font-semibold text-gray-700">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
			field: "injuredPay",
			headerName: "Injured",
			width: 110,
			minWidth: 90,
			type: "number",
			renderCell: (params) => {
				const { row } = params;
				if (row.injuredPay != null && row.injuredPay !== undefined) {
					return <span className="font-medium text-red-500">${row.injuredPay.toLocaleString()}</span>;
				}
				return <span className="text-gray-400">—</span>;
			},
			renderHeader: (params) => (
				<Tooltip title="Injured-on-duty pay for the latest year on file">
					<span className="font-semibold text-gray-700">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
			field: "detailPay",
			headerName: "Detail Pay",
			width: 120,
			minWidth: 100,
			type: "number",
			renderCell: (params) => {
				const { row } = params;
				if (row.detailPay != null && row.detailPay !== undefined) {
					return <span className="font-medium text-purple-600">${row.detailPay.toLocaleString()}</span>;
				}
				return <span className="text-gray-400">—</span>;
			},
			renderHeader: (params) => (
				<Tooltip title="Paid-detail earnings for the latest year on file">
					<span className="font-semibold text-gray-700">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}, {
			field: "quinnPay",
			headerName: "Quinn",
			width: 110,
			minWidth: 90,
			type: "number",
			renderCell: (params) => {
				const { row } = params;
				if (row.quinnPay != null && row.quinnPay !== undefined) {
					return <span className="font-medium text-amber-600">${row.quinnPay.toLocaleString()}</span>;
				}
				return <span className="text-gray-400">—</span>;
			},
			renderHeader: (params) => (
				<Tooltip title="Quinn Bill (educational incentive) pay for the latest year on file">
					<span className="font-semibold text-gray-700">{params.colDef.headerName}</span>
				</Tooltip>
			),
		}
	];

	const getRowsToExportHandler = ({ apiRef }) => {
		const selectedRowKeys = apiRef.current.getSelectedRows().keys();
		const selectedRowIds = Array.from(selectedRowKeys);

		if (selectedRowIds && selectedRowIds.length > 0) {
			return selectedRowIds;
		}

		const filteredSortedRowIds = gridFilteredSortedRowIdsSelector(apiRef);
		const paginationModel = gridPaginationModelSelector(apiRef);
		const pagedRowIds = filteredSortedRowIds.slice(
			paginationModel.page * paginationModel.pageSize,
			(paginationModel.page + 1) * paginationModel.pageSize,
		);
		return pagedRowIds;
	};

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
								<h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
									Officer Database
								</h2>
								<p className="text-gray-600 text-sm sm:text-base">
									Search and explore comprehensive data on Boston Police Department officers.
								</p>
							</div>

							{/* Filters: default to the current roster within our targeted 2020–2025 data range */}
							<div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
								<span className="text-sm text-gray-700">
									Showing{" "}
									<span className="font-semibold text-gray-900">{searchResData.length.toLocaleString()}</span>
									{" "}of {allData.length.toLocaleString()} officers
								</span>
								<div className="flex flex-wrap gap-2">
									<Tooltip title="Only officers on the current (fall 2025) BPD roster. Toggle off to include historical and public-records identities.">
										<Chip
											label={`${currentRosterOnly ? "✓ " : ""}Current roster`}
											onClick={() => setCurrentRosterOnly((v) => !v)}
											color={currentRosterOnly ? "success" : "default"}
											variant={currentRosterOnly ? "filled" : "outlined"}
											size="small"
										/>
									</Tooltip>
									<Tooltip title="Only officers with data in our targeted 2020–2025 range (earnings on file). Toggle off to include officers with no recent data.">
										<Chip
											label={`${activeRecentOnly ? "✓ " : ""}Active 2020–2025`}
											onClick={() => setActiveRecentOnly((v) => !v)}
											color={activeRecentOnly ? "success" : "default"}
											variant={activeRecentOnly ? "filled" : "outlined"}
											size="small"
										/>
									</Tooltip>
								</div>
								{(currentRosterOnly || activeRecentOnly) && (
									<span className="text-xs text-gray-400">
										Sorted by data completeness. Toggle filters off to include historical &amp; unmatched records.
									</span>
								)}
							</div>
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
								loading={loading}
								checkboxSelection={true}
								className="w-full min-h-[400px]"
								initialState={{
									pagination: { paginationModel: { pageSize: 10 } },	
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
						</div>
					</div>
				</FadeIn>
			</div>
		</div>
	);
}
