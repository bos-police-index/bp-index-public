import React, { FunctionComponentElement, useEffect, useState } from "react";
import { InferGetServerSidePropsType } from "next";
import { GetServerSideProps } from "nextjs-routes";
import Link from "next/link";

import LocalPoliceIcon from "@mui/icons-material/LocalPolice";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import TableViewIcon from "@mui/icons-material/TableView";

import { bpi_deep_green, bpi_light_green } from "@styles/theme/lightTheme";
import PayStackedBarChart from "@components/profileVisualizations/StackedBarChartOfficerFinancial";
import FinancialHistogram from "@components/profileVisualizations/(histogram)/FinancialHistogram";
import { Filter } from "@components/profileVisualizations/(histogram)/HistogramDataFeeder";
import { INDIVIDUAL_OFFICER_COURT_OVERTIMES, INDIVIDUAL_OFFICER_DETAIL_RECORDS, INDIVIDUAL_OFFICER_FIO_RECORDS, INDIVIDUAL_OFFICER_IA } from "@lib/graphql/queries";
import { court_overtime_alias_name, detail_alias_name, fio_record_alias_name, officer_ia_alias_name } from "@utility/dataViewAliases";
import { fixZipCode, formatMoneyNoCents, formatPercentileNoDecimals } from "@utility/textFormatHelpers";
import { getMUIGrid } from "@utility/createMUIGrid";
import { getNeighborhoodByZip } from "@utility/zipCodeMapping";
import { deduplicateRecordsbyId, extractEmployeeFinancialRowsFromIndividualEmployeeFinancialQuery, getIndividualOfficerFinancial, getMostRecentOfficerFinancialData, getOfficerProfileData } from "../../services/profile/data_fetchers";

interface Table {
	title: string;
	tables: DataTables;
	recordCount?: number;
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
					recordCount: rows.length, // Add record count
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
		<div className="min-h-screen bg-gray-50">
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
						<span className="text-slate-400 truncate">Officer Profile</span>
					</nav>

					{/* Officer Header */}
					<div className="flex flex-col sm:flex-row items-start sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
						<div className="flex-shrink-0 mx-auto sm:mx-0">
							<div 
								className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white/20"
								style={{ 
									background: `linear-gradient(135deg, ${bpi_light_green}, ${bpi_deep_green})` 
								}}
							>
								<LocalPoliceIcon style={{ fontSize: '2rem', color: 'white' }} className="sm:text-4xl" />
							</div>
						</div>
						<div className="flex-1 text-center sm:text-left w-full">
							<h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 tracking-tight break-words">
								{officerData.name}
							</h1>
							<div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 mb-3 sm:mb-4">
								<div className="flex items-center space-x-2">
									<MilitaryTechIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
									<span className="text-lg sm:text-xl text-slate-300 truncate">{officerData.rank}</span>
								</div>
								<div className={`px-3 py-2 sm:px-4 rounded-full text-xs sm:text-sm font-semibold ${getStatusColor(officerData.totalPayPercentile)} shadow-lg whitespace-nowrap`}>
									Top {formatPercentileNoDecimals(officerData.totalPayPercentile)}% Earner
								</div>
							</div>
							<div className="flex items-center justify-center sm:justify-start space-x-2 text-slate-400">
								<svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
								</svg>
								<span className="text-sm sm:text-base">Badge #{officerData.badgeNo}</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
				{/* Stats Cards Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
					{/* Financial Summary Card */}
					<div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
						<div className="flex items-center justify-between mb-3 sm:mb-4">
							<div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
								<svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
								</svg>
							</div>
							<span className="text-xs sm:text-sm font-medium text-gray-500">{mostRecentFinancialYear}</span>
						</div>
						<div className="mb-2">
							<div className="text-lg sm:text-2xl font-bold text-gray-900">${formatMoneyNoCents(officerData.totalEarnings)}</div>
							<div className="text-xs sm:text-sm text-gray-600">Total Earnings</div>
						</div>
						<div className="text-xs text-emerald-600 font-medium">
							Top {formatPercentileNoDecimals(officerData.totalPayPercentile)}% of all officers
						</div>
					</div>

					{/* Unit & Demographics Card */}
					<div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
						<div className="flex items-center justify-between mb-3 sm:mb-4">
							<div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
								<svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
							</div>
						</div>
						<div className="space-y-2 sm:space-y-3">
							<div>
								<div className="text-sm font-semibold text-gray-900 break-words">{officerData.unit}</div>
								<div className="text-xs text-gray-500">Unit Assignment</div>
							</div>
							<div>
								<div className="text-sm text-gray-700">{officerData.race}, {officerData.sex}</div>
								<div className="text-xs text-gray-500">Demographics</div>
							</div>
						</div>
					</div>

					{/* Location Card */}
					<div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
						<div className="flex items-center justify-between mb-3 sm:mb-4">
							<div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center">
								<svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
							</div>
						</div>
						<div>
							<div className="text-sm font-semibold text-gray-900 break-words">{getNeighborhoodByZip(fixZipCode(officerData.residence))}</div>
							<div className="text-xs text-gray-500">Residence Area</div>
						</div>
					</div>

					{/* Records Summary Card */}
					<div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
						<div className="flex items-center justify-between mb-3 sm:mb-4">
							<div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-xl flex items-center justify-center">
								<svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
							</div>
						</div>
						<div className="space-y-2">
							<div className="flex justify-between text-sm">
								<span className="text-gray-600">IA Cases:</span>
								<span className={`font-semibold ${officerData.ia_num > 0 ? 'text-red-600' : 'text-gray-900'}`}>
									{officerData.ia_num}
								</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-gray-600">Detail Records:</span>
								<span className="font-semibold text-gray-900">{officerData.detail_num}</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-gray-600">FIO Records:</span>
								<span className="font-semibold text-gray-900">{officerData.fio_record_num}</span>
							</div>
						</div>
					</div>
				</div>

				{/* Overview Section */}
				<div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
								<TableViewIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-600" />
								Detailed Records Overview
							</h2>
							<p className="text-xs sm:text-sm text-gray-600 mt-1">Comprehensive data across all available record types</p>
						</div>
						<div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
							<div className="w-2 h-2 bg-green-400 rounded-full"></div>
							<span>{props.tables.reduce((total, table) => total + (table.rows?.length || 0), 0)} Total Records</span>
						</div>
					</div>
					
					{/* Summary Stats Row */}
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
						{props.tables.map((table, index) => {
							const recordCount = table.rows?.length || 0;
							const colors = [
								'bg-blue-50 text-blue-700 border-blue-200',
								'bg-red-50 text-red-700 border-red-200', 
								'bg-emerald-50 text-emerald-700 border-emerald-200',
								'bg-purple-50 text-purple-700 border-purple-200',
								'bg-orange-50 text-orange-700 border-orange-200'
							];
							return (
								<div key={index} className={`px-2 sm:px-3 py-2 rounded-lg border text-center ${colors[index]}`}>
									<div className="text-sm sm:text-lg font-bold">{recordCount}</div>
									<div className="text-xs font-medium truncate" title={table.title}>{table.title}</div>
								</div>
							);
						})}
					</div>
				</div>

				{/* Individual Data Cards */}
				{tablesArr && tablesArr.length > 0 && (
					<div className="space-y-6 sm:space-y-8 mb-6 sm:mb-8">
						{tablesArr.map((table, index) => {
							const recordCount = table.recordCount || 0;
							const colors = [
								{ bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-100', iconColor: 'text-blue-600', accent: 'text-blue-700' },
								{ bg: 'bg-red-50', border: 'border-red-200', icon: 'bg-red-100', iconColor: 'text-red-600', accent: 'text-red-700' },
								{ bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-100', iconColor: 'text-emerald-600', accent: 'text-emerald-700' },
								{ bg: 'bg-purple-50', border: 'border-purple-200', icon: 'bg-purple-100', iconColor: 'text-purple-600', accent: 'text-purple-700' },
								{ bg: 'bg-orange-50', border: 'border-orange-200', icon: 'bg-orange-100', iconColor: 'text-orange-600', accent: 'text-orange-700' }
							];
							const colorScheme = colors[index % colors.length];
							
							// Define icons for each table type
							const getIconForTable = (title: string) => {
								switch (title) {
									case 'Detail Record':
										return (
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
										);
									case 'Officer IA':
										return (
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
										);
									case 'Police Earnings':
										return (
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
										);
									case 'Court Overtimes':
										return (
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
										);
									case 'Field Interrogation & Observations':
										return (
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
										);
									default:
										return (
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
										);
								}
							};
							
							// Skip if no records
							if (recordCount === 0) return null;
							
							return (
								<div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">
									<div className={`px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 ${colorScheme.bg}`}>
										<div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
											<div className="flex items-center space-x-3">
												<div className={`w-8 h-8 sm:w-10 sm:h-10 ${colorScheme.icon} rounded-lg flex items-center justify-center`}>
													<svg className={`w-4 h-4 sm:w-5 sm:h-5 ${colorScheme.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
														{getIconForTable(table.title)}
													</svg>
												</div>
												<div className="flex-1">
													<h3 className="text-base sm:text-lg font-semibold text-gray-900">{table.title}</h3>
													<p className="text-xs sm:text-sm text-gray-600">{recordCount} records available</p>
												</div>
											</div>
											<div className="flex items-center justify-end">
												<div className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${colorScheme.bg} ${colorScheme.accent} border ${colorScheme.border}`}>
													{recordCount} records
												</div>
											</div>
										</div>
									</div>
									<div className="p-0">
										{table.tables?.filteredTable || table.tables?.fullTable}
									</div>
								</div>
							);
						})}
					</div>
				)}

				{/* Visualizations Section */}
				{tablesArr[2]?.tables?.fullTable && (
					<div className="space-y-6 sm:space-y-8">
						<div id="stackedBarChart" className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
							<div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-blue-50">
								<div className="flex items-center space-x-2 sm:space-x-3">
									<div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
										<svg className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
										</svg>
									</div>
									<div>
										<h2 className="text-base sm:text-lg font-semibold text-gray-900">Annual Earnings Breakdown</h2>
										<p className="text-xs sm:text-sm text-gray-600">Year-over-year earnings analysis by pay category</p>
									</div>
								</div>
							</div>
							<div className="p-3 sm:p-6">
								<PayStackedBarChart data={tablesArr[2].tables.fullTable} />
							</div>
						</div>

						<div id="financialHistogram" className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">
							<div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-violet-50">
								<div className="flex flex-col sm:flex-row sm:items-center justify-between">
									<div className="flex items-center space-x-3 mb-2 sm:mb-0">
										<div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
											<svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
											</svg>
										</div>
										<div>
											<h2 className="text-base sm:text-lg font-semibold text-gray-900">Pay Distribution Analysis</h2>
											<p className="text-xs sm:text-sm text-gray-600">Officer's position within department-wide pay distribution</p>
										</div>
									</div>
									<div className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-50 rounded-full border border-indigo-100 text-xs sm:text-sm text-indigo-700 font-medium">
										<svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
										</svg>
										<span>Top {formatPercentileNoDecimals(officerData.totalPayPercentile)}% Earner</span>
									</div>
								</div>
							</div>
							<div className="p-2 sm:p-4 md:p-6 overflow-hidden">
								<div className="bg-gradient-to-b from-white to-indigo-50/30 rounded-xl max-w-full overflow-hidden">
									<div className="overflow-auto -mx-1 px-1">
										<FinancialHistogram 
											officerPayData={tablesArr[2]?.tables?.fullTable?.props}
											officerDetailData={officerDetailData}
											mode="total"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	) : null;
}
