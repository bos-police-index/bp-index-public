// Used by /profile/[bpiId].tsx

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
}
