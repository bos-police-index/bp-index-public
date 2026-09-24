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
			// Same officer twice: keep the first non-empty value of every field.
			const existing = rows.get(node.bpiId);
			const merged = { ...existing };
			for (const [k, v] of Object.entries(node)) if (merged[k] == null || merged[k] === "") merged[k] = v;
			rows.set(node.bpiId, merged as SearchResponseData);
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
