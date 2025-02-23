/* TODO: When adding new data you need to make the following interfaces:
- Record 
- Edge 
- PageInfo
- Collection
- Response
*/

declare global {
	/* ------------------- DETAIL RECORDS ---------------------*/
	interface DetailRecord {
		adminFeeFlag: string;
		badgeNo: number;
		bpdCustomerNo: number;
		customerNo: number;
		customerSeq: number;
		detailRank: number;
		detailType: string;
		districtWorked: number;
		endTime: string;
		hoursWorked: number;
		nameId: string;
		payAmount: string;
		payHours: number;
		payRate: number;
		race: string;
		payTrcCode: string;
		sex: string;
		startDate: string;
		startTime: string;
		street: string;
		xstreet: string;
		trackingNo: number;
		streetNo: string;
		empRank: number;
		empOrgCode: number;
		customerName: string;
		noShowFlag: string;
		prepaidFlag: string;
		stateFunded: string;
	}

	interface DetailRecordsEdge {
		node: DetailRecord;
		cursor: string;
	}

	interface DetailRecordsPageInfo {
		endCursor: string;
		hasNextPage: boolean;
	}

	type DetailRecordsCollection = Record<string, { edges: DetailRecordsEdge[]; pageInfo: DetailRecordsPageInfo }>;

	interface DetailRecordsResponse {
		data: DetailRecordsCollection;
	}

	/* ------------------- COURT OVERTIME ---------------------*/

	interface CourtOvertimeRecord {
		assignedDesc: string;
		chargedDesc: string;
		description: string;
		endTime: number;
		name: string;
		otCode: number;
		otDate: string;
		race: string;
		rank: string;
		sex: string;
		startTime: number;
		workedHours: number;
	}

	interface CourtOvertimeEdge {
		node: CourtOvertimeRecord;
		cursor: string;
	}

	interface CourtOvertimePageInfo {
		endCursor: string;
		hasNextPage: boolean;
	}

	type CourtOvertimeCollection = Record<string, { edges: CourtOvertimeEdge[]; pageInfo: CourtOvertimePageInfo }>;

	interface CourtOvertimeResponse {
		data: CourtOvertimeCollection;
	}

	/* ------------------- OFFICER IA ---------------------*/

	interface OfficerIARecord {
		actionTaken: string;
		adminLeave: string;
		allegation: string;
		badgeNo: number;
		dateReceived: string;
		dateHired: string;
		daysOrHoursSuspended: string;
		finding: string;
		firstName: string;
		lastName: string;
		iaNo: string;
		incidentType: string;
		race: string;
		sex: string;
		unionCode: string;
	}

	interface OfficerIAEdge {
		node: OfficerIARecord;
		cursor: string;
	}

	interface OfficerIAPageInfo {
		endCursor: string;
		hasNextPage: boolean;
	}

	type OfficerIACollection = Record<string, { edges: OfficerIAEdge[]; pageInfo: OfficerIAPageInfo }>;

	interface OfficerIAResponse {
		data: OfficerIACollection;
	}
}
// Added to prevent TS from considering this a legacy script and fail in prod
export {};
