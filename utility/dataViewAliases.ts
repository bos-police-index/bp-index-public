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
export const ir_fall_2025_alias_name = "allVwIrFall2025S";

// PROFILE PAGE
export const homepage_alias_name = "allHomepages";
// Officer search over the canonical-name-merged v2_officer_id_map (vw_v2_officer_search),
// so search results link to v2 bpi_ids and the v2 profile sections populate.
export const officer_search_alias_name = "allVwV2OfficerSearches";
export const officer_financial_alias_name = "allVwEmployeeFinancials";
export const officer_ia_alias_name = "allVwEmployeeIaFall2025S";
export const employee_alias_name = "allVwEmployeeRosterFall20252S";
export const officer_year_history_alias_name = "allVwEmployeeYearHistories";

/* V2 PROFILE PAGE — sourced from production.vw_v2_* views, fed by the n8n
   ingest pipelines (POST Commission, Boston earnings, identity merge).
   Verify these alias names in GraphiQL after PostGraphile re-introspects:
   https://dev-graphql.bpindex.org/graphiql */
export const v2_officer_profile_alias_name      = "allVwV2OfficerProfiles";
export const v2_earnings_by_year_alias_name     = "allVwV2EarningsByYears";
export const v2_post_certification_alias_name   = "allVwV2PostCertifications";
export const v2_post_decertification_alias_name = "allVwV2PostDecertifications";
export const v2_officer_misconduct_alias_name   = "allVwV2OfficerMisconducts";
export const v2_fio_alias_name                  = "allVwV2Fios";
export const v2_officer_assignment_alias_name   = "allVwV2OfficerAssignments";
export const v2_paid_detail_alias_name           = "allVwV2PaidDetails";
export const v2_traffic_alias_name               = "allVwV2TrafficCitations";
export const v2_incident_alias_name              = "allVwV2Incidents";

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
	ir_fall_2025: ir_fall_2025_alias_name,
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
