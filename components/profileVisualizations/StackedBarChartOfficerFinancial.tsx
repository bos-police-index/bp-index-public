"use client";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { bpi_deep_green, payCategoryColorMap } from "@styles/theme/lightTheme";
import { formatMoney } from "@utility/textFormatHelpers";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function PayStackedBarChart(data) {
	const tableData: FinancialEmployeeData[] = data?.data?.props?.table || [];
	if (!tableData || !tableData.length) {
		return <div>No financial data available</div>;
	}

	// Mapping the data to extract relevant pay fields for each year
	const financialYearsPay = tableData.map((table: FinancialEmployeeData) => ({
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

	const stackColors = {
		regularPay: {
			background: 'rgba(59, 130, 246, 0.8)',
			border: 'rgb(59, 130, 246)',
			hover: 'rgba(59, 130, 246, 0.9)'
		},
		detailPay: {
			background: 'rgba(245, 158, 11, 0.8)',
			border: 'rgb(245, 158, 11)',
			hover: 'rgba(245, 158, 11, 0.9)'
		},
		otherPay: {
			background: 'rgba(156, 163, 175, 0.8)',
			border: 'rgb(156, 163, 175)',
			hover: 'rgba(156, 163, 175, 0.9)'
		},
		injuredPay: {
			background: 'rgba(252, 211, 77, 0.8)',
			border: 'rgb(252, 211, 77)',
			hover: 'rgba(252, 211, 77, 0.9)'
		},
		retroPay: {
			background: 'rgba(34, 197, 94, 0.8)',
			border: 'rgb(34, 197, 94)',
			hover: 'rgba(34, 197, 94, 0.9)'
		},
		quinnPay: {
			background: 'rgba(168, 85, 247, 0.8)',
			border: 'rgb(168, 85, 247)',
			hover: 'rgba(168, 85, 247, 0.9)'
		},
		otPay: {
			background: 'rgba(239, 68, 68, 0.8)',
			border: 'rgb(239, 68, 68)',
			hover: 'rgba(239, 68, 68, 0.9)'
		}
	};

	// Prepare datasets for each pay type with modern styling
	const datasets = [
		{
			label: "Regular Pay",
			data: years.map((year) => financialYearsPay.find((item) => item.year === year)?.regularPay || 0),
			backgroundColor: stackColors.regularPay.background,
			borderColor: stackColors.regularPay.border,
			borderWidth: 2,
			borderRadius: 4,
			borderSkipped: false,
			hoverBackgroundColor: stackColors.regularPay.hover,
		},
		{
			label: "Detail Pay",
			data: years.map((year) => financialYearsPay.find((item) => item.year === year)?.detailPay || 0),
			backgroundColor: stackColors.detailPay.background,
			borderColor: stackColors.detailPay.border,
			borderWidth: 2,
			borderRadius: 4,
			borderSkipped: false,
			hoverBackgroundColor: stackColors.detailPay.hover,
		},
		{
			label: "Other Pay",
			data: years.map((year) => financialYearsPay.find((item) => item.year === year)?.otherPay || 0),
			backgroundColor: stackColors.otherPay.background,
			borderColor: stackColors.otherPay.border,
			borderWidth: 2,
			borderRadius: 4,
			borderSkipped: false,
			hoverBackgroundColor: stackColors.otherPay.hover,
		},
		{
			label: "Injured Pay",
			data: years.map((year) => financialYearsPay.find((item) => item.year === year)?.injuredPay || 0),
			backgroundColor: stackColors.injuredPay.background,
			borderColor: stackColors.injuredPay.border,
			borderWidth: 2,
			borderRadius: 4,
			borderSkipped: false,
			hoverBackgroundColor: stackColors.injuredPay.hover,
		},
		{
			label: "Retroactive Pay",
			data: years.map((year) => financialYearsPay.find((item) => item.year === year)?.retroPay || 0),
			backgroundColor: stackColors.retroPay.background,
			borderColor: stackColors.retroPay.border,
			borderWidth: 2,
			borderRadius: 4,
			borderSkipped: false,
			hoverBackgroundColor: stackColors.retroPay.hover,
		},
		{
			label: "Quinn Pay",
			data: years.map((year) => financialYearsPay.find((item) => item.year === year)?.quinnPay || 0),
			backgroundColor: stackColors.quinnPay.background,
			borderColor: stackColors.quinnPay.border,
			borderWidth: 2,
			borderRadius: 4,
			borderSkipped: false,
			hoverBackgroundColor: stackColors.quinnPay.hover,
		},
		{
			label: "Overtime Pay",
			data: years.map((year) => financialYearsPay.find((item) => item.year === year)?.otPay || 0),
			backgroundColor: stackColors.otPay.background,
			borderColor: stackColors.otPay.border,
			borderWidth: 2,
			borderRadius: 4,
			borderSkipped: false,
			hoverBackgroundColor: stackColors.otPay.hover,
		},
	];

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		interaction: {
			mode: 'index' as const,
			intersect: false,
		},
		plugins: {
			legend: {
				position: "bottom" as const,
				align: "center" as const,
				labels: {
					usePointStyle: true,
					pointStyle: 'rectRounded',
					padding: 20,
					font: {
						size: 12,
						weight: 500,
					},
					color: '#374151',
					generateLabels: (chart) => {
						const labels = ChartJS.defaults.plugins.legend.labels.generateLabels(chart);
						labels.forEach((label) => {
							label.borderRadius = 4;
						});
						return labels;
					}
				},
			},
			tooltip: {
				backgroundColor: 'rgba(17, 24, 39, 0.95)',
				titleColor: '#F9FAFB',
				bodyColor: '#F9FAFB',
				borderColor: 'rgba(75, 85, 99, 0.2)',
				borderWidth: 1,
				cornerRadius: 12,
				displayColors: true,
				usePointStyle: true,
				titleFont: {
					size: 14,
					weight: 600,
				},
				bodyFont: {
					size: 13,
					weight: 500,
				},
				padding: 16,
				callbacks: {
					title: (tooltipItems) => {
						return `Year ${tooltipItems[0].label}`;
					},
					label: (tooltipItem) => {
						const dataset = datasets[tooltipItem.datasetIndex];
						const value = tooltipItem.raw;
						const label = dataset.label;
						const yearIndex = tooltipItem.dataIndex;
						const totalPay = datasets.reduce((sum, ds) => sum + ds.data[yearIndex], 0);
						const percentage = ((value / totalPay) * 100).toFixed(1);

						return `${label}: ${formatMoney(value)} (${percentage}%)`;
					},
					afterBody: (tooltipItems) => {
						if (tooltipItems.length > 0) {
							const yearIndex = tooltipItems[0].dataIndex;
							const totalPay = datasets.reduce((sum, ds) => sum + ds.data[yearIndex], 0);
							return [``, `Total Earnings: ${formatMoney(totalPay)}`];
						}
						return [];
					}
				},
			},
		},
		scales: {
			x: {
				stacked: true,
				grid: {
					display: false,
				},
				border: {
					display: false,
				},
				ticks: {
					font: {
						size: 13,
						weight: 600,
					},
					color: '#4B5563',
					padding: 8,
				},
			},
			y: {
				stacked: true,
				grid: {
					color: 'rgba(156, 163, 175, 0.2)',
					lineWidth: 1,
				},
				border: {
					display: false,
				},
				ticks: {
					font: {
						size: 12,
					},
					color: '#6B7280',
					padding: 12,
					callback: function(value) {
						return formatMoney(value);
					},
				},
			},
		},
		elements: {
			bar: {
				borderRadius: {
					topLeft: 4,
					topRight: 4,
					bottomLeft: 0,
					bottomRight: 0,
				},
			},
		},
		animation: {
			duration: 1500,
			easing: 'easeInOutQuart' as const,
		},
	};

	// Calculate summary statistics
	const totalYears = years.length;
	const latestYear = Math.max(...years);
	const latestYearTotal = datasets.reduce((sum, ds) => sum + (ds.data[ds.data.length - 1] || 0), 0);
	const avgAnnualEarnings = financialYearsPay.reduce((sum, year) => {
		const yearTotal = datasets.reduce((yearSum, ds) => {
			const yearIndex = years.indexOf(year.year);
			return yearSum + (ds.data[yearIndex] || 0);
		}, 0);
		return sum + yearTotal;
	}, 0) / totalYears;

	// Prepare data for Chart.js
	const chartData = {
		labels: years,
		datasets: datasets,
	};

	if (!data || !data.data || !data.data.props) {
		console.error("Invalid data format passed to PayStackedBarChart.", data);
		return (
			<div className="flex items-center justify-center p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
				<div className="text-center">
					<svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
					</svg>
					<p className="text-gray-600 font-medium">No financial data available</p>
					<p className="text-gray-500 text-sm mt-1">Unable to generate earnings visualization</p>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full space-y-6">
			{/* Summary Statistics */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
				<div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
					<div className="flex items-center">
						<div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
							<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div>
							<p className="text-sm font-medium text-blue-700">Years of Data</p>
							<p className="text-xl font-bold text-blue-900">{totalYears}</p>
						</div>
					</div>
				</div>
				<div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200">
					<div className="flex items-center">
						<div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mr-3">
							<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
							</svg>
						</div>
						<div>
							<p className="text-sm font-medium text-emerald-700">Latest Year ({latestYear})</p>
							<p className="text-xl font-bold text-emerald-900">{formatMoney(latestYearTotal)}</p>
						</div>
					</div>
				</div>
				<div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
					<div className="flex items-center">
						<div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
							<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
							</svg>
						</div>
						<div>
							<p className="text-sm font-medium text-purple-700">Average Annual</p>
							<p className="text-xl font-bold text-purple-900">{formatMoney(avgAnnualEarnings)}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Chart Container */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
				<div className="p-6">
					<div className="mb-6">
						<div className="flex items-center justify-between mb-2">
							<h3 className="text-lg font-semibold text-gray-900">Annual Earnings Breakdown</h3>
							<div className="flex items-center space-x-2 text-sm text-gray-500">
								<div className="w-2 h-2 bg-blue-400 rounded-full"></div>
								<span>{years[0]} - {years[years.length - 1]}</span>
							</div>
						</div>
						<p className="text-sm text-gray-600">
							Comprehensive view of earnings across different pay categories over time. Hover over bars for detailed breakdowns.
						</p>
					</div>
					
					<div className="relative" style={{ height: '400px' }}>
						<Bar data={chartData} options={options} />
					</div>
				</div>
			</div>
		</div>
	);
}

export default PayStackedBarChart;
