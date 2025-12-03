// Replace these with new data view names every time you want to change the GQL queries
/*
WHERE TO FIND THEM? https://dev-graphql.bpindex.org/graphiql
- note: they will be different from what is seen in Postgres (add "all" and camelcase instead of underlines and make plural)
*/


// DATA PAGE
export const detail_alias_name = "allVwDetailRecords";
export const court_overtime_alias_name = "allVwCourtOvertimes";
// export const officer_ia_alias_name  = "allLinkSu24EmployeeIas" (replace if they arent the same )
export const fio_record_alias_name = "allVwFieldInterrogationAndObservations";
export const crime_incident_alias_name = "allVwIncidentsWithOfficerDetailsWws";
export const boston_arrest_alias_name = "allVwBostonArrests";
export const traffic_stop_alias_name = "allVwTrafficStopsFall2025S";

// PROFILE PAGE
export const homepage_alias_name = "allHomepages";
export const officer_financial_alias_name = "allVwEmployeeFinancials";
export const officer_ia_alias_name = "allVwEmployeeIaFall2025S";
export const employee_alias_name = "allVwEmployeeRosterFall2025S";

// Use in `[table_name].tsx`
export const table_name_to_alias_map = {
	detail_record: detail_alias_name,
	court_overtime: court_overtime_alias_name,
	officer_misconduct: officer_ia_alias_name,
	fio_record: fio_record_alias_name,
	crime_incident: crime_incident_alias_name,
	boston_arrest: boston_arrest_alias_name,
	employee: employee_alias_name,
	traffic_stop: traffic_stop_alias_name,
};


/* Used to work with GraphQL type enums better in queries */
export const removeAllPrefix = (alias:string) =>{
	if (!alias) {
		throw new Error("removeAllPrefix: alias is undefined or null");
	}
	return alias.replace("all","");
}

export const removePluralSuffix = (alias: string) => {
	if (!alias) {
		throw new Error("removePluralSuffix: alias is undefined or null");
	}
	const trimmed = alias.trim();
	// Remove trailing 's' or 'S' if present 
	if (trimmed.toLowerCase().endsWith("s")) {
		return trimmed.slice(0, -1);
	}
	return trimmed;
};
