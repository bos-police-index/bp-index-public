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
			<div className="bg-white shadow-sm border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-6 py-8">
					<nav className="flex items-center space-x-2 text-sm font-medium mb-6">
						<Link href="/" className="hover:text-opacity-80 transition-colors" style={{ color: bpi_light_green }}>
							Home
						</Link>
						<span className="text-gray-400">/</span>
						<Link href="/data" className="hover:text-opacity-80 transition-colors" style={{ color: bpi_light_green }}>
							Data
						</Link>
						<span className="text-gray-400">/</span>
						<span className="text-gray-600">{tableDef.table}</span>
					</nav>

					<div className="flex items-start space-x-6">
						<div className="flex-shrink-0">
							<div 
								className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg"
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
						<div className="flex-1">
							<h1 className="text-3xl font-bold text-gray-900 mb-3">
								{tableDef.table}
							</h1>
							<p className="text-lg text-gray-600 leading-relaxed mb-6">
								{tableDef?.longDescription}
							</p>
							
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
									<h3 className="font-semibold text-gray-900 mb-2">Data Sources</h3>
									<p className="text-gray-700 text-sm">{tableDef.source}</p>
								</div>
								<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
									<h3 className="font-semibold text-gray-900 mb-2">Time Period</h3>
									<p className="text-gray-700 text-sm">
										{props.dataYearRange.earliest === "" 
											? "Unspecified" 
											: `${getYearFromAnyFormat(props.dataYearRange.earliest)} - ${getYearFromAnyFormat(props.dataYearRange.latest)}`
										}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-6 py-8">
				<div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
					<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
						<div>
							<h2 className="text-xl font-semibold text-gray-900">Data Table</h2>
							<p className="text-sm text-gray-600 mt-1">
								Explore and analyze the {tableDef.table.toLowerCase()} data
							</p>
						</div>
						<Button 
							onClick={handleSeeAllClick} 
							type="primary" 
							className="rounded-lg px-6 py-2 h-auto font-medium shadow-sm transition-all duration-200 hover:shadow-md"
							style={{ 
								backgroundColor: bpi_deep_green,
								borderColor: bpi_deep_green,
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = bpi_light_green;
								e.currentTarget.style.borderColor = bpi_light_green;
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = bpi_deep_green;
								e.currentTarget.style.borderColor = bpi_deep_green;
							}}
						>
							📖 Table Glossary
						</Button>
					</div>

					<div className="p-6">
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
							className="rounded-lg"
							onRowClick={handleRowClick}
						/>
					</div>
				</div>
			</div>

			<ScreenOverlay title={currentOverlay.title} children={currentOverlay.table} />
		</div>
	);
}
