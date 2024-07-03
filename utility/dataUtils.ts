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

interface EmployeeData {
	allEmployeeFromFa23Data: {
		edges: { node: EmployeeNode }[];
	};
}

interface HomepageData {
	allSu24Homepages: {
		edges: { node: SearchResponseData }[];
	};
}

interface OrganizationData {
	allOrganizationFromFa23Data: {
		edges: { node: OrganizationNode }[];
	};
}

interface IAData {
	allEmployeeIaLinkeds: {
		nodes: IALinkedNode[];
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

interface FinancialData {
	allEmployeeFinancialLinkeds: {
		edges: { node: FinacialLinkedNode }[];
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
}

interface SearchResData {
	id: string;
	employee_no: string;
	name: string;
	badge_no: string;
	rank: string;
	org: string;
	ia_no: number;
	totalPay: string;
	zipCode: string;
	injuredPay: string;
	otPay: string;
	otherPay: string;
	quinnPay: string;
	regularPay: string;
	retroPay: string;
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
				// rankId: existing.rankId || node.rankId,
				org: existing.org || node.org,
				totalPay: existing.totalPay || node.totalPay,
				overtimePay: existing.overtimePay || node.overtimePay,
				detailPay: existing.detailPay || node.detailPay,
				otherPay: existing.otherPay || node.otherPay,
				numOfIa: existing.numOfIa || node.numOfIa,

				// postalCode: existing.postalCode || node.postalCode,
				// title: existing.title || node.title,
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
// // Fetch Employee Data from the API
// async function fetchEmployeeData(): Promise<EmployeeNode[]> {
// 	const { data } = await apolloClient.query<EmployeeData>({ query: GET_EMPLOYEE_DATA });
// 	const employees = new Map<string, EmployeeNode>();

// 	for (const { node } of data.allEmployeeFromFa23Data.edges) {
// 		if (employees.has(node.employeeNo)) {
// 			const existing = employees.get(node.employeeNo);
// 			const mergedEmployee: EmployeeNode = {
// 				firstName: existing.firstName || node.firstName,
// 				lastName: existing.lastName || node.lastName,
// 				nameMi: existing.nameMi || node.nameMi,
// 				employeeId: existing.employeeId || node.employeeId,
// 				employeeNo: node.employeeNo,
// 				namePrefix: existing.namePrefix || node.namePrefix,
// 				nameSuffix: existing.nameSuffix || node.nameSuffix,
// 				badgeNo: existing.badgeNo || node.badgeNo,
// 				rankId: existing.rankId || node.rankId,
// 				orgId: existing.orgId || node.orgId,
// 				// postalCode: existing.postalCode || node.postalCode,
// 				// title: existing.title || node.title,
// 			};
// 			employees.set(node.employeeNo, mergedEmployee);
// 		} else {
// 			employees.set(node.employeeNo, node);
// 		}
// 	}

// 	return Array.from(employees.values());
// }

// // Fetch Organization Data from the API
// async function fetchOrganizationData(): Promise<Map<string, string>> {
// 	const { data } = await apolloClient.query<OrganizationData>({ query: GET_ORG_DATA });
// 	const orgs = new Map<string, string>();

// 	for (const { node } of data.allOrganizationFromFa23Data.edges) {
// 		orgs.set(node.orgCode, node.orgDesc);
// 	}

// 	return orgs;
// }

// // Fetch IA Data from the API
// export async function fetchIAData(): Promise<Map<string, number>> {
// 	const { data } = await apolloClient.query<IAData>({ query: GET_IA_DATA });

// 	//to prevent counting duplicates
// 	const seenBpdIaNos = new Set();

// 	const iaCounts = new Map<string, number>();
// 	if (data && data.allEmployeeIaLinkeds && data.allEmployeeIaLinkeds.nodes) {
// 		console.log("data exists", data);
// 	} else {
// 		console.error("IA DATA MISSING", data.allEmployeeIaLinkeds.nodes);
// 	}
// 	console.log(data.allEmployeeIaLinkeds.nodes);
// 	for (const i in data.allEmployeeIaLinkeds.nodes) {
// 		const node = data.allEmployeeIaLinkeds.nodes[i];
// 		if (node.employeeNo && node.bpdIaNo && !seenBpdIaNos.has(node.bpdIaNo)) {
// 			console.log(node.bpdIaNo, "not in", seenBpdIaNos);
// 			if (iaCounts.has(node.employeeNo)) {
// 				iaCounts.set(node.employeeNo, iaCounts.get(node.employeeNo) + 1);
// 			} else {
// 				iaCounts.set(node.employeeNo, 1);
// 			}
// 			seenBpdIaNos.add(node.bpdIaNo);
// 		}
// 	}

// 	console.log("iaCounts:", iaCounts);
// 	console.log("seenBpdIaNos:", seenBpdIaNos);
// 	return iaCounts;
// }

// async function fetchFinancialData(): Promise<Map<string, FinacialLinkedNode>> {
// 	const { data } = await apolloClient.query<FinancialData>({ query: GET_FINANCIAL_DATA });
// 	const financialData = new Map<string, FinacialLinkedNode>();

// 	for (const { node } of data.allEmployeeFinancialLinkeds.edges) {
// 		const { employeeNo, ...rest } = node;
// 		financialData.set(employeeNo, rest);
// 	}
// 	return financialData;
// }

// // Temporary solution until the rank data in the API is fixed
// const rankDict = {
// 	"16": "NA",
// 	"17": "Patrol Officer",
// 	"18": "Sergeant Detective",
// 	"19": "Detective",
// 	"20": "Civilian",
// 	"21": "Lieutenant Detective",
// 	"22": "Depsup",
// 	"23": "Sergeant",
// 	"24": "Police Officer",
// 	"25": "Lieutenant",
// 	"26": "Captain",
// 	"27": "Lieutenant",
// 	"28": "Superintendent",
// 	"29": "Civil Contractor",
// 	"30": "Sergeant",
// 	"31": "Civilian",
// 	"32": "Deputy",
// 	"33": "Commissioner",
// };

// // Fetch data from the API
// export const fetchData = async ({ keyword }: { keyword: string | string[] | null }): Promise<SearchResData[]> => {
// 	try {
// 		const [empData, orgData, iaData, financialData] = await Promise.all([fetchEmployeeData(), fetchOrganizationData(), fetchIAData(), fetchFinancialData()]);

// 		if (keyword) {
// 			const fuse = new Fuse(empData, fuseOptions);
// 			const searchRes = fuse.search(keyword as string);
// 			return searchRes.map(({ item }) => mapData(item, orgData, iaData, financialData));
// 		} else {
// 			return empData.map((item) => mapData(item, orgData, iaData, financialData));
// 		}
// 	} catch (error) {
// 		console.error("Error fetching data: ", error);
// 		throw new Error("Error fetching data");
// 	}
// };

// // Helper function to map data to the format expected by the table
// function mapData(item: EmployeeNode, orgData: Map<string, string>, iaData: Map<string, number>, financialData: Map<string, FinacialLinkedNode>): SearchResData {
// 	return {
// 		id: item.employeeId,
// 		employee_no: item.employeeNo,
// 		name: `${item.namePrefix || ""} ${item.firstName} ${item.nameMi || ""} ${item.lastName} ${item.nameSuffix || ""}`.trim(),
// 		badge_no: item.badgeNo || "Unknown Badge",
// 		rank: rankDict[item.rankId] || "Unknown Rank",
// 		org: orgData.get(item.orgId) || "Unknown Organization",
// 		ia_no: iaData.get(item.employeeNo) || 0,
// 		...financialData.get(item.employeeNo)
// 	};
// }
