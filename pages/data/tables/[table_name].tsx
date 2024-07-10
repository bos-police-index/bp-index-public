import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getMUIGrid } from "@utility/createMUIGrid";
import { extractID, tableExists } from "@utility/utility";
import apolloClient from "@lib/apollo-client";
import { GET_FIRST_1000_DETAIL_RECORDS, GET_REST_DETAIL_RECORDS } from "@lib/graphql/queries";
import IconWrapper, { tableDefinitions } from "@utility/tableDefinitions";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

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

	const { data } = await apolloClient.query<DetailRecordsResponse>({ query: GET_FIRST_1000_DETAIL_RECORDS });

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
		},
	};
};

export default function Table(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
	const [rows, setRows] = useState<any[]>(props.rows);
	const router = useRouter();
	const tableDef = tableDefinitions.find((tableDef) => tableDef.query === props.table_name);

	const table = getMUIGrid(props.table_name, rows, "", [], []);

	//fetch the rest of the rows once loaded
	useEffect( () =>{
		const fetchRestRecords = async() =>{
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
		setRows([...rows, ...dataArr])
		}
		fetchRestRecords()
	},[])

	return (
		<div className={"max-w-1128 h-full"} style={{ color: "white", fontSize: "large" }}>
			
			<div style={{ margin: "1rem 0" }}>
				<span>
				<Link href="/" style={{ color: "#3874CB" }}>
					{"Home > "}
				</Link>
				<Link href="/data" style={{ color: "#3874CB" }}>
					{"Data > "}
				</Link>
				<span style={{ color: "#3874CB", textDecoration: "none", cursor: "default" }}>
            {tableDef.table}
        </span>

				</span>
				
			</div>
			<div>
				<div style={{ display: "flex", alignItems: "center", justifyContent: "start", marginBottom: "1rem" }}>
					<div style={{ marginLeft: "-0.8rem" }}>
						{" "}
						<IconWrapper Icon={tableDef.image.src} color="white" fontSize="4rem" />
					</div>
					<h2 style={{ marginLeft: "1rem", fontSize: "xx-large", fontWeight: "bold" }}>{tableDef.table}</h2>
				</div>

				<p style={{ color: "white" }}>{tableDef?.longDescription}</p>
				<br />
				<strong style={{ fontSize: "x-large" }}>Sources: </strong>
				{tableDef.source}
				<br />
				<strong style={{ fontSize: "x-large" }}>Years: </strong>
				{tableDef.years}
			</div>
			{table.fullTable}
		</div>
	);
}
