"use client";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { payCategoryColorMap } from "@styles/theme/lightTheme";

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
	const tableData: EmployeeFinancial[] = data?.data.props.table;

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

	// Options for the stacked bar chart
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

	if (!data || !Array.isArray(data)) {
		return <div>No data available</div>;
	}

	return (
		<div className="w-full max-w-4xl flex justify-center items-center bg-white p-6 rounded-md">
			<Bar data={chartData} options={options} />
		</div>
	);
}

export default PayStackedBarChart;
