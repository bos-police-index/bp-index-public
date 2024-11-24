import { useEffect, useState } from "react";
import { Histogram } from "./Histogram";
import { EmployeeFinancial, fetchFinancialsHistogram, PayTypeBuckets } from "@utility/dataUtils";
import ArrowCircleRightIcon from "@mui/icons-material/ArrowCircleRight";
import ArrowCircleLeftIcon from "@mui/icons-material/ArrowCircleLeft";
import { PayTypeMap } from "./FinancialHistogram";
import { bpi_deep_green, payCategoryColorMap } from "@styles/theme/lightTheme";
import { PayCategories } from "./Rectangle";

const BUTTONS_HEIGHT = 50;

type HistogramDataFeederProps = {
	width: number;
	height: number;
	specificOfficerFinancialData: PayTypeMap;
};

const buttonStyle = {
	borderRadius: "3px",
	padding: "0px 8px",
	margin: "10px 2px",
	fontSize: 14,
	opacity: 0.7,
};

const HistogramDataFeeder = ({ width, height, specificOfficerFinancialData }: HistogramDataFeederProps) => {
	const [allOfficerFinancialData, setAllOfficerFinancialData] = useState<PayTypeBuckets>();
	const [selectedData, setSelectedData] = useState<number[]>();
	const [selectedCategory, setSelectedCategory] = useState<PayCategories>();
	const [selectedYearIndex, setSelectedYearIndex] = useState<number>();
	const [validYears, setValidYears] = useState<number[]>();
	const [specificOfficerPayValue, setSpecificOfficerPayValue] = useState<number>();

	useEffect(() => {
		const fetchData = async () => {
			const data: PayTypeBuckets = await fetchFinancialsHistogram();
			setAllOfficerFinancialData(data);

			// set to the most recent year in the data
			let i = 1;
			while (data[Number(Object.keys(data)[Object.keys(data).length - i])].regularPay.length == 0) {
				i++;
			}
			const validYears = Object.keys(specificOfficerFinancialData)
				.slice(0, Object.keys(data).length - i + 1)
				.map(Number); // Cast to numbers

			setValidYears(validYears);
			console.log(validYears[validYears.length - 1]);
			setSelectedYearIndex(validYears.length - 1);
		};
		fetchData();
		setSelectedCategory(PayCategories.totalPay);
	}, []);

	useEffect(() => {
		// Ensure all data is available before proceeding
		if (!allOfficerFinancialData || !selectedYearIndex || !selectedCategory) {
			return;
		}

		let chosenData: number[];
		let year: number = validYears[selectedYearIndex];
		let specificOfficerValue: number;

		// normalize the values
		switch (selectedCategory) {
			case PayCategories.totalPay:
				chosenData = allOfficerFinancialData[year].totalPay;
				specificOfficerValue = specificOfficerFinancialData[year].totalPay;
				break;
			case PayCategories.otPay:
				chosenData = allOfficerFinancialData[year].otPay;
				specificOfficerValue = specificOfficerFinancialData[year].otPay;
				break;
			case PayCategories.detailPay:
				chosenData = allOfficerFinancialData[year].detailPay;
				specificOfficerValue = specificOfficerFinancialData[year].detailPay;
				break;
			case PayCategories.otherPay:
				chosenData = allOfficerFinancialData[year].otherPay;
				specificOfficerValue = specificOfficerFinancialData[year].otherPay;
				break;
			case PayCategories.retroPay:
				chosenData = allOfficerFinancialData[year].retroPay;
				specificOfficerValue = specificOfficerFinancialData[year].retroPay;
				break;
			case PayCategories.regularPay:
				chosenData = allOfficerFinancialData[year].regularPay;
				specificOfficerValue = specificOfficerFinancialData[year].regularPay;
				break;
			case PayCategories.injuredPay:
				chosenData = allOfficerFinancialData[year].injuredPay;
				specificOfficerValue = specificOfficerFinancialData[year].injuredPay;
				break;
			case PayCategories.quinnPay:
				chosenData = allOfficerFinancialData[year].quinnPay;
				specificOfficerValue = specificOfficerFinancialData[year].quinnPay;
				break;
		}
		setSpecificOfficerPayValue(specificOfficerValue);
		setSelectedData(chosenData);
	}, [selectedCategory, allOfficerFinancialData, selectedYearIndex]);

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
			return false; // Invalid option
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

	const ButtonGroup = () => {
		const buttonLabels = {
			[PayCategories.totalPay]: "Total Pay",
			[PayCategories.regularPay]: "Regular Pay",
			[PayCategories.detailPay]: "Detail Pay",
			[PayCategories.otPay]: "Overtime Pay",
			[PayCategories.retroPay]: "Retroactive Pay",
			[PayCategories.injuredPay]: "Injured Pay",
			[PayCategories.quinnPay]: "Quinn Pay",
			[PayCategories.otherPay]: "Other Pay",
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
		<div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
			<ButtonGroup />
			<YearToggle />

			<Histogram mode={selectedCategory} width={width} height={height - BUTTONS_HEIGHT} data={selectedData} verticalLineX={specificOfficerPayValue || 0} />
		</div>
	) : (
		<div style={{ width: 860, height: 450, backgroundColor: "white" }}></div>
	);
};

export default HistogramDataFeeder;
