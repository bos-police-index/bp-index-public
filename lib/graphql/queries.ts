import { gql } from "@apollo/client";
import { API_PAGE_SIZE_LARGE, API_PAGE_SIZE_MEDIUM, API_PAGE_SIZE_SMALL, court_overtime_alias_name, detail_alias_name, homepage_alias_name, officer_financial_alias_name, officer_ia_alias_name } from "@utility/dataViewAliases";
import { DocumentNode } from "graphql";

// Homepage Query
export const GET_HOMEPAGE_DATA = gql`
	query MyQuery {
		${homepage_alias_name} {
			edges {
				node {
					employeeId
					fullName
					org
					badgeNo
					totalPay
					overtimePay
					detailPay
					otherPay
					year
					numOfIa
					bpiId
					rank
					sex
					race
				}
			}
		}
	}
`;

// Dashboard Queries
export const INDIVIDUAL_OFFICER_DETAIL_RECORDS = (bpiId: string) => {
	return gql`query MyQuery {
		${detail_alias_name}(condition: {bpiId: "${bpiId}"}) {
			nodes {
				adminFeeFlag
				bpdCustomerNo
				customerNo
				customerSeq
				detailRank
				detailType
				districtWorked
				endTime
				hoursWorked
				nameId
				payAmount
				payHours
				payRate
				payTrcCode
				startDate
				startTime
				street
				xstreet
				trackingNo
				streetNo
				customerName
				noShowFlag
				stateFunded
			}
		}
	}
	  `;
};

export const INDIVIDUAL_OFFICER_FINANCIAL_AND_EMPLOYEE = (bpiId: string) => {
	return gql`query MyQuery {
		${officer_financial_alias_name}(condition: {bpiId: "${bpiId}" }) {
		  nodes {
			race
			rank
			sex
			unit
			year
			zipCode
			unionCode
			badgeNo
			firstName
			lastName
			otPay
			otherPay
			quinnPay
			regularPay
			retroPay
			totalPay
			detailPay
			injuredPay
			year
			totalPayPercentile
		  }
		}
	  }`;
};

export const INDIVIDUAL_OFFICER_IA = (bpiId: string) => {
	return gql`
		query MyQuery {
			${officer_ia_alias_name}(condition: {bpiId: "${bpiId}"}) {
				nodes {
					dateReceived
					allegation
					finding
					actionTaken
					adminLeave
					daysOrHoursSuspended
					incidentType
					iaNo
				}
			}
		}
	`;
};

// Data Page Queries
export const GET_FIRST_1000_DETAIL_RECORDS = gql`
	query MyQuery {
		${detail_alias_name}(first: ${API_PAGE_SIZE_SMALL}) {
			pageInfo {
				endCursor
				hasNextPage
			}
			edges {
				node {
					adminFeeFlag
					badgeNo
					bpdCustomerNo
					customerNo
					customerSeq
					detailRank
					detailType
					districtWorked
					endTime
					hoursWorked
					nameId
					payAmount
					payHours
					payRate
					race
					payTrcCode
					sex
					startDate
					startTime
					street
					xstreet
					trackingNo
					streetNo
					empRank
					empOrgCode
					customerName
					noShowFlag
					stateFunded
				}
			}
		}
	}
`;

export const GET_NEXT_PAGE_DETAIL_RECORDS: DocumentNode = gql`
	query MyQuery($endCursor: Cursor) {
		${detail_alias_name}(first: ${API_PAGE_SIZE_LARGE}, after: $endCursor) {
			pageInfo {
				endCursor
				hasNextPage
			}
			edges {
				node {
					adminFeeFlag
					badgeNo
					bpdCustomerNo
					customerNo
					customerSeq
					detailRank
					detailType
					districtWorked
					endTime
					hoursWorked
					nameId
					payAmount
					payHours
					payRate
					race
					payTrcCode
					sex
					startDate
					startTime
					street
					xstreet
					trackingNo
					streetNo
					empRank
					empOrgCode
					customerName
					noShowFlag
					stateFunded
				}
			}
		}
	}
`;

export const GET_ALL_OFFICER_FINANCIAL_DATA = gql`
	query MyQuery {
		${officer_financial_alias_name} {
			nodes {
				totalPay
				injuredPay
				otPay
				otherPay
				quinnPay
				regularPay
				retroPay
				detailPay
				year
				rank
			}
		}
	}
`;

export const GET_FIRST_1000_COURT_OVERTIMES = gql`
	query MyQuery {
		${court_overtime_alias_name}(first: ${API_PAGE_SIZE_SMALL}){
			edges {
				node {
					assignedDesc
					chargedDesc
					description
					endTime
					name
					otCode
					otDate
					race
					rank
					sex
					startTime
					workedHours
				}
			}
			pageInfo {
				endCursor
				hasNextPage
			}
  }
}

`;
export const GET_NEXT_PAGE_COURT_OVERTIMES = gql`
	query MyQuery($endCursor: Cursor) {
		${court_overtime_alias_name}(first: ${API_PAGE_SIZE_MEDIUM}, after: $endCursor) {
			edges {
				node {
					assignedDesc
					chargedDesc
					description
					endTime
					name
					otCode
					otDate
					race
					rank
					sex
					startTime
					workedHours
				}
			}
			pageInfo {
				endCursor
				hasNextPage
			}
		}
	}
`;

export const GET_FIRST_1000_OFFICER_IA = gql`
query MyQuery {
		${officer_ia_alias_name}(first: ${API_PAGE_SIZE_SMALL}){
			edges {
				node {
					actionTaken
					adminLeave
					allegation
					badgeNo
					dateReceived
					dateHired
					daysOrHoursSuspended
					finding
					firstName
					lastName
					iaNo
					incidentType
					race
					sex
					unionCode
				}
    		}
    pageInfo {
      endCursor
      hasNextPage
    }
  }
}`;

export const GET_NEXT_PAGE_OFFICER_IA = gql`
query MyQuery($endCursor: Cursor) {
		${officer_ia_alias_name}(first: ${API_PAGE_SIZE_SMALL}, after: $endCursor) {
			edges {
				node {
					actionTaken
					adminLeave
					allegation
					badgeNo
					dateReceived
					dateHired
					daysOrHoursSuspended
					finding
					firstName
					lastName
					iaNo
					incidentType
					race
					sex
					unionCode
				}
    		}
    pageInfo {
      endCursor
      hasNextPage
    }
  }
}`;



// Data Page Length of Data Queries

export const GET_NUMBER_OF_ROWS = (table_name: string): DocumentNode =>{
	let query_source = ""
	if (table_name.includes("detail")){
		query_source = detail_alias_name
	}
	else if (table_name.includes("court_overtime")) {
		query_source = court_overtime_alias_name;
	} else if (table_name.includes("officer_misconduct")) {
		query_source = officer_ia_alias_name;
	} else {
		console.log("ERROR, source to check num of rows from is invalid");
		throw new Error("Need to add this data source to queries.ts GET_NUMBER_OF_ROWS");
	}

	return(
	gql`query MyQuery {
		${query_source} {
			totalCount
				}
	}`

	)
} 
