"use client";

import HistogramDataFeeder, { Filter } from "./HistogramDataFeeder";
import { useEffect, useState } from "react";

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
	const [dimensions, setDimensions] = useState({ width: 860, height: 450 });
	
	useEffect(() => {
		const handleResize = () => {
			const isMobile = window.innerWidth < 640;
			setDimensions({
				width: isMobile ? Math.max(300, window.innerWidth - 40) : 860,
				height: isMobile ? 350 : 450
			});
		};
		
		handleResize();
		
		window.addEventListener('resize', handleResize);
		
		return () => window.removeEventListener('resize', handleResize);
	}, []);

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
		<div className="space-y-3 sm:space-y-4">
			<div className="w-full flex flex-col px-1 sm:px-0">
				<div className="flex flex-col mb-1 sm:mb-3">
					<h3 className="text-sm sm:text-lg font-medium text-gray-800 mb-1 sm:mb-0 text-center sm:text-left">
						Officer Pay Distribution
					</h3>
				</div>
				
				<p className="text-[11px] sm:text-sm text-gray-600 mb-2 sm:mb-3 leading-snug sm:leading-relaxed text-center sm:text-left">
					This chart shows how this officer's earnings compare to peers within the department's pay distribution. 
					Use the filter below to compare against officers of similar rank or the entire department.
				</p>
			</div>

			<div className="w-full flex justify-center items-center bg-white rounded-lg shadow-sm p-1 sm:p-3 overflow-x-auto">
				<div className="min-w-full w-full">
					<HistogramDataFeeder 
						width={dimensions.width} 
						height={dimensions.height} 
						specificOfficerFinancialData={reshapeFinancialDataInput(officerPayData)} 
						officerDetailData={officerDetailData} 
					/>
				</div>
			</div>
		</div>
	);
}
