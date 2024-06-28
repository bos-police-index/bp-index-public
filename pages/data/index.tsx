"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Card } from "antd";
import DescriptionIcon from "@mui/icons-material/Description";
import BalanceIcon from "@mui/icons-material/Balance";
import LocalPoliceIcon from "@mui/icons-material/LocalPolice";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CrisisAlertIcon from "@mui/icons-material/CrisisAlert";
import LocalParkingIcon from "@mui/icons-material/LocalParking";
import EventNoteIcon from "@mui/icons-material/EventNote";

const IconWrapper = ({ Icon }: { Icon: React.ElementType }) => {
	return <Icon style={{ fontSize: "48px", color: "#3874CB" }} />;
};

export default function Home() {
	const [cardFlipped, setCardFlipped] = useState<any>(null);

	const handleHover = (table) => {
		setCardFlipped(table.table);
	};

	const handleLeave = () => {
		setCardFlipped(null);
	};

	const tables = [
		{
			table: "Officer Earnings",
			query: "police_financial",
			image: <IconWrapper Icon={AttachMoneyIcon} />,
			isFake: true,
			shortDescription: "This dataset includes detailed records of officers' hourly earnings and various earning types such as regular pay and overtime.",
			longDescription:
				"The Officer Earnings dataset provides comprehensive information on the earnings of police officers. It includes hourly wage data and categorizes earnings into various types, including but not limited to regular pay, overtime, and other compensations. This dataset is crucial for analyzing the financial aspects of police officer employment and understanding the distribution of earnings within the department.",
		},
		{
			table: "Detail Record",
			query: "detail_record",
			image: <IconWrapper Icon={DescriptionIcon} />,
			isFake: false,
			shortDescription: "Detailed information about police detail assignments, which are special duty assignments outside regular police work",
			longDescription:
				"A police detail is typically present at any road work where traffic must be diverted or events with special safety or security concerns. The Police Detail Records dataset captures detailed information about police detail assignments, which are special duty assignments outside regular police work. Paid details offer a temporary police and security detail for public events and worksites, such as those that take place on roadways, to ensure public and personnel safety. It includes data on the locations, times, and nature of these assignments, providing insight into how police resources are allocated for special events and other non-routine activities.",
		},
		{
			table: "Crime Incident",
			query: "crime_incident",
			image: <IconWrapper Icon={EventNoteIcon} />,
			isFake: true,
			shortDescription: "Records from the crime incident report system, focusing on the type, time, and location of the crime incidents",
			longDescription:
				"The Crime Incident Records dataset offers a comprehensive view of crime reports logged in the  crime incident report system. It includes a reduced but essential set of fields designed to capture the type of crime, as well as the time and location of each incident. This streamlined dataset is essential for analyzing crime patterns, trends, and hot spots within the city.",
		},
		{
			table: "BPD Employees",
			query: "employee",
			image: <IconWrapper Icon={LocalPoliceIcon} />,
			isFake: true,
			shortDescription: "Information about all employees of the Boston Police Department.",
			longDescription:
				"Detailed records of all employees working within the Boston Police Department (BPD). This includes information such as employee names, roles, ranks, and other pertinent employment details. This dataset is valuable for understanding the workforce composition and organizational structure of the BPD.",
		},
		{
			table: "Officer Misconduct (IAs)",
			query: "officer_misconduct",
			image: <IconWrapper Icon={BalanceIcon} />,
			isFake: true,
			shortDescription: "Records of internal affair complaints against Boston Police Department officers, detailing allegation types and final dispositions",
			longDescription:
				"The Officer Misconduct (IAs) dataset provides detailed records of all internal affair complaints filed against officers of the Boston Police Department. It includes information on the types of allegations made, the investigative process, and the final disposition of each complaint. This dataset is crucial for transparency and accountability, offering insights into the nature and outcomes of misconduct allegations within the police force.",
		},
		{
			table: "Parking Tickets",
			query: "parking_ticket",
			image: <IconWrapper Icon={LocalParkingIcon} />, // Updated to apply styles directly
			isFake: true,
			shortDescription: "The Parking Tickets dataset includes records of all parking citations issued in the City of Boston",
			longDescription:
				"The Parking Tickets dataset comprises comprehensive records of all parking citations issued in the City of Boston. This includes data on the time, date, location, and nature of each parking violation, as well as any fines assessed. This dataset is essential for analyzing parking enforcement patterns, identifying problem areas, and understanding the city's approach to managing parking regulations.",
		},
		{
			table: "Shooting Report",
			query: "shooting_report",
			image: <IconWrapper Icon={CrisisAlertIcon} />,
			isFake: true,
			shortDescription: "Information on shooting incidents in Boston where victims were hit by bullets, including both fatal and non-fatal cases",
			longDescription:
				"The Shooting Reports dataset provides detailed information on shooting incidents within the City of Boston that fall under the jurisdiction of the Boston Police Department. It includes records of incidents where a victim was struck by a bullet, encompassing both fatal and non-fatal cases. This dataset covers the date, time, and location of shootings, as well as victim demographics and other relevant details. It is a vital resource for analyzing gun violence trends and the impact of shootings on the community.",
		},
	];

	return (
		<div
			style={{
				backgroundColor: "white",
				height: "100%",
				width: "110vw",
				marginLeft: "-11vw",
			}}
		>
			<div style={{ maxWidth: "1128px", margin: "0 auto", color: "#3874CB" }}>
				<div className={"flex flex-row flex-wrap gap-3 items-center justify-start pb-12 pt-20"}>
					{tables.map((table) => (
						<Card
							key={table.table}
							style={{
								borderColor: "#3874CB",
								boxShadow: "0px 0px 4px 4px rgba(0, 0, 0, 0.1)",
								color: "#3874CB",
								width: "272px",
								height: "177px",
								alignContent: "center",
								transition: "transform 0.5s",
								// transform: cardFlipped == table.table ? "rotateY(180deg)" : "rotateY(0deg)", // Flipping animation
								backgroundColor: cardFlipped == table.table ? "#3874CB" : "transparent", // Blue background on hover
								opacity: table.isFake ? "50%" : "100%",
								pointerEvents: table.isFake ? "none" : "all",
							}}
							onMouseEnter={() => handleHover(table)}
							onMouseLeave={handleLeave}
						>
							<Link
								href={{
									pathname: "/data/tables/[table_name]",
									query: { table_name: table.query },
								}}
								className={`flex flex-col items-center justify-center text-lg font-medium bg-white rounded-lg overflow-clip gap-4`}
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									color: cardFlipped === table.table ? "white" : "#3874CB",
									backgroundColor: cardFlipped !== table.table ? "white" : "#3874CB",
								}}
							>
								{cardFlipped == table.table ? (
									<div style={{ fontSize: "small" }}>{table.shortDescription}</div>
								) : (
									<div>
										{table.image}
										{table.table}
									</div>
								)}
							</Link>
						</Card>
					))}
					<p style={{ color: "#B3B3B3", margin: "0 0.5rem" }}>More Coming...</p>
				</div>
			</div>
		</div>
	);
}
