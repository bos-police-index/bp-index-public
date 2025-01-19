import React, { FunctionComponentElement, useEffect, useState } from "react";
import { getMUIGrid } from "@utility/createMUIGrid";
import apolloClient from "@lib/apollo-client";
import { useRouter } from "next/router";
import FullWidthTabs from "./TabTables";
import { bpi_deep_green, bpi_light_gray, bpi_light_green } from "@styles/theme/lightTheme";
import PayStackedBarChart from "./StackedBarChartOfficerFinancial";
import FinancialHistogram from "./(histogram)/FinancialHistogram";
import { Filter } from "./(histogram)/HistogramDataFeeder";
import { INDIVIDUAL_OFFICER_DETAIL_RECORDS, INDIVIDUAL_OFFICER_FINANCIAL_AND_EMPLOYEE, INDIVIDUAL_OFFICER_IA } from "@lib/graphql/queries";
import { detail_alias_name } from "@utility/dataViewAliases";

export interface Table {
	title: string;
	tables: DataTables;
}
interface DataTables {
	fullTable: FunctionComponentElement<{}> | null;
	filteredTable: FunctionComponentElement<{}> | null;
}

interface OfficerData {
	bpiId: string;
	name: string;
	badgeNo: number;
	rank: string;
	unit: string;
	residence: string;
	sex: string;
	race: string;
	totalEarnings: number;
	ia_num: number;
	detail_num: number;
}

interface FinancialEmployeeData {
	org: string;
	badgeNo: number;
	numOfIa: number;
	rank: string;
	race: string;
	sex: string;
	unit: string;
	unionCode: string;
	zipCode: string;
	firstName: string;
	lastName: string;
	otPay: number;
	otherPay: number;
	quinnPay: number;
	regularPay: number;
	retroPay: number;
	totalPay: number;
	detailPay: number;
	injuredPay: number;
	year: number;
}

export const getData = async (keyword: string, bpiId: string) => {
	if (!bpiId) {
		console.log("bpiId NOT FOUND", bpiId);
		return {
			notFound: true,
		};
	}
	const financial_and_employee_query = INDIVIDUAL_OFFICER_FINANCIAL_AND_EMPLOYEE(bpiId);
	const financialAndEmployeeResponse: any = await apolloClient.query({ query: financial_and_employee_query });
	const financeEmployeeData = financialAndEmployeeResponse.data.allLinkSu24EmployeeFinancials.nodes;
	// if not found, return 404s
	if (!financeEmployeeData) {
		return {
			notFound: true,
		};
	}
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
	const uniqueFinancialYears = new Set();
	const filteredFinanceEmployeeData = financeEmployeeData.filter((node: FinancialEmployeeData) => {
		const { year } = node;

		if (!uniqueFinancialYears.has(`${year}`)) {
			uniqueFinancialYears.add(`${year}`);
			return true;
		}
		return false;
	});

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

	// DETERMINE IF THEY ARE DUPLICATES OR JUST COINCIDENCE?
	//Filter the data to remove duplicates based on bpdIaNo
	// const uniqueBpdIaNos = new Set();
	// const filteredEmployeeIaData = iaData.filter((node: any) => {
	// 	const { iaNo } = node;

	// 	if (!uniqueBpdIaNos.has(`${iaNo}`)) {
	// 		uniqueBpdIaNos.add(`${iaNo}`);
	// 		return true;
	// 	}
	// 	return false;
	// });

	//add artificial id for MUI purposes
	// let iaRowId = 1;
	// const newOfficerIaRows = filteredEmployeeIaData.map((node) => {
	// 	return { id: iaRowId++, ...node };
	// });
	// officerData.ia_num = uniqueBpdIaNos.size;
	let iaRowId = 1;
	const newOfficerIaRows = iaData.map((node) => {
		return { id: iaRowId++, ...node };
	});

	officer_IA_rows = newOfficerIaRows;

	officerData.ia_num = newOfficerIaRows.length;

	return {
		props: {
			officerData: officerData,
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
				// {
				// 	title: "Personnel Roaster",
				// 	tableName: "personnel_roaster",
				// 	rows: personnel_roaster_rows,
				// },
				{
					title: "Police Financial",
					tableName: "police_financial",
					rows: police_financial_rows,
				},
				// {
				// 	title: "Police Overtime",
				// 	tableName: "police_overtime",
				// 	rows: police_overtime_rows,
				// },
				// {
				// 	title: "Post Decertified",
				// 	tableName: "post_decertified",
				// 	rows: post_decertified_rows,
				// },
				// {
				// 	title: "Post Certified",
				// 	tableName: "post_certified",
				// 	rows: post_certified_rows,
				// },
				// {
				// 	title: "FIO Record",
				// 	tableName: "fio_record",
				// 	rows: fio_record_rows,
				// },
				// {
				// 	title: "Parking Ticket",
				// 	tableName: "parking_ticket",
				// 	rows: parking_ticket_rows,
				// },
				// {
				// 	title: "Crime Incident",
				// 	tableName: "crime_incident",
				// 	rows: crime_incident_rows,
				// },
			],
		},
	};
};

export default function OfficerProfile(): FunctionComponentElement<{}> {
	const router = useRouter();
	const { bpiId, keyword } = router.query;
	const [tablesArr, setTablesArr] = useState<Table[]>([]);
	const [officerData, setOfficerData] = useState<OfficerData>();
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
		// alpha_listing: {
		// 	includesOnly: [],
		// 	excludes: [],
		// },
		// personnel_roaster: {
		// 	includesOnly: ["position", "location", "employee_record", "eff_date", "reason"],
		// 	excludes: [],
		// },
		// police_overtime: {
		// 	includesOnly: ["hours_worked", "ot_hours", "ot_desc", "assigned_desc", "charged_code", "charged_desc"],
		// 	excludes: [],
		// },
		// post_decertified: {
		// 	includesOnly: [],
		// 	excludes: [],
		// },
		// post_certified: {
		// 	includesOnly: [],
		// 	excludes: ["certified_expiration_date"],
		// },
		// crime_incident: {
		// 	includesOnly: ["incident_no", "offense_code", "offense_desc", "reporting_area", "incident_date", "shooting"],
		// 	excludes: [],
		// },
		// fio_record: {
		// 	includesOnly: ["contact_date", "key_situation", "zip_code", "circumstance", "basis"],
		// 	excludes: [],
		// },
		// parking_ticket: {
		// 	includesOnly: [],
		// 	excludes: [],
		// },
	});

	useEffect(() => {
		const fetchData = async () => {
			const { props } = await getData(keyword as string, bpiId as string);
			// console.log("props", props);
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
			setOfficerData(props.officerData);
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
		if (keyword && bpiId) {
			fetchData();
		}
	}, [bpiId, keyword]);

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
						<div className="overview" style={{ boxShadow: "0px 0px 8px 3px rgba(0, 0, 0, 0.1)", padding: "1rem 2rem", width: "52%", marginRight: "2rem", height: "300px" }}>
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
						<div className="table-of-contents" style={{ boxShadow: "0px 0px 8px 3px rgba(0, 0, 0, 0.1)", padding: "1rem 2.5rem", width: "43%", height: "300px" }}>
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

							<div className="text-lg" style={{ display: "flex", justifyContent: "space-between" }}>
								<strong style={{ cursor: "pointer" }}>Earnings</strong> {`$${formatMoney(officerData.totalEarnings)}`}
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
