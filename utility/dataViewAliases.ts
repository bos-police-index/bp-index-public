// Replace these with new data view names every time you want to change the GQL queries

// DATA PAGE
export const detail_alias_name = "allLinkSu24DetailRecordsNews";
export const court_overtime_alias_name = "allLinkSu24CourtOvertimes";
// export const officer_ia_alias_name  = "allLinkSu24EmployeeIas" (replace if they arent the same )

// PROFILE PAGE
export const homepage_alias_name = "allSu24Homepages";
export const officer_financial_alias_name = "allLinkSu24EmployeeFinancials";
export const officer_ia_alias_name = "allLinkSu24EmployeeIas";

export const API_PAGE_SIZE_LARGE = 30000;
export const API_PAGE_SIZE_MEDIUM = 10000;
export const API_PAGE_SIZE_SMALL = 1000;

// Use in `[table_name].tsx`
export const table_name_to_alias_map = {
	detail_record: detail_alias_name,
	court_overtime: court_overtime_alias_name,
	officer_misconduct: officer_ia_alias_name,
};

