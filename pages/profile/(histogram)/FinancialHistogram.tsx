"use client";
import HistogramDataFeeder from "./HistogramDataFeeder";

interface FinancialHistogramProps {
	officerPayData: any;
	mode: string; // use this later if you want to make different charts with set views
}

export interface PayTypeMap {
	[year: number]: {
		totalPay: number;
		detailPay: number;
		injuredPay: number;
		otherPay: number;
		regularPay: number;
		quinnPay: number;
		retroPay: number;
		otPay: number;
	};
}

export default function FinancialHistogram({ officerPayData, mode }: FinancialHistogramProps) {
	function reshapeFinancialDataInput(data) {
		if (!data) {
			return;
		}
		const { table } = data;

		// Initialize the payTypeMap structure
		const payTypeMap: PayTypeMap = {};

		table.forEach((row) => {
			const { year, totalPay, detailPay, injuredPay, otherPay, regularPay, quinnPay, retroPay, otPay } = row;

			// Ensure the year exists in the payTypeMap structure
			if (!payTypeMap[year]) {
				payTypeMap[year] = {
					totalPay: 0,
					detailPay: 0,
					injuredPay: 0,
					otherPay: 0,
					regularPay: 0,
					quinnPay: 0,
					retroPay: 0,
					otPay: 0,
				};
			}

			// Push values into the respective pay type array
			payTypeMap[year].totalPay = totalPay;
			payTypeMap[year].detailPay = detailPay;
			payTypeMap[year].injuredPay = injuredPay;
			payTypeMap[year].otherPay = otherPay;
			payTypeMap[year].regularPay = regularPay;
			payTypeMap[year].quinnPay = quinnPay;
			payTypeMap[year].retroPay = retroPay;
			payTypeMap[year].otPay = otPay;
		});

		return payTypeMap;
	}

	return (
		<div className="bg-white p-4 rounded-md">
			<HistogramDataFeeder width={860} height={450} specificOfficerFinancialData={reshapeFinancialDataInput(officerPayData)} />
		</div>
	);
}
