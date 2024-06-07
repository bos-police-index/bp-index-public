import { gql } from "@apollo/client";

export const GET_EMPLOYEE_DATA = gql`
	query MyQuery {
		allEmployeeFromFa23Data(orderBy: EMPLOYEE_NO_ASC) {
			edges {
				node {
					firstName
					lastName
					nameMi
					employeeId
					employeeNo
					namePrefix
					nameSuffix
					badgeNo
					postalCode
					rankId
					orgId
				}
			}
		}
	}
`;

export const GET_ORG_DATA = gql`
	query MyQuery {
		allOrganizationFromFa23Data {
			edges {
				node {
					organizationId
					orgCode
					orgDesc
				}
			}
		}
	}
`;

export const GET_IA_DATA = gql`
	query MyQuery {
		allEmployeeIaLinkeds {
			nodes {
				employeeNo
				bpdIaNo
			}
		}
	}
`;

export const GET_FINANCIAL_DATA = gql`
	query MyQuery {
		allEmployeeFinancialLinkeds(condition: {year: 2021}) {
			edges {
				node {
				employeeNo
				totalPay
				zipCode
				injuredPay
				otPay
				otherPay
				quinnPay
				regularPay
				retroPay
				detailPay
				}
			}
		}
	}
`;