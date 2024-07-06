import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getMUIGrid } from "@utility/createMUIGrid";
import { extractID, tableExists } from "@utility/utility";
import apolloClient from "@lib/apollo-client";
import { GET_DETAIL_RECORDS } from "@lib/graphql/queries";
import IconWrapper, { tableDefinitions } from "@pages/data/tableDefinitions";

interface DetailRecord {
	customerId: number;
	crossStreetNo: number;
	crossStreetName: string;
	adminFeeRate: number;
	contractNo: number;
	detailPayRate: number;
	detailStart: Date;
	detailEnd: Date;
	hoursWorked: number;
	adminFeeFlag: boolean;
	detailClerkEmployeeId: number;
	detailRank: string;
	detailRecordId: number;
	detailType: string;
	employeeId: number;
	fbkPayDate: Date;
	incidentNo: number;
	licensePremiseFlag: boolean;
	locationDesc: string;
	noShowFlag: boolean;
	payAmount: number;
	payHours: number;
	payTrcCode: string;
	prepaidFlag: boolean;
	rateChangeAuthorizationEmployeeId: number;
	recordCreatedBy: string;
	recordCreatedDate: Date;
	recordUpdatedBy: string;
	recordUpdatedDate: Date;
	requestRank: string;
	rowId: number;
	streetName: string;
	streetId: number;
	stateFunded: boolean;
	streetNo: number;
	trackingNo: number;
}

interface DetailRecordsResponse {
	allDetailRecordFromFa23Data: {
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

	const { data } = await apolloClient.query<DetailRecordsResponse>({ query: GET_DETAIL_RECORDS });

	let dataArr: any[] = [];

	if (data && data.allDetailRecordFromFa23Data && data.allDetailRecordFromFa23Data.nodes) {
		dataArr = data.allDetailRecordFromFa23Data.nodes.map((item, index) => ({
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
	console.log(props.rows[0]);
	const tableDef = tableDefinitions.find((tableDef) => tableDef.query === props.table_name);
	console.log(tableDef);

	const table = getMUIGrid(props.table_name, props.rows, "", [], []);
	return (
		<div className={"w-full h-full"} style={{ color: "white", fontSize: "large" }}>
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
