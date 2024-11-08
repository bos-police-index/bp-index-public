import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { functionMapping, getMUIGrid } from "@utility/createMUIGrid";
import { tableExists } from "@utility/utility";
import apolloClient from "@lib/apollo-client";
import { GET_FIRST_1000_DETAIL_RECORDS, GET_REST_DETAIL_RECORDS } from "@lib/graphql/queries";
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

interface DetailRecord {
	adminFeeFlag: string;
	badgeNo: number;
	bpdCustomerNo: number;
	customerNo: number;
	customerNoAndSeq: string;
	customerSeq: number;
	detailRank: number;
	detailType: string;
	districtWorked: number;
	endTime: number;
	fbkPayDate: string;
	location: string;
	hoursWorked: number;
	nameId: string;
	payAmount: number;
	payHours: number;
	payRate: number;
	race: string;
	payTrcCode: string;
	rowId: number;
	sex: string;
	startDate: string;
	startTime: number;
	street: string;
	xStreet: string;
	trackingNo: number;
	streetNo: number;
	empRank: number;
	empOrgCode: number;
}

interface DetailRecordsResponse {
	allLinkSu24DetailRecords: {
		nodes: DetailRecord[];
	};
}

export const getServerSideProps: GetServerSideProps = async (context) => {
	const table_name = context.params?.table_name as string;

	if (!tableExists(table_name)) {
		// throw a 404, with a custom message : "Table not found"
		return {
			notFound: true,
		};
	}

	var query: DocumentNode = null;

	// ADDING NEW DATA? Add switch statement for each new data table
	switch (table_name) {
		case "detail_record":
			query = GET_FIRST_1000_DETAIL_RECORDS;
	}

	const { data } = await apolloClient.query<DetailRecordsResponse>({ query: query });

	let dataArr: any[] = [];

	if (data && data.allLinkSu24DetailRecords && data.allLinkSu24DetailRecords.nodes) {
		dataArr = data.allLinkSu24DetailRecords.nodes.map((item, index) => ({
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
			const { data } = await apolloClient.query<DetailRecordsResponse>({ query: GET_REST_DETAIL_RECORDS });

			let dataArr: any[] = [];

			if (data && data.allLinkSu24DetailRecords && data.allLinkSu24DetailRecords.nodes) {
				dataArr = data.allLinkSu24DetailRecords.nodes.map((item, index) => ({
					id: index + 1,
					...item,
				}));
			}
			if (props.table_name === "employee") {
				// remove the officer_photo column
				dataArr.forEach((item) => {
					delete item["officer_photo"];
				});
			}
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
