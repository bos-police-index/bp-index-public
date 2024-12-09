import { Prisma } from "@prisma/client";
import { tableDefinitions } from "./tableDefinitions";

// Set the primary key for each table
// const table_pk = {};
// Prisma.dmmf.datamodel.models.forEach((model) => {
// 	table_pk[model.name] = model.fields[0].name;
// });

// extracts PK and renames it so MUI DataGrid can use it
// export function extractID(data: any, table_name: string) {
// 	const id_name = table_pk[table_name];
// 	const { [id_name]: id, ...rest } = data;
// 	return {
// 		id,
// 		...rest,
// 	};
// }

// // Looks for a particular table in the database
// // Used in /data/tables/[table_name], so that if the table doesn't exist, it can throw a 404
// export function tableExists(table_name: string): boolean {
// 	const table = tableDefinitions.find((entry) => entry.table === table_name);
// 	return table !== undefined && table.isFake === false;
// }


export function determinePercentile(data: number[], target: number): number {
	let lessThanTarget = 0;
	for (let i = 0; i < data.length; i++) {
		if (data[i] < target) {
			lessThanTarget++;
		}
	}
	return (lessThanTarget / data.length) * 100;
}