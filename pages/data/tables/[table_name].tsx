import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { Button } from "antd";

import apolloClient from "@lib/apollo-client";
import { GET_YEAR_RANGE_OF_DATASET } from "@lib/graphql/queries";
import { functionMapping } from "@utility/createMUIGrid";
import IconWrapper, { tableDefinitions } from "@utility/tableDefinitions";
import getHeaderWithDescription from "@utility/columnDefinitions";
import { getYearFromAnyFormat, getYearFromDate } from "@utility/textFormatHelpers";
import { table_name_to_alias_map } from "@utility/dataViewAliases";
import { tableDateColumnMap, handleQuery } from "@utility/queryUtils";
import ScreenOverlay from "@components/ScreenOverlay";
import GlossaryTotal from "@components/GlossaryTotal";
import DataTable from "@components/DataTable";
import { bpi_deep_green, bpi_light_green } from "@styles/theme/lightTheme";

export const dataToColumns = (data, table_name: string) => {
	const viewName = table_name_to_alias_map[table_name];
	let date_row_name = tableDateColumnMap[table_name];
	let dataArr: any[] = [];
	let rowCount: number;

	if (data && data[viewName]?.nodes) {
		rowCount = data[viewName].totalCount;
		dataArr = data[viewName]?.nodes.map((item, index) => {
			const { ...rest } = item;

			if (!date_row_name) {
				return {
					id: index + 1,
					...rest,
				};
			} else {
				return {
					id: index + 1,
					year: getYearFromDate(rest[date_row_name as keyof DetailRecord] as string),
					...rest,
				};
			}
		});
	} else {
		return { formattedData: [], rowCount: 0 };
	}

	if (table_name === "employee") {
		dataArr.forEach((item) => {
			delete item["officer_photo"];
		});
	}

	return { formattedData: dataArr || [], rowCount: rowCount || 0 };
};

export const getServerSideProps: GetServerSideProps = async (context) => {
	const table_name = context.params?.table_name as string;

	if (!table_name_to_alias_map[table_name] || !table_name) {
		return {
			notFound: true,
		};
	}

	let dates = { earliest: "", latest: "" };
	let earliestNeeded = true;
	let latestNeeded = true;
	if (tableDateColumnMap[table_name] != "") {
		let offset = 0;
		while (earliestNeeded || latestNeeded) {
			const dateRange = await apolloClient.query({ query: GET_YEAR_RANGE_OF_DATASET(table_name, tableDateColumnMap[table_name], offset, earliestNeeded, latestNeeded) });

			if (earliestNeeded && dateRange.data.earliest.nodes[0] != null ? dateRange.data.earliest.nodes[0][tableDateColumnMap[table_name]] : false) {
				dates.earliest = dateRange.data.earliest.nodes[0][tableDateColumnMap[table_name]];
				earliestNeeded = false;
			}
			if (latestNeeded && dateRange.data.latest.nodes[0] != null ? dateRange.data.latest.nodes[0][tableDateColumnMap[table_name]] : false) {
				dates.latest = dateRange.data.latest.nodes[0][tableDateColumnMap[table_name]];
				latestNeeded = false;
			}
			offset == 0 ? (offset += 2) : (offset *= 2);
		}
	}

	return {
		props: {
			table_name: table_name,
			columns: getHeaderWithDescription(functionMapping[table_name]),
			dataYearRange: dates,
		},
	};
};

export default function Table(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
	const router = useRouter();
	const tableDef = tableDefinitions.find((tableDef) => tableDef.query === props.table_name);
	const [currentOverlay, setCurrentOverlay] = useState({ table: null, title: null });
	const viewName = table_name_to_alias_map[props.table_name];

	const handleRowClick = (params) => {
		if (props.table_name === "officer_misconduct" && params.row.iaNumber) {
			router.push({
				pathname: "/ia/[iaNumber]",
				query: { iaNumber: params.row.iaNumber }
			});
		}
	};

	const handleSeeAllClick = () => {
		setCurrentOverlay({ table: <GlossaryTotal columnObjects={props.columns} total={false} />, title: `${tableDef.table} Glossary` });
		document.getElementById("screen-overlay").classList.add("flex");
		document.getElementById("screen-overlay").classList.remove("hidden");
	};

	const cols = functionMapping[props.table_name];
	const hide = cols.filter((col) => col.hideable === true).map((col) => col.field);
	
	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
			<div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
					<nav className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm mb-6 sm:mb-8">
						<Link href="/" className="text-slate-300 hover:text-white transition-colors duration-200">
							Home
						</Link>
						<svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
						</svg>
						<Link href="/data" className="text-slate-300 hover:text-white transition-colors duration-200">
							Data
						</Link>
						<svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
						</svg>
						<span className="text-slate-400 truncate">{tableDef.table}</span>
					</nav>

					<div className="flex flex-col sm:flex-row items-start sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
						<div className="flex-shrink-0 mx-auto sm:mx-0">
							<div 
								className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white/20"
								style={{ 
									background: `linear-gradient(135deg, ${bpi_light_green}, ${bpi_deep_green})` 
								}}
							>
								<IconWrapper 
									Icon={tableDef.image.src} 
									color="white" 
									fontSize="2rem" 
								/>
							</div>
						</div>
						<div className="flex-1 text-center sm:text-left w-full">
							<h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 tracking-tight break-words">
								{tableDef.table}
							</h1>
							<p className="text-sm sm:text-base lg:text-lg text-gray-200 leading-relaxed">
								{tableDef?.longDescription}
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 -mt-2 sm:mt-0">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
					<div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
						<div className="flex items-center justify-between mb-3 sm:mb-4">
							<h2 className="text-lg sm:text-xl font-semibold text-gray-900">Data Sources</h2>
							<div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${bpi_light_green}30` }}>
								<svg className="w-4 h-4" style={{ color: bpi_deep_green }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
							</div>
						</div>
						<div>
							<p className="text-gray-700">{tableDef.source}</p>
						</div>
					</div>

					<div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
						<div className="flex items-center justify-between mb-3 sm:mb-4">
							<h2 className="text-lg sm:text-xl font-semibold text-gray-900">Time Period</h2>
							<div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${bpi_light_green}30` }}>
								<svg className="w-4 h-4" style={{ color: bpi_deep_green }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
							</div>
						</div>
						<div>
							<p className="text-gray-700 font-medium">
								{props.dataYearRange.earliest === "" 
									? "Unspecified" 
									: `${getYearFromAnyFormat(props.dataYearRange.earliest)} - ${getYearFromAnyFormat(props.dataYearRange.latest)}`
								}
							</p>
						</div>
					</div>
				</div>
				<div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">
					<div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200" style={{ background: `linear-gradient(90deg, ${bpi_light_green}20, ${bpi_deep_green}10)` }}>
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-3">
								<div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${bpi_light_green}30` }}>
									<svg className="w-4 h-4" style={{ color: bpi_deep_green }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
									</svg>
								</div>
								<div>
									<h2 className="text-base sm:text-lg font-semibold text-gray-900">Data Table</h2>
									<p className="text-xs sm:text-sm text-gray-600">
										Explore and analyze the {tableDef.table.toLowerCase()} data
									</p>
								</div>
							</div>
							<Button 
								onClick={handleSeeAllClick} 
								type="primary" 
								className="flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 hover:shadow-md"
								style={{ 
									backgroundColor: 'transparent',
									borderColor: 'transparent',
									boxShadow: 'none',
									height: 'auto',
									color: bpi_deep_green
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.backgroundColor = `${bpi_light_green}40`;
									e.currentTarget.style.borderColor = bpi_light_green;
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.backgroundColor = 'transparent';
									e.currentTarget.style.borderColor = 'transparent';
								}}
							>
								<svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
								<span>📖 Table Glossary</span>
							</Button>
						</div>
					</div>

					<div className="p-0">
						<div className="overflow-hidden" style={{ background: `linear-gradient(180deg, white, ${bpi_light_green}20)` }}>
							<DataTable 
								table={[]} 
								cols={cols} 
								table_name={props.table_name} 
								pageSizeOptions={[25, 50, 75, 100]} 
								pageSize={25} 
								rowCount={undefined} 
								hide={hide} 
								isServerSideRendered={true} 
								query={handleQuery(props.table_name)}
								className="w-full bg-transparent"
								onRowClick={handleRowClick}
							/>						</div>
					</div>
				</div>
			</div>

			<ScreenOverlay title={currentOverlay.title} children={currentOverlay.table} />
		</div>
	);
}
