import { gql } from "@apollo/client";
import { court_overtime_alias_name, crime_incident_alias_name, detail_alias_name, fio_record_alias_name, homepage_alias_name, officer_financial_alias_name, officer_ia_alias_name, removeAllPrefix, removePluralSuffix, table_name_to_alias_map } from "@utility/dataViewAliases";
import { DocumentNode } from "graphql";

export const DATA_PAGE_SIZE = 25;

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
					iaNumber
					badgeNo
					incidentType
					receivedDate
					allegation
					finding
					actionTaken
					leaDisposition
					disposition
					occuredDate
					allegationDetails
					allegationSubtype
					allegationType
					disciplines
				}
			}
		}
	`;
};

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

export const INDIVIDUAL_OFFICER_COURT_OVERTIMES = (bpiId: string) => {
	return gql`query MyQuery {
		${court_overtime_alias_name}(condition: {bpiId: "${bpiId}" }) {
		  nodes {
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
	  }`;
};

export const INDIVIDUAL_OFFICER_FIO_RECORDS = (bpiId: string) => {
	return gql`query MyQuery {
		${fio_record_alias_name}(condition: {bpiId: "${bpiId}" }) {
		 nodes {
				contactDate
				basis
				circumstance
				city
				contactOfficerName
				fcNum
				frisked
				keySituations
				narrative
				state
				stopDuration
				streetAddress
				summonsIssued
				supervisorName
				vehicleSearched
				vehicleModel
				vehicleMake
				vehicleColor
				vehicleState
				vehicleStyle
				vehicleType
				vehicleYear
				weather
				zip
			}
		}
	  }`;
};

// Data Page Queries
export const GET_NEXT_PAGE_DETAIL_RECORDS: DocumentNode = gql`
	query MyQuery($offset: Int, $page_size: Int, $order_by: [${removeAllPrefix(detail_alias_name)}OrderBy!], $filters: ${removePluralSuffix(removeAllPrefix(detail_alias_name))}Condition) {
		${detail_alias_name}(first: $page_size, offset: $offset, orderBy: $order_by, condition: $filters) {
			nodes {
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
				bpiId
   		 	}
				totalCount
		}
	}
`;

export const GET_NEXT_PAGE_COURT_OVERTIMES: DocumentNode = gql`
	query MyQuery($offset: Int, $page_size: Int, $order_by: [${removeAllPrefix(court_overtime_alias_name)}OrderBy!], $filters: ${removePluralSuffix(removeAllPrefix(court_overtime_alias_name))}Condition) {
		${court_overtime_alias_name}(first: $page_size, offset: $offset, orderBy: $order_by, condition: $filters) {
			nodes {
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
				bpiId
   		 	}
				totalCount
		}
	}
`;

export const GET_NEXT_PAGE_OFFICER_IA = gql`
	query MyQuery($offset: Int, $page_size: Int, $order_by: [${removeAllPrefix(officer_ia_alias_name)}OrderBy!], $filters: ${removePluralSuffix(removeAllPrefix(officer_ia_alias_name))}Condition) {
		${officer_ia_alias_name}(first: $page_size, offset: $offset, orderBy: $order_by, condition: $filters) {
			nodes {
			 	iaNumber
				badgeNo
				incidentType
				receivedDate
				firstName
				lastName
				allegation
				finding
				actionTaken
				leaDisposition
				disposition
				occuredDate
				allegationDetails
				allegationSubtype
				allegationType
				disciplines
				bpiId
   		 	}
				totalCount
		}
	}
`;

export const GET_NEXT_PAGE_FIO_RECORDS = gql`
	query MyQuery($offset: Int, $page_size: Int, $order_by: [${removeAllPrefix(fio_record_alias_name)}OrderBy!], $filters: ${removePluralSuffix(removeAllPrefix(fio_record_alias_name))}Condition) {
		${fio_record_alias_name}(first: $page_size, offset: $offset, orderBy: $order_by, condition: $filters) {
			nodes {
				contactDate
				basis
				circumstance
				city
				contactOfficerName
				fcNum
				frisked
				keySituations
				narrative
				state
				stopDuration
				streetAddress
				summonsIssued
				supervisorName
				vehicleSearched
				vehicleModel
				vehicleMake
				vehicleColor
				vehicleState
				vehicleStyle
				vehicleType
				vehicleYear
				weather
				zip
				bpiId
			}
				totalCount
		}
	}
`;

export const GET_NEXT_PAGE_CRIME_INCIDENTS: DocumentNode = gql`
	query MyQuery($offset: Int, $page_size: Int, $order_by: [${removeAllPrefix(crime_incident_alias_name)}OrderBy!], $filters: ${removePluralSuffix(removeAllPrefix(crime_incident_alias_name))}Condition) {
		${crime_incident_alias_name}(first: $page_size, offset: $offset, orderBy: $order_by, condition: $filters) {
			nodes {
				id
				geocodeLongitude
				exceptionalClearanceDate
				buiOfficerId
				bagOfText
				buiBadgeNo
				numberOfOffenders
				offenses
				officerJournalName
				numberOfArrestees
				shooting
				locationOfOccurrence
				locationType
				street
				reportingArea
				reportedLongitude
				reportedLatitude
				reportDate
				officerId
				occurredOnDate
				numberOfVictims
				nibrsOffenses
				natureOfIncident
				longitude
				latitude
				incidentNumber
				incidentClearance
				district
				createdAt
				geocodeLatitude
				buiNameId
				bpiId
				attributions
			}
			totalCount
		}
	}
`;

export const GET_IA_CASE_BY_NUMBER = (iaNumber: string) => {
	return gql`
		query MyQuery {
			${officer_ia_alias_name}(condition: {iaNumber: "${iaNumber}"}) {
				nodes {
					iaNumber
					badgeNo
					incidentType
					receivedDate
					firstName
					lastName
					allegation
					finding
					actionTaken
					leaDisposition
					disposition
					occuredDate
					allegationDetails
					allegationSubtype
					allegationType
					disciplines
					bpiId
				}
			}
		}
	`;
};

// Get Year range of the dataset
export const GET_YEAR_RANGE_OF_DATASET = (table_name: string, date_column_name: string, offset: number, queryEarliest: boolean, queryLatest: boolean): DocumentNode => {
	const query_source = table_name_to_alias_map[table_name];
	const capitalized_date_col = toUpperSnakeCase(date_column_name);

	let query_string = `query {`;

	if (queryEarliest) {
		query_string += `\n earliest: ${query_source}(orderBy: ${capitalized_date_col}_ASC, first: 1, offset: ${offset}) {
							nodes{
								${date_column_name}
							}
						}`;
	}
	if (queryLatest) {
		query_string += `\n latest: ${query_source}(orderBy: ${capitalized_date_col}_DESC, first: 1, , offset: ${offset}) {
								nodes{
								${date_column_name}
							}
						}`;
	}

	query_string += " }";

	// console.log("QUERY:", query_string);

	return gql(query_string);
};

function toUpperSnakeCase(camelCaseStr) {
	return camelCaseStr.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();
}
