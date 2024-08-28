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
					sex
					race
				}
			}
		}
	}
`;

export const GET_FIRST_1000_DETAIL_RECORDS = gql`
	query MyQuery {
		allLinkSu24DetailRecords(first: 1000) {
			nodes {
				adminFeeFlag
				badgeNo
				bpdCustomerNo
				customerNo
				customerNoAndSeq
				customerSeq
				detailRank
				detailType
				districtWorked
				endTime
				fbkPayDate
				hoursWorked
				nameId
				payAmount
				payHours
				payRate
				race
				payTrcCode
				rowId
				sex
				startDate
				startTime
				street
				xStreet
				trackingNo
				streetNo
				empRank
				empOrgCode
			}
			totalCount
		}
	}
`;

export const GET_REST_DETAIL_RECORDS = gql`
	query MyQuery {
		allLinkSu24DetailRecords(offset: 1000) {
			nodes {
				adminFeeFlag
				badgeNo
				bpdCustomerNo
				customerNo
				customerNoAndSeq
				customerSeq
				detailType
				districtWorked
				endTime
				fbkPayDate
				hoursWorked
				nameId
				payAmount
				payHours
				payRate
				race
				payTrcCode
				rowId
				sex
				startDate
				startTime
				street
				xStreet
				trackingNo
				streetNo
				empRank
				empOrgCode
			}
			totalCount
		}
	}
`;
