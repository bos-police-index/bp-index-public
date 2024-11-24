import Fuse from "fuse.js";
import apolloClient from "@lib/apollo-client";
import { GET_ALL_OFFICER_FINANCIAL_DATA, GET_HOMEPAGE_DATA } from "@lib/graphql/queries";

export interface EmployeeFinancialsResponse {
	allLinkSu24EmployeeFinancials: {
		nodes: EmployeeFinancial[];
	};
}
export interface EmployeeFinancial {
	totalPay: number;
	injuredPay: number;
	otPay: number;
	otherPay: number;
	quinnPay: number;
	regularPay: number;
	retroPay: number;
	detailPay: number;
	year: number;
}

interface HomepageData {
	allSu24Homepages: {
		edges: { node: SearchResponseData }[];
	};
}

interface SearchResponseData {
	bpiId: number | null;
	fullName: string | null;
	org: string | null;
	badge_no: number | null;
	totalPay: number | null;
	overtimePay: number | null;
	detailPay: number | null;
	otherPay: number | null;
	numOfIa: number | null;
	race: string | null;
	sex: string | null;
}

export interface PayTypeBuckets {
	[year: number]: {
		totalPay: number[];
		detailPay: number[];
		injuredPay: number[];
		otherPay: number[];
		regularPay: number[];
		quinnPay: number[];
		retroPay: number[];
		otPay: number[];
	};
}

async function fetchHomepageData(): Promise<SearchResponseData[]> {
	const { data } = await apolloClient.query<HomepageData>({ query: GET_HOMEPAGE_DATA });
	const rows = new Map<number, SearchResponseData>();
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	const isUUID = (str) => uuidRegex.test(str);

	for (const { node } of data.allSu24Homepages.edges) {
		if (rows.has(node.bpiId) && isUUID(node.bpiId)) {
			const existing = rows.get(node.bpiId);
			const mergedEmployee: SearchResponseData = {
				bpiId: existing.bpiId,
				badge_no: existing.badge_no || node.badge_no,
				fullName: existing.fullName || node.fullName,
				org: existing.org || node.org,
				totalPay: existing.totalPay || node.totalPay,
				overtimePay: existing.overtimePay || node.overtimePay,
				detailPay: existing.detailPay || node.detailPay,
				otherPay: existing.otherPay || node.otherPay,
				numOfIa: existing.numOfIa || node.numOfIa,
				race: existing.race || node.race,
				sex: existing.sex || node.sex,
			};
			rows.set(node.bpiId, mergedEmployee);
		} else {
			rows.set(node.bpiId, node);
		}
	}

	return Array.from(rows.values());
}

const fuseOptions = {
	keys: ["fullName", "badgeNo"],
	threshold: 1,
	includeScore: true,
};

export const fetchHompage = async ({ keyword }: { keyword: string | string[] | null }): Promise<SearchResponseData[]> => {
	try {
		const homepage: SearchResponseData[] = await fetchHomepageData();
		if (keyword) {
			const fuse = new Fuse(homepage, fuseOptions);
			const searchRes = fuse.search(keyword as string);
			return searchRes.map((result) => result.item);
		}
		return homepage;
	} catch (error) {
		console.error("Error fetching data: ", error);
		throw new Error("Error fetching data");
	}
};

const fetchFinancialsHistogramData = async () => {
	try {
		const { data } = await apolloClient.query<EmployeeFinancialsResponse>({ query: GET_ALL_OFFICER_FINANCIAL_DATA });
		return data;
	} catch (error) {
		console.error("Error fetching data: ", error);
		throw new Error("Error fetching data");
	}
};

export const fetchFinancialsHistogram = async () => {
	try {
		const allFinancials = (await fetchFinancialsHistogramData()).allLinkSu24EmployeeFinancials.nodes;

		// organize values into pay types
		const payTypeBuckets: PayTypeBuckets = {
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
			return payTypeBuckets;
		}

		allFinancials.forEach((row) => {
			if (!payTypeBuckets[row.year] && row.regularPay) {
				payTypeBuckets[row.year] = {
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
			if (row.totalPay) payTypeBuckets[row.year].totalPay.push(row.totalPay);
			if (row.detailPay) payTypeBuckets[row.year].detailPay.push(row.detailPay);
			if (row.injuredPay) payTypeBuckets[row.year].injuredPay.push(row.injuredPay);
			if (row.otherPay) payTypeBuckets[row.year].otherPay.push(row.otherPay);
			if (row.regularPay) payTypeBuckets[row.year].regularPay.push(row.regularPay);
			if (row.quinnPay) payTypeBuckets[row.year].quinnPay.push(row.quinnPay);
			if (row.retroPay) payTypeBuckets[row.year].retroPay.push(row.retroPay);
			if (row.otPay) payTypeBuckets[row.year].otPay.push(row.otPay);
		});

		return payTypeBuckets;
	} catch (error) {
		console.error("Error fetching data: ", error);
		throw new Error("Error fetching data");
	}
};
