import React, { FunctionComponentElement, useEffect, useState } from "react";
import SearchBar from "@components/SearchBar";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import prisma from "lib/prisma";
import ScreenOverlay from "@components/ScreenOverlay";
import { getMUIGrid } from "@utility/createMUIGrid";
import { Prisma } from "@prisma/client";
import { extractID } from "@utility/utility";
interface Table {
	title: string;
	tables: DataTables;
}
interface DataTables {
	fullTable: FunctionComponentElement<{}> | null;
	filteredTable: FunctionComponentElement<{}> | null;
}

async function getTable(table_name: string, filter: { name: string; value: string }) {
	const data: object[] = await prisma.$queryRaw(Prisma.sql([`SELECT * FROM ${table_name} WHERE ${filter.name} = ${filter.value}`]));
	let dataArr = [];

	if (data.length && data.length > 0) {
		dataArr = data.map((row) => {
			return extractID(row, table_name);
		});
	}
	return dataArr;
}
export const getServerSideProps: GetServerSideProps = async (context) => {
	const employee_id = context.params?.employee_id as string;

	if (parseInt(employee_id) > 2147483647 || parseInt(employee_id) < 0 || isNaN(parseInt(employee_id))) {
		return {
			notFound: true,
		};
	}

	const intEmployeeId = parseInt(employee_id);

	const employeeData = await prisma.employee.findUnique({
		where: {
			employee_id: intEmployeeId,
		},
		select: {
			employee_id: true,
			first_name: true,
			last_name: true,
			name_mi: true,
			name_prefix: true,
			name_suffix: true,
			dept_id: true,
			postal_code: true,
			sex: true,
		},
	});

	// if not found, return 404
	if (!employeeData) {
		return {
			notFound: true,
		};
	}

	const departmentData = await prisma.department.findUnique({
		where: {
			department_id: employeeData.dept_id,
		},
		select: {
			police_dept_name: true,
			city_dept_name: true,
		},
	});

	const rank_id = 9;
	const rankData = await prisma.rank.findUnique({
		where: {
			rank_id: rank_id,
		},
		select: {
			rank_title_full: true,
		},
	});

	let officerData = {
		employee_id: intEmployeeId,
		name: "",
		title: rankData.rank_title_full,
		police_dept_name: departmentData.police_dept_name,
		city_dept_name: departmentData.city_dept_name,
		postal: employeeData.postal_code,
		sex: employeeData.sex,
		ia_num: 0,
	};

	let fullName = "";
	fullName += employeeData.name_prefix ? employeeData.name_prefix + " " : "";
	fullName += employeeData.first_name + " ";
	fullName += employeeData.name_mi ? employeeData.name_mi + " " : "";
	fullName += employeeData.last_name + " ";
	fullName += employeeData.name_suffix ? employeeData.name_suffix : "";
	officerData.name = fullName;

	const table_pk = {};
	Prisma.dmmf.datamodel.models.forEach((model) => {
		table_pk[model.name] = model.fields[0].name;
	});

	const alpha_listing_rows = await getTable("alpha_listing", { name: "employee_id", value: employee_id });
	const detail_record_rows = await getTable("detail_record", { name: "employee_id", value: employee_id });
	const officer_misconduct_rows = await getTable("officer_misconduct", { name: "employee_id", value: employee_id });
	const personnel_roaster_rows = await getTable("personnel_roaster", { name: "employee_id", value: employee_id });
	const police_financial_rows = await getTable("police_financial", { name: "employee_id", value: employee_id });
	const police_overtime_rows = await getTable("police_overtime", { name: "employee_id", value: employee_id });
	const post_decertified_rows = await getTable("post_decertified", { name: "employee_id", value: employee_id });
	const post_certified_rows = await getTable("post_certified", { name: "employee_id", value: employee_id });
	const fio_record_rows = await getTable("fio_record", { name: "employee_id", value: employee_id });
	const parking_ticket_rows = await getTable("parking_ticket", { name: "employee_id", value: employee_id });

	let crime_incident_rows = [];

	for (let detail_record_row of detail_record_rows) {
		const ia_no = detail_record_row.incident_no;

		const crime_incidents = await getTable("crime_incident", { name: "incident_no", value: ia_no });

		crime_incident_rows = crime_incident_rows.concat(crime_incidents);
	}

	officerData.ia_num = officer_misconduct_rows.length;

	return {
		props: {
			officerData: officerData,
			tables: [
				{
					title: "Alpha Listing",
					tableName: "alpha_listing",
					rows: alpha_listing_rows,
				},
				{
					title: "Detail Record",
					tableName: "detail_record",
					rows: detail_record_rows,
				},
				{
					title: "Officer Misconduct",
					tableName: "officer_misconduct",
					rows: officer_misconduct_rows,
				},
				{
					title: "Personnel Roaster",
					tableName: "personnel_roaster",
					rows: personnel_roaster_rows,
				},
				{
					title: "Police Financial",
					tableName: "police_financial",
					rows: police_financial_rows,
				},
				{
					title: "Police Overtime",
					tableName: "police_overtime",
					rows: police_overtime_rows,
				},
				{
					title: "Post Decertified",
					tableName: "post_decertified",
					rows: post_decertified_rows,
				},
				{
					title: "Post Certified",
					tableName: "post_certified",
					rows: post_certified_rows,
				},
				{
					title: "FIO Record",
					tableName: "fio_record",
					rows: fio_record_rows,
				},
				{
					title: "Parking Ticket",
					tableName: "parking_ticket",
					rows: parking_ticket_rows,
				},
				{
					title: "Crime Incident",
					tableName: "crime_incident",
					rows: crime_incident_rows,
				},
			],
		},
	};
};
export default function OfficerProfile(props: InferGetServerSidePropsType<typeof getServerSideProps>): FunctionComponentElement<{}> {
	const [currentOverlay, setCurrentOverlay] = useState({ table: null, title: null });
	const [tablesArr, setTablesArr] = useState<Table[]>([]);
	const [tableFilters] = useState({
		alpha_listing: {
			includesOnly: [],
			excludes: [],
		},
		detail_record: {
			includesOnly: ["tracking_no", "customer_id", "incident_no", "contract", "contract_no", "detail_start", "detail_end"],
			excludes: [],
		},
		officer_misconduct: {
			includesOnly: [],
			excludes: ["received_date"],
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

		setTablesArr(tablesArr);
	}, []);
	return (
		<>
			<SearchBar title="Officer Profile" officerName={props.officerData.name} />
			<section>
				<div className={"hero min-w-screen px-52 mt-16"}>
					<div className={"flex gap-16 w-full h-80"}>
						<div className={"grow bg-white/[.75] rounded-xl px-12 py-8 flex gap-[.4rem] flex-col"}>
							<p className={"text-3xl font-bold"}>{props.officerData.name}</p>
							<p className={"text-lg mt-4"}>
								<strong>Title :</strong> {props.officerData.title}
							</p>
							<p className={"text-lg"}>
								<strong>Employee ID :</strong> {props.officerData.employee_id}
							</p>
							<p className={"text-lg"}>
								<strong>Police Department :</strong> {props.officerData.police_dept_name}
							</p>
							<p className={"text-lg"}>
								<strong>City Department :</strong> {props.officerData.city_dept_name}
							</p>
							<p className={"text-lg"}>
								<strong>Postal :</strong> {props.officerData.postal}
							</p>
							<p className={"text-lg"}>
								<strong>Number of IA:</strong> {props.officerData.ia_num}
							</p>
						</div>
						<div className="avatar bg-white/[.75] p-8 rounded-xl h-full">
							<div className="w-5/6 mx-auto">
								<img src={"../officer_icon.png"} alt={"Officer Icon"} />
							</div>
						</div>
					</div>
				</div>
			</section>
			{tablesArr.map((table) => {
				return (
					<section className={"min-w-screen px-52 flex flex-col gap-16 py-16"} key={table.title}>
						<div className={"bg-white/[.75] rounded-2xl px-10 py-8"}>
							<div className={"flex justify-between items-center flex-row"}>
								<h2 className={"text-3xl font-bold underline "}>{table.title}</h2>
								<button
									onClick={() => {
										setCurrentOverlay({ table: table.tables.fullTable, title: table.title });
										document.getElementById("screen-overlay").classList.add("flex");
										document.getElementById("screen-overlay").classList.remove("hidden");
									}}
									className={"bg-primary text-white font-urbanist rounded-lg p-2 w-32 flex items-center justify-center active:scale-[.95] shadow-xl transition-button duration-300 hover:bg-primary-hover"}
								>
									See All
								</button>
							</div>

							<div className={"mt-6"}>{table.tables.filteredTable}</div>
						</div>
					</section>
				);
			})}
			<ScreenOverlay title={currentOverlay.title} children={currentOverlay.table} />
		</>
	);
}
