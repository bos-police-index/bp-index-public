import Fuse from "fuse.js";
import apolloClient from "@lib/apollo-client";
import { GET_EMPLOYEE_DATA, GET_IA_DATA, GET_ORG_DATA, GET_FINANCIAL_DATA } from "@lib/graphql/queries";

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
}

interface EmployeeData {
	allEmployeeFromFa23Data: {
		edges: { node: EmployeeNode }[];
	};
}

interface OrganizationData {
	allOrganizationFromFa23Data: {
		edges: { node: OrganizationNode }[];
	};
}

interface IAData {
	allEmployeeIaLinkeds: {
		edges: { node: IALinkedNode }[];
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
// Fetch Employee Data from the API
async function fetchEmployeeData(): Promise<EmployeeNode[]> {
	const { data } = await apolloClient.query<EmployeeData>({ query: GET_EMPLOYEE_DATA });
	const employees = new Map<string, EmployeeNode>();

	for (const { node } of data.allEmployeeFromFa23Data.edges) {
		if (employees.has(node.employeeNo)) {
			const existing = employees.get(node.employeeNo);
			const mergedEmployee: EmployeeNode = {
				firstName: existing.firstName || node.firstName,
				lastName: existing.lastName || node.lastName,
				nameMi: existing.nameMi || node.nameMi,
				employeeId: existing.employeeId || node.employeeId,
				employeeNo: node.employeeNo,
				namePrefix: existing.namePrefix || node.namePrefix,
				nameSuffix: existing.nameSuffix || node.nameSuffix,
				badgeNo: existing.badgeNo || node.badgeNo,
				rankId: existing.rankId || node.rankId,
				orgId: existing.orgId || node.orgId,
				// postalCode: existing.postalCode || node.postalCode,
				// title: existing.title || node.title,
			};
			employees.set(node.employeeNo, mergedEmployee);
		} else {
			employees.set(node.employeeNo, node);
		}
	}

	return Array.from(employees.values());
}

// Fetch Organization Data from the API
async function fetchOrganizationData(): Promise<Map<string, string>> {
	const { data } = await apolloClient.query<OrganizationData>({ query: GET_ORG_DATA });
	const orgs = new Map<string, string>();

	for (const { node } of data.allOrganizationFromFa23Data.edges) {
		orgs.set(node.orgCode, node.orgDesc);
	}

	return orgs;
}

// Fetch IA Data from the API
async function fetchIAData(): Promise<Map<string, number>> {
	const { data } = await apolloClient.query<IAData>({ query: GET_IA_DATA });
	const iaCounts = new Map<string, number>();

	for (const { node } of data.allEmployeeIaLinkeds.edges) {
		if (iaCounts.has(node.employeeNo)) {
			iaCounts.set(node.employeeNo, iaCounts.get(node.employeeNo) + 1);
		} else {
			iaCounts.set(node.employeeNo, 1);
		}
	}

	return iaCounts;
}

async function fetchFinacialData(): Promise<Map<string, FinacialLinkedNode>> {
	const { data } = await apolloClient.query<FinancialData>({ query: GET_FINANCIAL_DATA });
	const financialData = new Map<string, FinacialLinkedNode>();
	
	for (const { node } of data.allEmployeeFinancialLinkeds.edges) {
		const { employeeNo, ...rest } = node;
		financialData.set(employeeNo, rest);
	}
	return financialData;
}

// Temporary solution until the rank data in the API is fixed
const rankDict = {
	"16": "NA",
	"17": "Patrol Officer",
	"18": "Sergeant Detective",
	"19": "Detective",
	"20": "Civilian",
	"21": "Lieutenant Detective",
	"22": "Depsup",
	"23": "Sergeant",
	"24": "Police Officer",
	"25": "Lieutenant",
	"26": "Captain",
	"27": "Lieutenant",
	"28": "Superintendent",
	"29": "Civil Contractor",
	"30": "Sergeant",
	"31": "Civilian",
	"32": "Deputy",
	"33": "Commissioner",
};

const fuseOptions = {
	keys: ["employeeId", "employeeNo", "firstName", "lastName", "nameMi", "namePrefix", "nameSuffix", "badgeNo"],
	threshold: 1,
	includeScore: true,
};

// Fetch data from the API
export const fetchData = async ({ keyword }: { keyword: string | string[] | null }): Promise<SearchResData[]> => {
	try {
		const [empData, orgData, iaData, financialData] = await Promise.all([fetchEmployeeData(), fetchOrganizationData(), fetchIAData(), fetchFinacialData()]);

		if (keyword) {
			const fuse = new Fuse(empData, fuseOptions);
			const searchRes = fuse.search(keyword as string);
			return searchRes.map(({ item }) => mapData(item, orgData, iaData, financialData));
		} else {
			return empData.map((item) => mapData(item, orgData, iaData, financialData));
		}
	} catch (error) {
		console.error("Error fetching data: ", error);
		throw new Error("Error fetching data");
	}
};

// Helper function to map data to the format expected by the table
function mapData(item: EmployeeNode, orgData: Map<string, string>, iaData: Map<string, number>, financialData: Map<string, FinacialLinkedNode>): SearchResData {
	return {
		id: item.employeeId,
		employee_no: item.employeeNo,
		name: `${item.namePrefix || ""} ${item.firstName} ${item.nameMi || ""} ${item.lastName} ${item.nameSuffix || ""}`.trim(),
		badge_no: item.badgeNo || "Unknown Badge",
		rank: rankDict[item.rankId] || "Unknown Rank",
		org: orgData.get(item.orgId) || "Unknown Organization",
		ia_no: iaData.get(item.employeeNo) || 0,
		...financialData.get(item.employeeNo)
	};
}
