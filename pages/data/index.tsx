import React from "react";
import Link from "next/link";
export default function Home() {
	const tables = [
		// Since there is no icon for now, I have disabled the alpha listing table
		// subject to change
		// {
		// 	table: "Alpha Listing",
		// 	query: "alpha_listing",
		// 	image: "./alpha_listing.png",
		// },
		{
			table: "BPD Customer",
			query: "bpd_customer",
			image: "./bpd_customer.png",
		},
		{
			table: "Crime Incident",
			query: "crime_incident",
			image: "./crime_incident.png",
		},
		{
			table: "Department",
			query: "department",
			image: "./department.png",
		},
		{
			table: "Detail Record",
			query: "detail_record",
			image: "./detail_record.png",
		},
		{
			table: "Employee",
			query: "employee",
			image: "./employee.png",
		},
		{
			table: "FIO Record",
			query: "fio_record",
			image: "./fio_record.png",
		},
		{
			table: "Forfeiture Data",
			query: "forfeiture_data",
			image: "./forfeiture_data.png",
		},
		{
			table: "Officer Misconduct",
			query: "officer_misconduct",
			image: "./officer_misconduct.png",
		},
		{
			table: "Organization",
			query: "organization",
			image: "./organization.png",
		},
		{
			table: "Overtime Category",
			query: "overtime_category",
			image: "./overtime_category.png",
		},
		{
			table: "Parking Ticket",
			query: "parking_ticket",
			image: "./parking_ticket.png",
		},
		{
			table: "Personnel Roaster",
			query: "personnel_roaster",
			image: "./personnel_roaster.png",
		},
		{
			table: "Police Financial",
			query: "police_financial",
			image: "./police_financial.png",
		},
		{
			table: "Police Overtime",
			query: "police_overtime",
			image: "./police_overtime.png",
		},
		{
			table: "Post Certified",
			query: "post_certified",
			image: "./post_certified.png",
		},
		{
			table: "Post Decertified",
			query: "post_decertified",
			image: "./post_decertified.png",
		},
		{
			table: "Rank",
			query: "rank",
			image: "./rank.png",
		},
		{
			table: "Shooting Report",
			query: "shooting_report",
			image: "./shooting_report.png",
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
						className="flex flex-col items-center justify-center text-lg font-medium w-48 bg-white rounded-lg overflow-clip py-6 gap-4"
					>
						{table.table}
						<img src={table.image} alt={table.table} className={"w-24 h-24"} />
					</Link>
				);
			})}
		</div>
	);
}
