// Replace these with new data view names every time you want to change the GQL queries

// DATA PAGE
export const detail_alias_name = "allLinkSu24DetailRecords";
export const court_overtime_alias_name = "allLinkSu24CourtOvertimes";
// export const officer_ia_alias_name  = "allLinkSu24EmployeeIas" (replace if they arent the same )
export const fio_record_alias_name = "allLinkSu24FieldInterrogationAndObservations";

// PROFILE PAGE
export const homepage_alias_name = "allSu24Homepages";
export const officer_financial_alias_name = "allLinkSu24EmployeeFinancials";
export const officer_ia_alias_name = "allLinkSu24EmployeeIaNews";

// Use in `[table_name].tsx`
export const table_name_to_alias_map = {
	detail_record: detail_alias_name,
	court_overtime: court_overtime_alias_name,
	officer_misconduct: officer_ia_alias_name,
	fio_record: fio_record_alias_name,
};


/* Used to work with GraphQL type enums better in queries */
export const removeAllPrefix = (alias:string) =>{
	return alias.replace("all","");
}

export const removePluralSuffix = (alias: string) => {
	return alias.trim().endsWith("s") ? alias.slice(0, -1) : alias;
};