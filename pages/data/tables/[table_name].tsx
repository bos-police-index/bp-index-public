import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { functionMapping, getMUIGrid } from "@utility/createMUIGrid";
import apolloClient from "@lib/apollo-client";
import { GET_FIRST_1000_COURT_OVERTIMES, GET_FIRST_1000_DETAIL_RECORDS, GET_REST_COURT_OVERTIMES, GET_REST_DETAIL_RECORDS } from "@lib/graphql/queries";
import IconWrapper, { tableDefinitions } from "@utility/tableDefinitions";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import getHeaderWithDescription from "@utility/columnDefinitions";
import { bpi_deep_green, bpi_light_gray, bpi_light_green } from "@styles/theme/lightTheme";
import ScreenOverlay from "@components/ScreenOverlay";
import { Button } from "antd";
import { DocumentNode } from "graphql";
import GlossaryTotal from "@components/GlossaryTotal";
import { court_overtime_alias_name, detail_alias_name } from "@utility/dataViewAliases";

interface DetailRecord {
	adminFeeFlag: string; // e.g., "Y" or "N"
	badgeNo: number;
	bpdCustomerNo: number;
	customerNo: number;
	customerSeq: number;
	detailRank: number;
	detailType: string; // e.g., "A"
	districtWorked: number;
	endTime: string; // e.g., "500"
	hoursWorked: number;
	nameId: string; // e.g., "WALLACE,DANIEL A"
	payAmount: string; // e.g., "655.92"
	payHours: number;
	payRate: number;
	race: string; // e.g., "WHITE"
	payTrcCode: string; // e.g., "P09S4"
	sex: string; // e.g., "M" or "F"
	startDate: string; // e.g., "2024-05-29"
	startTime: string; // e.g., "2345"
	street: string;
	xstreet: string;
	trackingNo: number;
	streetNo: string; // Can be empty
	empRank: number;
	empOrgCode: number;
	customerName: string; // e.g., "RJV CONSTRUCTION CORP."
	noShowFlag: string; // e.g., "N"
	prepaidFlag: string; // Can be empty
	stateFunded: string; // Can be empty
}

type DetailRecordCollection = Record<string, { nodes: DetailRecord[] }>;

interface DetailRecordsResponse extends DetailRecordCollection {
	[viewName: string]: {
		nodes: DetailRecord[];
	};
}

interface CourtOvertime {
	assignedDesc: string; // Description of the assignment
	chargedDesc: string; // Description of the charge
	description: string; // Additional description (e.g., court hearing type)
	endTime: number; // End time in 24-hour format (e.g., 1115 for 11:15 AM)
	name: string; // Full name of the person
	otCode: number; // Overtime code
	otDate: string; // Date of the overtime in YYYY-MM-DD format
	race: string; // Race of the individual (e.g., "HISPA" for Hispanic)
	rank: string; // Rank of the individual (e.g., "Ptl" for Patrol)
	sex: string; // Sex of the individual (e.g., "M" for Male)
	startTime: number; // Start time in 24-hour format (e.g., 915 for 9:15 AM)
	workedHours: number; // Total worked hours
}

type CourtOvertimeCollection = Record<string, { nodes: CourtOvertime[] }>;

interface CourtOvertimeResponse extends CourtOvertimeCollection {
	[viewName: string]: {
		nodes: CourtOvertime[];
	};
}

const dataToColumns = (data, table_name) => {
	let dataArr: any[] = [];
	if (data && data[detail_alias_name]?.nodes) {
		dataArr = data[detail_alias_name].nodes.map((item, index) => ({
			id: index + 1,
			...item,
		}));
	}
	if (data && data[court_overtime_alias_name]?.nodes) {
		dataArr = data[court_overtime_alias_name].nodes.map((item, index) => ({
			id: index + 1,
			...item,
		}));
	}

	if (table_name === "employee") {
		// remove the officer_photo column
		dataArr.forEach((item) => {
			delete item["officer_photo"];
		});
	}
	return dataArr;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
	const table_name = context.params?.table_name as string;

	// if (!tableExists(table_name)) {
	// 	console.log(`table does not exist ${table_name}`);
	// 	// throw a 404, with a custom message : "Table not found"
	// 	return {
	// 		notFound: true,
	// 	};
	// }

	let query: DocumentNode = null;
	let data: any;

	// ADDING NEW DATA? Add switch statement for each new data table
	console.log("TABLE NAME: ", table_name);
	switch (table_name) {
		case "detail_record":
			query = GET_FIRST_1000_DETAIL_RECORDS;
			data = (await apolloClient.query<DetailRecordsResponse>({ query: query })).data;
			break;
		case "court_overtime":
			query = GET_FIRST_1000_COURT_OVERTIMES;
			data = (await apolloClient.query<CourtOvertimeResponse>({ query: query })).data;
			break;
	}

	const dataArr = dataToColumns(data, table_name);

	return {
		props: {
			rows: dataArr,
			table_name: table_name,
			columns: getHeaderWithDescription(functionMapping[table_name]),
		},
	};
};

export default function Table(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
	const [rows, setRows] = useState<any[]>(props.rows);
	const [loadingMoreData, setLoadingMoreData] = useState<boolean>(true);
	const router = useRouter();
	const tableDef = tableDefinitions.find((tableDef) => tableDef.query === props.table_name);
	const [currentOverlay, setCurrentOverlay] = useState({ table: null, title: null });

	const handleSeeAllClick = () => {
		setCurrentOverlay({ table: <GlossaryTotal columnObjects={props.columns} total={false} />, title: `${tableDef.table} Glossary` });
		document.getElementById("screen-overlay").classList.add("flex");
		document.getElementById("screen-overlay").classList.remove("hidden");
	};

	const table = getMUIGrid(props.table_name, rows, "", [], []);

	//fetch the rest of the rows once loaded
	useEffect(() => {
		const fetchRestRecords = async () => {
			let query: DocumentNode = null;
			let data: any;

			// ADDING NEW DATA? Add switch statement for each new data table
			switch (props.table_name) {
				case "detail_record":
					query = GET_REST_DETAIL_RECORDS;
					data = (await apolloClient.query<DetailRecordsResponse>({ query: query })).data;
					break;
				case "court_overtime":
					query = GET_REST_COURT_OVERTIMES;
					data = (await apolloClient.query<CourtOvertimeResponse>({ query: query })).data;
					break;
			}

			const dataArr = dataToColumns(data, props.table_name);

			setRows([...rows, ...dataArr]);
			setLoadingMoreData(false);
		};
		setLoadingMoreData(true);
		fetchRestRecords();
	}, []);

	return (
		<div style={{ marginTop: "-1rem" }}>
			<div className={"max-w-1128 h-full"} style={{ backgroundColor: "white", color: bpi_deep_green, fontSize: "large", width: "68.25%", marginLeft: "auto", marginRight: "auto" }}>
				<div style={{ margin: "1rem 0" }}>
					<div style={{ margin: "1rem 0" }}>
						<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
							<span style={{ margin: "1rem 0" }}>
								<Link href="/" style={{ color: bpi_light_green }}>
									{"Home > "}
								</Link>
								<Link href="/data" style={{ color: bpi_light_green }}>
									{"Data > "}
								</Link>
								<span style={{ color: bpi_light_green, textDecoration: "none", cursor: "default" }}>{tableDef.table}</span>
							</span>
							{loadingMoreData ? <p style={{ color: bpi_light_green }}>Currently loading more rows...</p> : <></>}
						</div>
					</div>
				</div>
				<div>
					<div style={{ display: "flex", alignItems: "center", justifyContent: "start", marginBottom: "1rem" }}>
						<div style={{ marginLeft: "-0.8rem" }}>
							{" "}
							<IconWrapper Icon={tableDef.image.src} color={bpi_light_green} fontSize="4rem" />
						</div>
						<h2 style={{ marginLeft: "1rem", fontSize: "xx-large", fontWeight: "bold" }}>{tableDef.table}</h2>
					</div>

					<p style={{ color: bpi_deep_green, fontSize: "medium" }}>{tableDef?.longDescription}</p>
					<br />
					<strong style={{ fontSize: "x-large" }}>Sources: </strong>
					{tableDef.source}
					<br />
					<strong style={{ fontSize: "x-large" }}>Years: </strong>
					{tableDef.years == "Unknown" ? "Unspecified" : tableDef.years}

					<ScreenOverlay title={currentOverlay.title} children={currentOverlay.table} />
				</div>
			</div>
			<div style={{ backgroundColor: bpi_light_gray, paddingTop: "2rem", width: "100vw", marginLeft: 0, marginTop: "2rem" }}>
				<div style={{ display: "flex", alignItems: "center", justifyContent: "end", width: "83%", marginBottom: "1rem" }}>
					<Button onClick={handleSeeAllClick} type="primary" shape="round" className={" text-white font-urbanist active:scale-[.95] p-2 w-32 shadow-xl transition-button duration-300 hover:bg-primary-hover"} style={{ backgroundColor: bpi_deep_green, height: "2.3rem" }}>
						Table Glossary
					</Button>
				</div>

				<div className={"max-w-1128 h-full "} style={{ width: "68.25%" }}>
					{table.fullTable}
				</div>
			</div>
		</div>
	);
}
