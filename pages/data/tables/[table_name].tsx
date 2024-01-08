import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getMUIGrid } from "@utility/createMUIGrid";
import { extractID, tableExists } from "@utility/utility";
import prisma from "@lib/prisma";
import { Prisma } from "@prisma/client";
export const getServerSideProps: GetServerSideProps = async (context) => {
	const table_name = context.params?.table_name as string;

	if (!tableExists(table_name)) {
		// throw a 404, with a custom message : "Table not found"
		return {
			notFound: true,
		};
	}

	const data: object[] = await prisma.$queryRaw(Prisma.sql([`SELECT * FROM ${table_name}`]));
	let dataArr = [];
	if (data.length && data.length > 0) {
		dataArr = data.map((item) => {
			return extractID(item, table_name);
		});
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
	const tables = getMUIGrid(props.table_name, props.rows, "", [], []);
	return <div className={"w-full h-full"}>{tables.fullTable}</div>;
}
