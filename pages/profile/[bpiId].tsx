import React, { FunctionComponentElement, useEffect, useState } from "react";
import { getMUIGrid } from "@utility/createMUIGrid";
import FullWidthTabs from "../../components/TabTables";
import { bpi_deep_green, bpi_light_gray, bpi_light_green } from "@styles/theme/lightTheme";
import PayStackedBarChart from "../../components/profileVisualizations/StackedBarChartOfficerFinancial";
import FinancialHistogram from "../../components/profileVisualizations/(histogram)/FinancialHistogram";
import { Filter } from "../../components/profileVisualizations/(histogram)/HistogramDataFeeder";
import { INDIVIDUAL_OFFICER_COURT_OVERTIMES, INDIVIDUAL_OFFICER_DETAIL_RECORDS, INDIVIDUAL_OFFICER_FIO_RECORDS, INDIVIDUAL_OFFICER_IA } from "@lib/graphql/queries";
import { court_overtime_alias_name, detail_alias_name, fio_record_alias_name, officer_ia_alias_name } from "@utility/dataViewAliases";
import { GetServerSideProps } from "nextjs-routes";
import { InferGetServerSidePropsType } from "next";
import { fixZipCode, formatMoneyNoCents, formatPercentileNoDecimals } from "@utility/textFormatHelpers";
import { deduplicateRecordsbyId, extractEmployeeFinancialRowsFromIndividualEmployeeFinancialQuery, getIndividualOfficerFinancial, getMostRecentOfficerFinancialData, getOfficerProfileData } from "../../services/profile/data_fetchers";
import { getNeighborhoodByZip } from "@utility/zipCodeMapping";
import { Divider } from "@mui/material";
import { TableOfContentsButton } from "@components/profileVisualizations/TableOfContentsButton";

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
	}, [props]);

	const sectionHeaderColor = bpi_light_green;

	return officerData ? (
		<>
			<section
				style={{
					backgroundColor: "white",
					paddingBottom: "0rem",
					position: "relative",
				}}
			>
				<div className="contain-content" style={{ width: "68.25%", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "flex-start", marginBottom: "1.5rem" }} id="profile-header">
					<div className="title" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: bpi_deep_green }}>
						<p className="relative text-4xl font-bold" style={{ paddingTop: "2rem", marginLeft: "1rem", marginBottom: "1.5rem" }}>
							{officerData.name}
						</p>
					</div>
					<div className="sections" style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "1rem" }}>
						<div className="overview" style={{ boxShadow: "0px 0px 8px 3px rgba(0, 0, 0, 0.1)", padding: "1rem 1.5rem", width: "52%", marginRight: "2rem", height: "300px" }}>
							<p style={{ color: sectionHeaderColor }} className="text-3xl">
								Overview
							</p>
							<p className="text-lg mt-3">
								<strong>Badge Number:</strong> {officerData.badgeNo}
							</p>
							<p className="text-lg">
								<strong>Rank:</strong> {officerData.rank}
							</p>
							<p className="text-lg">
								<strong>Unit:</strong> {officerData.unit}
							</p>
							<p className="text-lg">
								<strong>Residence:</strong> {getNeighborhoodByZip(fixZipCode(officerData.residence))}
							</p>
							<p className="text-lg">
								<strong>Sex:</strong> {officerData.sex}
							</p>
							<p className="text-lg">
								<strong>Race:</strong> {officerData.race}
							</p>
						</div>
						<div className="table-of-contents" style={{ boxShadow: "0px 0px 8px 3px rgba(0, 0, 0, 0.1)", padding: "1rem 1.5rem", width: "43%", height: "300px" }}>
							<p style={{ color: sectionHeaderColor }} className="text-3xl">
								Data Summary
							</p>
							<div className="text-lg mt-3" style={{ display: "flex", justifyContent: "space-between" }}>
								<strong>Detail Records</strong>
								<span>{officerData.detail_num}</span>
							</div>
							<div className="text-lg" style={{ display: "flex", justifyContent: "space-between" }}>
								<strong>Officer IAs</strong>
								<span>{officerData.ia_num}</span>
							</div>
							<div className="text-lg" style={{ display: "flex", justifyContent: "space-between" }}>
								<strong>Officer FIOs</strong>
								<span>{officerData.fio_record_num}</span>
							</div>

							<Divider style={{ margin: "1rem 0", color: "#979797" }} sx={{ opacity: "2" }} />

							<div className="text-lg" style={{ display: "flex", justifyContent: "space-between", lineHeight: "1", flexDirection: "column" }}>
								<div style={{ display: "flex", justifyContent: "space-between" }}>
									<strong style={{ cursor: "pointer" }}>{mostRecentFinancialYear} Earnings</strong> {`$${formatMoneyNoCents(officerData.totalEarnings)}`}
								</div>
								<div style={{ display: "flex", alignItems: "center", justifyContent: "end", fontSize: "small" }}>({formatPercentileNoDecimals(officerData.totalPayPercentile)}%)</div>
							</div>

							<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.25rem" }}>
								<TableOfContentsButton svg_path="/Annual_Earnings_Breakdown.svg" text="Officer Earnings Visualization" anchor="stackedBarChart" />
								<TableOfContentsButton svg_path="/Officer_Pay_Distribution.svg" text="Officer Pay Histogram" anchor="financialHistogram" />
							</div>
							{/* <p className="text-lg"><strong style={{ cursor: "pointer" }}>Traffic Tickets:</strong> {officerData.traffic_no}</p> */}
						</div>
					</div>
				</div>
			</section>{" "}
			: <></>
			<section>
				<div style={{ backgroundColor: bpi_light_gray, paddingTop: "1.25rem", paddingBottom: ".25rem" }}>
					{tablesArr ? <FullWidthTabs tables={tablesArr} /> : <></>}
					{tablesArr[2]?.tables?.fullTable ? (
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "flex-start",
								justifyContent: "center",
								width: "100%",
								backgroundColor: bpi_light_gray,
							}}
						>
							<div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }} id="stackedBarChart">
								<PayStackedBarChart data={tablesArr[2].tables.fullTable} />
							</div>

							<div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "5rem" }} id="financialHistogram">
								<FinancialHistogram officerPayData={tablesArr[2]?.tables?.fullTable?.props} officerDetailData={officerDetailData} mode={"total"} />
							</div>
						</div>
					) : (
						<></>
					)}{" "}
				</div>
			</section>
		</>
	) : (
		<></>
	);
}
