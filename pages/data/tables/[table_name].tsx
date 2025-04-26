import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { functionMapping, getServerSidePaginationMUIGrid } from "@utility/createMUIGrid";
import apolloClient from "@lib/apollo-client";
import { GET_YEAR_RANGE_OF_DATASET } from "@lib/graphql/queries";
import IconWrapper, { tableDefinitions } from "@utility/tableDefinitions";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import getHeaderWithDescription from "@utility/columnDefinitions";
import { bpi_deep_green, bpi_light_gray, bpi_light_green } from "@styles/theme/lightTheme";
import ScreenOverlay from "@components/ScreenOverlay";
import { Button } from "antd";
import GlossaryTotal from "@components/GlossaryTotal";
import { table_name_to_alias_map } from "@utility/dataViewAliases";
import { getYearFromAnyFormat, getYearFromDate } from "@utility/textFormatHelpers";
import { tableDateColumnMap } from "@utility/queryUtils";

export const dataToColumns = (data, table_name: string) => {
	const viewName = table_name_to_alias_map[table_name];
	let date_row_name = tableDateColumnMap[table_name];
	let dataArr: any[] = [];
	let rowCount: number;

	if (data && data[viewName]?.nodes) {
		rowCount = data[viewName].totalCount;
		dataArr = data[viewName]?.nodes.map((item, index) => {
			const { ...rest } = item;

			if (!date_row_name) {
				return {
					id: index + 1,
					...rest,
				};
			} else {
				return {
					id: index + 1,
					year: getYearFromDate(rest[date_row_name as keyof DetailRecord] as string),
					...rest,
				};
			}
		});
	} else {
		return { formattedData: [], rowCount: 0 };
	}

	if (table_name === "employee") {
		// remove the officer_photo column
		dataArr.forEach((item) => {
			delete item["officer_photo"];
		});
	}

	return { formattedData: dataArr || [], rowCount: rowCount || 0 };
};

export const getServerSideProps: GetServerSideProps = async (context) => {
	const table_name = context.params?.table_name as string;

	// 404
	if (!table_name_to_alias_map[table_name] || !table_name) {
		return {
			notFound: true,
		};
	}

	// Get Min and Max years of dataset
	let dates = { earliest: "", latest: "" };
	let earliestNeeded = true;
	let latestNeeded = true;
	if (tableDateColumnMap[table_name] != "") {
		let offset = 0;
		while (earliestNeeded || latestNeeded) {
			const dateRange = await apolloClient.query({ query: GET_YEAR_RANGE_OF_DATASET(table_name, tableDateColumnMap[table_name], offset, earliestNeeded, latestNeeded) });

			if (earliestNeeded && dateRange.data.earliest.nodes[0] != null ? dateRange.data.earliest.nodes[0][tableDateColumnMap[table_name]] : false) {
				// console.log(dateRange.data.earliest.nodes[0][tableDateColumnMap[table_name]], offset);
				dates.earliest = dateRange.data.earliest.nodes[0][tableDateColumnMap[table_name]];
				earliestNeeded = false;
			}
			if (latestNeeded && dateRange.data.latest.nodes[0] != null ? dateRange.data.latest.nodes[0][tableDateColumnMap[table_name]] : false) {
				// console.log(dateRange.data.latest.nodes[0][tableDateColumnMap[table_name]], offset);
				dates.latest = dateRange.data.latest.nodes[0][tableDateColumnMap[table_name]];
				latestNeeded = false;
			}
			offset == 0 ? (offset += 2) : (offset *= 2);
		}
	}

	return {
		props: {
			table_name: table_name,
			columns: getHeaderWithDescription(functionMapping[table_name]),
			dataYearRange: dates,
		},
	};
};

export default function Table(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
	const router = useRouter();
	const tableDef = tableDefinitions.find((tableDef) => tableDef.query === props.table_name);
	const [currentOverlay, setCurrentOverlay] = useState({ table: null, title: null });
	const viewName = table_name_to_alias_map[props.table_name];

	const handleSeeAllClick = () => {
		setCurrentOverlay({ table: <GlossaryTotal columnObjects={props.columns} total={false} />, title: `${tableDef.table} Glossary` });
		document.getElementById("screen-overlay").classList.add("flex");
		document.getElementById("screen-overlay").classList.remove("hidden");
	};

	// const appendRows = useCallback((newData) => {
	// 	setRows((prevRows) => [...prevRows, ...newData]);
	// }, []);

	const table = getServerSidePaginationMUIGrid(props.table_name, [], []);
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
					{props.dataYearRange.earliest == "" ? "Unspecified" : getYearFromAnyFormat(props.dataYearRange.earliest) + " - " + getYearFromAnyFormat(props.dataYearRange.latest)}

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

					{table.dataPageTable}
				</div>
			</div>
		</div>
	);
}
