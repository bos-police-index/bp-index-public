// Used by /profile/[bpiId].tsx

declare global {
	interface OfficerData {
		bpiId: string;
		name: string;
		badgeNo: number;
		rank: string;
		unit: string;
		residence: string;
		sex: string;
		race: string;
		totalEarnings: number;
		ia_num: number;
		detail_num: number;
		fio_record_num: number;
		totalPayPercentile: number;
	}

	interface FinancialEmployeeData {
		org: string;
		badgeNo: number;
		numOfIa: number;
		rank: string;
		race: string;
		sex: string;
		unit: string;
		unionCode: string;
		zipCode: string;
		firstName: string;
		lastName: string;
		otPay: number;
		otherPay: number;
		quinnPay: number;
		regularPay: number;
		retroPay: number;
		totalPay: number;
		detailPay: number;
		injuredPay: number;
		year: number;
		totalPayPercentile: number;
	}

	// ---- V2 (auto-fed pipeline) ------------------------------------------------

	interface V2OfficerProfile {
		bpiId: string;
		employeeId: number | null;
		mptcId: string | null;
		badgeNo: number | null;
		firstName: string | null;
		lastName: string | null;
		middleName: string | null;
		canonicalName: string | null;
		earningsLastUpdated: string | null;
		fioLastUpdated: string | null;
		postCertLastUpdated: string | null;
		postDecertLastUpdated: string | null;
		misconductLastUpdated: string | null;
		identityConfidence: string | null;
		rosterSource: string | null;
		identityAsOf: string | null;
		rank: string | null;
		hireDate: string | null;
	}

	type V2LinkMethod = "id" | "name";

	interface V2EarningsRow {
		linkMethod?: V2LinkMethod;
		confirmed?: boolean;
		bpiId: string;
		year: number;
		departmentName: string | null;
		title: string | null;
		regularPay: number | null;
		retroPay: number | null;
		otherPay: number | null;
		otPay: number | null;
		injuredPay: number | null;
		detailPay: number | null;
		quinnPay: number | null;
		totalPay: number | null;
		source: string;
		asOf: string;
	}

	interface V2PostCertificationRow {
		linkMethod?: V2LinkMethod;
		confirmed?: boolean;
		bpiId: string | null;
		mptcId: string;
		certification: string | null;
		status: string | null;
		expiration: string | null;
		agency: string | null;
		additionalInfo: string | null;
		source: string;
		asOf: string;
	}

	interface V2MisconductRow {
		linkMethod?: V2LinkMethod;
		confirmed?: boolean;
		bpiId: string | null;
		caseNumber: string | null;
		incidentType: string | null;
		allegation: string | null;
		finding: string | null;
		actionTaken: string | null;
		receivedDate: string | null;
		completedDate: string | null;
		source: string;
		asOf: string;
	}

	interface V2FioRow {
		bpiId: string | null;
		fcNum: string | null;
		contactDate: string | null;
		location: string | null;
		frisked: boolean | null;
		vehicleSearched: boolean | null;
		basis: string | null;
		circumstance: string | null;
		narrative: string | null;
		source: string;
		asOf: string;
	}

	interface V2PostDecertificationRow {
		bpiId: string | null;
		mptcId: string;
		decertificationDate: string | null;
		reason: string | null;
		agency: string | null;
		source: string;
		asOf: string;
	}

	interface V2PaidDetailRow {
		bpiId: string | null;
		trackingNo: number | null;
		startDate: string | null;
		startTime: string | null;
		endTime: string | null;
		hoursWorked: number | null;
		detailType: string | null;
		customerName: string | null;
		customerCity: string | null;
		street: string | null;
		orgDesc: string | null;
		payAmount: number | null;
		source: string;
		asOf: string;
	}

	interface V2TrafficCitationRow {
		bpiId: string | null;
		eventDate: string | null;
		citationNumber: string | null;
		citationType: string | null;
		violationType: string | null;
		offenseDesc: string | null;
		disposition: string | null;
		locationName: string | null;
		searched: boolean | null;
		crash: boolean | null;
		subjectRace: string | null;
		subjectGender: string | null;
		issuingAgency: string | null;
		source: string;
		asOf: string;
	}

	interface V2IncidentRow {
		bpiId: string | null;
		incidentNumber: string | null;
		occurredOnDate: string | null;
		district: string | null;
		shooting: boolean | null;
		location: string | null;
		natureOfIncident: string | null;
		offenses: string | null;
		incidentClearance: string | null;
		numArrestees: number | null;
		numVictims: number | null;
		url: string | null;
		source: string;
		asOf: string;
	}

	interface V2AssignmentRow {
		bpiId: string | null;
		employeeId: number | null;
		workgroup: string | null;
		tskprofId: string | null;
		descr: string | null;
		effDate: string | null;
	}

	interface OfficerYearHistoryRow {
		bpiId: string;
		employeeId: number;
		year: number;
		lastName: string;
		firstName: string;
		badgeNo: number;
		rank: string;
		units: string | null;
		tskprofIds: string | null;
		tskprofDescs: string | null;
		jobTitles: string | null;
		hrAnnualRate: number | null;
		regularPay: number | null;
		retroPay: number | null;
		otherPay: number | null;
		otPay: number | null;
		injuredPay: number | null;
		detailPay: number | null;
		quinnPay: number | null;
		totalPay: number | null;
		totalPayPercentile: number | null;
	}
}
// Added to prevent TS from considering this a legacy script and fail in prod
export {};
