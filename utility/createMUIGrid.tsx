import React from "react";
import Link from "next/link";
import { GridColDef } from "@mui/x-data-grid";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import { Tooltip } from "@mui/material";

import DataTable from "@components/DataTable";
import { 
	formatDateShort, 
	formatDate, 
	formatHours, 
	formatMoney, 
	formatTime, 
	yAndNToBoolean, 
	fixNameOrdering, 
	noNullStringToBool, 
	fixZipCode 
} from "./textFormatHelpers";
import { bpi_light_green } from "@styles/theme/lightTheme";

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
			renderCell: (params) => {
				return (
					<Link
						href={{
							pathname: "/ia/[iaNumber]",
							query: { iaNumber: params.value },
						}}
						style={{ color: bpi_light_green, textDecoration: "none" }}
					>
						{params.value}
					</Link>
				);
			},
			width: 250,
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
			renderCell: (params) => {
				const firstName = params.row.firstName || "";
				const lastName = params.row.lastName || "";
				const officerName = `${firstName} ${lastName}`.trim();
				if (!params.row.bpiId) {
					return officerName;
				}
				return (
					<Link
						href={{
							pathname: "/profile/[bpiId]",
							query: { bpiId: params.row.bpiId },
						}}
						style={{ color: bpi_light_green, textDecoration: "none" }}
						onClick={(e) => {
							e.stopPropagation();
						}}
					>
						{officerName}
					</Link>
				);
			},
			width: 200,
		},
		{
			field: "badgeNo",
			headerName: "Officer Badge",
			description: "The badge number of an officer. Note that this is not necessarily unique.",
			type: "number",
			valueFormatter: (params) => params.value,
			width: 150,
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
			field: "daysHoursSuspended",
			headerName: "Days/Hours Suspended",
			description: "The number of days or hours the officer was suspended as a result of the disciplinary action.",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
		// Hidden columns (can be shown via column visibility menu)
		{
			field: "disposition",
			headerName: "Disposition",
			description: "The final status of the case, including whether it was closed, pending, or referred to another agency.",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
			hideable: true,
		},
		{
			field: "occuredDate",
			headerName: "Date Occurred",
			description: "The actual date on which the incident occurred.",
			type: "date",
			valueFormatter: formatDateShort,
			width: 200,
			hideable: true,
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
			hideable: true,
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
			hideable: true,
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
			hideable: true,
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
			hideable: true,
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
			hideable: true,
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
			valueGetter: (params) => {
				return fixNameOrdering(params.value);
			},
			renderCell: (params) => {
				if (!params.row.bpiId) {
					return fixNameOrdering(params.row.nameId);
				}
				return (
					<Link
						href={{
							pathname: "/profile/[bpiId]",
							query: { bpiId: params.row.bpiId },
						}}
						style={{ color: bpi_light_green, textDecoration: "none" }}
					>
						{fixNameOrdering(params.row.nameId)}
					</Link>
				);
			},
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
			renderCell: (params) => {
				if (!params.row.bpiId) {
					return fixNameOrdering(params.row.name);
				}
				return (
					<Link
						href={{
							pathname: "/profile/[bpiId]",
							query: { bpiId: params.row.bpiId },
						}}
						style={{ color: bpi_light_green, textDecoration: "none" }}
					>
						{fixNameOrdering(params.row.name)}
					</Link>
				);
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
			valueGetter: (params) => {
				return fixNameOrdering(params.value);
			},
			renderCell: (params) => {
				if (!params.row.bpiId) {
					return fixNameOrdering(params.row.contactOfficerName);
				}
				return (
					<Link
						href={{
							pathname: "/profile/[bpiId]",
							query: { bpiId: params.row.bpiId },
						}}
						style={{ color: bpi_light_green, textDecoration: "none" }}
					>
						{fixNameOrdering(params.row.contactOfficerName)}
					</Link>
				);
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

const boston_arrest_columns = () => {
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
			field: "arrestNum",
			headerName: "Arrest Number",
			description: "Unique identifier for the arrest record",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 150,
		},
		{
			field: "objectid",
			headerName: "Object ID",
			description: "Object identifier for the arrest record",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 150,
		},
		{
			field: "incNum",
			headerName: "Incident Number",
			description: "Incident number associated with the arrest",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 150,
		},
		{
			field: "chargeCode",
			headerName: "Charge Code",
			description: "Legal code for the charge",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 120,
		},
		{
			field: "chargeDesc",
			headerName: "Charge Description",
			description: "Description of the criminal charge",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 250,
		},
		{
			field: "arrDate",
			headerName: "Arrest Date",
			description: "Date when the arrest occurred",
			type: "date",
			valueFormatter: formatDateShort,
			width: 150,
		},
		{
			field: "genderDesc",
			headerName: "Gender",
			description: "Gender of the arrested individual",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 100,
		},
		{
			field: "raceDesc",
			headerName: "Race",
			description: "Race of the arrested individual",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 120,
		},
		{
			field: "ethnicityDesc",
			headerName: "Ethnicity",
			description: "Ethnicity of the arrested individual",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 150,
		},
		{
			field: "age",
			headerName: "Age",
			description: "Age of the arrested individual at time of arrest",
			type: "number",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 80,
		},
		{
			field: "juvenile",
			headerName: "Juvenile",
			description: "Whether the arrested individual was a juvenile",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 100,
		},
		{
			field: "hourOfDay",
			headerName: "Hour",
			description: "Hour of day when arrest occurred (0-23)",
			type: "number",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 80,
		},
		{
			field: "dayOfWeek",
			headerName: "Day of Week",
			description: "Day of week when arrest occurred",
			type: "number",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 120,
		},
		{
			field: "year",
			headerName: "Year",
			description: "Year when arrest occurred",
			type: "number",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 80,
		},
		{
			field: "quarter",
			headerName: "Quarter",
			description: "Quarter of year when arrest occurred",
			type: "number",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 90,
		},
		{
			field: "month",
			headerName: "Month",
			description: "Month when arrest occurred",
			type: "number",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 80,
		},
		{
			field: "neighborhood",
			headerName: "Neighborhood",
			description: "Neighborhood where arrest occurred",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 150,
		},
		{
			field: "district",
			headerName: "District",
			description: "Police district where arrest occurred",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 100,
		},
		{
			field: "nibrsCode",
			headerName: "NIBRS Code",
			description: "National Incident-Based Reporting System code",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 120,
		},
		{
			field: "nibrsDesc",
			headerName: "NIBRS Description",
			description: "Description of the NIBRS offense category",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
		{
			field: "chargeSeqNum",
			headerName: "Charge Sequence",
			description: "Sequence number for multiple charges in same arrest",
			type: "number",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 140,
		},
	];

	return cols;
};

const crime_incident_columns = () => {
	const cleanYamlString = (str: string | null) => {
		if (!str) return '';
		return str.replace(/---\\n- /g, '').replace(/\\n/g, '').trim();
	};

	const cols: GridColDef[] = [
		{
			field: "incidentNumber",
			headerName: "Key",
			description: "Unique identifier for the incident",
			type: "number",
			valueFormatter: (params) => params.value || '',
			width: 120,
		},
		{
			field: "offenses",
			headerName: "Offensive Description",
			description: "Description of the offenses involved in the incident",
			type: "string",
			valueFormatter: (params) => {
				if (!params.value) return '';
				return params.value.replace(/---\\n- /g, '').replace(/\\n/g, '');
			},
			width: 200,
		},
		{
			field: "district",
			headerName: "District",
			description: "Police district where the incident occurred",
			type: "string",
			valueGetter: (params) => {
				if (params.row.district) return params.row.district;
				const bagOfText = params.row.bagOfText;
				if (bagOfText) {
					const match = bagOfText.match(/DISTRICT\s*([A-Z0-9-]+)/i);
					if (match) return match[1];
				}
				return '';
			},
			width: 100,
		},
		{
			field: "street",
			headerName: "Street",
			description: "Street where the incident occurred",
			type: "string",
			valueFormatter: (params) => params.value || '',
			width: 200,
		},
		{
			field: "occurredOnDate",
			headerName: "Date",
			description: "The date when the incident occurred",
			type: "date",
			valueFormatter: formatDateShort,
			width: 150,
		},
		{
			field: "officerJournalName",
			headerName: "Officer Name",
			description: "Name of the officer from the journal",
			type: "string",
			valueFormatter: (params) => {
				if (!params.value) return '';
				const parts = params.value.split(' ');
				return parts.slice(1).join(' '); // Remove the first part (number) and join the rest
			},
			width: 200,
		},
		{
			field: "officerId",
			headerName: "Officer ID",
			description: "Unique identifier for the officer involved",
			type: "string",
			valueFormatter: (params) => params.value || '',
			width: 120,
		},
		{
			field: "natureOfIncident",
			headerName: "Nature of Incident",
			description: "Description of the type of incident",
			type: "string",
			valueGetter: (params) => {
				const nature = cleanYamlString(params.value);
				if (!nature && params.row.bagOfText) {
					const match = params.row.bagOfText.match(/\d+\s+.*?\s+(.*?)(?=\s+\d{6}|\s+[A-Z]+\s+[A-Z]+\s+|$)/);
					if (match) return match[1].trim();
				}
				return nature;
			},
			width: 200,
		},
		{
			field: "latitude",
			headerName: "Latitude",
			description: "Latitude coordinate of the incident location",
			type: "number",
			valueFormatter: (params) => params.value || '',
			width: 120,
		},
		{
			field: "longitude",
			headerName: "Longitude",
			description: "Longitude coordinate of the incident location",
			type: "number",
			valueFormatter: (params) => params.value || '',
			width: 120,
		},
		{
			field: "numberOfOffenders",
			headerName: "# of Offenders",
			description: "Number of offenders involved in the incident",
			type: "number",
			valueFormatter: (params) => params.value || '',
			width: 120,
		},
		{
			field: "numberOfVictims",
			headerName: "# of Victims",
			description: "Number of victims involved in the incident",
			type: "number",
			valueFormatter: (params) => params.value || '',
			width: 120,
		},
		{
			field: "numberOfArrestees",
			headerName: "# of Arrests",
			description: "Number of people arrested in relation to the incident",
			type: "number",
			valueFormatter: (params) => params.value || '',
			width: 120,
		},
		{
			field: "shooting",
			headerName: "Shooting Involved",
			description: "Whether the incident involved a shooting",
			type: "boolean",
			valueFormatter: (params) => params.value === null ? '' : params.value ? 'Yes' : 'No',
			width: 140,
		},
		{
			field: "locationOfOccurrence",
			headerName: "Location",
			description: "Description of where the incident occurred",
			type: "string",
			valueGetter: (params) => {
				const loc = cleanYamlString(params.value);
				if (!loc && params.row.bagOfText) {
					const parts = params.row.bagOfText.split(' ');
					if (parts.length >= 2) {
						return `${parts[1]} ${parts[2]}`; 
					}
				}
				return loc;
			},
			width: 200,
		},
		{
			field: "locationType",
			headerName: "Location Type",
			description: "Type of location where the incident occurred (e.g., street, residence, business)",
			type: "string",
			valueFormatter: (params) => params.value || '',
			width: 150,
		},
		{
			field: "reportDate",
			headerName: "Reported Date",
			description: "The date when the incident was reported",
			type: "date",
			valueFormatter: formatDateShort,
			width: 150,
		},
	];
	return cols;
};

const employee_columns = () => {
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
			field: "employeeId",
			headerName: "Employee ID",
			description: "The unique employee identifier",
			type: "number",
			width: 150,
		},
		{
			field: "officerName",
			headerName: "Officer Name",
			description: "The full name of the employee",
			valueGetter: (params) => {
				const firstName = params.row.firstName || "";
				const lastName = params.row.lastName || "";
				return `${firstName} ${lastName}`.trim();
			},
			renderCell: (params) => {
				const firstName = params.row.firstName || "";
				const lastName = params.row.lastName || "";
				const officerName = `${firstName} ${lastName}`.trim();
				if (!params.row.bpiId) {
					return officerName;
				}
				return (
					<Link
						href={{
							pathname: "/profile/[bpiId]",
							query: { bpiId: params.row.bpiId },
						}}
						style={{ color: bpi_light_green, textDecoration: "none" }}
						onClick={(e) => {
							e.stopPropagation();
						}}
					>
						{officerName}
					</Link>
				);
			},
			width: 200,
		},
		{
			field: "lastName",
			headerName: "Last Name",
			description: "The last name of the employee",
			type: "string",
			width: 150,
		},
		{
			field: "firstName",
			headerName: "First Name",
			description: "The first name of the employee",
			type: "string",
			width: 150,
		},
		{
			field: "jobTitle",
			headerName: "Job Title",
			description: "The job title or position of the employee",
			type: "string",
			width: 200,
		},
		{
			field: "salPlan",
			headerName: "Salary Plan",
			description: "The salary plan classification",
			type: "string",
			width: 150,
		},
		{
			field: "nameId",
			headerName: "Name ID",
			description: "The formatted name identifier",
			type: "string",
			hideable: true,
			width: 200,
		},
		{
			field: "bpiId",
			headerName: "BPI ID",
			description: "The Boston Police Index unique identifier",
			type: "string",
			hideable: true,
			width: 250,
		},
	];
	return cols;
};

const traffic_stop_columns = () => {
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
			field: "officerId",
			headerName: "Officer ID",
			description: "Officer identification number",
			type: "number",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 120,
		},
		{
			field: "eventDate",
			headerName: "Event Date",
			description: "Date when the traffic stop occurred",
			type: "date",
			valueFormatter: formatDateShort,
			width: 150,
		},
		{
			field: "timeHh",
			headerName: "Hour",
			description: "Hour of the traffic stop",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 80,
		},
		{
			field: "timeMm",
			headerName: "Minute",
			description: "Minute of the traffic stop",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 80,
		},
		{
			field: "amPm",
			headerName: "AM/PM",
			description: "Time of day (AM or PM)",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 100,
		},
		{
			field: "violatorType",
			headerName: "Violator Type",
			description: "Type of violator (e.g., OPERATOR, PEDESTRIAN)",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 150,
		},
		{
			field: "citationNumber",
			headerName: "Citation Number",
			description: "Unique citation number issued for the traffic stop",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 150,
		},
		{
			field: "citationType",
			headerName: "Citation Type",
			description: "Type of citation issued (e.g., WARN, CITATION)",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 150,
		},
		{
			field: "offenseCode",
			headerName: "Offense Code",
			description: "Code for the traffic offense",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 120,
		},
		{
			field: "offenseDescription",
			headerName: "Offense Description",
			description: "Description of the traffic offense",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 300,
		},
		{
			field: "locationName",
			headerName: "Location",
			description: "Location where the traffic stop occurred",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
		{
			field: "race",
			headerName: "Race",
			description: "Race of the individual stopped",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 120,
		},
		{
			field: "gender",
			headerName: "Gender",
			description: "Gender of the individual stopped",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 100,
		},
		{
			field: "yearOfBirth",
			headerName: "Year of Birth",
			description: "Birth year of the individual stopped",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 130,
		},
		{
			field: "searched",
			headerName: "Searched",
			description: "Whether a search was conducted during the stop (Y/N)",
			type: "boolean",
			valueFormatter: (params) => {
				return yAndNToBoolean(params.value);
			},
			width: 100,
		},
		{
			field: "crash",
			headerName: "Crash",
			description: "Whether a crash was involved in the traffic stop (Y/N)",
			type: "boolean",
			valueFormatter: (params) => {
				return yAndNToBoolean(params.value);
			},
			width: 100,
		},
	];

	return cols;
};

const ir_fall_2025_columns = () => {
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
			field: "officerName",
			headerName: "Officer Name",
			description: "Name of the reporting officer",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
		{
			field: "badgeNo",
			headerName: "Badge Number",
			description: "Badge number of the reporting officer",
			type: "number",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 150,
		},
		{
			field: "reportingOfficer",
			headerName: "Reporting Officer",
			description: "Full name and badge number of the reporting officer",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 250,
		},
		{
			field: "allAssistingOfficersAndAssistTypes",
			headerName: "Assisting Officers",
			description: "All assisting officers and their assistance types",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 400,
		},
		{
			field: "weaponForceInvolved",
			headerName: "Weapon/Force Involved",
			description: "Information about weapons or force involved in the incident",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
		{
			field: "shooting",
			headerName: "Shooting",
			description: "Whether a shooting was involved in the incident",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 120,
		},
		{
			field: "eventLocationStreetAddress",
			headerName: "Event Street Address",
			description: "Street address where the event occurred",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 250,
		},
		{
			field: "eventLocationCrossStreet1",
			headerName: "Event Cross Street 1",
			description: "First cross street for the event location",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
		{
			field: "eventLocationCrossStreet2",
			headerName: "Event Cross Street 2",
			description: "Second cross street for the event location",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
		{
			field: "eventLocationNeighborhood",
			headerName: "Event Neighborhood",
			description: "Neighborhood where the event occurred",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
		{
			field: "offenseLocationCrossStreet1",
			headerName: "Offense Cross Street 1",
			description: "First cross street for the offense location",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
		{
			field: "offenseLocationCrossStreet2",
			headerName: "Offense Cross Street 2",
			description: "Second cross street for the offense location",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
		{
			field: "offenseLocationLat",
			headerName: "Offense Latitude",
			description: "Latitude coordinate of the offense location",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 150,
		},
		{
			field: "offenseLocationLong",
			headerName: "Offense Longitude",
			description: "Longitude coordinate of the offense location",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 150,
		},
		{
			field: "offenseLocationNeighborhood",
			headerName: "Offense Neighborhood",
			description: "Neighborhood where the offense occurred",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
		{
			field: "date",
			headerName: "Date",
			description: "Date when the incident occurred",
			type: "date",
			valueFormatter: formatDateShort,
			width: 150,
		},
		{
			field: "time",
			headerName: "Time",
			description: "Time when the incident occurred",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 120,
		},
		{
			field: "eventDistrict",
			headerName: "Event District",
			description: "Police district where the event occurred",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 150,
		},
		{
			field: "eventNeighborhood",
			headerName: "Event Neighborhood",
			description: "Neighborhood classification for the event",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 200,
		},
		{
			field: "suspectCount",
			headerName: "Suspect Count",
			description: "Number of suspects involved in the incident",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 130,
		},
		{
			field: "totalCharges",
			headerName: "Total Charges",
			description: "Total number of charges filed",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 130,
		},
		{
			field: "chargeI",
			headerName: "Charge I",
			description: "First charge filed",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 300,
		},
		{
			field: "chargeIi",
			headerName: "Charge II",
			description: "Second charge filed",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 300,
		},
		{
			field: "chargeIii",
			headerName: "Charge III",
			description: "Third charge filed",
			type: "string",
			valueFormatter: (params) => {
				return params.value;
			},
			width: 300,
		},
	];

	return cols;
};

export const functionMapping = {
	detail_record: detail_record_columns(),
	crime_incident: crime_incident_columns(), // Using actual crime incident columns now
	officer_ia: officer_ia_columns(),
	police_financial: police_financial_columns(),
	court_overtime: court_overtime_columns(),
	officer_misconduct: officer_misconduct_columns(),
	fio_record: fio_record_columns(),
	boston_arrest: boston_arrest_columns(),
	employee: employee_columns(),
	traffic_stop: traffic_stop_columns(),
	ir_fall_2025: ir_fall_2025_columns(),
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
