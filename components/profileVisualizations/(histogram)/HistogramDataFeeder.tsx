import { useEffect, useState } from "react";

import ArrowCircleRightIcon from "@mui/icons-material/ArrowCircleRight";
import ArrowCircleLeftIcon from "@mui/icons-material/ArrowCircleLeft";

import { Histogram } from "./Histogram";
import { fetchFinancialsHistogram } from "services/profile/financial_histogram/data_fetchers";
import { PayTypeMap } from "./FinancialHistogram";
import { payCategoryColorMap } from "@styles/theme/lightTheme";
import { PayCategories } from "./Rectangle";

const BUTTONS_HEIGHT = 50;

type HistogramDataFeederProps = {
	width: number;
	height: number;
	specificOfficerFinancialData: PayTypeMap;
	officerDetailData: Filter;
};

export type Filter = {
	rank: String;
	unit: String;
	zipCode: number;
	sex: String;
	race: String;
};

interface FinancialDataSplit {
	[filter: string]: PayTypeBuckets;
}

const buttonStyle = {
	borderRadius: "3px",
	padding: "0px 8px",
	margin: "10px 2px",
	fontSize: 14,
	opacity: 0.7,
};

const HistogramDataFeeder = ({ width, height, specificOfficerFinancialData, officerDetailData }: HistogramDataFeederProps) => {
	const [officerFinancialDataSplit, setOfficerFinancialDataSplit] = useState<FinancialDataSplit>();
	const [selectedData, setSelectedData] = useState<number[]>();
	const [selectedCategory, setSelectedCategory] = useState<PayCategories>();
	const [selectedFilter, setSelectedFilter] = useState<string>("rank");
	const [selectedYearIndex, setSelectedYearIndex] = useState<number>();
	const [validYears, setValidYears] = useState<number[]>();
	const [specificOfficerPayValue, setSpecificOfficerPayValue] = useState<number>();
	const [isMobile, setIsMobile] = useState<boolean>(false);
	
	// Handle window resize for responsive design
	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 640);
		checkMobile();
		
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	useEffect(() => {
		const fetchData = async () => {
			// get data split by filter attribute and add them to the map that works with selectedFilter
			const [matching, nonMatching]: PayTypeBuckets[] = await fetchFinancialsHistogram(officerDetailData.rank);
			setOfficerFinancialDataSplit({ rank: matching, none: nonMatching });

			// set to the most recent year in the data
			let i = 1;
			while (matching[Number(Object.keys(matching)[Object.keys(matching).length - i])].regularPay.length == 0) {
				i++;
			}
			const validYears = Object.keys(specificOfficerFinancialData)
				.slice(0, Object.keys(matching).length - i + 1)
				.map(Number);

			setValidYears(validYears);
			setSelectedYearIndex(validYears.length - 1);
		};
		fetchData();
		setSelectedCategory(PayCategories.totalPay);
	}, []);

	useEffect(() => {
		// helper to get data by filter and category
		const getChosenData = (year): [number[], number] => {
			var payTypeBucketRow: number[] = officerFinancialDataSplit[selectedFilter][year][selectedCategory] || [];
			var specificOfficerValue: number = specificOfficerFinancialData[year]?.[selectedCategory] || 0;

			// if no filter get all values
			if (selectedFilter == "none") {
				payTypeBucketRow = [...payTypeBucketRow, ...officerFinancialDataSplit["rank"][year][selectedCategory]];
			}

			return [payTypeBucketRow, specificOfficerValue];
		};

		// Ensure all data is available before proceeding
		if (!officerFinancialDataSplit || !selectedYearIndex || !selectedCategory || !selectedFilter) {
			return;
		}

		let year: number = validYears[selectedYearIndex];
		let specificOfficerValue: number;
		let filteredData: number[];

		[filteredData, specificOfficerValue] = getChosenData(year);

		// get the values of a specific category
		setSpecificOfficerPayValue(specificOfficerValue);
		setSelectedData(filteredData || []);
	}, [selectedCategory, officerFinancialDataSplit, selectedYearIndex, selectedFilter]);

	function handleYearChange(option: string) {
		if (option == "increase") {
			if (!validYears[selectedYearIndex + 1]) {
				throw new Error("Illegal range, no data there");
			}

			setSelectedYearIndex(selectedYearIndex + 1);
		} else if (option == "decrease") {
			if (!validYears[selectedYearIndex - 1]) {
				throw new Error("Illegal range, no data there");
			}
			setSelectedYearIndex(selectedYearIndex - 1);
		} else {
			throw new Error("Illegal option for handleYearChange");
		}
	}

	function checkNextYearValid(option: string): boolean {
		if (!validYears || selectedYearIndex == null) {
			return false;
		}

		if (option === "increase") {
			return selectedYearIndex + 1 < validYears.length;
		} else if (option === "decrease") {
			return selectedYearIndex - 1 > -1;
		} else {
			return false;
		}
	}

	const YearToggle: React.FC = () => {
		return selectedData ? (
			<div className="flex items-center justify-center space-x-1 sm:space-x-2 py-1 sm:py-2">
				<button 
					onClick={() => handleYearChange("decrease")} 
					disabled={!checkNextYearValid("decrease")} 
					className={`p-0.5 sm:p-1 rounded-full transition-all duration-200 ${!checkNextYearValid("decrease") 
						? 'text-gray-300 cursor-not-allowed' 
						: 'text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50'}`}
				>
					<ArrowCircleLeftIcon fontSize={isMobile ? "small" : "medium"} className="text-[18px] sm:text-[24px]" />
				</button>
				<div className="text-xs sm:text-sm font-medium px-2 sm:px-3 py-0.5 sm:py-1 bg-indigo-50 text-indigo-800 rounded-md">
					{validYears[selectedYearIndex]}
				</div>
				<button 
					onClick={() => handleYearChange("increase")} 
					disabled={!checkNextYearValid("increase")} 
					className={`p-0.5 sm:p-1 rounded-full transition-all duration-200 ${!checkNextYearValid("increase") 
						? 'text-gray-300 cursor-not-allowed' 
						: 'text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50'}`}
				>
					<ArrowCircleRightIcon fontSize={isMobile ? "small" : "medium"} className="text-[18px] sm:text-[24px]" />
				</button>
			</div>
		) : (
			<></>
		);
	};

	// UNCOMMENT TO USE THIS LATER IF YOU ADD MORE FILTER OPTIONS
	// const FilterButton: React.FC = () => {
	// 	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	// 	const open = Boolean(anchorEl);

	// 	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
	// 		setAnchorEl(event.currentTarget);
	// 	};

	// 	const handleClose = () => {
	// 		setAnchorEl(null);
	// 	};

	// 	const filters = ["Rank", "Unit", "Zip Code", "Sex", "Race"];

	// 	const handleMenuItemClick = (filter: string) => {
	// 		setSelectedFilter(filter);
	// 		handleClose();
	// 	};

	// 	return (
	// 		<div>
	// 			<Button
	// 				onClick={handleClick}
	// 				style={{
	// 					color: bpi_deep_green,
	// 					fontSize: "small",
	// 					display: "flex",
	// 					alignItems: "center",
	// 					gap: "0.5rem",
	// 					width: "10rem",
	// 				}}
	// 			>
	// 				<FilterAltIcon fontSize="medium" />
	// 				FILTER {selectedFilter ? selectedFilter.toUpperCase() : "NONE"}
	// 			</Button>
	// 			<Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
	// 				{filters.map((filter, index) => (
	// 					<MenuItem key={index} onClick={() => handleMenuItemClick(filter)}>
	// 						{filter}
	// 					</MenuItem>
	// 				))}
	// 			</Menu>
	// 		</div>
	// 	);
	// };

	const FilterToggle = () => {
		const toggleFunction = () => {
			if (selectedFilter == "rank") setSelectedFilter("none");
			else setSelectedFilter("rank");
		};

		return (
			<div className="flex items-center space-x-2">
				<div 
					onClick={toggleFunction}
					className={`flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium cursor-pointer transition-all duration-200 ${
						selectedFilter == "rank" 
							? 'bg-indigo-100 text-indigo-800' 
							: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
					}`}
				>
					<span className="mr-1 sm:mr-2">
						<span className="hidden sm:inline">Filter by Rank</span>
						<span className="sm:hidden">By Rank</span>
					</span>
					<div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${selectedFilter == "rank" ? 'bg-indigo-500' : 'bg-gray-400'}`}></div>
				</div>
			</div>
		);
	};

	const ButtonGroup = () => {
		const buttonLabels = {
			[PayCategories.totalPay]: "Total",
			[PayCategories.regularPay]: "Regular",
			[PayCategories.detailPay]: "Detail",
			[PayCategories.otPay]: "Overtime",
			[PayCategories.retroPay]: "Retroactive",
			[PayCategories.injuredPay]: "Injured",
			[PayCategories.quinnPay]: "Quinn",
			[PayCategories.otherPay]: "Other",
		};

		const getMobileCategories = () => {
			const entries = Object.entries(buttonLabels);
			const firstRow = entries.slice(0, 4);
			const secondRow = entries.slice(4);
			return [firstRow, secondRow];
		};
		
		const mobileRows = getMobileCategories();
		
		return (
			<div className="my-2" style={{ minHeight: BUTTONS_HEIGHT }}>
				<div className="sm:hidden flex flex-col space-y-1.5">
					{mobileRows.map((row, rowIndex) => (
						<div key={`row-${rowIndex}`} className="flex justify-center gap-1">
							{row.map(([category, label]) => {
								const isSelected = selectedCategory === category;
								const color = payCategoryColorMap[category];
								const truncatedLabel = label.length > 6 ? `${label.slice(0, 3)}...` : label;
								
								return (
									<button
										key={category}
										className={`px-1.5 py-1 text-[10px] font-medium rounded-md transition-all duration-200 ${
											isSelected 
												? 'shadow-sm' 
												: 'hover:bg-opacity-20 hover:shadow-sm'
										}`}
										style={{
											backgroundColor: isSelected ? color : 'transparent',
											color: isSelected ? 'white' : color,
											borderWidth: 1,
											borderColor: color,
										}}
										onClick={() => setSelectedCategory(category as PayCategories)}
										title={label}
									>
										{truncatedLabel}
									</button>
								);
							})}
						</div>
					))}
				</div>
				
				<div className="hidden sm:flex flex-wrap gap-1.5 justify-center">
					{Object.entries(buttonLabels).map(([category, label]) => {
						const isSelected = selectedCategory === category;
						const color = payCategoryColorMap[category];
						
						return (
							<button
								key={category}
								className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
									isSelected 
										? 'shadow-sm' 
										: 'hover:bg-opacity-20 hover:shadow-sm'
								}`}
								style={{
									backgroundColor: isSelected ? color : 'transparent',
									color: isSelected ? 'white' : color,
									borderWidth: 1,
									borderColor: color,
								}}
								onClick={() => setSelectedCategory(category as PayCategories)}
							>
								{label}
							</button>
						);
					})}
				</div>
			</div>
		);
	};


	return selectedData ? (
		<div className="flex flex-col items-center w-full max-w-full overflow-hidden">
			<div className="flex flex-col sm:flex-row items-center justify-between w-full mb-2 sm:mb-3 px-1 sm:px-2">
				<div className="flex items-center mb-2 sm:mb-0 w-full sm:w-auto justify-center sm:justify-start">
					<FilterToggle />
				</div>
				<YearToggle />
			</div>
			
			<ButtonGroup />

			<div className="mt-1 sm:mt-2 w-full bg-gradient-to-b from-white to-indigo-50/10 rounded-lg p-1 sm:p-2 overflow-visible">
				<div className="overflow-visible w-full flex justify-center">
					<Histogram 
						mode={selectedCategory} 
						width={width} 
						height={height - (isMobile ? BUTTONS_HEIGHT/1.5 : BUTTONS_HEIGHT)} 
						data={selectedData} 
						verticalLineX={specificOfficerPayValue || 0} 
					/>
				</div>
			</div>
		</div>
	) : (
		<div style={{ width: 860, height: 450, backgroundColor: "white" }}></div>
	);
};

export default HistogramDataFeeder;
