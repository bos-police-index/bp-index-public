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
		totalPay: number | null;
		overtimePay: number | null;
		detailPay: number | null;
		otherPay: number | null;
		numOfIa: number | null;
		race: string | null;
		sex: string | null;
	}

	type HomepageData = {
		[key in typeof homepage_alias_name]: {
			edges: { node: SearchResponseData }[];
		};
	};
}

export {};
