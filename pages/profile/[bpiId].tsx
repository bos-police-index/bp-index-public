import React, { FunctionComponentElement, useEffect, useState } from "react";
import { getMUIGrid } from "@utility/createMUIGrid";
import apolloClient from "@lib/apollo-client";
import { useRouter } from "next/router";
import FullWidthTabs from "../../components/TabTables";
import { bpi_deep_green, bpi_light_gray, bpi_light_green } from "@styles/theme/lightTheme";
import PayStackedBarChart from "../../components/profileVisualizations/StackedBarChartOfficerFinancial";
import FinancialHistogram from "../../components/profileVisualizations/(histogram)/FinancialHistogram";
import { Filter } from "../../components/profileVisualizations/(histogram)/HistogramDataFeeder";
import { INDIVIDUAL_OFFICER_DETAIL_RECORDS, INDIVIDUAL_OFFICER_FINANCIAL_AND_EMPLOYEE, INDIVIDUAL_OFFICER_IA } from "@lib/graphql/queries";
import { detail_alias_name } from "@utility/dataViewAliases";
import { GetServerSideProps } from "nextjs-routes";
import { InferGetServerSidePropsType } from "next";
import { formatPercentile } from "@utility/textFormatHelpers";

export interface Table {
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
	const financial_and_employee_query = INDIVIDUAL_OFFICER_FINANCIAL_AND_EMPLOYEE(bpiId);

	// catch error if invalid bpiID
	let financialAndEmployeeResponse: any;
	try {
		financialAndEmployeeResponse = await apolloClient.query({ query: financial_and_employee_query });
	} catch (error) {
		console.error("GraphQL query error:", error);
		financialAndEmployeeResponse = null;
	}

	// If the response is invalid, return a 404
	if (!financialAndEmployeeResponse) {
		return {
			notFound: true,
		};
	}

	const financeEmployeeData = financialAndEmployeeResponse.data.allLinkSu24EmployeeFinancials.nodes;

	// Collapse data from all entries into one
	let mostRecentEmployeeData: FinancialEmployeeData = financeEmployeeData[0];
	financeEmployeeData.slice(0).map((node: any) => {
		if (mostRecentEmployeeData.year && mostRecentEmployeeData.year < node.year) {
			mostRecentEmployeeData = {
				org: "",
				numOfIa: 0,
				race: node.race || mostRecentEmployeeData.race,
				rank: node.rank || mostRecentEmployeeData.rank,
				sex: node.sex || mostRecentEmployeeData.sex,
				unit: node.unit || mostRecentEmployeeData.unit,
				year: node.year,
				zipCode: node.zipCode || mostRecentEmployeeData.zipCode,
				unionCode: node.unionCode || mostRecentEmployeeData.unionCode,
				badgeNo: node.badgeNo || mostRecentEmployeeData.badgeNo,
				firstName: node.firstName || mostRecentEmployeeData.firstName,
				lastName: node.lastName || mostRecentEmployeeData.lastName,
				otPay: node.otPay || mostRecentEmployeeData.otPay,
				otherPay: node.otherPay || mostRecentEmployeeData.otherPay,
				quinnPay: node.quinnPay || mostRecentEmployeeData.quinnPay,
				regularPay: node.regularPay || mostRecentEmployeeData.regularPay,
				retroPay: node.retroPay || mostRecentEmployeeData.retroPay,
				totalPay: node.totalPay || mostRecentEmployeeData.totalPay,
				detailPay: node.detailPay || mostRecentEmployeeData.detailPay,
				injuredPay: node.injuredPay || mostRecentEmployeeData.injuredPay,
				totalPayPercentile: node.totalPayPercentile || mostRecentEmployeeData.totalPayPercentile,
			};
		}
	});

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
		totalPayPercentile: mostRecentEmployeeData.totalPayPercentile,
	};
	// console.log(officerData);

	let detail_record_rows = [];
	let officer_IA_rows = [];
	let police_financial_rows = [];

	const financialCols = ["year", "rank", "otPay", "otherPay", "quinnPay", "regularPay", "retroPay", "totalPay", "detailPay", "injuredPay"];

	// Extract specific columns
	financeEmployeeData.forEach((node) => {
		let payData: any = {};
		financialCols.forEach((col) => {
			if (col in node) {
				payData[col] = node[col as keyof FinancialEmployeeData];
			}
		});
		if (Object.keys(payData).length > 0) {
			police_financial_rows.push(payData);
		}
	});

	// Filter the data to remove duplicates based on bpdIaNo
	let uniqueFinancialYears: number[] = [];
	const filteredFinanceEmployeeData = financeEmployeeData.filter((node: FinancialEmployeeData) => {
		const { year } = node;

		if (!uniqueFinancialYears.includes(Number(year))) {
			uniqueFinancialYears.push(Number(year));
			return true;
		}
		return false;
	});

	// for use in profile header
	const mostRecentFinancialYear = Math.max(...uniqueFinancialYears);

	//add artificial id for MUI purposes
	let financialRowId = 1;
	const newFinancialRows = filteredFinanceEmployeeData.map((node) => {
		return { id: financialRowId++, ...node };
	});

	police_financial_rows = newFinancialRows;

	const detail_record_query = INDIVIDUAL_OFFICER_DETAIL_RECORDS(bpiId);
	const detail_response = await apolloClient.query({ query: detail_record_query });

	//add artificial id for MUI purposes
	let detailRowId = 1;
	const newDetailRows = detail_response.data[detail_alias_name].nodes.map((node) => {
		return { id: detailRowId++, ...node };
	});
	detail_record_rows = newDetailRows;

	officerData.detail_num = detail_record_rows.length;

	//get IA data
	const ia_query = INDIVIDUAL_OFFICER_IA(bpiId);

	const iaResponse: any = await apolloClient.query({ query: ia_query });
	const iaData = iaResponse.data.allLinkSu24EmployeeIas.nodes;

	let iaRowId = 1;
	const newOfficerIaRows = iaData.map((node) => {
		return { id: iaRowId++, ...node };
	});

	officer_IA_rows = newOfficerIaRows;

	officerData.ia_num = newOfficerIaRows.length;

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
					title: "Police Financial",
					tableName: "police_financial",
					rows: police_financial_rows,
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
			includesOnly: [
				"adminFeeFlag",
				"bpdCustomerNo",
				"customerNo",
				"customerNoAndSeq",
				"customerSeq",
				"detailRank",
				"detailType",
				"districtWorked",
				"endTime",
				"fbkPayDate",
				"location",
				"hoursWorked",
				"payAmount",
				"payHours",
				"payRate",
				"payTrcCode",
				"rowId",
				"startDate",
				"startTime",
				"street",
				"xStreet",
				"trackingNo",
				"streetNo",
			],
			excludes: [],
		},
		officer_ia: {
			includesOnly: ["iaNo", "dateReceived", "incidentType", "allegation", "finding", "actionTaken", "adminLeave", "daysOrHoursSuspended", "Citizen complaint"],
			excludes: [],
		},

		police_financial: {
			includesOnly: ["year", "rank", "otPay", "otherPay", "quinnPay", "regularPay", "retroPay", "totalPay", "detailPay", "injuredPay"],
			excludes: [],
		},
	});
	const mostRecentFinancialYear = props.mostRecentFinancialYear;
	const officerData = props.officerData;

	useEffect(() => {
		const assignData = async () => {
			let tablesArr: Table[] = [];
			for (let table of props.tables) {
				let rows = table.rows;
				let tableTitle = table.title;
				let tableName = table.tableName;
				let tableEntry = {
					title: tableTitle,
					tables: getMUIGrid(tableName, rows, props.officerData.name, tableFilters[tableName].includesOnly, tableFilters[tableName].excludes) as DataTables,
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

	function formatMoney(number: number): string {
		return new Intl.NumberFormat("en-US", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(number);
	}

	return officerData ? (
		<>
			<section
				style={{
					backgroundColor: "white",
					paddingBottom: "0rem",
					position: "relative",
				}}
			>
				<div className="contain-content" style={{ width: "68.25%", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "flex-start", marginBottom: "1.5rem" }}>
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
								<strong>Residence:</strong> {officerData.residence}
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
								<strong>Officer IA</strong>
								<span>{officerData.ia_num}</span>
							</div>

							<div className="text-lg" style={{ display: "flex", justifyContent: "space-between", lineHeight: "1", flexDirection: "column" }}>
								<div style={{ display: "flex", justifyContent: "space-between" }}>
									<strong style={{ cursor: "pointer" }}>{mostRecentFinancialYear} Earnings</strong> {`$${formatMoney(officerData.totalEarnings)}`}
								</div>
								{/* TODO: Uncomment when have data in right view  */}
								<div style={{ display: "flex", alignItems: "center", justifyContent: "end" }}>({formatPercentile(officerData.totalPayPercentile)} Percentile)</div>
							</div>
							<p className="text-lg">{/* <strong style={{ cursor: "pointer" }}>FIO:</strong> {officerData.fio_record} */}</p>
							<p className="text-lg">{/* <strong style={{ cursor: "pointer" }}>Traffic Tickets:</strong> {officerData.traffic_no} */}</p>
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
							<div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
								<p className="text-lg ml-[-40rem] mb-[1.5rem]" style={{ color: bpi_deep_green, fontWeight: 500 }}>
									Officer Earnings Visualization
								</p>
								<PayStackedBarChart data={tablesArr[2].tables.fullTable} />
							</div>

							<div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "5rem" }}>
								<div className="ml-[-40rem] mb-[1.5rem]">
									<p style={{ color: bpi_deep_green, fontWeight: 500 }} className="text-lg">
										Percentile Benchmarking
									</p>
									<p style={{ color: bpi_deep_green, fontWeight: 300 }} className="text-md">
										Individual Officer Pay Distribution
									</p>
								</div>

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
