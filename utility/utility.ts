import { Prisma } from "@prisma/client";

// Set the primary key for each table
const table_pk = {};
Prisma.dmmf.datamodel.models.forEach((model) => {
	table_pk[model.name] = model.fields[0].name;
});

// extracts PK and renames it so MUI DataGrid can use it
export function extractID(data: any, table_name: string) {
	const id_name = table_pk[table_name];
	const { [id_name]: id, ...rest } = data;
	return {
		id,
		...rest,
	};
}

// Looks for a particular table in the database
// Used in /data/tables/[table_name], so that if the table doesn't exist, it can throw a 404
export function tableExists(table_name: string) {
	return table_pk[table_name] !== undefined;
}
