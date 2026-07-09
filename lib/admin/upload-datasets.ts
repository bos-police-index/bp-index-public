/**
 * Upload dataset registry — the schema-first contract for admin file uploads.
 *
 * Instead of writing a bespoke parser for every file we happen to receive, we
 * PUBLISH the schema each dataset must conform to. An admin downloads/reads the
 * schema, shapes their CSV/XLSX to match, and uploads it. The upload validates
 * the file's headers against `columns` here, lands the rows into `rawTable`, and
 * runs `reconciler` to rebuild the officer-facing v2 tables.
 *
 * To add a new dataset: add an entry here. No new API/UI code required.
 */

export type UploadColumn = {
	/** Canonical column name the file header must map to (case/space-insensitive). */
	name: string;
	/** Required columns must be present in the file or the upload is rejected. */
	required: boolean;
	/** Short human hint shown in the schema panel. */
	note?: string;
};

export type UploadDataset = {
	key: string;
	label: string;
	/** One-line description of what this dataset feeds. */
	description: string;
	/** production.<table> that rows land in (truncated + replaced on each upload). */
	rawTable: string;
	/** production.<fn>() run after load to rebuild the v2 officer tables. */
	reconciler: string;
	/** How rows attach to officers, for the UI. */
	matchOn: string;
	/** Canonical schema — the file must supply at least every `required` column. */
	columns: UploadColumn[];
};

export const UPLOAD_DATASETS: UploadDataset[] = [
	{
		key: "roster",
		label: "Officer roster (source of truth)",
		description: "Current BPD personnel roster. Defines which officers exist and their identity (employee id, name, badge, rank).",
		rawTable: "production.raw_employee_roster_fall_2025",
		reconciler: "production.build_officer_roster()",
		matchOn: "employee_id (hard key)",
		columns: [
			{ name: "employee_id", required: true, note: "PeopleSoft employee id — the identity key" },
			{ name: "first_name", required: true },
			{ name: "last_name", required: true },
			{ name: "name_id", required: false, note: "Legacy name id, if available" },
			{ name: "job_title", required: false },
			{ name: "sal_plan", required: false, note: "Salary plan / union code" },
		],
	},
	{
		key: "earnings",
		label: "Earnings by year",
		description: "Boston city payroll earnings. One row per officer per year.",
		rawTable: "production.raw_v2_boston_earnings",
		reconciler: "production.run_earnings_from_boston()",
		matchOn: "name (canonical) — flagged unconfirmed on profiles",
		columns: [
			{ name: "name", required: true, note: "\"Last,First\" as published by data.boston.gov" },
			{ name: "year", required: true },
			{ name: "department_name", required: false },
			{ name: "title", required: false },
			{ name: "regular", required: false },
			{ name: "retro", required: false },
			{ name: "other", required: false },
			{ name: "overtime", required: false },
			{ name: "injured", required: false },
			{ name: "detail", required: false },
			{ name: "quinn", required: false, note: "Quinn / education incentive" },
			{ name: "total_earnings", required: false },
			{ name: "postal", required: false },
		],
	},
	{
		key: "paid_details",
		label: "Paid details",
		description: "Privately-paid detail assignments (construction, events). One row per detail.",
		rawTable: "production.raw_detail_records",
		reconciler: "production.run_paid_details_from_legacy()",
		matchOn: "employee_id (hard key)",
		columns: [
			{ name: "employee_id", required: true },
			{ name: "tracking_no", required: false, note: "Detail tracking number — used to dedup" },
			{ name: "name_id", required: false },
			{ name: "emp_org_desc", required: false },
			{ name: "customer_name", required: false },
			{ name: "customer_city", required: false },
			{ name: "customer_zip", required: false },
			{ name: "street", required: false },
			{ name: "xstreet", required: false },
			{ name: "start_date", required: false },
			{ name: "start_time", required: false },
			{ name: "end_date", required: false },
			{ name: "end_time", required: false },
			{ name: "hours_worked", required: false },
			{ name: "detail_type", required: false },
			{ name: "state_funded", required: false },
			{ name: "pay_amount", required: false },
			{ name: "pay_rate", required: false },
		],
	},
	{
		key: "traffic",
		label: "Traffic citations",
		description: "Motor-vehicle citations issued by officers. One row per citation.",
		rawTable: "production.raw_traffic_tickets_fall_2025",
		reconciler: "production.run_traffic_from_legacy()",
		matchOn: "officer_id = employee_id (hard key)",
		columns: [
			{ name: "officer_id", required: true, note: "Issuing officer's employee id" },
			{ name: "citation_number", required: true, note: "Unique citation id — used to dedup" },
			{ name: "issuing_agency", required: false },
			{ name: "event_date", required: false },
			{ name: "citation_type", required: false },
			{ name: "violator_type", required: false },
			{ name: "offense_code", required: false },
			{ name: "offense_description", required: false },
			{ name: "location_name", required: false },
			{ name: "race", required: false },
			{ name: "gender", required: false },
			{ name: "searched", required: false, note: "yes/no or true/false" },
			{ name: "crash", required: false, note: "yes/no or true/false" },
		],
	},
	{
		key: "iad",
		label: "Internal Affairs (IAD) complaints",
		description: "Internal-affairs cases and their allegations/findings. One row per officer per allegation.",
		rawTable: "production.raw_employee_ia",
		reconciler: "production.run_misconduct_from_legacy()",
		matchOn: "employee_id (hard key)",
		columns: [
			{ name: "employee_id", required: true },
			{ name: "ia_no", required: true, note: "IA case number" },
			{ name: "first_name", required: false },
			{ name: "last_name", required: false },
			{ name: "name_id", required: false },
			{ name: "incident_type", required: false },
			{ name: "allegation", required: false },
			{ name: "finding", required: false, note: "e.g. Sustained / Not Sustained" },
			{ name: "action_taken", required: false },
			{ name: "date_received", required: false },
			{ name: "admin_leave", required: false },
			{ name: "days_or_hours_suspended", required: false },
		],
	},
	{
		key: "fio",
		label: "Field interrogation & observation (FIO)",
		description: "Field contacts / stops. One row per contact.",
		rawTable: "production.raw_v2_boston_fio",
		reconciler: "production.run_fio_from_raw()",
		matchOn: "contact_officer (embedded employee id)",
		columns: [
			{ name: "fc_num", required: true, note: "Field contact number — used to dedup" },
			{ name: "contact_officer", required: true, note: "Officer id/string carrying the employee id" },
			{ name: "contact_officer_name", required: false },
			{ name: "contact_date", required: false, note: "ISO date (YYYY-MM-DD)" },
			{ name: "street", required: false },
			{ name: "city", required: false },
			{ name: "state", required: false },
			{ name: "zip", required: false },
			{ name: "basis", required: false },
			{ name: "circumstance", required: false },
			{ name: "contact_reason", required: false },
		],
	},
	{
		key: "post",
		label: "POST certification",
		description: "MA POST Commission certification records. One row per officer certification.",
		rawTable: "production.raw_v2_post_certified",
		reconciler: "production.run_post_cert_from_raw()",
		matchOn: "mptc_id; name-linked to BPD roster where unambiguous",
		columns: [
			{ name: "officer", required: true, note: "Officer name as published by POST" },
			{ name: "mptc_id", required: true, note: "POST/MPTC id" },
			{ name: "certification", required: false },
			{ name: "status", required: false },
			{ name: "law_enforcement_agency", required: false },
			{ name: "expiration", required: false, note: "MM/DD/YYYY" },
			{ name: "additional_information", required: false },
		],
	},
	{
		key: "incidents",
		label: "Incident journal",
		description: "Reported incidents with the responding officer embedded in the journal name. One row per incident record.",
		rawTable: "production.raw_v2_incident_journal",
		reconciler: "production.run_incidents_from_journal()",
		matchOn: "employee id embedded in officer_journal_name",
		columns: [
			{ name: "incident_number", required: true },
			{ name: "officer_journal_name", required: true, note: "\"<employee_id>  <NAME>\" — id is parsed out" },
			{ name: "occurred_on_date", required: false },
			{ name: "district", required: false },
			{ name: "district_name", required: false },
			{ name: "shooting", required: false },
			{ name: "location_of_occurrence", required: false },
			{ name: "street", required: false },
			{ name: "nature_of_incident", required: false },
			{ name: "offenses", required: false },
			{ name: "incident_clearance", required: false },
			{ name: "number_of_arrestees", required: false },
			{ name: "number_of_victims", required: false },
			{ name: "number_of_offenders", required: false },
			{ name: "url", required: false },
		],
	},
];

export function getDataset(key: string): UploadDataset | undefined {
	return UPLOAD_DATASETS.find((d) => d.key === key);
}

/** Normalize a header/column name for tolerant matching (lowercase, collapse non-alnum to _). */
export function normalizeHeader(h: string): string {
	return String(h ?? "")
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "");
}
