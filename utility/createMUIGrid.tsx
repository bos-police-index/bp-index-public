import { GridColDef } from "@mui/x-data-grid";
import React from "react";
import DataTable from "@components/DataTable";
import { Tooltip } from "@mui/material";
import { formatDateShort, formatDate, formatHours, formatMoney, formatTime, yAndNToBoolean, fixNameOrdering, noNullStringToBool, fixZipCode } from "./textFormatHelpers";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";

export const getMUIGrid = (table: string, rows: any[], officerName: string, includesOnly = [], excludes = [], rowCount) => {
	const cols: GridColDef[] = functionMapping[table];
	const hide = cols.filter((col) => col.hideable === true).map((col) => col.field);

	if (!rows) {
		rows = [];
	}
	// if includesOnly contains anything, we remove all columns that are not in includesOnly
	// Except for the id column, which is always included
	let filteredCols: GridColDef[] = cols.filter((col: GridColDef) => {
		return includesOnly.length === 0 || includesOnly.includes(col.field) || col.field === "id";
	});

	// if excludes contains anything, we remove all columns that are in excludes
	// Except for the id column, which is always included
	filteredCols = filteredCols.filter((col: GridColDef) => {
		return !excludes.includes(col.field) || col.field === "id";
	});

	// 100vh - 7rem is for data-table, aka /data/tables/[table_name]
	// 100vh - 90px is for screen overlay table, inside the officer profile page

	return {
		fullTable: <DataTable table={rows} cols={cols} table_name={`${officerName}-${table}`} pageSizeOptions={[25, 50, 75, 100]} pageSize={25} rowCount={undefined} hide={hide} isServerSideRendered={false} />,
		filteredTable: <DataTable table={rows} cols={filteredCols} table_name={`${officerName}-${table}`} pageSizeOptions={[5]} pageSize={5} rowCount={undefined} hide={hide} isServerSideRendered={false} />,
	};
};

const officer_ia_columns = () => {
	const cols: GridColDef[] = [
		{
			field: "id",
			hideable: true,
			headerName: "ID",
			type: "number",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 100,
			filterable: false,
		},
		{
			field: "iaNumber",
			headerName: "IA Number",
			description: "Internal Affairs (IA) case number assigned to track the investigation",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 250,
		},
		{
			field: "badgeNo",
			headerName: "Officer Badge #",
			description: "The badge number of an officer. Note that this is not necessarily unique.",
			type: "number",
			valueFormatter: (params) => params.value,
			width: 150,
		},
		{
			field: "incidentType",
			headerName: "Incident Type",
			description: "The general category of the reported event (e.g., use of force, misconduct, policy violation)",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
		{
			field: "receivedDate",
			headerName: "Date Received",
			description: "The date when the complaint or investigation was officially received",
			type: "date",
			valueFormatter: formatDateShort,
			width: 200,
		},
		{
			field: "officerName",
			headerName: "Officer Name",
			description: "The full name of the officer involved in the incident",
			valueGetter: (params) => {
				const firstName = params.row.firstName || "";
				const lastName = params.row.lastName || "";
				return `${firstName} ${lastName}`.trim();
			},
			width: 200,
		},
		{
			field: "allegation",
			headerName: "Allegation",
			description: "The specific accusation or complaint made against the officer(s)",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
		{
			field: "finding",
			headerName: "Finding",
			description: "The outcome of the investigation (e.g., sustained, not sustained, exonerated, unfounded)",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
		{
			field: "actionTaken",
			headerName: "Action Taken",
			description: "Disciplinary or corrective actions imposed if the allegation was substantiated (e.g., reprimand, suspension, termination).",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
		{
			field: "disposition",
			headerName: "Disposition",
			description: "The final status of the case, including whether it was closed, pending, or referred to another agency.",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
		{
			field: "occuredDate",
			headerName: "Date Occurred",
			description: "The actual date on which the incident occurred.",
			type: "date",
			valueFormatter: formatDateShort,
			width: 200,
		},
		{
			field: "allegationType",
			headerName: "Allegation Type",
			description: "A broader categorization of the allegation.",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
		{
			field: "allegationSubtype",
			headerName: "Allegation Subtype",
			description: "A more detailed or specific categorization of the allegation.",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
		{
			field: "allegationDetails",
			headerName: "Allegation Details",
			description: "Detailed information or context about the allegation.",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
		{
			field: "disciplines",
			headerName: "Disciplines",
			description: "Any disciplinary categories relevant to the case or action taken.",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
		{
			field: "leaDisposition",
			headerName: "LEA Disposition",
			description: "The final disposition or outcome of the case as determined by the Law Enforcement Agency.(e.g., sustained, not sustained, exonerated, unfounded)",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
	];

	return cols;
};

const police_financial_columns = () => {
	const cols: GridColDef[] = [
		{
			field: "id",
			hideable: false,
			headerName: "ID",
			type: "number",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 50,
			filterable: false,
		},
		{
			field: "year",
			headerName: "Year",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 70,
			filterable: false,
		},
		{
			field: "totalPay",
			headerName: "Total Pay",
			type: "number",
			valueGetter: (params) => {
				const { regularPay, detailPay, otPay, retroPay, quinnPay, injuredPay, otherPay } = params.row;
				return regularPay + detailPay + otPay + retroPay + quinnPay + injuredPay + otherPay;
			},
			valueFormatter: (params) => {
				return formatMoney(params.value);
			},
			width: 120,
		},
		{
			field: "regularPay",
			headerName: "Regular Pay",
			type: "number",
			valueFormatter: (params) => {
				return formatMoney(params.value);
			},
			width: 110,
		},
		{
			field: "detailPay",
			headerName: "Detail Pay",
			type: "number",
			valueFormatter: (params) => {
				return formatMoney(params.value);
			},
			width: 110,
		},
		{
			field: "otPay",
			headerName: "Overtime Pay",
			type: "number",
			valueFormatter: (params) => {
				return formatMoney(params.value);
			},
			width: 110,
		},
		{
			field: "retroPay",
			headerName: "Retroactive Pay",
			type: "number",
			valueFormatter: (params) => {
				return formatMoney(params.value);
			},
			width: 125,
		},
		{
			field: "quinnPay",
			headerName: "Quinn Pay",
			type: "number",
			valueFormatter: (params) => {
				return formatMoney(params.value);
			},
			renderHeader: (params) => (
				<Tooltip title="Earnings from the Quinn Bill educational incentive program">
					<span className="font-semibold">Quinn Pay</span>
				</Tooltip>
			),
			width: 110,
		},
		{
			field: "injuredPay",
			headerName: "Injured Pay",
			type: "number",
			valueFormatter: (params) => {
				return formatMoney(params.value);
			},
			width: 110,
		},
		{
			field: "otherPay",
			headerName: "Other Pay",
			type: "number",
			valueFormatter: (params) => {
				return formatMoney(params.value);
			},
			width: 110,
		},
	];

	return cols;
};

const detail_record_columns = () => {
	const cols: GridColDef[] = [
		{
			field: "id",
			hideable: true,
			headerName: "ID",
			description: "An arbitrary unique identifier used for getting a specific row of data.",
			type: "number",
			valueFormatter: (params) => params.value,
			width: 100,
			filterable: false,
		},
		{
			field: "year",
			headerName: "Year",
			description: "The year that the detail work took place",
			type: "number",
			valueFormatter: (params) => params.value,
			width: 100,
			hideable: true,
			filterable: false,
		},
		{
			field: "trackingNo",
			headerName: "Tracking #",
			description: "Unique tracking number assigned to each detail or request.",
			type: "number",
			valueFormatter: (params) => params.value,
			width: 100,
		},
		{
			field: "customerNo",
			headerName: "Customer #",
			description: "Unique number assigned to the customer requesting the detail or service.",
			type: "number",
			valueFormatter: (params) => params.value,
			width: 100,
		},
		{
			field: "badgeNo",
			headerName: "Officer Badge #",
			description: "The badge number of an officer. Note that this is not necessarily unique.",
			type: "number",
			valueFormatter: (params) => params.value,
			width: 150,
		},
		{
			field: "streetNo",
			headerName: "Street #",
			description: "The address of the detail done.",
			type: "number",
			valueFormatter: (params) => params.value,
			width: 75,
		},
		{
			field: "street",
			headerName: "Street Name",
			description: "The name of the street where the detail was done.",
			type: "string",
			valueFormatter: (params) => params.value,
			width: 150,
		},
		{
			field: "xstreet",
			headerName: "Cross Street",
			description: "Name of the cross-street.",
			type: "string",
			valueFormatter: (params) => params.value,
			width: 170,
		},
		{
			field: "startDate",
			headerName: "Start Date",
			description: "The day that the detail work took place",
			type: "date",
			valueFormatter: formatDateShort,
			width: 100,
		},
		{
			field: "startTime",
			headerName: "Start Time",
			description: "The time of day it started",
			type: "string",
			valueFormatter: (params) => params.value,
			width: 100,
		},
		{
			field: "endTime",
			headerName: "End Time",
			description: "The time of day it ended",
			type: "string",
			valueFormatter: (params) => formatTime(params.value),
			width: 100,
		},
		{
			field: "hoursWorked",
			headerName: "Hours Worked",
			description: "Number of hours worked that day",
			type: "number",
			valueFormatter: (params) => formatHours(params.value),
			width: 110,
		},
		{
			field: "payHours",
			headerName: "Pay Hours",
			description: "Number of hours officer was paid for in detail from that job",
			type: "number",
			valueFormatter: (params) => params.value,
			width: 100,
		},
		{
			field: "payAmount",
			headerName: "Pay Amount",
			description: "The amount that officer was paid for this detail work",
			type: "number",
			valueFormatter: (params) => formatMoney(params.value),
			width: 110,
		},
		{
			field: "payRate",
			headerName: "Pay Rate",
			description: "The rate per hour that the officer was paid for this detail work",
			type: "number",
			valueFormatter: (params) => formatMoney(params.value),
			width: 90,
		},
		{
			field: "nameId",
			headerName: "Officer Name",
			description: "Full name of the employee.",
			type: "string",
			valueFormatter: (params) => params.value,
			width: 200,
		},
		{
			field: "districtWorked",
			headerName: "Work District",
			description: "Code or identifier for the district where the employee worked.",
			type: "number",
			valueFormatter: (params) => params.value,
			width: 100,
		},
		{
			field: "customerName",
			headerName: "Customer Name",
			description: "Name of the customer or entity requesting services.",
			type: "string",
			valueFormatter: (params) => params.value,
			width: 250,
		},
		{
			field: "sex",
			headerName: "Officer Sex",
			description: "The sex of the officer",
			type: "string",
			valueFormatter: (params) => params.value,
			align: "center",
			width: 100,
		},
		{
			field: "race",
			headerName: "Officer Race",
			description: "The race of the officer",
			type: "string",
			valueFormatter: (params) => params.value,
			align: "center",
			width: 100,
		},
		{
			field: "empRank",
			headerName: "Officer Rank",
			description: "The rank of the officer",
			type: "string",
			valueFormatter: (params) => params.value,
			align: "center",
			width: 100,
		},
		{
			field: "empOrgCode",
			headerName: "Officer Org Code",
			description: "5-digit code assigned to each organization within BPD",
			type: "string",
			valueFormatter: (params) => params.value,
			align: "center",
			width: 150,
		},
		{
			field: "payTrcCode",
			headerName: "Pay TRC Code",
			description: "Transaction code for payment processing.",
			type: "string",
			valueFormatter: (params) => params.value,
			align: "center",
			width: 130,
		},
		{
			field: "detailType",
			headerName: "Detail Type",
			description: "C is construction (traffic control + pedestrian safety). S is standard (security etc.)",
			type: "string",
			valueFormatter: (params) => params.value,
			align: "center",
			width: 100,
		},
		{
			field: "adminFeeFlag",
			headerName: "Admin Fee",
			description: "Rate for administrative fees (percentage or fixed amount).",
			type: "boolean",
			valueGetter: (params) => yAndNToBoolean(params.value),
			renderCell: (params) => {
				if (params.value === null) return "";
				return params.value ? <CheckIcon fontSize="small" htmlColor="#00000099" /> : <ClearIcon fontSize="small" htmlColor="#00000061" />;
			},
			width: 100,
		},
		{
			field: "noShowFlag",
			headerName: "No Show",
			description: "Flag indicating if the assigned officer failed to show up.",
			type: "boolean",
			valueGetter: (params) => yAndNToBoolean(params.value),
			renderCell: (params) => {
				if (params.value === null) return "";
				return params.value ? <CheckIcon fontSize="small" htmlColor="#00000099" /> : <ClearIcon fontSize="small" htmlColor="#00000061" />;
			},
			width: 100,
		},
		{
			field: "stateFunded",
			headerName: "State Funded",
			description: "Flag indicating if the detail is state-funded.",
			type: "string",
			valueGetter: (params) => yAndNToBoolean(params.value),
			renderCell: (params) => {
				if (params.value === null) return "";
				return params.value ? <CheckIcon fontSize="small" htmlColor="#00000099" /> : <ClearIcon fontSize="small" htmlColor="#00000061" />;
			},
			width: 120,
		},
	];
	return cols;
};

const court_overtime_columns = () => {
	const cols: GridColDef[] = [
		{
			field: "name",
			headerName: "Officer Name",
			description: "Name of officer",
			type: "string",
			valueGetter: (params) => {
				return fixNameOrdering(params.value);
			},
			width: 200,
		},
		{
			field: "rank",
			headerName: "Rank",
			description: "Rank of the officer (e.g., Detective, Sergeant, Patrol Officer).",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 75,
		},
		{
			field: "sex",
			headerName: "Sex",
			description: "Officer's sex",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 50,
		},
		{
			field: "otDate",
			headerName: "Date",
			description: "Date of the overtime detail.",
			type: "date",
			valueFormatter: formatDateShort,
			width: 100,
		},
		{
			field: "assignedDesc",
			headerName: "Assigned Description",
			description: "Description of the unit or department the officer is assigned to.",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 250,
		},
		{
			field: "chargedDesc",
			headerName: "Charged Description",
			description: "Description of the unit or department where overtime hours were charged.",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 250,
		},
		{
			field: "description",
			headerName: "Description",
			description: "General description of the overtime purpose or type.",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
		{
			field: "workedHours",
			headerName: "Hours Worked",
			description: "Total number of hours worked during the overtime detail.",
			type: "number",
			// valueFormatter: (params) => {
			// 	return formatHours(params.value);
			// },
			width: 125,
		},
		{
			field: "startTime",
			headerName: "Start Time",
			description: "Start time of the overtime detail.",
			type: "string",
			valueFormatter: (params) => {
				return formatTime(params.value);
			},
			width: 100,
		},
		{
			field: "endTime",
			headerName: "End Time",
			description: "End time of the overtime detail.",
			type: "string",
			valueFormatter: (params) => {
				return formatTime(params.value);
			},
			width: 100,
		},
		{
			field: "otCode",
			headerName: "Code",
			description: "Code representing the specific court-related overtime activity.",
			type: "number",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 50,
		},
	];
	return cols;
};

const officer_misconduct_columns = () => {
	let cols = officer_ia_columns();
	// let badge_num_col = {
	// 	field: "badgeNo",
	// 	headerName: "Officer Badge #",
	// 	description: "The badge number of an officer. Note that this is not necessarily unique.",
	// 	type: "number",
	// 	valueFormatter: (params) => params.value,
	// 	width: 150,
	// };

	// change width of ia num
	cols[1].width = 125;

	// change width of date received
	cols[2].width = 125;

	cols = [cols[0], cols[1], ...cols.slice(2)];

	return cols;
};

const fio_record_columns = () => {
	const cols: GridColDef[] = [
		{
			field: "fcNum",
			headerName: "Field Contact #",
			description: "Field Contact Number",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 150,
		},
		{
			field: "contactDate",
			headerName: "Contact Date",
			description: "Date on which the stop occurred",
			type: "date",
			valueFormatter: formatDate,
			width: 200,
		},
		{
			field: "contactOfficerName",
			headerName: "Contact Officer",
			description: "Officer's name",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
		{
			field: "supervisorName",
			headerName: "Supervisor Name",
			description: "Supervisor's name",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
		{
			field: "streetAddress",
			headerName: "Street Address",
			description: "The street address where the encounter happened",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 150,
		},
		{
			field: "city",
			headerName: "City",
			description: "City of location where stop occurred",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 100,
		},
		{
			field: "state",
			headerName: "State",
			description: "State of location where stop occurred",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 75,
		},
		{
			field: "zip",
			headerName: "Zip Code",
			description: "The zip code of where the stop happened",
			type: "string",
			valueFormatter: (params) => {
				return fixZipCode(params.value);
			},
			width: 75,
		},
		{
			field: "stopDuration",
			headerName: "Stop Duration",
			description: "Length of stop (time)",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
		{
			field: "circumstance",
			headerName: "Circumstance",
			description: "Basis for field contact (Encounter, Intel, Reasonable Suspicion, Probable Cause)",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 125,
		},
		{
			field: "basis",
			headerName: "Basis",
			description: "Circumstances of field contact (Observed, Encountered, Stopped)",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 125,
		},
		{
			field: "vehicleYear",
			headerName: "Vehicle Year",
			description: "Vehicle year",
			type: "number",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 125,
		},
		{
			field: "vehicleState",
			headerName: "Vehicle State",
			description: "Vehicle registration state",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 125,
		},
		{
			field: "vehicleModel",
			headerName: "Vehicle Model",
			description: "Vehicle model",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 125,
		},
		{
			field: "vehicleMake",
			headerName: "Vehicle Make",
			description: "Vehicle make",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 150,
		},
		{
			field: "vehicleColor",
			headerName: "Vehicle Color",
			description: "Vehicle color",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 100,
		},
		{
			field: "vehicleStyle",
			headerName: "Vehicle Style",
			description: "Passenger Car or pick up truck",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 150,
		},
		{
			field: "vehicleType",
			headerName: "Vehicle Type",
			description: "Type of Vehicle (Sedan, Compact Car, SUV, Utility Vehicle)",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 150,
		},
		{
			field: "vehicleSearched",
			headerName: "Vehicle Searched",
			description: "Indicates if a vehicle was searched",
			type: "boolean",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 150,
		},
		{
			field: "keySituations",
			headerName: "Key Situation",
			description: "What happened in the event and what was present",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
		{
			field: "narrative",
			headerName: "Narrative",
			description: "Reasons for Interrogation, Observation, Frisk, or Search",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
		{
			field: "frisked",
			headerName: "Frisked",
			description: "Whether or not an officer passes the hands over (someone) in a search for hidden weapons, drugs, or other items.",
			type: "boolean",
			valueFormatter: (params) => {
				return noNullStringToBool(params.value);
			},
			width: 100,
		},
		{
			field: "summonsIssued",
			headerName: "Summons Issued",
			description: "Indicates if a summons was issued",
			type: "boolean",
			valueFormatter: (params) => {
				return noNullStringToBool(params.value);
			},
			width: 150,
		},
		{
			field: "weather",
			headerName: "Weather",
			description: "The weather of the day",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 150,
		},
	];

	return cols;
};

export const functionMapping = {
	detail_record: detail_record_columns(),
	officer_ia: officer_ia_columns(),
	police_financial: police_financial_columns(),
	court_overtime: court_overtime_columns(),
	officer_misconduct: officer_misconduct_columns(),
	fio_record: fio_record_columns(),
};

// THE BELOW TABLE DEFINITIONS ARE DEPRECATED BUT **may be helpful** later

// export const functionMapping = {
// alpha_listing: alpha_listing_columns(),
// bpd_customer: bpd_customer_columns(),
// crime_incident: crime_incident_columns(),
// department: department_columns(),

// employee: employee_columns(),
// forfeiture_data: forfeiture_data_columns(),
// organization: organization_columns(),
// overtime_category: overtime_category_columns(),
// rank: rank_columns(),
// shooting_report: shooting_report_columns(),
// officer_misconduct: officer_misconduct_columns(),
// parking_ticket: parking_ticket_columns(),
// personnel_roaster: personnel_roaster_columns(),
// police_overtime: police_overtime_columns(),
// post_decertified: post_decertified_columns(),
// post_certified: post_certified_columns(),
// fio_record: fio_record_columns(),
// };

// const alpha_listing_columns = () => {
// 	const cols: GridColDef[] = [
// 		{
// 			field: "id",
// 			hideable: false,
// 			headerName: "ID",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 100,
// 		},
// 		{
// 			field: "is_active",
// 			headerName: "Is Active",
// 			type: "boolean",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			flex: 1,
// 		},
// 	];
// 	return cols;
// };
// const crime_incident_columns = () => {
// 	const cols: GridColDef[] = [
// 		{
// 			field: "id",
// 			hideable: false,
// 			headerName: "ID",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 100,
// 		},
// 		{
// 			field: "incident_no",
// 			headerName: "Incident #",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "offense_code",
// 			headerName: "Offense Code",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "offense_code_group",
// 			headerName: "Offense Code Group",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "offense_desc",
// 			headerName: "Offense Description",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "offense_desc_detailed",
// 			headerName: "Offense Description Detailed",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 300,
// 		},
// 		{
// 			field: "incident_district",
// 			headerName: "Incident District",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "reporting_area",
// 			headerName: "Reporting Area",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "shooting",
// 			headerName: "Shooting",
// 			type: "boolean",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 			align: "center",
// 		},
// 		{
// 			field: "incident_date",
// 			headerName: "Incident Date",
// 			type: "date",
// 			valueFormatter: formatDateShort,
// 			width: 200,
// 		},
// 		{
// 			field: "day_of_week",
// 			headerName: "Day of Week",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "hour",
// 			headerName: "Hour",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 100,
// 		},
// 		{
// 			field: "ucr_part",
// 			headerName: "UCR Part",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 			align: "center",
// 		},
// 		{
// 			field: "street_name",
// 			headerName: "Street Name",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "latitude",
// 			headerName: "Latitude",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "longitude",
// 			headerName: "Longitude",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 	];
// 	return cols;
// };


// const parking_ticket_columns = () => {
// 	const cols: GridColDef[] = [
// 		{
// 			field: "id",
// 			hideable: false,
// 			headerName: "ID",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 100,
// 		},
// 		{
// 			field: "tracking_no",
// 			headerName: "Tracking #",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			align: "center",
// 			headerAlign: "center",
// 			flex: 1,
// 		},
// 	];

// 	return cols;
// };
// const personnel_roaster_columns = () => {
// 	const cols: GridColDef[] = [
// 		{
// 			field: "id",
// 			hideable: false,
// 			headerName: "ID",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 100,
// 		},
// 		{
// 			field: "employee_record",
// 			headerName: "Employee Record",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "eff_date",
// 			headerName: "Effective Date",
// 			type: "date",
// 			valueFormatter: formatDate,
// 			width: 200,
// 		},
// 		{
// 			field: "start_date",
// 			headerName: "Start Date",
// 			type: "date",
// 			valueFormatter: formatDate,
// 			width: 200,
// 		},
// 		{
// 			field: "prof_exp_date",
// 			headerName: "Professional Experience Date",
// 			type: "date",
// 			valueFormatter: formatDate,
// 			width: 300,
// 		},
// 		{
// 			field: "rehire_date",
// 			headerName: "Rehire Date",
// 			type: "date",
// 			valueFormatter: formatDate,
// 			width: 200,
// 		},
// 		{
// 			field: "service_date",
// 			headerName: "Service Date",
// 			type: "date",
// 			valueFormatter: formatDateShort,
// 			width: 200,
// 		},
// 		{
// 			field: "return_date",
// 			headerName: "Return Date",
// 			type: "date",
// 			valueFormatter: formatDateShort,
// 			width: 200,
// 		},
// 		{
// 			field: "reports_to",
// 			headerName: "Reports To",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "job_code",
// 			headerName: "Job Code",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "position",
// 			headerName: "Position",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "pay_status",
// 			headerName: "Pay Status",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "action",
// 			headerName: "Action",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "action_date",
// 			headerName: "Action Date",
// 			type: "date",
// 			valueFormatter: formatDate,
// 			width: 200,
// 		},
// 		{
// 			field: "reason",
// 			headerName: "Reason",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "location",
// 			headerName: "Location",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "is_regular",
// 			headerName: "Is Regular",
// 			type: "boolean",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "is_full",
// 			headerName: "Is Full",
// 			type: "boolean",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "officer_cd",
// 			headerName: "Officer Code",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "payroll_pay_group",
// 			headerName: "Payroll Pay Group",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "absence_pay_group",
// 			headerName: "Absence Pay Group",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "type",
// 			headerName: "Type",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 100,
// 		},
// 		{
// 			field: "standard_hours_weekly",
// 			headerName: "Standard Hours Weekly",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 250,
// 		},
// 		{
// 			field: "eeo_class",
// 			headerName: "EEO Class",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "sal_plan",
// 			headerName: "Salary Plan",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "grade_no",
// 			headerName: "Grade #",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "grade_date",
// 			headerName: "Grade Date",
// 			type: "date",
// 			valueFormatter: formatDateShort,
// 			width: 200,
// 		},
// 		{
// 			field: "step_no",
// 			headerName: "Step #",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "step_date",
// 			headerName: "Step Date",
// 			type: "date",
// 			valueFormatter: formatDateShort,
// 			width: 200,
// 		},
// 		{
// 			field: "comp_freq",
// 			headerName: "Comp Freq",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "comp_rate",
// 			headerName: "Comp Rate",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "change_amt",
// 			headerName: "Change Amount",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "pct",
// 			headerName: "PCT",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 100,
// 		},
// 		{
// 			field: "annual_rate",
// 			headerName: "Annual Rate",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "monthly_rate",
// 			headerName: "Monthly Rate",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "hourly_rate",
// 			headerName: "Hourly Rate",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 	];

// 	return cols;
// };

// const police_overtime_columns = () => {
// 	const cols: GridColDef[] = [
// 		{
// 			field: "id",
// 			hideable: false,
// 			headerName: "ID",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 100,
// 		},
// 		{
// 			field: "full_name",
// 			headerName: "Full Name",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "last_name",
// 			headerName: "Last Name",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "first_name",
// 			headerName: "First Name",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "middle_initial",
// 			headerName: "Middle Initial",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "rank_title_abbrev",
// 			headerName: "Rank Title Abbreviation",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 250,
// 		},
// 		{
// 			field: "assigned_code",
// 			headerName: "Assigned Code",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "assigned_desc",
// 			headerName: "Assigned Description",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 250,
// 		},
// 		{
// 			field: "charged_code",
// 			headerName: "Charged Code",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "charged_desc",
// 			headerName: "Charged Description",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "ot_date",
// 			headerName: "OT Date",
// 			type: "date",
// 			valueFormatter: formatDateShort,
// 			width: 200,
// 		},
// 		{
// 			field: "ot_code",
// 			headerName: "OT Code",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "ot_desc",
// 			headerName: "OT Description",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "ot_start_time",
// 			headerName: "OT Start Time",
// 			type: "date",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "ot_start",
// 			headerName: "OT Start",
// 			type: "date",
// 			valueFormatter: formatDateShort,
// 			width: 200,
// 		},
// 		{
// 			field: "ot_end_time",
// 			headerName: "OT End Time",
// 			type: "date",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "ot_end",
// 			headerName: "OT End",
// 			type: "date",
// 			valueFormatter: formatDateShort,
// 			width: 200,
// 		},
// 		{
// 			field: "hours_worked",
// 			headerName: "Hours Worked",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "ot_hours",
// 			headerName: "OT Hours",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "overtime_category_id",
// 			headerName: "Overtime Category ID",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 250,
// 		},
// 	];

// 	return cols;
// };
// const post_certified_columns = () => {
// 	const cols: GridColDef[] = [
// 		{
// 			field: "id",
// 			hideable: false,
// 			headerName: "ID",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 100,
// 		},
// 		{
// 			field: "rank_id",
// 			headerName: "Rank ID",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "police_dept_id",
// 			headerName: "Police Dept ID",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "certified_no",
// 			headerName: "Certified #",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "certified_outcome",
// 			headerName: "Certified Outcome",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			flex: 1,
// 		},
// 		{
// 			field: "certified_expiration_date",
// 			headerName: "Certified Expiration Date",
// 			type: "date",
// 			valueFormatter: formatDateShort,
// 			flex: 1,
// 		},
// 	];

// 	return cols;
// };
// const post_decertified_columns = () => {
// 	const cols: GridColDef[] = [
// 		{
// 			field: "id",
// 			hideable: false,
// 			headerName: "ID",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 100,
// 		},
// 		{
// 			field: "rank_id",
// 			headerName: "Rank ID",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			flex: 1,
// 		},
// 		{
// 			field: "police_dept_id",
// 			headerName: "Police Dept ID",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			flex: 1,
// 		},
// 	];

// 	return cols;
// };

// const bpd_customer_columns = () => {
// 	const cols: GridColDef[] = [
// 		{
// 			field: "id",
// 			hideable: false,
// 			headerName: "Customer ID",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "customer_no",
// 			headerName: "Customer No.",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "customer_seq",
// 			headerName: "Customer Seq",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "bpd_customer_no",
// 			headerName: "BPD Customer No.",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "customer_name",
// 			headerName: "Customer Name",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "customer_address1",
// 			headerName: "Customer Address 1",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 250,
// 		},
// 		{
// 			field: "customer_address2",
// 			headerName: "Customer Address 2",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 250,
// 		},
// 		{
// 			field: "customer_address3",
// 			headerName: "Customer Address 3",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 250,
// 		},
// 		{
// 			field: "customer_city",
// 			headerName: "Customer City",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "customer_state",
// 			headerName: "Customer State",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "customer_zip",
// 			headerName: "Customer Zip",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "customer_taxpayer_id",
// 			headerName: "Customer Taxpayer ID",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 250,
// 		},
// 	];
// 	return cols;
// };
// const department_columns = () => {
// 	const cols: GridColDef[] = [
// 		{
// 			field: "id",
// 			hideable: false,
// 			headerName: "Department ID",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "police_dept_name",
// 			headerName: "Police Department Name",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 300,
// 		},
// 		{
// 			field: "city_dept_name",
// 			headerName: "City Department Name",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 300,
// 		},
// 	];
// 	return cols;
// };
// const employee_columns = () => {
// 	const cols: GridColDef[] = [
// 		{
// 			field: "id",
// 			hideable: false,
// 			headerName: "Employee ID",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "employee_no",
// 			headerName: "Employee No.",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "dept_id",
// 			headerName: "Department ID",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 250,
// 		},
// 		{
// 			field: "full_name",
// 			headerName: "Full Name",
// 			type: "string",
// 			valueGetter: (params) => {
// 				const { first_name, last_name, name_mid, name_prefix, name_suffix } = params.row;
// 				let name = "";
// 				if (name_prefix) name += name_prefix + " ";
// 				if (first_name) name += first_name + " ";
// 				if (name_mid) name += name_mid + " ";
// 				if (last_name) name += last_name + " ";
// 				if (name_suffix) name += name_suffix + " ";
// 				return name;
// 			},
// 			width: 250,
// 		},
// 		{
// 			field: "sex",
// 			headerName: "Sex",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 100,
// 		},
// 		{
// 			field: "ethnicity",
// 			headerName: "Ethnicity",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		// Subject to change?
// 		//
// 		// {
// 		// 	field: "officer_photo",
// 		// 	headerName: "Officer Photo",
// 		// 	type: "string",
// 		// 	valueFormatter: (params) => {
// 		// 		return params.value;
// 		// 	},
// 		// 	width: 200,
// 		// },
// 		{
// 			field: "postal_code",
// 			headerName: "Postal Code",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "badge_no",
// 			headerName: "Badge No.",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "rank_id",
// 			headerName: "Rank ID",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "rank_as_of",
// 			headerName: "Rank As Of",
// 			type: "date",
// 			valueFormatter: formatDate,
// 			width: 150,
// 		},
// 		{
// 			field: "org_id",
// 			headerName: "Org ID",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 100,
// 		},
// 		{
// 			field: "district_worked",
// 			headerName: "District Worked",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "union_code",
// 			headerName: "Union Code",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 	];
// 	return cols;
// };
// const forfeiture_data_columns = () => {
// 	const cols: GridColDef[] = [
// 		{
// 			field: "id",
// 			hideable: false,
// 			headerName: "Forfeiture Data ID",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "url",
// 			headerName: "URL",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "case_number",
// 			headerName: "Case Number",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "court_name",
// 			headerName: "Court Name",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "date",
// 			headerName: "Date",
// 			type: "date",
// 			valueFormatter: formatDate,
// 			width: 200,
// 		},
// 		{
// 			field: "amount",
// 			headerName: "Amount",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "motor_vehicle",
// 			headerName: "Motor Vehicle",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "case_incident",
// 			headerName: "Case Incident",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 	];

// 	return cols;
// };
// const organization_columns = () => {
// 	const cols: GridColDef[] = [
// 		{
// 			field: "id",
// 			hideable: false,
// 			headerName: "Organization ID",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "org_code",
// 			headerName: "Organization Code",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "org_desc",
// 			headerName: "Organization Description",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 250,
// 		},
// 	];

// 	return cols;
// };
// const overtime_category_columns = () => {
// 	const cols: GridColDef[] = [
// 		{
// 			field: "id",
// 			hideable: false,
// 			headerName: "Overtime Category ID",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "ot_category",
// 			headerName: "Overtime Category",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "ot_category_code",
// 			headerName: "Overtime Category Code",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 	];

// 	return cols;
// };
// const rank_columns = () => {
// 	const cols: GridColDef[] = [
// 		{
// 			field: "id",
// 			hideable: false,
// 			headerName: "Rank ID",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 100,
// 		},
// 		{
// 			field: "rank_id_no",
// 			headerName: "Rank ID No.",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "rank_title_full",
// 			headerName: "Rank Title Full",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "rank_title_abbrev",
// 			headerName: "Rank Title Abbreviation",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 250,
// 		},
// 		{
// 			field: "rank_name",
// 			headerName: "Rank Name",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "rank_abbr",
// 			headerName: "Rank Abbreviation",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 	];

// 	return cols;
// };
// const shooting_report_columns = () => {
// 	const cols: GridColDef[] = [
// 		{
// 			field: "id",
// 			hideable: false,
// 			headerName: "Shooting Report ID",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "incident_no",
// 			headerName: "Incident #",
// 			type: "number",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "shooting_date",
// 			headerName: "Shooting Date",
// 			type: "date",
// 			valueFormatter: formatDate,
// 			width: 200,
// 		},
// 		{
// 			field: "shooting_district",
// 			headerName: "Shooting District",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 200,
// 		},
// 		{
// 			field: "shooting_type_v2",
// 			headerName: "Shooting Type V2",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 250,
// 		},
// 		{
// 			field: "victim_gender",
// 			headerName: "Victim Gender",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "victim_race",
// 			headerName: "Victim Race",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 		{
// 			field: "victim_ethnicity_nibrs",
// 			headerName: "Victim Ethnicity NIBRS",
// 			type: "string",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 250,
// 		},
// 		{
// 			field: "is_multi_victim",
// 			headerName: "Multiple Victims",
// 			type: "boolean",
// 			valueFormatter: (params) => {
// 				return params.value;
// 			},
// 			width: 150,
// 		},
// 	];
// 	return cols;
// };
