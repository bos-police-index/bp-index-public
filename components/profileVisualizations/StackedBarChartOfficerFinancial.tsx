"use client";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { bpi_deep_green, payCategoryColorMap } from "@styles/theme/lightTheme";
import { formatMoney } from "@utility/textFormatHelpers";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface EmployeeFinancial {
	id: number;
	__typename: "LinkSu24EmployeeFinancial";
	race: "WHITE" | "BLACK" | "HISPANIC" | "ASIAN" | "OTHER";
	rank: string;
	sex: "M" | "F";
	unit: string;
	year: number;
	zipCode: string;
	unionCode: string;
	badgeNo: number;
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
}

function PayStackedBarChart(data) {
	const tableData: EmployeeFinancial[] = data?.data?.props?.table || [];
	if (!tableData || !tableData.length) {
		return <div>No financial data available</div>;
	}

	// Mapping the data to extract relevant pay fields for each year
	const financialYearsPay = tableData.map((table: EmployeeFinancial) => ({
		year: table.year,
		regularPay: table.regularPay,
		detailPay: table.detailPay,
		otherPay: table.otherPay,
		injuredPay: table.injuredPay,
		retroPay: table.retroPay,
		quinnPay: table.quinnPay,
		otPay: table.otPay,
	}));

	// Preparing the labels (unique years)
	const years = Array.from(new Set(financialYearsPay.map((item) => item.year))).sort((a, b) => a - b);

	// Prepare datasets for each pay type
	const datasets = [
		{
			label: "Regular",
			data: years.map((year) => financialYearsPay.find((item) => item.year === year)?.regularPay || 0),
			backgroundColor: payCategoryColorMap.regularPay,
		},
		{
			label: "Detail",
			data: years.map((year) => financialYearsPay.find((item) => item.year === year)?.detailPay || 0),
			backgroundColor: payCategoryColorMap.detailPay,
		},
		{
			label: "Other",
			data: years.map((year) => financialYearsPay.find((item) => item.year === year)?.otherPay || 0),
			backgroundColor: payCategoryColorMap.otherPay,
		},
		{
			label: "Injured",
			data: years.map((year) => financialYearsPay.find((item) => item.year === year)?.injuredPay || 0),
			backgroundColor: payCategoryColorMap.injuredPay,
		},
		{
			label: "Retroactive",
			data: years.map((year) => financialYearsPay.find((item) => item.year === year)?.retroPay || 0),
			backgroundColor: payCategoryColorMap.retroPay,
		},
		{
			label: "Quinn",
			data: years.map((year) => financialYearsPay.find((item) => item.year === year)?.quinnPay || 0),
			backgroundColor: payCategoryColorMap.quinnPay,
		},
		{
			label: "Overtime",
			data: years.map((year) => financialYearsPay.find((item) => item.year === year)?.otPay || 0),
			backgroundColor: payCategoryColorMap.otPay,
		},
	];

	const options = {
		responsive: true,
		plugins: {
			legend: {
				position: "top" as const,
			},
			title: {
				display: true,
				text: "Annual Earnings Breakdown",
			},
			tooltip: {
				callbacks: {
					label: (tooltipItem) => {
						const dataset = datasets[tooltipItem.datasetIndex];
						const value = tooltipItem.raw; // Access the value of the bar segment
						const label = dataset.label; // Access the label of the dataset
						const yearIndex = tooltipItem.dataIndex;
						const totalPay = datasets.reduce((sum, ds) => sum + ds.data[yearIndex], 0);
						const percentage = ((value / totalPay) * 100).toFixed(1);

						return [`${label}: ${formatMoney(value)} (${percentage}%)`, `Total: ${formatMoney(totalPay)}`];
					},
				},
			},
		},
		scales: {
			x: {
				stacked: true,
			},
			y: {
				stacked: true,
				suggestedMax: 200000,
			},
		},
	};

	// Prepare data for Chart.js
	const chartData = {
		labels: years,
		datasets: datasets,
	};

	if (!data || !data.data || !data.data.props) {
		console.error("Invalid data format passed to PayStackedBarChart.", data);
		return <div>Invalid data format</div>;
	}

	return (
		<>
			<div className="w-full max-w-4xl flex rounded-md flex-col mb-5">
				<p className="text-lg" style={{ color: bpi_deep_green, fontWeight: 500 }}>
					Officer Earnings Visualization
				</p>
				<p style={{ color: bpi_deep_green, fontWeight: 300, justifyContent: "left" }} className="text-sm">
					This tool provides a look at individual police officers' earnings, including base salary, overtime, detail, etc. By visualizing this data, users can better understand patterns in an officer earnings, identify trends in earning patterns.
				</p>
			</div>

			<div className="w-full max-w-4xl flex justify-center items-center bg-white p-6 rounded-md flex-col">
				<Bar data={chartData} options={options} />
			</div>
		</>
	);
}

export default PayStackedBarChart;
