import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Tooltip } from "@mui/material";
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
	const [searchResData, setSearchResData] = useState<Array<any>>([]);
	const [loading, setLoading] = useState<boolean>(true);

	useEffect(() => {
		setLoading(true);
		fetchHompage({ keyword: keyword as string | string[] })
			.then((data) => {
				const formattedData = data.map((row, index) => ({
					...row,
					id: row.bpiId
				}));
				setSearchResData(formattedData);
			})
			.catch((error) => {
				console.error("Failed to fetch data", error);
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

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
				<Tooltip title="The total gross earnings of the police officer for the specified period">
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
				<Tooltip title="Earnings from overtime work">
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
				<Tooltip title="Earnings from detailed assignments or special duties">
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
				<Tooltip title="Other types of earnings not classified elsewhere">
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
				className="relative w-full border-b border-gray-200"
				style={{
					backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.75) 100%), url(${backgroundImage.src})`,
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					backgroundAttachment: 'fixed'
				}}
			>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
					<div className="text-center mb-16">
						<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
							Boston Police Index
						</h1>
						<p className="text-xl sm:text-2xl text-slate-200 max-w-4xl mx-auto mb-10 leading-relaxed">
							Bringing transparency to law enforcement activities through public records and data.
						</p>
						<div className="inline-flex items-center px-8 py-4 bg-white/15 backdrop-blur-sm border border-white/30 rounded-xl text-white font-medium text-lg shadow-lg">
							<svg className="w-6 h-6 mr-3 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<span className="font-semibold">
								{loading ? (
									<span className="text-emerald-300 font-bold">Loading...</span>
								) : (
									<>
										<AnimatedCounter 
											endValue={searchResData.length} 
											duration={2000}
											animation="easeInOut" 
											className="text-emerald-300 font-bold mr-2" 
										/>
										<span>Officers in Database</span>
									</>
								)}
							</span>
						</div>
					</div>

					{/* Info Cards */}
					<div className="grid md:grid-cols-3 gap-8 lg:gap-10">
						<div className="bg-white rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 shadow-xl border border-gray-100 group">
							<div className="flex items-center mb-6">
								<div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
									<svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
									</svg>
								</div>
								<h3 className="text-xl font-bold text-gray-900 ml-4">Data Transparency</h3>
							</div>
							<p className="text-gray-600 leading-relaxed">
								All information sourced from public sources and public records requests.
							</p>
						</div>

						<div className="bg-white rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 shadow-xl border border-gray-100 group">
							<div className="flex items-center mb-6">
								<div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
									<svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
									</svg>
								</div>
								<h3 className="text-xl font-bold text-gray-900 ml-4">Easy Search</h3>
							</div>
							<p className="text-gray-600 leading-relaxed">
								Powerful search and filtering capabilities to find specific officers and data points.
							</p>
						</div>

						<div className="bg-white rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 shadow-xl border border-gray-100 group">
							<div className="flex items-center mb-6">
								<div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
									<svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
									</svg>
								</div>
								<h3 className="text-xl font-bold text-gray-900 ml-4">Community Resource</h3>
							</div>
							<p className="text-gray-600 leading-relaxed">
								Supporting journalists, policy makers, and citizens in understanding police accountability.
							</p>
						</div>
					</div>
				</div>
			</div>
			{/* Main Content Section */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<FadeIn>
					{/* Data Table Container */}
					<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
						<div className="p-6 sm:p-8">
							<div className="mb-6">
								<h2 className="text-2xl font-semibold text-gray-900 mb-2">
									Officer Database
								</h2>
								<p className="text-gray-600">
									Search and explore comprehensive data on Boston Police Department officers.
								</p>
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
