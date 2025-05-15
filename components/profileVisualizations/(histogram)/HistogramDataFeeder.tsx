import { useEffect, useState } from "react";
import { Histogram } from "./Histogram";
import { fetchFinancialsHistogram } from "services/profile/financial_histogram/data_fetchers";
import ArrowCircleRightIcon from "@mui/icons-material/ArrowCircleRight";
import ArrowCircleLeftIcon from "@mui/icons-material/ArrowCircleLeft";
import { PayTypeMap } from "./FinancialHistogram";
import { bpi_deep_green, bpi_light_green, payCategoryColorMap } from "@styles/theme/lightTheme";
import { PayCategories } from "./Rectangle";
import { FormControlLabel, Switch } from "@mui/material";

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
			<div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
				<button onClick={() => handleYearChange("decrease")} disabled={!checkNextYearValid("decrease")} style={{ opacity: !checkNextYearValid("decrease") ? 0.3 : 1 }}>
					<ArrowCircleLeftIcon />
				</button>
				{validYears[selectedYearIndex]}
				<button onClick={() => handleYearChange("increase")} disabled={!checkNextYearValid("increase")} style={{ opacity: !checkNextYearValid("increase") ? 0.3 : 1 }}>
					<ArrowCircleRightIcon />
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
			<FormControlLabel
				control={
					<Switch
						checked={selectedFilter == "rank"}
						onClick={toggleFunction}
						sx={{
							"& .MuiSwitch-colorPrimary": {
								color: `${bpi_deep_green} !important`,
							},
							"& .MuiSwitch-track": {
								backgroundColor: selectedFilter == "rank" ? `${bpi_light_green} !important` : "grey !important",
							},

							"& .MuiSwitch-input": {
								color: bpi_deep_green,
								backgroundColor: bpi_deep_green,
							},
						}}
					/>
				}
				label="Filter by Rank"
			/>
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

		return (
			<div style={{ height: BUTTONS_HEIGHT }}>
				{Object.entries(buttonLabels).map(([category, label]) => (
					<button
						key={category}
						style={{
							...buttonStyle,
							backgroundColor: selectedCategory === category ? payCategoryColorMap[category] : "transparent",
							color: selectedCategory === category ? "white" : payCategoryColorMap[category],
							opacity: selectedCategory === category ? 1 : 0.7,
							borderWidth: 1,
							borderColor: payCategoryColorMap[category],
						}}
						onClick={() => setSelectedCategory(category as PayCategories)}
					>
						{label}
					</button>
				))}
			</div>
		);
	};


	return selectedData ? (
		<div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1rem 1rem" }}>
			<div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
				<p style={{ color: "black", fontSize: "large", textAlign: "center", flexGrow: 1 }}>Individual Officer Pay Distribution</p>
				<div style={{ marginLeft: "auto" }}>
					<FilterToggle />
				</div>
			</div>
			<ButtonGroup />

			<YearToggle />

			<Histogram mode={selectedCategory} width={width} height={height - BUTTONS_HEIGHT} data={selectedData} verticalLineX={specificOfficerPayValue || 0} />
		</div>
	) : (
		<div style={{ width: 860, height: 450, backgroundColor: "white" }}></div>
	);
};

export default HistogramDataFeeder;
