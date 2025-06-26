import apolloClient from "@lib/apollo-client";
import { GET_NEXT_PAGE_COURT_OVERTIMES, GET_NEXT_PAGE_CRIME_INCIDENTS, GET_NEXT_PAGE_DETAIL_RECORDS, GET_NEXT_PAGE_FIO_RECORDS, GET_NEXT_PAGE_OFFICER_IA } from "@lib/graphql/queries";
import { table_name_to_alias_map } from "./dataViewAliases";

export const handleQuery = (table_name) => {
	let query;
	// ADDING NEW DATA? Add switch statement for each new data table
	switch (table_name) {
		case "detail_record":
			query = GET_NEXT_PAGE_DETAIL_RECORDS;
			break;
		case "crime_incident":
			query = GET_NEXT_PAGE_CRIME_INCIDENTS;
			break;
		case "court_overtime":
			query = GET_NEXT_PAGE_COURT_OVERTIMES;
			break;
		case "officer_misconduct":
			query = GET_NEXT_PAGE_OFFICER_IA;
			break;
		case "fio_record":
			query = GET_NEXT_PAGE_FIO_RECORDS;
			break;
	}
	return query;
};

export const executeDataPageQuery = async (table_name, query, variables) => {
	let data;
	const viewName = table_name_to_alias_map[table_name];
	
	console.log("Executing query for:", {
		table_name,
		viewName,
		variables,
		queryDefinition: query.definitions[0]?.selectionSet?.selections
	});
	
	try {
		switch (table_name) {
			case "detail_record":
				data = (await apolloClient.query<DetailRecordsResponse>({ query: query, variables: variables })).data[viewName];
				break;
			case "crime_incident":
					data = (await apolloClient.query<CrimeIncidentsResponse>({ query: query, variables: variables })).data[viewName];
				break;
			case "court_overtime":
				data = (await apolloClient.query<CourtOvertimeResponse>({ query: query, variables: variables })).data[viewName];
				break;
			case "officer_misconduct":
				data = (await apolloClient.query<OfficerIAResponse>({ query: query, variables: variables })).data[viewName];
				break;
			case "fio_record":
				data = (await apolloClient.query<FIORecordResponse>({ query: query, variables: variables })).data[viewName];
				break;
		}
		return data;
	} catch (error) {
		console.error("Query execution error:", {
			error,
			errorMessage: error.message,
			graphQLErrors: error.graphQLErrors,
			networkError: error.networkError,
			table_name,
			viewName,
			variables
		});
		throw error; 
	}
};

/* 
ADDING NEW DATA? Add a new key-value pair for each new table 
required that year is the first part of the date
 */
export const tableDateColumnMap = {
	detail_record: "startDate",
	crime_incident: "occurredOnDate",
	court_overtime: "otDate",
	officer_misconduct: "occuredDate",
	fio_record: "year",
};

