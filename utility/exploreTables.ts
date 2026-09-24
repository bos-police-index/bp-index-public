import { DocumentNode, gql } from "@apollo/client";
import {
	GET_NEXT_PAGE_BOSTON_ARRESTS,
	GET_NEXT_PAGE_COURT_OVERTIMES,
	GET_NEXT_PAGE_CRIME_INCIDENTS,
	GET_NEXT_PAGE_DETAIL_RECORDS,
	GET_NEXT_PAGE_EMPLOYEE,
	GET_NEXT_PAGE_FIO_RECORDS,
	GET_NEXT_PAGE_IR_FALL_2025,
	GET_NEXT_PAGE_OVERTIME,
	GET_NEXT_PAGE_TRAFFIC_STOPS,
	GET_NEXT_PAGE_TRAFFIC_UNATTRIBUTED,
} from "@lib/graphql/queries";
import { table_name_to_alias_map } from "./dataViewAliases";
import { exploreColumns } from "./exploreColumns.generated";
import { ColumnFilter, FilterState, cleanFilters } from "./tableFilters";

/*
 * /data explorer tables → the filterable explore_<table>(filters) SQL functions
 * (db/migrations/2026_09_23_1_explorer_filters.sql, _2_ia_officer_cases.sql).
 *
 * Each query aliases the function back to the table's old root field
 * (table_name_to_alias_map), so dataToColumns() and the response types are unchanged.
 * The selected fields are the table's previous GET_NEXT_PAGE_* selection plus the new
 * year column — whatever of those the explore view actually has.
 */

interface ExploreTable {
	fn: string; // GraphQL root field
	view: string; // production.vw_explore_* view (for explore_distinct + column map)
	connection: string; // GraphQL connection type prefix: <connection>OrderBy
	baseQuery?: DocumentNode; // previous query, for its field selection
	extraFields?: string[];
	defaultOrderBy?: string[];
	/** Sort a grid field by a different SQL column (e.g. a null-safe sort key). */
	sortColumns?: Record<string, string>;
}

export const exploreTables: Record<string, ExploreTable> = {
	detail_record: { fn: "exploreDetailRecords", view: "vw_explore_detail_records", connection: "VwExploreDetailRecords", baseQuery: GET_NEXT_PAGE_DETAIL_RECORDS, extraFields: ["year"] },
	court_overtime: { fn: "exploreCourtOvertime", view: "vw_explore_court_overtime", connection: "VwExploreCourtOvertimes", baseQuery: GET_NEXT_PAGE_COURT_OVERTIMES, extraFields: ["year"] },
	overtime: { fn: "exploreOvertime", view: "vw_explore_overtime", connection: "VwExploreOvertimes", baseQuery: GET_NEXT_PAGE_OVERTIME, extraFields: ["year"] },
	crime_incident: { fn: "exploreCrimeIncidents", view: "vw_explore_crime_incidents", connection: "VwExploreCrimeIncidents", baseQuery: GET_NEXT_PAGE_CRIME_INCIDENTS, extraFields: ["year"] },
	fio_record: { fn: "exploreFioRecords", view: "vw_explore_fio_records", connection: "VwExploreFioRecords", baseQuery: GET_NEXT_PAGE_FIO_RECORDS, extraFields: ["year"] },
	boston_arrest: { fn: "exploreArrests", view: "vw_explore_arrests", connection: "VwExploreArrests", baseQuery: GET_NEXT_PAGE_BOSTON_ARRESTS, extraFields: ["year"] },
	traffic_stop: { fn: "exploreTrafficCitations", view: "vw_explore_traffic_citations", connection: "VwExploreTrafficCitations", baseQuery: GET_NEXT_PAGE_TRAFFIC_STOPS, extraFields: ["year"] },
	traffic_unattributed: { fn: "exploreTrafficUnattributed", view: "vw_explore_traffic_unattributed", connection: "VwExploreTrafficUnattributeds", baseQuery: GET_NEXT_PAGE_TRAFFIC_UNATTRIBUTED, extraFields: ["year"] },
	ir_fall_2025: { fn: "exploreIncidentReports", view: "vw_explore_incident_reports", connection: "VwExploreIncidentReports", baseQuery: GET_NEXT_PAGE_IR_FALL_2025, extraFields: ["year"] },
	employee: { fn: "exploreEmployees", view: "vw_explore_employees", connection: "VwExploreEmployees", baseQuery: GET_NEXT_PAGE_EMPLOYEE, extraFields: ["payYear"] },
	// One row per officer per IA case (replaces the 2022+ allegation-level extract).
	officer_misconduct: {
		fn: "exploreIaCases",
		view: "vw_explore_ia_cases",
		connection: "VwExploreIaCases",
		defaultOrderBy: ["SORT_DATE_DESC"],
		sortColumns: { receivedDate: "sort_date" },
	},
};

/** Field names under nodes/edges.node of a GET_NEXT_PAGE_* document. */
function selectedFields(doc?: DocumentNode): string[] {
	const op: any = doc?.definitions?.[0];
	const root = op?.selectionSet?.selections?.[0];
	const sels = root?.selectionSet?.selections ?? [];
	const nodes = sels.find((s) => s.name?.value === "nodes");
	const edges = sels.find((s) => s.name?.value === "edges");
	const nodeSel = nodes ?? edges?.selectionSet?.selections?.find((s) => s.name?.value === "node");
	return (nodeSel?.selectionSet?.selections ?? []).map((s) => s.name?.value).filter(Boolean);
}

const queryCache: Record<string, DocumentNode> = {};

export function buildExploreQuery(table_name: string): DocumentNode | undefined {
	const t = exploreTables[table_name];
	if (!t) return undefined;
	if (queryCache[table_name]) return queryCache[table_name];
	const cols = exploreColumns[t.view] ?? {};
	const wanted = t.baseQuery ? [...selectedFields(t.baseQuery), ...(t.extraFields ?? [])] : Object.keys(cols);
	const fields = Array.from(new Set(wanted)).filter((f) => f in cols);
	const alias = table_name_to_alias_map[table_name];
	queryCache[table_name] = gql`
		query Explore_${table_name}($offset: Int, $page_size: Int, $order_by: [${t.connection}OrderBy!], $filters: JSON) {
			${alias}: ${t.fn}(filters: $filters, first: $page_size, offset: $offset, orderBy: $order_by) {
				nodes {
					${fields.join("\n\t\t\t\t\t")}
				}
				totalCount
			}
		}
	`;
	return queryCache[table_name];
}

/** grid field → SQL column of the table's explore view (undefined if the view lacks it). */
export function sqlColumnOf(table_name: string, field: string): string | undefined {
	const t = exploreTables[table_name];
	return t ? exploreColumns[t.view]?.[field] : undefined;
}

/** Grid filter state → explore_<table>(filters) JSON (snake_case keys), dropping unknown fields. */
export function exploreFilterJson(table_name: string, state: FilterState): string {
	const out: Record<string, ColumnFilter> = {};
	for (const [field, f] of Object.entries(cleanFilters(state))) {
		const col = sqlColumnOf(table_name, field);
		if (col) out[col] = f;
	}
	return JSON.stringify(out);
}

/** Grid sort model → orderBy enum values, e.g. officerBadgeNo desc → OFFICER_BADGE_NO_DESC. */
export function exploreOrderBy(table_name: string, sortModel: { field: string; sort?: "asc" | "desc" | null }[]): string[] {
	const orderBy = sortModel
		.map(({ field, sort }) => {
			const col = exploreTables[table_name]?.sortColumns?.[field] ?? sqlColumnOf(table_name, field);
			return col && sort ? `${col.toUpperCase()}_${sort === "desc" ? "DESC" : "ASC"}` : null;
		})
		.filter(Boolean);
	return orderBy.length > 0 ? orderBy : exploreTables[table_name]?.defaultOrderBy ?? ["NATURAL"];
}

export const EXPLORE_DISTINCT = gql`
	query ExploreDistinct($view: String!, $column: String!, $limit: Int) {
		exploreDistinct(pView: $view, pColumn: $column, pLimit: $limit) {
			nodes {
				value
				n
			}
		}
	}
`;

/** One request for every /data table's total row count (the /data cards). */
export const GET_ALL_TABLE_COUNTS = gql`
	query TableCounts {
		${Object.entries(exploreTables)
			.map(([table, t]) => `${table}: ${t.fn}(first: 1) { totalCount }`)
			.join("\n\t\t")}
	}
`;

export const tableCountQuery = (table_name: string): DocumentNode | undefined => {
	const t = exploreTables[table_name];
	return t ? gql`query TableCount_${table_name} { count: ${t.fn}(first: 1) { totalCount } }` : undefined;
};

/** Column used for a table's "Time Period" box (overtime is reported by fiscal year). */
export const timePeriodColumn = (table_name: string): { column: string; prefix: string } | null => {
	const t = exploreTables[table_name];
	if (!t) return null;
	if (table_name === "overtime") return { column: "fy", prefix: "FY" };
	return Object.values(exploreColumns[t.view] ?? {}).includes("year") ? { column: "year", prefix: "" } : null;
};
