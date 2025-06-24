import { FunctionComponentElement, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Tooltip } from "@mui/material";

import { fetchHompage } from "services/homepage/data_fetchers";
import DataTable from "@components/DataTable";
import { bpi_light_green, bpi_deep_green } from "@styles/theme/lightTheme";

export default function SearchResult(): FunctionComponentElement<{}> {
	const router = useRouter();
	const { keyword } = router.query;
	const [searchResData, setSearchResData] = useState<Array<any>>([]);
	const [loading, setLoading] = useState<boolean>(true);

	// fetchData returns a promise that resolves to an array of objects representing rows in the table
	useEffect(() => {
		setLoading(true);
		fetchHompage({ keyword: keyword as string | string[] })
			.then((data) => {
				const formattedData = data.map((row, index) => ({
					...row,
					id: row.bpiId,
				}));
				setSearchResData(formattedData);
			})
			.catch((error) => {
				console.error("Failed to fetch data", error);
				// TODO - Handle error state here
			})
			.finally(() => {
				setLoading(false);
			});
	}, [keyword]);

	const cols = [
		{
			field: "fullName",
			headerName: "Full Name",
			width: 200,
			type: "string",
			renderCell: (params) => {
				// const properCasedName = properCaseName(params.row.name);
				const properCasedName = params.row.fullName;
				return (
					<Link
						href={{
							pathname: `/profile/[bpiId]`,
							query: { bpiId: params.row.bpiId, keyword: params.row.fullName },
						}}
						style={{ color: bpi_deep_green }}
						className="link"
					>
						{properCasedName}
					</Link>
				);
			},
			renderHeader: (params) => (
				<Tooltip title="The full name of the police officer">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		},

		{
			field: "badgeNo",
			headerName: "Badge No.",
			width: 200,
			type: "string",
			renderCell: (params) => {
				const { row } = params;
				const badgeText = row.badgeNo === "Unknown Badge" ? (row.rank === "Civilian" ? "Not Applicable" : "Unknown") : row.badgeNo;
				return <span style={badgeText === "Not Applicable" || badgeText === "Unknown" ? { color: "#B3B3B3" } : {}}>{badgeText}</span>;
			},
			renderHeader: (params) => (
				<Tooltip title="The badge number assigned to the police officer; used for identification">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		},
		{
			field: "rank",
			headerName: "Rank",
			width: 150,
			type: "string",
			renderHeader: (params) => (
				<Tooltip title="The job title or rank of the police officer">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		},
		{
			field: "org",
			headerName: "Org",
			width: 250,
			type: "string",
			renderHeader: (params) => (
				<Tooltip title="The department or unit within the Boston Police Department where the officer works">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		},

		//TO DO: Add Race
		//BLOCKER: data in raw form

		//TO DO: Add Gender
		//BLOCKER: data in raw form
		{
			field: "numOfIa",
			headerName: "No. of IA",
			width: 100,
			type: "number",
			renderCell: (params) => {
				const { row } = params;
				return `${row.numOfIa}`;
			},
			renderHeader: (params) => (
				<Tooltip title="The cumulative number of Internal Affairs complaints linked to the officer">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		},

		{
			field: "totalPay",
			headerName: "Total Pay",
			width: 150,
			type: "number",
			renderCell: (params) => {
				const { row } = params;
				if (row.totalPay != null || undefined) {
					return `$${row.totalPay}`;
				}
				return ``;
			},
			renderHeader: (params) => (
				<Tooltip title="The total gross earnings of the police officer for the specified period">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		},

		//TO DO: Add Arrests
		//BLOCKER: data hasn't been found

		//TO DO: Add FOI
		// BLOCKER: data not in database

		//TO DO: Add News
		// BLOCKER: data hasn't been found

		{
			field: "overtimePay",
			headerName: "Overtime Pay",
			width: 150,
			type: "number",
			renderCell: (params) => {
				const { row } = params;
				if (row.overtimePay != null || undefined) {
					return `$${row.overtimePay}`;
				}
				return ``;
			},
			renderHeader: (params) => (
				<Tooltip title="Earnings from overtime work">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		},

		{
			field: "detailPay",
			headerName: "Detail Pay",
			width: 150,
			type: "number",
			renderCell: (params) => {
				const { row } = params;
				if (row.detailPay != null || undefined) {
					return `$${row.detailPay}`;
				}
				return ``;
			},
			renderHeader: (params) => (
				<Tooltip title="Earnings from detailed assignments or special duties">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		},

		{
			field: "otherPay",
			headerName: "Other Pay",
			width: 150,
			type: "number",
			renderCell: (params) => {
				const { row } = params;
				if (row.otherPay != null || undefined) {
					return `$${row.otherPay}`;
				}
				return ``;
			},
			renderHeader: (params) => (
				<Tooltip title="Other types of earnings not classified elsewhere">
					<span className="font-semibold">{params.colDef.headerName}</span>
				</Tooltip>
			),
		},

		//TO DO: Add Parking Tickets
		// BLOCKER: data in raw form only

		//TO DO: Add Shooting Report
		// BLOCKER: data doesn't exist
	];

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
			{/* Header */}
			<div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
					<nav className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm mb-6 sm:mb-8">
						<Link href="/" className="text-slate-300 hover:text-white transition-colors duration-200">
							Home
						</Link>
						<svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
						</svg>
						<span className="text-slate-400 truncate">Search Results: {keyword}</span>
					</nav>
					
					<h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 tracking-tight">
						Search Results
					</h1>
					<p className="text-sm sm:text-base lg:text-lg text-gray-200 leading-relaxed">
						Officers matching "{keyword}" search query
					</p>
				</div>
			</div>
			
			{/* Table */}
			<section className="w-full py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto -mt-2 sm:mt-0">
				<div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">
					<div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200" style={{ background: `linear-gradient(90deg, ${bpi_light_green}20, ${bpi_deep_green}10)` }}>
						<div className="flex items-center space-x-3">
							<div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${bpi_light_green}30` }}>
								<svg className="w-4 h-4" style={{ color: bpi_deep_green }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
								</svg>
							</div>
							<div>
								<h2 className="text-base sm:text-lg font-semibold text-gray-900">Search Results</h2>
								<p className="text-xs sm:text-sm text-gray-600">
									{searchResData.length} officers found for "{keyword}"
								</p>
							</div>
						</div>
					</div>
					
					<div className="p-0" style={{ background: `linear-gradient(180deg, white, ${bpi_light_green}20)` }}>
						<DataTable
							table={searchResData}
							cols={cols}
							table_name={`search-results`}
							pageSizeOptions={[10, 25, 50, 100]}
							pageSize={10}
							rowCount={searchResData.length}
							hide={[]}
							isServerSideRendered={false}
							loading={loading}
							className="w-full bg-transparent"
							onRowClick={(params) => {
								router.push({
									pathname: `/profile/[bpiId]`,
									query: { bpiId: params.row.bpiId, keyword: params.row.fullName },
								});
							}}
						/>
					</div>
				</div>
			</section>
			{/* <p className="text-xs text-white mt-[-3.5em] text-center mx-auto w-full max-w-[70em]">* Not Applicable in Badge No. is due to Civilians not having one. Unknown means there is missing data for this officer's badge.</p> */}
		</div>
	);
}
