import { gql } from "@apollo/client";


export const GET_HOMEPAGE_DATA = gql`
	query MyQuery {
		allSu24Homepages {
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
				}
			}
		}
	}
`;

export const GET_DETAIL_RECORDS = gql`
	query MyQuery {
		allDetailRecordFromFa23Data {
			nodes {
				customerId
				crossStreetNo
				crossStreetName
				adminFeeRate
				contractNo
				detailPayRate
				detailStart
				detailEnd
				hoursWorked
				adminFeeFlag
				detailClerkEmployeeId
				detailRank
				detailRecordId
				detailType
				employeeId
				fbkPayDate
				incidentNo
				licensePremiseFlag
				locationDesc
				noShowFlag
				payAmount
				payHours
				payTrcCode
				prepaidFlag
				rateChangeAuthorizationEmployeeId
				recordCreatedBy
				recordCreatedDate
				recordUpdatedBy
				recordUpdatedDate
				requestRank
				rowId
				streetName
				streetId
				stateFunded
				streetNo
				trackingNo
			}
		}
	}
`;
// export const GET_EMPLOYEE_DATA = gql`
// 	query MyQuery {
// 		allEmployeeFromFa23Data(orderBy: EMPLOYEE_NO_ASC) {
// 			edges {
// 				node {
// 					firstName
// 					lastName
// 					nameMi
// 					employeeId
// 					employeeNo
// 					namePrefix
// 					nameSuffix
// 					badgeNo
// 					postalCode
// 					rankId
// 					orgId
// 				}
// 			}
// 		}
// 	}
// `;

// export const GET_ORG_DATA = gql`
// 	query MyQuery {
// 		allOrganizationFromFa23Data {
// 			edges {
// 				node {
// 					organizationId
// 					orgCode
// 					orgDesc
// 				}
// 			}
// 		}
// 	}
// `;

// export const GET_IA_DATA = gql`
// 	query MyQuery {
// 		allEmployeeIaLinkeds {
// 			nodes {
// 				employeeNo
// 				bpdIaNo
// 			}
// 		}
// 	}
// `;

// export const GET_FINANCIAL_DATA = gql`
// 	query MyQuery {
// 		allEmployeeFinancialLinkeds(condition: {year: 2021}) {
// 			edges {
// 				node {
// 				employeeNo
// 				totalPay
// 				zipCode
// 				injuredPay
// 				otPay
// 				otherPay
// 				quinnPay
// 				regularPay
// 				retroPay
// 				detailPay
// 				}
// 			}
// 		}
// 	}
// `;