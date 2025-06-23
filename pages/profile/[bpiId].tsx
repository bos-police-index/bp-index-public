import React, { FunctionComponentElement, useEffect, useState } from "react";
import { getMUIGrid } from "@utility/createMUIGrid";
import FullWidthTabs from "../../components/TabTables";
import { bpi_deep_green, bpi_light_gray, bpi_light_green } from "@styles/theme/lightTheme";
import PayStackedBarChart from "../../components/profileVisualizations/StackedBarChartOfficerFinancial";
import FinancialHistogram from "../../components/profileVisualizations/(histogram)/FinancialHistogram";
import { Filter } from "../../components/profileVisualizations/(histogram)/HistogramDataFeeder";
import { Paper, Divider, Box, Typography } from "@mui/material";
import { INDIVIDUAL_OFFICER_COURT_OVERTIMES, INDIVIDUAL_OFFICER_DETAIL_RECORDS, INDIVIDUAL_OFFICER_FIO_RECORDS, INDIVIDUAL_OFFICER_IA } from "@lib/graphql/queries";
import { court_overtime_alias_name, detail_alias_name, fio_record_alias_name, officer_ia_alias_name } from "@utility/dataViewAliases";
import { GetServerSideProps } from "nextjs-routes";
import { InferGetServerSidePropsType } from "next";
import { fixZipCode, formatMoneyNoCents, formatPercentileNoDecimals } from "@utility/textFormatHelpers";
import { deduplicateRecordsbyId, extractEmployeeFinancialRowsFromIndividualEmployeeFinancialQuery, getIndividualOfficerFinancial, getMostRecentOfficerFinancialData, getOfficerProfileData } from "../../services/profile/data_fetchers";
import { getNeighborhoodByZip } from "@utility/zipCodeMapping";
import { TableOfContentsButton } from "@components/profileVisualizations/TableOfContentsButton";
import LocalPoliceIcon from "@mui/icons-material/LocalPolice";
import Link from "next/link";

interface Table {
	title: string;
	tables: DataTables;
}
interface DataTables {
	fullTable: FunctionComponentElement<{}> | null;
	filteredTable: FunctionComponentElement<{}> | null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
	const bpiId = context.params?.bpiId as string;

	if (!bpiId) {
		console.log("bpiId NOT FOUND", bpiId);
		return {
			notFound: true,
		};
	}

	/*FINANCIAL DATA*/
	const financeEmployeeData = await getIndividualOfficerFinancial(bpiId);

	// Collapse data from all entries into one
	let mostRecentEmployeeData: FinancialEmployeeData = getMostRecentOfficerFinancialData(financeEmployeeData);

	//used for profile summary
	let officerData: OfficerData = {
		bpiId: bpiId,
		name: `${mostRecentEmployeeData.firstName} ${mostRecentEmployeeData.lastName}`,
		badgeNo: mostRecentEmployeeData.badgeNo,
		rank: mostRecentEmployeeData.rank,
		unit: mostRecentEmployeeData.unit,
		residence: mostRecentEmployeeData.zipCode,
		sex: mostRecentEmployeeData.sex,
		race: mostRecentEmployeeData.race,
		totalEarnings: mostRecentEmployeeData.totalPay,
		ia_num: 0,
		detail_num: 0,
		fio_record_num: 0,
		totalPayPercentile: mostRecentEmployeeData.totalPayPercentile,
	};

	const { police_financial_rows, mostRecentFinancialYear } = extractEmployeeFinancialRowsFromIndividualEmployeeFinancialQuery(financeEmployeeData);

	/* DETAIL RECORDS */
	const detail_record_query = INDIVIDUAL_OFFICER_DETAIL_RECORDS(bpiId);
	const detail_record_rows = await getOfficerProfileData(detail_record_query, detail_alias_name);
	officerData.detail_num = detail_record_rows.length;

	/* IA RECORDS */
	const ia_query = INDIVIDUAL_OFFICER_IA(bpiId);
	const officer_IA_rows = await getOfficerProfileData(ia_query, officer_ia_alias_name);
	officerData.ia_num = officer_IA_rows.length;

	/* COURT OVERTIME RECORDS */
	const court_overtime_query = INDIVIDUAL_OFFICER_COURT_OVERTIMES(bpiId);
	const court_overtime_rows = await getOfficerProfileData(court_overtime_query, court_overtime_alias_name);

	/* FIO RECORDS */
	const fio_record_query = INDIVIDUAL_OFFICER_FIO_RECORDS(bpiId);
	const raw_fio_record_rows = await getOfficerProfileData(fio_record_query, fio_record_alias_name);
	const fio_record_rows = deduplicateRecordsbyId(raw_fio_record_rows, "fcNum");
	// console.log(fio_record_rows);
	officerData.fio_record_num = fio_record_rows.length;

	return {
		props: {
			officerData: officerData,
			mostRecentFinancialYear: mostRecentFinancialYear,
			tables: [
				{
					title: "Detail Record",
					tableName: "detail_record",
					rows: detail_record_rows,
				},
				{
					title: "Officer IA",
					tableName: "officer_ia",
					rows: officer_IA_rows,
				},
				{
					title: "Police Earnings",
					tableName: "police_financial",
					rows: police_financial_rows,
				},
				{
					title: "Court Overtimes",
					tableName: "court_overtime",
					rows: court_overtime_rows,
				},
				{
					title: "Field Interrogation & Observations",
					tableName: "fio_record",
					rows: fio_record_rows,
				},
			],
		},
	};
};

export default function OfficerProfile(props: InferGetServerSidePropsType<typeof getServerSideProps>): FunctionComponentElement<{}> {
	const [tablesArr, setTablesArr] = useState<Table[]>([]);
	const [officerDetailData, setOfficerDetailData] = useState<Filter>();
	const [tableFilters] = useState({
		detail_record: {
			includesOnly: [],
			excludes: [],
		},
		officer_ia: {
			includesOnly: [],
			excludes: [],
		},

		police_financial: {
			includesOnly: [],
			excludes: [],
		},
		court_overtime: {
			includesOnly: [],
			excludes: [],
		},
		fio_record: {
			includesOnly: [],
			excludes: [],
		},
	});
	const mostRecentFinancialYear = props.mostRecentFinancialYear;
	const officerData: OfficerData = props.officerData;

	useEffect(() => {
		const assignData = async () => {
			let tablesArr: Table[] = [];
			for (let table of props.tables) {
				let rows = table.rows;
				let tableTitle = table.title;
				let tableName = table.tableName;
				let tableEntry = {
					title: tableTitle,
					tables: getMUIGrid(tableName, rows, props.officerData.name, tableFilters[tableName].includesOnly, tableFilters[tableName].excludes, rows.length) as DataTables,
				};

				tablesArr.push(tableEntry);
			}
			const officerDetails: Filter = {
				sex: props.officerData.sex,
				race: props.officerData.race,
				rank: props.officerData.rank,
				zipCode: Number(props.officerData.residence),
				unit: props.officerData.unit,
			};
			setOfficerDetailData(officerDetails);
			setTablesArr(tablesArr);
		};

		assignData();
	}, [props, tableFilters]);

	const getStatusColor = (percentile: number) => {
		if (percentile >= 90) return 'bg-red-100 text-red-800';
		if (percentile >= 75) return 'bg-orange-100 text-orange-800';
		if (percentile >= 50) return 'bg-blue-100 text-blue-800';
		return 'bg-gray-100 text-gray-800';
	};

	return officerData ? (
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
						<span className="text-gray-600">Officer Profile</span>
					</nav>

					<div className="flex items-start space-x-6">
						<div className="flex-shrink-0">
							<div 
								className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg"
								style={{ 
									background: `linear-gradient(135deg, ${bpi_light_green}, ${bpi_deep_green})` 
								}}
							>
								<LocalPoliceIcon style={{ fontSize: '2rem', color: 'white' }} />
							</div>
						</div>
						<div className="flex-1">
							<h1 className="text-3xl font-bold text-gray-900 mb-3">
								{officerData.name}
							</h1>
							<div className="flex items-center space-x-4">
								<p className="text-lg text-gray-600">{officerData.rank}</p>
								<div className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(officerData.totalPayPercentile)}`}>
									Top {formatPercentileNoDecimals(officerData.totalPayPercentile)}% Earner
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-6 py-8">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
					{/* Overview Card */}
					<div className="bg-white rounded-xl shadow-lg overflow-hidden">
						<div className="px-6 py-5 border-b border-gray-200">
							<h2 className="text-lg font-semibold text-gray-900">Overview</h2>
						</div>
						<div className="px-6 py-5 space-y-4">
							<div>
								<div className="text-sm font-medium text-gray-500">Badge Number</div>
								<div className="mt-1 text-gray-900">{officerData.badgeNo}</div>
							</div>
							<div>
								<div className="text-sm font-medium text-gray-500">Unit</div>
								<div className="mt-1 text-gray-900">{officerData.unit}</div>
							</div>
							<div>
								<div className="text-sm font-medium text-gray-500">Residence</div>
								<div className="mt-1 text-gray-900">{getNeighborhoodByZip(fixZipCode(officerData.residence))}</div>
							</div>
							<div>
								<div className="text-sm font-medium text-gray-500">Demographics</div>
								<div className="mt-1 text-gray-900">{officerData.race}, {officerData.sex}</div>
							</div>
						</div>
					</div>

					{/* Data Summary Card */}
					<div className="bg-white rounded-xl shadow-lg overflow-hidden">
						<div className="px-6 py-5 border-b border-gray-200">
							<h2 className="text-lg font-semibold text-gray-900">Data Summary</h2>
						</div>
						<div className="px-6 py-5 space-y-4">
							<div>
								<div className="text-sm font-medium text-gray-500">Detail Records</div>
								<div className="mt-1 text-gray-900">{officerData.detail_num}</div>
							</div>
							<div>
								<div className="text-sm font-medium text-gray-500">Officer IAs</div>
								<div className="mt-1 text-gray-900">{officerData.ia_num}</div>
							</div>
							<div>
								<div className="text-sm font-medium text-gray-500">Officer FIOs</div>
								<div className="mt-1 text-gray-900">{officerData.fio_record_num}</div>
							</div>
						</div>
					</div>

					{/* Financial Summary Card */}
					<div className="bg-white rounded-xl shadow-lg overflow-hidden">
						<div className="px-6 py-5 border-b border-gray-200">
							<h2 className="text-lg font-semibold text-gray-900">Financial Summary</h2>
						</div>
						<div className="px-6 py-5 space-y-4">
							<div>
								<div className="text-sm font-medium text-gray-500">{mostRecentFinancialYear} Earnings</div>
								<div className="mt-1">
									<span className="text-2xl font-bold text-gray-900">${formatMoneyNoCents(officerData.totalEarnings)}</span>
									<span className="ml-2 text-sm text-gray-500">
										Top {formatPercentileNoDecimals(officerData.totalPayPercentile)}%
									</span>
								</div>
							</div>
							<div className="pt-4">
								<div className="flex flex-col space-y-2">
									<TableOfContentsButton 
										svg_path="/Annual_Earnings_Breakdown.svg" 
										text="Officer Earnings Visualization" 
										anchor="stackedBarChart" 
									/>
									<TableOfContentsButton 
										svg_path="/Officer_Pay_Distribution.svg" 
										text="Officer Pay Histogram" 
										anchor="financialHistogram" 
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Data Tables Section */}
				<div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
					{tablesArr ? <FullWidthTabs tables={tablesArr} /> : null}
				</div>

				{/* Visualizations Section */}
				{tablesArr[2]?.tables?.fullTable && (
					<div className="space-y-6">
						<div id="stackedBarChart" className="bg-white rounded-xl shadow-lg overflow-hidden p-6">
							<h2 className="text-lg font-semibold text-gray-900 mb-4">Annual Earnings Breakdown</h2>
							<PayStackedBarChart data={tablesArr[2].tables.fullTable} />
						</div>

						<div id="financialHistogram" className="bg-white rounded-xl shadow-lg overflow-hidden p-6">
							<h2 className="text-lg font-semibold text-gray-900 mb-4">Officer Pay Distribution</h2>
							<FinancialHistogram 
								officerPayData={tablesArr[2]?.tables?.fullTable?.props}
								officerDetailData={officerDetailData}
								mode="total"
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	) : null;
}
