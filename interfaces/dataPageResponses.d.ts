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
		bpiId: string;
		employeeId: number;
		badgeNo: number;
		firstName: string;
		lastName: string;
		titleRank: string;
		race: string;
		sex: string;
		iaNumber: string;
		incidentType: string;
		receivedDate: string;
		allegation: string;
		finding: string;
		actionTaken: string;
		daysHoursSuspended: string;
		// Legacy fields 
		leaDisposition?: string;
		disposition?: string;
		occuredDate?: string;
		allegationDetails?: string;
		allegationSubtype?: string;
		allegationType?: string;
		disciplines?: string;
		rank?: string; 
	}

	interface OfficerIAResponse {
		edges?: Array<{ node: OfficerIARecord }>;
		nodes?: OfficerIARecord[];
		totalCount: number;
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

	/* ------------------- CRIME INCIDENTS ---------------------*/
	interface CrimeIncidentRecord {
		id: string;
		geocodeLongitude: number;
		exceptionalClearanceDate: string | null;
		buiOfficerId: string | null;
		bagOfText: string;
		buiBadgeNo: string | null;
		numberOfOffenders: number | null;
		offenses: string | null;
		officerJournalName: string;
		numberOfArrestees: number | null;
		shooting: boolean | null;
		locationOfOccurrence: string;
		locationType: string | null;
		street: string | null;
		reportingArea: string | null;
		reportedLongitude: number | null;
		reportedLatitude: number | null;
		reportDate: string;
		officerId: string;
		occurredOnDate: string;
		numberOfVictims: number | null;
		nibrsOffenses: string | null;
		natureOfIncident: string;
		longitude: number;
		latitude: number;
		incidentNumber: number;
		incidentClearance: string | null;
		district: string | null;
		createdAt: string;
		geocodeLatitude: number;
		buiNameId: string | null;
		bpiId: string | null;
		attributions: string;
	}

	interface CrimeIncidentsResponse {
		records: {
			nodes: CrimeIncidentRecord[];
			totalCount: number;
		};
	}

	/* ------------------- BOSTON ARRESTS ---------------------*/
	interface BostonArrestRecord {
		pkey: number;
		objectid: string;
		arrestNum: string;
		incNum: string;
		chargeSeqNum: number;
		chargeCode: string;
		chargeDesc: string;
		nibrsCode: string;
		nibrsDesc: string;
		arrDate: string;
		genderDesc: string;
		raceDesc: string;
		ethnicityDesc: string;
		age: number;
		juvenile: string;
		hourOfDay: number;
		dayOfWeek: number;
		year: number;
		quarter: number;
		month: number;
		neighborhood: string;
		district: string;
	}

	interface BostonArrestsResponse {
		edges?: Array<{ node: BostonArrestRecord }>;
		nodes?: BostonArrestRecord[];
		totalCount: number;
	}

	interface EmployeeRecord {
		bpiId: string;
		employeeId: number;
		nameId: string;
		lastName: string;
		firstName: string;
		salPlan: string;
		jobTitle: string;
	}

	interface EmployeeResponse {
		edges?: Array<{ node: EmployeeRecord }>;
		nodes?: EmployeeRecord[];
		totalCount: number;
	}

	/* ------------------- TRAFFIC STOPS ---------------------*/
	interface TrafficStopRecord {
		bpiId: string;
		officerId: number;
		eventDate: string;
		timeHh: string;
		timeMm: string;
		amPm: string;
		violatorType: string;
		citationNumber: string;
		citationType: string;
		offenseCode: string;
		offenseDescription: string;
		locationName: string;
		race: string;
		gender: string;
		yearOfBirth: string;
		searched: string;
		crash: string;
	}

	interface TrafficStopsResponse {
		edges?: Array<{ node: TrafficStopRecord }>;
		nodes?: TrafficStopRecord[];
		totalCount: number;
	}

	/* ------------------- INCIDENT REPORT FALL 2025 ---------------------*/
	interface IRFall2025Record {
		bpiId: string;
		officerName: string;
		badgeNo: number;
		reportingOfficer: string;
		allAssistingOfficersAndAssistTypes: string | null;
		weaponForceInvolved: string | null;
		shooting: string | null;
		eventLocationStreetAddress: string | null;
		eventLocationCrossStreet1: string | null;
		eventLocationCrossStreet2: string | null;
		eventLocationNeighborhood: string | null;
		offenseLocationCrossStreet1: string | null;
		offenseLocationCrossStreet2: string | null;
		offenseLocationLat: string | null;
		offenseLocationLong: string | null;
		offenseLocationNeighborhood: string | null;
		date: string;
		time: string | null;
		eventDistrict: string | null;
		eventNeighborhood: string | null;
		suspectCount: string | null;
		totalCharges: string | null;
		chargeI: string | null;
		chargeIi: string | null;
		chargeIii: string | null;
	}

	interface IRFall2025Response {
		edges?: Array<{ node: IRFall2025Record }>;
		nodes?: IRFall2025Record[];
		totalCount: number;
	}
}

// Added to prevent TS from considering this a legacy script and fail in prod
export {};
