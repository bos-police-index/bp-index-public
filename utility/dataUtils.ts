import Fuse from "fuse.js";
import apolloClient from "@lib/apollo-client";
import { GET_HOMEPAGE_DATA } from "@lib/graphql/queries";

interface EmployeeNode {
	employeeId: string;
	employeeNo: string;
	firstName: string;
	lastName: string;
	nameMi: string;
	namePrefix: string;
	nameSuffix: string;
	badgeNo: string;
	rankId: string;
	orgId: string;
	// postalCode: string;
	// title: string;
}

interface OrganizationNode {
	orgCode: string;
	orgDesc: string;
}

interface IALinkedNode {
	employeeNo: string;
	bpdIaNo: string;
}

interface HomepageData {
	allSu24Homepages: {
		edges: { node: SearchResponseData }[];
	};
}

interface FinacialLinkedNode {
	employeeNo?: string;
	totalPay: string;
	zipCode: string;
	injuredPay: string;
	otPay: string;
	otherPay: string;
	quinnPay: string;
	regularPay: string;
	retroPay: string;
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
	// race: string | null; UNCOMMENT WHEN ADDED TO TABLE
	// gender: string | null
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
				// race: existing.race || node.race,
				// gender: existing.gender || node.gender
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
