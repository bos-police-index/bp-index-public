import { homepage_alias_name, officer_financial_alias_name } from "@utility/dataViewAliases";

declare global {
	interface EmployeeFinancial {
		totalPay: number;
		injuredPay: number;
		otPay: number;
		otherPay: number;
		quinnPay: number;
		regularPay: number;
		retroPay: number;
		detailPay: number;
		year: number;
		rank: String;
	}

	type EmployeeFinancialsResponse = {
		[key in typeof officer_financial_alias_name]: {
			nodes: EmployeeFinancial[];
		};
	};

	interface SearchResponseData {
		bpiId: number | null;
		fullName: string | null;
		org: string | null;
		badge_no: number | null;
		badgeNo: string | null;
		employeeId: string | null;
		rank: string | null;
		postId: string | null;
		startDate: string | null;
		year: number | null;
		totalPay: number | null;
		overtimePay: number | null;
		detailPay: number | null;
		otherPay: number | null;
		regularPay: number | null;
		retroPay: number | null;
		injuredPay: number | null;
		quinnPay: number | null;
		numOfIa: number | null;
		numOfDetail: number | null;
		numOfFio: number | null;
		numOfMvc: number | null;
		race: string | null;
		sex: string | null;
		isCurrentRoster: boolean | null;
		firstName?: string | null;
		lastName?: string | null;
		/** Distinct IA cases (numOfIa counts allegation rows). */
		numOfIaCases?: number | null;
		payPeerGroup?: "sworn" | "civilian" | null;
		payRank?: number | null;
		payPeers?: number | null;
		payPercentile?: number | null;
		payPeerAvg?: number | string | null;
		payRatioToAvg?: number | string | null;
	}

	/** One officer × year from vw_v2_officer_year_stats (home year filter). */
	interface OfficerYearStats {
		bpiId: string;
		year: number;
		title: string | null;
		peerGroup: "sworn" | "civilian" | null;
		totalPay: number | string | null;
		regularPay: number | string | null;
		retroPay: number | string | null;
		otherPay: number | string | null;
		overtimePay: number | string | null;
		injuredPay: number | string | null;
		detailPay: number | string | null;
		quinnPay: number | string | null;
		payRank: number | null;
		payPeers: number | null;
		payPercentile: number | null;
		payPeerAvg: number | string | null;
		payRatioToAvg: number | string | null;
		numOfIaCases: number;
		numOfDetail: number;
		numOfFio: number;
		numOfMvc: number;
	}

	type HomepageData = {
		[key in typeof homepage_alias_name]: {
			edges: { node: SearchResponseData }[];
		};
	};
}

export {};
