import { gql } from "@apollo/client";
import { court_overtime_alias_name, detail_alias_name, homepage_alias_name, officer_financial_alias_name, officer_ia_alias_name } from "@utility/dataViewAliases";

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
		${detail_alias_name}(first: 1000) {
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
			}
		}
	}
`;

export const GET_REST_DETAIL_RECORDS = gql`
	query MyQuery {
		${detail_alias_name}(offset: 1000, first: 50000) {
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
		${court_overtime_alias_name}(first: 1000) {
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
	}
`;

export const GET_REST_COURT_OVERTIMES = gql`
	query MyQuery {
		${court_overtime_alias_name}(offset: 1000) {
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
	}
`;