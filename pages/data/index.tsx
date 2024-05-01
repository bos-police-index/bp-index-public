import React from "react";
import Link from "next/link";
export default function Home() {
	const tables = [
		// Since there is no icon for now, I have disabled the alpha listing table
		// subject to change
		// {
		// 	table: "Alpha Listing",
		// 	query: "alpha_listing",
		// 	image: "./alpha_listing.svg",
		// },
		{
			table: "BPD Customer",
			query: "bpd_customer",
			image: "./bpd_customer.svg",
			isFake: true,
		},
		{
			table: "Crime Incident",
			query: "crime_incident",
			image: "./crime_incident.svg",
			isFake: true,
		},
		{
			table: "Department",
			query: "department",
			image: "./department.svg",
			isFake: true,
		},
		{
			table: "Detail Record",
			query: "detail_record",
			image: "./detail_record.svg",
			isFake: false,
		},
		{
			table: "Employee",
			query: "employee",
			image: "./employee.svg",
			isFake: true,
		},
		{
			table: "FIO Record",
			query: "fio_record",
			image: "./fio_record.svg",
			isFake: true,
		},
		{
			table: "Forfeiture Data",
			query: "forfeiture_data",
			image: "./test.svg",
			isFake: true,
		},
		{
			table: "Officer Misconduct",
			query: "officer_misconduct",
			image: "./officer_misconduct.svg",
			isFake: true,
		},
		{
			table: "Organization",
			query: "organization",
			image: "./organization.svg",
			isFake: true,
		},
		{
			table: "Overtime Category",
			query: "overtime_category",
			image: "./overtime_category.svg",
			isFake: true,
		},
		{
			table: "Parking Ticket",
			query: "parking_ticket",
			image: "./parking_ticket.svg",
			isFake: true,
		},
		{
			table: "Personnel Roaster",
			query: "personnel_roaster",
			image: "./personnel_roaster.svg",
			isFake: true,
		},
		{
			table: "Police Financial",
			query: "police_financial",
			image: "./police_financial.svg",
			isFake: true,
		},
		{
			table: "Police Overtime",
			query: "police_overtime",
			image: "./police_overtime.svg",
			isFake: true,
		},
		{
			table: "Post Certified",
			query: "post_certified",
			image: "./post_certified.svg",
			isFake: true,
		},
		{
			table: "Post Decertified",
			query: "post_decertified",
			image: "./post_decertified.svg",
			isFake: true,
		},
		{
			table: "Rank",
			query: "rank",
			image: "./rank.svg",
			isFake: true,
		},
		{
			table: "Shooting Report",
			query: "shooting_report",
			image: "./shooting_report.svg",
			isFake: true,
		},
	];

	return (
		<div className={"flex flex-row flex-wrap gap-4 items-center justify-center pb-12"}>
			{tables.map((table) => {
				return (
					<Link
						key={table.table}
						href={{
							pathname: "/data/tables/[table_name]",
							query: { table_name: table.query },
						}}
						className={`flex flex-col items-center justify-center text-lg font-medium w-48 bg-white rounded-lg overflow-clip py-6 gap-4 ${table.isFake ? "opacity-50 pointer-events-none" : ""}`}
					>
						{table.table}
						<img src={table.image} alt={table.table} className={"w-24 h-24"} />
					</Link>
				);
			})}
		</div>
	);
}
