/* TODO: When adding new data you need to make the following interfaces:
- Record (interface)
- Response (interface)
*/

declare global {
	/* ------------------- DETAIL RECORDS ---------------------*/
	interface DetailRecord {
		adminFeeFlag: string; // "Y" or "N"
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
		payAmount: number;
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
		noShowFlag: string; // "Y" or "N"
		stateFunded: string; // "Y" or "N"
	}

	interface DetailRecordsResponse {
		records: {
			nodes: DetailRecord[];
			totalCount: number;
		};
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

	interface CourtOvertimeResponse {
		records: {
			nodes: CourtOvertimeRecord[];
			totalCount: number;
		};
	}

	/* ------------------- OFFICER IA ---------------------*/

	interface OfficerIARecord {
		iaNumber: string;
		badgeNo: number;
		incidentType: string;
		receivedDate: string;
		firstName: string;
		lastName: string;
		allegation: string;
		finding: string;
		actionTaken: string;
		leaDisposition: string;
		disposition: string;
		occuredDate: string;
		allegationDetails: string;
		allegationSubtype: string;
		allegationType: string;
		disciplines: string;
	}

	interface OfficerIAResponse {
		records: {
			nodes: OfficerIARecord[];
			totalCount: number;
		};
	}

	/* ------------------- FIO Record ---------------------*/

	interface FIORecord {
		contactDate: string;
		basis: string;
		circumstance: string;
		city: string;
		contactOfficerName: string;
		fcNum: string;
		frisked: string;
		keySituations: string;
		narrative: string;
		state: string;
		stopDuration: string;
		streetAddress: string;
		summonsIssued: string;
		supervisorName: string;
		vehicleSearched: string;
		vehicleModel: string;
		vehicleMake: string;
		vehicleColor: string;
		vehicleState: string;
		vehicleStyle: string;
		vehicleType: string;
		vehicleYear: number;
		weather: string;
		zip: string;
	}

	interface FIORecordResponse {
		records: {
			nodes: FIORecord[];
			totalCount: number;
		};
	}
}

// Added to prevent TS from considering this a legacy script and fail in prod
export {};
