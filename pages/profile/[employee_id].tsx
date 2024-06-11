import React, { FunctionComponentElement, useEffect, useState } from "react";
import SearchBar from "@components/SearchBar";
import ScreenOverlay from "@components/ScreenOverlay";
import { getMUIGrid } from "@utility/createMUIGrid";
import apolloClient from "@lib/apollo-client";
import { gql } from "@apollo/client";
import { useRouter } from "next/router";
import { Button } from "antd";
import FullWidthTabs from "./TabTables";
interface Table {
	title: string;
	tables: DataTables;
}
interface DataTables {
	fullTable: FunctionComponentElement<{}> | null;
	filteredTable: FunctionComponentElement<{}> | null;
}

export const getData = async (keyword: string, employee_no: string) => {
	if (parseInt(employee_no) > 2147483647 || parseInt(employee_no) < 0 || isNaN(parseInt(employee_no))) {
		return {
			notFound: true,
		};
	}
	// Fetch all employee entries corresponding to employee number
	// NULL FIELDS: deptId, namePrefix, nameSuffix, sex, ethnicity, officerPhoto, postalCode, badgeNo,
	//		 rankId, rankAsOf, orgId, districtWorked, unionCode
	const intEmployeeNo = parseInt(employee_no);
	const employeeDataQuery = gql`query MyQuery {
		allEmployeeFromFa23Data(condition: {employeeNo: ${intEmployeeNo}}) {
		  edges {
			node {
			  employeeId
			  employeeNo
			  deptId
			  lastName
			  firstName
			  nameMi
			  namePrefix 
			  nameSuffix
			  sex
			  ethnicity
			  officerPhoto
			  postalCode
			  badgeNo
			  rankId
			  rankAsOf
			  orgId
			  districtWorked
			  unionCode
			}
		  }
		}
	  }`;
	const employeeResponse: any = await apolloClient.query({ query: employeeDataQuery });
	const employeeData = employeeResponse.data.allEmployeeFromFa23Data.edges;
	// if not found, return 404s
	if (!employeeData) {
		return {
			notFound: true,
		};
	}
	// Collapse data from all entries into one
	let cleanEmployeeData = employeeData[0].node;
	let employee_ids = [];
	employeeData.slice(0).map((entry: any) => {
		const node = entry.node;
		employee_ids.push(node.employeeId);
		cleanEmployeeData = {
			employeeNo: cleanEmployeeData.employeeNo,
			deptId: cleanEmployeeData.deptId || node.deptId,
			lastName: cleanEmployeeData.lastName || node.lastName,
			firstName: cleanEmployeeData.firstName || node.firstName,
			nameMi: cleanEmployeeData.nameMi || node.nameMi,
			namePrefix: cleanEmployeeData.namePrefix || node.namePrefix,
			nameSuffix: cleanEmployeeData.nameSuffix || node.nameSuffix,
			sex: cleanEmployeeData.sex || node.sex,
			ethnicity: cleanEmployeeData.ethnicity || node.ethnicity,
			officerPhoto: cleanEmployeeData.officerPhoto || node.officerPhoto,
			postalCode: cleanEmployeeData.postalCode || node.postalCode,
			badgeNo: cleanEmployeeData.badgeNo || node.badgeNo,
			rankId: cleanEmployeeData.rankId || node.rankId,
			rankAsOf: cleanEmployeeData.rankAsOf || node.rankAsOf,
			orgId: cleanEmployeeData.orgId || node.orgId,
			districtWorked: cleanEmployeeData.districtWorked || node.districtWorked,
			unionCode: cleanEmployeeData.unionCode || node.unionCode,
		};
	});
	//NULL FIELDS: policeDeptName, cityDeptName
	//BECAUSE deptId is null
	//NULL FIELDS: policeDeptName, cityDeptName
	//BECAUES deptId is null
	const departmentDataQuery = gql`query MyQuery {
		departmentByDepartmentId(departmentId: ${cleanEmployeeData.deptId || 100000}) {
		  policeDeptName
		  cityDeptName
		}
	  }
	  `;
	const departmentData = await apolloClient.query({ query: departmentDataQuery });
	const rank_id = 9;

	//NULL FIELDS: rankIdNo, rankTitleFull, rankTitleAbbrev, rankName ,rankAbbr
	//BECAUSE rankId is null

	//NULL FIELDS: rankIdNo, rankTitleFull, rankTitleAbbrev, rankName ,rankAbbr
	//BECAUES rankId is null
	const rankDataQuery = gql`query MyQuery {
		rankByRankId(rankId: ${rank_id}) {
		  rankIdNo
		  rankTitleFull
		  rankTitleAbbrev
		  rankName
		  rankAbbr
		}
	  }	  
	  `;
	const rankData = await apolloClient.query({ query: rankDataQuery });

	let officerData = {
		employee_no: cleanEmployeeData.employeeNo,
		name: "",
		title: rankData.data.rankByRankId ? rankData.data.rankByRankId.rankTitleFull : "",
		police_dept_name: departmentData.data.departmentByDepartmentId ? departmentData.data.departmentByDepartmentId.policeDeptName : "",
		city_dept_name: departmentData.data.departmentByDepartmentId ? departmentData.data.departmentByDepartmentId.cityDeptName : "",
		postal: cleanEmployeeData.postalCode,
		sex: cleanEmployeeData.sex,
		ia_num: 0,
		detail_num: 0,
	};
	console.log(officerData);
	let fullName = "";
	fullName += cleanEmployeeData.namePrefix ? cleanEmployeeData.namePrefix + " " : "";
	fullName += cleanEmployeeData.firstName + " ";
	fullName += cleanEmployeeData.nameMi ? cleanEmployeeData.nameMi + " " : "";
	fullName += cleanEmployeeData.lastName + " ";
	fullName += cleanEmployeeData.nameSuffix ? cleanEmployeeData.nameSuffix : "";
	officerData.name = fullName;

	let detail_record_rows = [];
	let officer_IA_rows = [];
	let police_financial_rows = [];
	for (let id of employee_ids) {
		const detail_record_query = gql`query MyQuery {
			allDetailRecordFromFa23Data(condition: {employeeId: ${id}}) {
			  edges {
				node {
				  detailRecordId
				  rowId
				  trackingNo
				  employeeId
				  customerId
				  incidentNo
				  contractNo
				  streetNo
				  streetId
				  streetName
				  crossStreetNo
				  crossStreetName
				  locationDesc
				  detailStart
				  detailEnd
				  hoursWorked
				  detailType
				  stateFunded
				  detailRank
				  noShowFlag
				  licensePremiseFlag
				  adminFeeFlag
				  prepaidFlag
				  requestRank
				  adminFeeRate
				  rateChangeAuthorizationEmployeeId
				  detailClerkEmployeeId
				  payHours
				  payAmount
				  payTrcCode
				  detailPayRate
				  recordCreatedDate
				  recordCreatedBy
				  recordUpdatedDate
				  recordUpdatedBy
				  fbkPayDate
				}
			  }
			}
		  }`;
		const police_financial_query = gql`query MyQuery {
			allPoliceFinancialFromFa23Data(condition: {employeeId: "${id}"}) {
			  edges {
				node {
				  policeFinancialId
				  employeeId
				  cityDeptId
				  title
				  regularPay
				  retroPay
				  otherPay
				  otPay
				  injuredPay
				  detailPay
				  quinnPay
				  totalPay
				  year
				  zipCode
				}
			  }
			}
		  }`;
		const all_employee_ia_linkeds_query = gql`query MyQuery {
			allEmployeeIaLinkeds(condition: {employeeNo: ${cleanEmployeeData.employeeNo}}) {
			  edges {
				node {
				  bpdIaRecordId
				  bpdIaNo
				  receivedDate
				}
			  }
			}
		  }`;
		const employee_ia_response = await apolloClient.query({ query: all_employee_ia_linkeds_query });
		const detail_response = await apolloClient.query({ query: detail_record_query });
		const financial_response = await apolloClient.query({ query: police_financial_query });
		detail_record_rows = detail_record_rows.concat(
			detail_response.data.allDetailRecordFromFa23Data.edges.map((edge: any) => {
				const { ["rowId"]: id, ...rest } = edge.node;
				return { id, ...rest };
			}),
		);
		police_financial_rows = police_financial_rows.concat(
			financial_response.data.allPoliceFinancialFromFa23Data.edges.map((edge: any) => {
				const { ["policeFinancialId"]: id, ...rest } = edge.node;
				return { id, ...rest };
			}),
		);
		const uniqueBpdIaNos = new Set();

		// Filter the data to remove duplicates based on bpdIaNo
		const filteredEmployeeIaData = employee_ia_response.data.allEmployeeIaLinkeds.edges.filter((edge) => {
			const { bpdIaNo } = edge.node;

			if (!uniqueBpdIaNos.has(`${bpdIaNo}`)) {
				uniqueBpdIaNos.add(`${bpdIaNo}`);
				return true;
			}
			return false;
		});

		const newOfficerIaRows = filteredEmployeeIaData.map((edge) => {
			const { bpdIaRecordId: id, ...rest } = edge.node;
			return { id, ...rest };
		});

		officer_IA_rows = newOfficerIaRows;

		officerData.ia_num = uniqueBpdIaNos.size;
		officerData.detail_num = detail_record_rows.length;
	}

	// // const alpha_listing_rows = await getTable("alpha_listing", { name: "employee_id", value: employee_id });
	// const detail_record_rows = await getTable("allDetailRecordFromFa23Data", { name: "employeeId", values: employee_ids });
	// const officer_misconduct_rows = await getTable("officer_misconduct", { name: "employee_id", value: employee_id });
	// // const personnel_roaster_rows = await getTable("personnel_roaster", { name: "employee_id", value: employee_id });
	// const police_financial_rows = await getTable("police_financial", { name: "employee_id", value: employee_id });
	// // const police_overtime_rows = await getTable("police_overtime", { name: "employee_id", value: employee_id });
	// // const post_decertified_rows = await getTable("post_decertified", { name: "employee_id", value: employee_id });
	// // const post_certified_rows = await getTable("post_certified", { name: "employee_id", value: employee_id });
	// // const fio_record_rows = await getTable("fio_record", { name: "employee_id", value: employee_id });
	// // const parking_ticket_rows = await getTable("parking_ticket", { name: "employee_id", value: employee_id });

	// // let crime_incident_rows = [];

	// for (let detail_record_row of detail_record_rows) {
	// 	const ia_no = detail_record_row.incident_no;

	// 	const crime_incidents = await getTable("crime_incident", { name: "incident_no", value: ia_no });

	// 	crime_incident_rows = crime_incident_rows.concat(crime_incidents);
	// }

	// officerData.ia_num = officer_misconduct_rows.length;

	return {
		props: {
			officerData: officerData,
			tables: [
				// {
				// 	title: "Alpha Listing",
				// 	tableName: "alpha_listing",
				// 	rows: alpha_listing_rows,
				// },
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
	const { employee_id, keyword } = router.query;
	const [currentOverlay, setCurrentOverlay] = useState({ table: null, title: null });
	const [tablesArr, setTablesArr] = useState<Table[]>([]);
	const [officerData, setOfficerData] = useState<any>();
	const [tableFilters] = useState({
		alpha_listing: {
			includesOnly: [],
			excludes: [],
		},
		detail_record: {
			includesOnly: ["trackingNo", "customerId", "incidentNo", "contract", "contractNo", "detailStart", "detailEnd"],
			excludes: [],
		},
		officer_ia: {
			includesOnly: ["bpdIaRecordId", "bpdIaNo", "receivedDate"],
			excludes: [],
		},
		personnel_roaster: {
			includesOnly: ["position", "location", "employee_record", "eff_date", "reason"],
			excludes: [],
		},
		police_financial: {
			includesOnly: ["title", "regular_pay", "ot_pay", "total_pay", "year"],
			excludes: [],
		},
		police_overtime: {
			includesOnly: ["hours_worked", "ot_hours", "ot_desc", "assigned_desc", "charged_code", "charged_desc"],
			excludes: [],
		},
		post_decertified: {
			includesOnly: [],
			excludes: [],
		},
		post_certified: {
			includesOnly: [],
			excludes: ["certified_expiration_date"],
		},
		crime_incident: {
			includesOnly: ["incident_no", "offense_code", "offense_desc", "reporting_area", "incident_date", "shooting"],
			excludes: [],
		},
		fio_record: {
			includesOnly: ["contact_date", "key_situation", "zip_code", "circumstance", "basis"],
			excludes: [],
		},
		parking_ticket: {
			includesOnly: [],
			excludes: [],
		},
	});

	useEffect(() => {
		const fetchData = async () => {
			const { props } = await getData(keyword as string, employee_id as string);
			console.log(props);
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
			setTablesArr(tablesArr);
		};
		if (keyword && employee_id) {
			fetchData();
		}
	}, [employee_id, keyword]);

	const sectionHeaderColor = "#3874CB";

	return (
		officerData && (
			<>
				<section style={{ width: "100vw", backgroundColor: "white", paddingBottom: "2rem", position: "relative" }}>
					<div className="contain-content" style={{ width: "80vw", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
						<div className="title" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#032752" }}>
							<p className="relative text-4xl font-bold underline" style={{ paddingTop: "2rem", marginLeft: "1rem" }}>
								{officerData.name}
							</p>
						</div>
						<div className="sections" style={{ display: "flex", justifyContent: "flex-start", width: "100%", padding: "1rem" }}>
							<div className="overview" style={{ boxShadow: "0px 0px 8px 3px rgba(0, 0, 0, 0.1)", padding: "1rem 2rem", width: "calc(50% - 1rem)", marginRight: "2rem", height: "300px" }}>
								<p style={{ color: sectionHeaderColor }} className="text-3xl">
									Overview
								</p>
								<p className="text-lg mt-3">
									<strong>Employee ID:</strong> {officerData.employee_no}
								</p>
								<p className="text-lg">
									<strong>Rank:</strong> {officerData.title}
								</p>
								<p className="text-lg">
									<strong>Unit:</strong> {officerData.city_dept_name}
								</p>
								<p className="text-lg">
									<strong>Residence:</strong> {officerData.postal}
								</p>
								<p className="text-lg">
									<strong>Number of IA:</strong> {officerData.ia_num}
								</p>
								<p className="text-lg">
									<strong>Sex:</strong> {officerData.sex}
								</p>
								<p className="text-lg">
									<strong>Race:</strong> {officerData.ethnicity}
								</p>
							</div>
							<div className="table-of-contents" style={{ boxShadow: "0px 0px 8px 3px rgba(0, 0, 0, 0.1)", padding: "1rem 2rem", width: "35%", height: "300px" }}>
								<p style={{ color: sectionHeaderColor }} className="text-3xl">
									Data Summary
								</p>
								<div className="text-lg mt-3">
									<strong>Detail Record:</strong>
									<p
										style={{ display: "inline-block", textIndent: "0.2em", textDecoration: "underline", cursor: "pointer" }}
										// onClick={() => {
										// 	document.getElementById("detail-record").scrollIntoView({ behavior: "smooth" });
										// }}
									>
										{officerData.detail_num}
									</p>
								</div>
								<div className="text-lg">
									<strong style={{ cursor: "pointer" }}>Officer IA:</strong>
									<p
										style={{ display: "inline-block", textIndent: "0.2em", textDecoration: "underline", cursor: "pointer" }}
										// onClick={() => {
										// 	document.getElementById("officer-ia").scrollIntoView({ behavior: "smooth" });
										// }}
									>
										{officerData.ia_num}
									</p>
								</div>
								<p className="text-lg">
									<strong
										style={{ cursor: "pointer", textDecoration: "underline" }}
										// onClick={() => {
										// 	document.getElementById("police-financial").scrollIntoView({ behavior: "smooth" });
										// }}
									>
										Police Financial
									</strong>
								</p>
								<p className="text-lg">
									<strong style={{ cursor: "pointer" }}>Earnings:</strong> {officerData.total_pay}
								</p>
								<p className="text-lg">
									<strong style={{ cursor: "pointer" }}>FIO:</strong> {officerData.fio_record}
								</p>
								<p className="text-lg">
									<strong style={{ cursor: "pointer" }}>Traffic Tickets:</strong> {officerData.traffic_no}
								</p>
							</div>
						</div>
					</div>
				</section>

				{tablesArr ? <FullWidthTabs tables={tablesArr} /> : <></>}

				{/* Uncomment and modify if needed
			{tablesArr.map((table) => {
			  return (
				<section className={"min-w-screen px-52 flex flex-col gap-0 py-8"} key={table.title} id={table.title.replace(/\s+/g, "-").toLowerCase()}>
				  <div className={" rounded-2xl px-10 py-8"}>
					<div className={"flex justify-between items-center flex-row"}>
					  <h2 className={"text-2xl  text-white"}>{table.title}</h2>
					  <Button
						type="primary"
						shape="round"
						onClick={() => {
						  setCurrentOverlay({ table: table.tables.fullTable, title: table.title });
						  document.getElementById("screen-overlay").classList.add("flex");
						  document.getElementById("screen-overlay").classList.remove("hidden");
						}}
						className={"bg-primary text-white font-urbanist p-2 w-32 flex items-center justify-center active:scale-[.95] shadow-xl transition-button duration-300 hover:bg-primary-hover"}
					  >
						See All
					  </Button>
					</div>
					<div className={"mt-6"}>{table.tables.filteredTable}</div>
				  </div>
				</section>
			  );
			})}
			<ScreenOverlay title={currentOverlay.title} children={currentOverlay.table} />
			*/}
			</>
		)
	);
}	  