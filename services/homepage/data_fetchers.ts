import Fuse from "fuse.js";
import apolloClient from "@lib/apollo-client";
import { GET_HOMEPAGE_DATA } from "@lib/graphql/queries";
import { officer_search_alias_name } from "@utility/dataViewAliases";

async function fetchHomepageData(): Promise<SearchResponseData[]> {
	const { data } = await apolloClient.query<HomepageData>({ query: GET_HOMEPAGE_DATA });
	const rows = new Map<number, SearchResponseData>();
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	const isUUID = (str) => uuidRegex.test(str);

	for (const { node } of data[officer_search_alias_name].edges) {
		if (rows.has(node.bpiId) && isUUID(node.bpiId)) {
			const existing = rows.get(node.bpiId);
			const mergedEmployee: SearchResponseData = {
				bpiId: existing.bpiId,
				badge_no: existing.badge_no || node.badge_no,
				badgeNo: existing.badgeNo || node.badgeNo,
				employeeId: existing.employeeId || node.employeeId,
				rank: existing.rank || node.rank,
				postId: existing.postId || node.postId,
				startDate: existing.startDate || node.startDate,
				year: existing.year || node.year,
				fullName: existing.fullName || node.fullName,
				org: existing.org || node.org,
				totalPay: existing.totalPay || node.totalPay,
				overtimePay: existing.overtimePay || node.overtimePay,
				detailPay: existing.detailPay || node.detailPay,
				otherPay: existing.otherPay || node.otherPay,
				regularPay: existing.regularPay || node.regularPay,
				retroPay: existing.retroPay || node.retroPay,
				injuredPay: existing.injuredPay || node.injuredPay,
				quinnPay: existing.quinnPay || node.quinnPay,
				numOfIa: existing.numOfIa || node.numOfIa,
				numOfDetail: existing.numOfDetail || node.numOfDetail,
				numOfFio: existing.numOfFio || node.numOfFio,
				numOfMvc: existing.numOfMvc || node.numOfMvc,
				race: existing.race || node.race,
				sex: existing.sex || node.sex,
				isCurrentRoster: existing.isCurrentRoster || node.isCurrentRoster,
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
