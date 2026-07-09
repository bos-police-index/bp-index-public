import { gql } from "@apollo/client";
import { boston_arrest_alias_name, court_overtime_alias_name, crime_incident_alias_name, detail_alias_name, employee_alias_name, fio_record_alias_name, homepage_alias_name, officer_search_alias_name, ir_fall_2025_alias_name, officer_financial_alias_name, officer_ia_alias_name, officer_year_history_alias_name, traffic_stop_alias_name, removeAllPrefix, removePluralSuffix, table_name_to_alias_map, v2_officer_profile_alias_name, v2_earnings_by_year_alias_name, v2_post_certification_alias_name, v2_post_decertification_alias_name, v2_fio_alias_name, v2_officer_misconduct_alias_name, v2_officer_assignment_alias_name, v2_paid_detail_alias_name, v2_traffic_alias_name, v2_incident_alias_name } from "@utility/dataViewAliases";
import { DocumentNode } from "graphql";

export const DATA_PAGE_SIZE = 25;

// Homepage Query
export const GET_HOMEPAGE_DATA = gql`
	query MyQuery {
		${officer_search_alias_name}(first: 6000) {
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
				edges {
					node {
						bpiId
						employeeId
						badgeNo
						firstName
						lastName
						titleRank
						race
						sex
						iaNumber
						incidentType
						receivedDate
						allegation
						finding
						actionTaken
						daysHoursSuspended
					}
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

// ---- V2 queries (auto-fed pipeline) ----------------------------------------

export const V2_OFFICER_PROFILE = (bpiId: string) => gql`
	query MyQuery {
		${v2_officer_profile_alias_name}(condition: {bpiId: "${bpiId}"}, first: 1) {
			nodes {
				bpiId
				employeeId
				mptcId
				badgeNo
				firstName
				lastName
				middleName
				canonicalName
				earningsLastUpdated
				fioLastUpdated
				postCertLastUpdated
				postDecertLastUpdated
				misconductLastUpdated
				identityConfidence
				rosterSource
				identityAsOf
				rank
				hireDate
			}
		}
	}
`;

export const V2_OFFICER_EARNINGS = (bpiId: string) => gql`
	query MyQuery {
		${v2_earnings_by_year_alias_name}(condition: {bpiId: "${bpiId}"}, orderBy: YEAR_DESC) {
			nodes {
				bpiId
				year
				departmentName
				title
				regularPay
				retroPay
				otherPay
				otPay
				injuredPay
				detailPay
				quinnPay
				totalPay
				source
				asOf
				linkMethod
				confirmed
			}
		}
	}
`;

export const V2_OFFICER_POST_CERTIFICATIONS = (bpiId: string) => gql`
	query MyQuery {
		${v2_post_certification_alias_name}(condition: {bpiId: "${bpiId}"}, orderBy: AS_OF_DESC) {
			nodes {
				bpiId
				mptcId
				certification
				status
				expiration
				agency
				additionalInfo
				source
				asOf
				linkMethod
				confirmed
			}
		}
	}
`;

export const V2_OFFICER_MISCONDUCT = (bpiId: string) => gql`
	query MyQuery {
		${v2_officer_misconduct_alias_name}(condition: {bpiId: "${bpiId}"}, orderBy: RECEIVED_DATE_DESC) {
			nodes {
				bpiId
				caseNumber
				incidentType
				allegation
				finding
				actionTaken
				receivedDate
				completedDate
				source
				asOf
				linkMethod
				confirmed
			}
		}
	}
`;

export const V2_OFFICER_FIO = (bpiId: string) => gql`
	query MyQuery {
		${v2_fio_alias_name}(condition: {bpiId: "${bpiId}"}, orderBy: CONTACT_DATE_DESC) {
			nodes {
				bpiId
				fcNum
				contactDate
				location
				frisked
				vehicleSearched
				basis
				circumstance
				narrative
				source
				asOf
			}
		}
	}
`;

export const V2_OFFICER_ASSIGNMENTS = (bpiId: string) => gql`
	query MyQuery {
		${v2_officer_assignment_alias_name}(condition: {bpiId: "${bpiId}"}, orderBy: EFF_DATE_DESC) {
			nodes {
				bpiId
				employeeId
				workgroup
				tskprofId
				descr
				effDate
			}
		}
	}
`;

export const V2_OFFICER_PAID_DETAILS = (bpiId: string) => gql`
	query MyQuery {
		${v2_paid_detail_alias_name}(condition: {bpiId: "${bpiId}"}, orderBy: START_DATE_DESC) {
			nodes {
				bpiId
				trackingNo
				startDate
				startTime
				endTime
				hoursWorked
				detailType
				customerName
				customerCity
				street
				orgDesc
				payAmount
				source
				asOf
			}
		}
	}
`;

export const V2_OFFICER_TRAFFIC = (bpiId: string) => gql`
	query MyQuery {
		${v2_traffic_alias_name}(condition: {bpiId: "${bpiId}"}, orderBy: EVENT_DATE_DESC) {
			nodes {
				bpiId
				eventDate
				citationNumber
				citationType
				violationType
				offenseDesc
				disposition
				locationName
				searched
				crash
				subjectRace
				subjectGender
				issuingAgency
				source
				asOf
			}
		}
	}
`;

export const V2_OFFICER_INCIDENTS = (bpiId: string) => gql`
	query MyQuery {
		${v2_incident_alias_name}(condition: {bpiId: "${bpiId}"}, orderBy: OCCURRED_ON_DATE_DESC) {
			nodes {
				bpiId
				incidentNumber
				occurredOnDate
				district
				shooting
				location
				natureOfIncident
				offenses
				incidentClearance
				numArrestees
				numVictims
				url
				source
				asOf
			}
		}
	}
`;

export const V2_OFFICER_POST_DECERTIFICATIONS = (bpiId: string) => gql`
	query MyQuery {
		${v2_post_decertification_alias_name}(condition: {bpiId: "${bpiId}"}, orderBy: DECERTIFICATION_DATE_DESC) {
			nodes {
				bpiId
				mptcId
				decertificationDate
				reason
				agency
				source
				asOf
			}
		}
	}
`;

export const INDIVIDUAL_OFFICER_YEAR_HISTORY = (bpiId: string) => {
	return gql`query MyQuery {
		${officer_year_history_alias_name}(condition: {bpiId: "${bpiId}"}, orderBy: YEAR_DESC) {
			nodes {
				bpiId
				employeeId
				year
				lastName
				firstName
				badgeNo
				rank
				units
				tskprofIds
				tskprofDescs
				jobTitles
				hrAnnualRate
				regularPay
				retroPay
				otherPay
				otPay
				injuredPay
				detailPay
				quinnPay
				totalPay
				totalPayPercentile
			}
		}
	}`;
};

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

export const GET_NEXT_PAGE_OFFICER_IA: DocumentNode = gql`
	query MyQuery($offset: Int, $page_size: Int, $order_by: [${removeAllPrefix(officer_ia_alias_name)}OrderBy!], $filters: ${removePluralSuffix(removeAllPrefix(officer_ia_alias_name))}Condition) {
		${officer_ia_alias_name}(first: $page_size, offset: $offset, orderBy: $order_by, condition: $filters) {
			edges {
				node {
					bpiId
					employeeId
					badgeNo
					firstName
					lastName
					titleRank
					race
					sex
					iaNumber
					incidentType
					receivedDate
					allegation
					finding
					actionTaken
					daysHoursSuspended
				}
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

export const GET_NEXT_PAGE_BOSTON_ARRESTS: DocumentNode = gql`
	query MyQuery($offset: Int, $page_size: Int, $order_by: [${removeAllPrefix(boston_arrest_alias_name)}OrderBy!], $filters: ${removePluralSuffix(removeAllPrefix(boston_arrest_alias_name))}Condition) {
		${boston_arrest_alias_name}(first: $page_size, offset: $offset, orderBy: $order_by, condition: $filters) {
			totalCount
			edges {
				node {
					pkey
					objectid
					arrestNum
					incNum
					chargeSeqNum
					chargeCode
					chargeDesc
					nibrsCode
					nibrsDesc
					arrDate
					genderDesc
					raceDesc
					ethnicityDesc
					age
					juvenile
					hourOfDay
					dayOfWeek
					year
					quarter
					month
					neighborhood
					district
				}
			}
		}
	}
`;

export const GET_NEXT_PAGE_EMPLOYEE: DocumentNode = (() => {
	if (!employee_alias_name) {
		throw new Error("employee_alias_name is not defined");
	}
	return gql`
		query MyQuery($offset: Int, $page_size: Int, $order_by: [${removeAllPrefix(employee_alias_name)}OrderBy!], $filters: ${removePluralSuffix(removeAllPrefix(employee_alias_name))}Condition) {
			${employee_alias_name}(first: $page_size, offset: $offset, orderBy: $order_by, condition: $filters) {
				totalCount
				edges {
					node {
						bpiId
						employeeId
						nameId
						lastName
						firstName
						salPlan
						jobTitle
						race
						sex
					}
				}
			}
		}
	`;
})();

export const GET_NEXT_PAGE_TRAFFIC_STOPS: DocumentNode = gql`
	query MyQuery($offset: Int, $page_size: Int, $order_by: [${removeAllPrefix(traffic_stop_alias_name)}OrderBy!], $filters: ${removePluralSuffix(removeAllPrefix(traffic_stop_alias_name))}Condition) {
		${traffic_stop_alias_name}(first: $page_size, offset: $offset, orderBy: $order_by, condition: $filters) {
			totalCount
			edges {
				node {
					bpiId
					officerId
					eventDate
					timeHh
					timeMm
					amPm
					violatorType
					citationNumber
					citationType
					offenseCode
					offenseDescription
					locationName
					race
					gender
					yearOfBirth
					searched
					crash
				}
			}
		}
	}
`;

export const GET_NEXT_PAGE_IR_FALL_2025: DocumentNode = gql`
	query MyQuery($offset: Int, $page_size: Int, $order_by: [${removeAllPrefix(ir_fall_2025_alias_name)}OrderBy!], $filters: ${removePluralSuffix(removeAllPrefix(ir_fall_2025_alias_name))}Condition) {
		${ir_fall_2025_alias_name}(first: $page_size, offset: $offset, orderBy: $order_by, condition: $filters) {
			totalCount
			edges {
				node {
					bpiId
					officerName
					badgeNo
					reportingOfficer
					allAssistingOfficersAndAssistTypes
					weaponForceInvolved
					shooting
					eventLocationStreetAddress
					eventLocationCrossStreet1
					eventLocationCrossStreet2
					eventLocationNeighborhood
					offenseLocationCrossStreet1
					offenseLocationCrossStreet2
					offenseLocationLat
					offenseLocationLong
					offenseLocationNeighborhood
					date
					time
					eventDistrict
					eventNeighborhood
					suspectCount
					totalCharges
					chargeI
					chargeIi
					chargeIii
				}
			}
		}
	}
`;

export const GET_IA_CASE_BY_NUMBER = (iaNumber: string) => {
	return gql`
		query MyQuery($filters: ${removePluralSuffix(removeAllPrefix(officer_ia_alias_name))}Condition) {
			${officer_ia_alias_name}(first: 1, condition: $filters) {
				edges {
					node {
						bpiId
						employeeId
						badgeNo
						firstName
						lastName
						titleRank
						race
						sex
						iaNumber
						incidentType
						receivedDate
						allegation
						finding
						actionTaken
						daysHoursSuspended
					}
				}
				totalCount
			}
		}
	`;
};

// Get Year range of the dataset
export const GET_YEAR_RANGE_OF_DATASET = (table_name: string, date_column_name: string, offset: number, queryEarliest: boolean, queryLatest: boolean): DocumentNode => {
	const query_source = table_name_to_alias_map[table_name];
	
	// If no date column is provided, return an empty query
	if (!date_column_name) {
		return gql`query { }`;
	}
	
	const capitalized_date_col = toUpperSnakeCase(date_column_name);

	let query_string = `query {`;

	const usesEdgesStructure = table_name === "boston_arrest" || table_name === "officer_misconduct" || table_name === "traffic_stop" || table_name === "ir_fall_2025";

	if (queryEarliest) {
		if (usesEdgesStructure) {
			query_string += `\n earliest: ${query_source}(orderBy: ${capitalized_date_col}_ASC, first: 1, offset: ${offset}) {
								edges {
									node {
										${date_column_name}
									}
								}
							}`;
		} else {
			query_string += `\n earliest: ${query_source}(orderBy: ${capitalized_date_col}_ASC, first: 1, offset: ${offset}) {
								nodes{
									${date_column_name}
								}
							}`;
		}
	}
	if (queryLatest) {
		if (usesEdgesStructure) {
			query_string += `\n latest: ${query_source}(orderBy: ${capitalized_date_col}_DESC, first: 1, offset: ${offset}) {
								edges {
									node {
										${date_column_name}
									}
								}
							}`;
		} else {
			query_string += `\n latest: ${query_source}(orderBy: ${capitalized_date_col}_DESC, first: 1, offset: ${offset}) {
								nodes{
									${date_column_name}
								}
							}`;
		}
	}

	query_string += " }";

	// console.log("QUERY:", query_string);

	return gql(query_string);
};

function toUpperSnakeCase(camelCaseStr) {
	if (!camelCaseStr) {
		return "";
	}
	return camelCaseStr.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();
}
