import apolloClient from "@lib/apollo-client";
import { GET_ALL_OFFICER_FINANCIAL_DATA } from "@lib/graphql/queries";
import { officer_financial_alias_name } from "@utility/dataViewAliases";

// Move this file outside of /profile if financial histogram gets used in places other than profile

const fetchFinancialsHistogramData = async () => {
	try {
		const { data } = await apolloClient.query<EmployeeFinancialsResponse>({ query: GET_ALL_OFFICER_FINANCIAL_DATA });
		return data[officer_financial_alias_name].nodes;
	} catch (error) {
		console.error("Error fetching data: ", error);
		throw new Error("Error fetching data");
	}
};

export const fetchFinancialsHistogram = async (rank: String) => {
	const addNewRecord = (payBucket: PayTypeBuckets, row: any) => {
		if (!payBucket[row.year] && row.regularPay) {
			payBucket[row.year] = {
				totalPay: [],
				detailPay: [],
				injuredPay: [],
				otherPay: [],
				regularPay: [],
				quinnPay: [],
				retroPay: [],
				otPay: [],
			};
		}
		if (row.totalPay) payBucket[row.year].totalPay.push(row.totalPay);
		if (row.detailPay) payBucket[row.year].detailPay.push(row.detailPay);
		if (row.injuredPay) payBucket[row.year].injuredPay.push(row.injuredPay);
		if (row.otherPay) payBucket[row.year].otherPay.push(row.otherPay);
		if (row.regularPay) payBucket[row.year].regularPay.push(row.regularPay);
		if (row.quinnPay) payBucket[row.year].quinnPay.push(row.quinnPay);
		if (row.retroPay) payBucket[row.year].retroPay.push(row.retroPay);
		if (row.otPay) payBucket[row.year].otPay.push(row.otPay);

		return payBucket;
	};

	try {
		const allFinancials = await fetchFinancialsHistogramData();

		//TODO: Remove hardcoding of "2023" in case that in the future we don't have any data for 2023
		// organize values into pay types
		var rankMatchingPayTypeBuckets: PayTypeBuckets = {
			[2023]: {
				totalPay: [],
				detailPay: [],
				injuredPay: [],
				otherPay: [],
				regularPay: [],
				quinnPay: [],
				retroPay: [],
				otPay: [],
			},
		};

		var nonRankMatchingPayTypeBuckets: PayTypeBuckets = {
			[2023]: {
				totalPay: [],
				detailPay: [],
				injuredPay: [],
				otherPay: [],
				regularPay: [],
				quinnPay: [],
				retroPay: [],
				otPay: [],
			},
		};

		if (!allFinancials) {
			return [rankMatchingPayTypeBuckets, nonRankMatchingPayTypeBuckets];
		}

		allFinancials.forEach((row) => {
			if (row.rank == rank) {
				rankMatchingPayTypeBuckets = addNewRecord(rankMatchingPayTypeBuckets, row);
			} else {
				nonRankMatchingPayTypeBuckets = addNewRecord(nonRankMatchingPayTypeBuckets, row);
			}
		});

		return [rankMatchingPayTypeBuckets, nonRankMatchingPayTypeBuckets];
	} catch (error) {
		console.error("Error fetching data: ", error);
		throw new Error("Error fetching data");
	}
};
