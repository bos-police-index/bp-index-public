"use client";
import { bpi_deep_green } from "@styles/theme/lightTheme";
import HistogramDataFeeder, { Filter } from "./HistogramDataFeeder";

interface FinancialHistogramProps {
	officerPayData: any;
	officerDetailData: Filter;
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

export default function FinancialHistogram({ officerPayData, officerDetailData, mode }: FinancialHistogramProps) {
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
		<>
			<div className="w-full max-w-4xl flex rounded-md flex-col mb-5">
				<p className="text-lg" style={{ color: bpi_deep_green, fontWeight: 500 }}>
					Individual Officer Pay Histogram
				</p>
				<p style={{ color: bpi_deep_green, fontWeight: 300, justifyContent: "left" }} className="text-sm">
					This feature shows how an officer’s various earnings compare to their peers by placing them within a percentile of the department’s overall pay distribution. It helps users quickly see whether an officer earns more or less than most others. Turning the Filtering by rank option
					enables you to only compare an officer against similar ranking peers.{" "}
				</p>
			</div>

			<div className="w-full max-w-4xl flex justify-center items-center bg-white p-6 rounded-md flex-col">
				<HistogramDataFeeder width={860} height={450} specificOfficerFinancialData={reshapeFinancialDataInput(officerPayData)} officerDetailData={officerDetailData} />
			</div>
		</>
	);
}
