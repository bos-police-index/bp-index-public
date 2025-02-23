import next, { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { functionMapping, getMUIGrid } from "@utility/createMUIGrid";
import apolloClient from "@lib/apollo-client";
import { GET_FIRST_1000_COURT_OVERTIMES, GET_FIRST_1000_DETAIL_RECORDS, GET_FIRST_1000_OFFICER_IA, GET_NEXT_PAGE_COURT_OVERTIMES, GET_NEXT_PAGE_DETAIL_RECORDS, GET_NEXT_PAGE_OFFICER_IA, GET_NUMBER_OF_ROWS } from "@lib/graphql/queries";
import IconWrapper, { tableDefinitions } from "@utility/tableDefinitions";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import getHeaderWithDescription from "@utility/columnDefinitions";
import { bpi_deep_green, bpi_light_gray, bpi_light_green } from "@styles/theme/lightTheme";
import ScreenOverlay from "@components/ScreenOverlay";
import { Button } from "antd";
import { DocumentNode } from "graphql";
import GlossaryTotal from "@components/GlossaryTotal";
import { table_name_to_alias_map } from "@utility/dataViewAliases";
import { getYearFromDate } from "@utility/textFormatHelpers";

let id_counter = 0;

const dataToColumns = (data, table_name) => {
	// try to create a year column for filtering
	let date_row_name = "";
	switch (table_name) {
		case "detail_record":
			date_row_name = "startDate";
			break;
		case "court_overtime":
			date_row_name = "";
			break;
		case "officer_misconduct":
			date_row_name = "dateReceived";
			break;
	}

	let dataArr: any[] = [];
	if (data && data.edges) {
		dataArr = data.edges.map((item, index) => {
			const { __typename, ...rest } = item.node;

			if (date_row_name.length < 0) {
				return {
					id: id_counter++,
					...rest,
				};
			} else {
				return {
					id: id_counter++,
					year: getYearFromDate(rest[date_row_name]),
					...rest,
				};
			}
		});
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

	// 404
	if (!table_name_to_alias_map[table_name] || !table_name) {
		return {
			notFound: true,
		};
	}

	const viewName = table_name_to_alias_map[table_name];

	let query: DocumentNode = null;
	let data: any;

	// ADDING NEW DATA? Add switch statement for each new data table
	switch (table_name) {
		case "detail_record":
			query = GET_FIRST_1000_DETAIL_RECORDS;
			data = (await apolloClient.query<DetailRecordsResponse>({ query: query })).data[viewName];
			break;
		case "court_overtime":
			query = GET_FIRST_1000_COURT_OVERTIMES;
			data = (await apolloClient.query<CourtOvertimeResponse>({ query: query })).data[viewName];
			break;
		case "officer_misconduct":
			query = GET_FIRST_1000_OFFICER_IA;
			data = (await apolloClient.query<OfficerIAResponse>({ query: query })).data[viewName];
			break;
	}

	const rowCount = (await apolloClient.query({ query: GET_NUMBER_OF_ROWS(table_name) })).data;
	const endCursor = data.pageInfo.endCursor;
	const hasNextPage = data.pageInfo.hasNextPage;

	const dataArr = dataToColumns(data, table_name);

	return {
		props: {
			rows: dataArr,
			table_name: table_name,
			columns: getHeaderWithDescription(functionMapping[table_name]),
			rowCount: rowCount.totalCount,
			endCursor: endCursor,
			hasNextPage: hasNextPage,
		},
	};
};

export default function Table(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
	const [rows, setRows] = useState<any[]>(props.rows);
	const [loadingMoreData, setLoadingMoreData] = useState<boolean>(true);
	const router = useRouter();
	const tableDef = tableDefinitions.find((tableDef) => tableDef.query === props.table_name);
	const [currentOverlay, setCurrentOverlay] = useState({ table: null, title: null });
	const viewName = table_name_to_alias_map[props.table_name];

	const handleSeeAllClick = () => {
		setCurrentOverlay({ table: <GlossaryTotal columnObjects={props.columns} total={false} />, title: `${tableDef.table} Glossary` });
		document.getElementById("screen-overlay").classList.add("flex");
		document.getElementById("screen-overlay").classList.remove("hidden");
	};

	const table = getMUIGrid(props.table_name, rows, "", [], []);

	const appendRows = useCallback((newData) => {
		setRows((prevRows) => [...prevRows, ...newData]);
	}, []);

	//fetch the rest of the rows once loaded
	useEffect(() => {
		const fetchRestRecords = async () => {
			const currentTimeInSeconds = performance.now();
			let query: DocumentNode = null;
			let data: any;
			let nextPage = props.hasNextPage;
			let endCursor = props.endCursor;
			let variables = endCursor ? { endCursor } : { endCursor: null };

			let count = 1;

			while (nextPage) {
				count += 1;
				variables = endCursor ? { endCursor } : { endCursor: null };
				// ADDING NEW DATA? Add switch statement for each new data table
				switch (props.table_name) {
					case "detail_record":
						query = GET_NEXT_PAGE_DETAIL_RECORDS;
						data = (await apolloClient.query<DetailRecordsResponse>({ query: query, variables: variables })).data[viewName];
						break;
					case "court_overtime":
						query = GET_NEXT_PAGE_COURT_OVERTIMES;
						data = (await apolloClient.query<CourtOvertimeResponse>({ query: query, variables: variables })).data[viewName];
						break;
					case "officer_misconduct":
						query = GET_NEXT_PAGE_OFFICER_IA;
						data = (await apolloClient.query<OfficerIAResponse>({ query: query, variables: variables })).data[viewName];
						break;
				}

				nextPage = data.pageInfo.hasNextPage;
				endCursor = data.pageInfo.endCursor;
				const dataArr = dataToColumns(data, props.table_name);
				appendRows(dataArr);
			}
			setLoadingMoreData(false);
			const finishTime = performance.now();
			console.log("TOTAL EXECUTION TIME (ms)", finishTime - currentTimeInSeconds);
		};
		setLoadingMoreData(true);
		fetchRestRecords();
	}, [props.table_name, appendRows]);

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
				<div className={"max-w-1128 h-full "} style={{ width: "68.25%" }}>
					<div style={{ display: "flex", alignItems: "center", justifyContent: "end", marginBottom: "1rem" }}>
						<Button onClick={handleSeeAllClick} type="primary" shape="round" className={" text-white font-urbanist active:scale-[.95] p-2 w-32 shadow-xl transition-button duration-300 hover:bg-primary-hover"} style={{ backgroundColor: bpi_deep_green, height: "2.3rem" }}>
							Table Glossary
						</Button>
					</div>

					{table.fullTable}
				</div>
			</div>
		</div>
	);
}
