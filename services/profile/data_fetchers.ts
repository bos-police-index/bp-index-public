import apolloClient from "@lib/apollo-client";
import { INDIVIDUAL_OFFICER_FINANCIAL_AND_EMPLOYEE } from "@lib/graphql/queries";
import { officer_financial_alias_name } from "@utility/dataViewAliases";

/*
Function that fetches the financial data by BPI ID for a specific officer
*/
export async function getIndividualOfficerFinancial(bpiId: string) {
	const financial_and_employee_query = INDIVIDUAL_OFFICER_FINANCIAL_AND_EMPLOYEE(bpiId);

	let financialAndEmployeeResponse: any;
	try {
		financialAndEmployeeResponse = await apolloClient.query({ query: financial_and_employee_query });
	} catch (error) {
		console.error("GraphQL query error:", error);
		return [];
	}

	return financialAndEmployeeResponse?.data?.[officer_financial_alias_name]?.nodes ?? [];
}

const EMPTY_FINANCIAL: FinancialEmployeeData = {
	org: "",
	badgeNo: 0,
	numOfIa: 0,
	rank: "",
	race: "",
	sex: "",
	unit: "",
	unionCode: "",
	zipCode: "",
	firstName: "",
	lastName: "",
	otPay: 0,
	otherPay: 0,
	quinnPay: 0,
	regularPay: 0,
	retroPay: 0,
	totalPay: 0,
	detailPay: 0,
	injuredPay: 0,
	year: 0,
	totalPayPercentile: 0,
};

export function getMostRecentOfficerFinancialData(data) {
	if (!Array.isArray(data) || data.length === 0) {
		return { ...EMPTY_FINANCIAL };
	}
	let mostRecentEmployeeData = data[0];
	data.slice(0).map((node: any) => {
		if (mostRecentEmployeeData.year && mostRecentEmployeeData.year < node.year) {
			mostRecentEmployeeData = {
				org: "",
				numOfIa: 0,
				race: node.race || mostRecentEmployeeData.race,
				rank: node.rank || mostRecentEmployeeData.rank,
				sex: node.sex || mostRecentEmployeeData.sex,
				unit: node.unit || mostRecentEmployeeData.unit,
				year: node.year,
				zipCode: node.zipCode || mostRecentEmployeeData.zipCode,
				unionCode: node.unionCode || mostRecentEmployeeData.unionCode,
				badgeNo: node.badgeNo || mostRecentEmployeeData.badgeNo,
				firstName: node.firstName || mostRecentEmployeeData.firstName,
				lastName: node.lastName || mostRecentEmployeeData.lastName,
				otPay: node.otPay || mostRecentEmployeeData.otPay,
				otherPay: node.otherPay || mostRecentEmployeeData.otherPay,
				quinnPay: node.quinnPay || mostRecentEmployeeData.quinnPay,
				regularPay: node.regularPay || mostRecentEmployeeData.regularPay,
				retroPay: node.retroPay || mostRecentEmployeeData.retroPay,
				totalPay: node.totalPay || mostRecentEmployeeData.totalPay,
				detailPay: node.detailPay || mostRecentEmployeeData.detailPay,
				injuredPay: node.injuredPay || mostRecentEmployeeData.injuredPay,
				totalPayPercentile: node.totalPayPercentile || mostRecentEmployeeData.totalPayPercentile,
			};
		}
	});

	return mostRecentEmployeeData;
}

export function extractEmployeeFinancialRowsFromIndividualEmployeeFinancialQuery(data) {
	const financialCols = ["year", "rank", "otPay", "otherPay", "quinnPay", "regularPay", "retroPay", "totalPay", "detailPay", "injuredPay"];
	let police_financial_rows = [];

	if (!Array.isArray(data) || data.length === 0) {
		return { police_financial_rows: [], mostRecentFinancialYear: null };
	}

	// Extract specific columns to use as financial rows
	data.forEach((node) => {
		let payData: any = {};
		financialCols.forEach((col) => {
			if (col in node) {
				payData[col] = node[col as keyof FinancialEmployeeData];
			}
		});
		if (Object.keys(payData).length > 0) {
			police_financial_rows.push(payData);
		}
	});

	// Filter the data to remove duplicates based on bpdIaNo
	let uniqueFinancialYears: number[] = [];
	const filteredFinanceEmployeeData = data.filter((node: FinancialEmployeeData) => {
		const { year } = node;

		if (!uniqueFinancialYears.includes(Number(year))) {
			uniqueFinancialYears.push(Number(year));
			return true;
		}
		return false;
	});

	// for use in profile header
	const mostRecentFinancialYear = Math.max(...uniqueFinancialYears);

	//add artificial id for MUI purposes
	let financialRowId = 1;
	const newFinancialRows = filteredFinanceEmployeeData.map((node) => {
		return { id: financialRowId++, ...node };
	});

	return {
		police_financial_rows: newFinancialRows,
		mostRecentFinancialYear: mostRecentFinancialYear,
	};
}

/* 
Add artificial id for MUI purposes
Handles both nodes and edges.node structures
*/
export function addIdToRows(rows, alias_name) {
	let rowId = 1;
	let dataArray = [];
	
	if (rows.data[alias_name]?.edges) {
		// Handle edges structure
		dataArray = rows.data[alias_name].edges.map((edge) => edge.node);
	} else if (rows.data[alias_name]?.nodes) {
		// Handle nodes structure
		dataArray = rows.data[alias_name].nodes;
	} else {
		return [];
	}
	
	const newRows = dataArray.map((node) => {
		// Map titleRank to rank for backward compatibility
		const mappedNode = { ...node };
		if (mappedNode.titleRank && !mappedNode.rank) {
			mappedNode.rank = mappedNode.titleRank;
		}
		return { id: rowId++, ...mappedNode };
	});
	return newRows;
}

export async function getOfficerProfileData(query, alias_name) {
	let response;
	try {
		response = await apolloClient.query({ query: query });
	} catch (error) {
		console.error(`GraphQL query error for ${alias_name}:`, error);
		return [];
	}
	if (!response?.data?.[alias_name]) {
		return [];
	}
	return addIdToRows(response, alias_name);
}

/*
Deduplicate records based on unique IDs
*/
export function deduplicateRecordsbyId(rows, id_field_name){
	let uniqueIds = [];
	let uniqueRows = [];
	rows.map((row)=>{
		if (!(uniqueIds.includes(row[id_field_name]))){
			uniqueRows.push(row)
			uniqueIds += row[id_field_name]
		}
	})
	return uniqueRows
}