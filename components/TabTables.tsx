import React, { useState } from "react";

import { styled, useTheme } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import ScreenOverlay from "@components/ScreenOverlay";
import { bpi_deep_green } from "@styles/theme/lightTheme";

interface Table {
	title: string;
	tables: DataTables;
	recordCount?: number; 
}

interface DataTables {
	fullTable: React.FunctionComponentElement<{}> | null;
	filteredTable: React.FunctionComponentElement<{}> | null;
}

interface TabPanelProps {
	children?: React.ReactNode;
	dir?: string;
	index: number;
	value: number;
}

interface FullWidthTabsProps {
	tables: Table[];
}

const StyledTabs = styled(Tabs)({
	"& .MuiTabs-indicator": {
		backgroundColor: bpi_deep_green,
		height: 3,
		borderRadius: '2px',
	},
	"& .MuiTabs-flexContainer": {
		justifyContent: "start",
		gap: '4px',
	},
	"& .MuiTabs-root": {
		minHeight: '48px',
	},
});

const StyledTab = styled(Tab)(({ theme }) => ({
	textTransform: "none",
	minWidth: 100,
	minHeight: 44,
	[theme.breakpoints.up("sm")]: {
		minWidth: 140,
		minHeight: 48,
	},
	fontWeight: 500,
	fontSize: '0.8rem',
	[theme.breakpoints.up("sm")]: {
		fontSize: '0.875rem',
	},
	marginRight: theme.spacing(0.25),
	[theme.breakpoints.up("sm")]: {
		marginRight: theme.spacing(0.5),
	},
	color: "#64748b",
	fontFamily: ["-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", '"Helvetica Neue"', "Arial", "sans-serif"].join(","),
	backgroundColor: "#f8fafc",
	border: "1px solid #e2e8f0",
	borderBottom: "none",
	borderRadius: "8px 8px 0 0",
	transition: "all 0.2s ease-in-out",
	"&:hover": {
		color: bpi_deep_green,
		backgroundColor: "#f1f5f9",
		transform: "translateY(-1px)",
	},
	"&.Mui-selected": {
		backgroundColor: "white",
		color: bpi_deep_green,
		fontWeight: 600,
		borderColor: "#e2e8f0",
		borderBottomColor: "white",
		zIndex: 1,
		"&:hover": {
			transform: "none",
		},
	},
}));

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div 
			role="tabpanel" 
			hidden={value !== index} 
			id={`full-width-tabpanel-${index}`} 
			aria-labelledby={`full-width-tab-${index}`} 
			className="bg-white border border-gray-200 rounded-b-lg"
			style={{ borderTop: 'none' }}
			{...other}
		>
			{value === index && (
				<Box sx={{ p: 0, minHeight: "350px", "@media (min-width: 640px)": { minHeight: "400px" } }}>
					<Typography component={"div"} variant={"body2"}>
						{children}
					</Typography>
				</Box>
			)}
		</div>
	);
}

function a11yProps(index: number) {
	return {
		id: `full-width-tab-${index}`,
		"aria-controls": `full-width-tabpanel-${index}`,
	};
}

export default function FullWidthTabs({ tables }: FullWidthTabsProps) {
	if (!tables) {
		return;
	}
	// Find the indices of the specific tables
	const policeFinancialIndex = tables?.findIndex((table) => table.title === "Police Earnings");
	const officerIaIndex = tables?.findIndex((table) => table.title === "Officer IA");

	let orderedTables: Table[] = [];
	if (policeFinancialIndex !== -1) {
		orderedTables.push(tables[policeFinancialIndex]);
	}
	if (officerIaIndex !== -1) {
		orderedTables.push(tables[officerIaIndex]);
	}

	orderedTables = orderedTables.concat(tables.filter((table, index) => index !== policeFinancialIndex && index !== officerIaIndex));
	tables = orderedTables;
	const theme = useTheme();
	const [value, setValue] = React.useState(0);
	const [currentOverlay, setCurrentOverlay] = useState({ table: null, title: null });

	const handleChange = (event: React.SyntheticEvent, newValue: number) => {
		setValue(newValue);
	};

	const handleSeeAllClick = () => {
		const selectedTable = tables[value];
		setCurrentOverlay({ table: selectedTable.tables.fullTable, title: selectedTable.title });
		document.getElementById("screen-overlay").classList.add("flex");
		document.getElementById("screen-overlay").classList.remove("hidden");
	};

	let lastTable = 0;
	if (tables) {
		lastTable = tables?.length - 1;
	}

	return tables ? (
		<Box sx={{ maxWidth: "100%", minHeight: "400px" }}>
			<div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 sm:px-4 py-2 bg-gray-50 border-b border-gray-200 space-y-2 sm:space-y-0">
				<AppBar position="static" sx={{ backgroundColor: "transparent", boxShadow: "none", flexGrow: 1, overflow: "auto" }}>
					<StyledTabs 
						value={value} 
						onChange={handleChange} 
						aria-label="record type tabs"
						variant="scrollable"
						scrollButtons="auto"
						allowScrollButtonsMobile
					>
						{orderedTables.map((table, index) => {
							const recordCount = table.recordCount || 0;
							return (
								<StyledTab 
									label={
										<div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2">
											<span className="text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none">{table.title}</span>
											<span className="bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full font-medium">
												{recordCount}
											</span>
										</div>
									} 
									key={index} 
									{...a11yProps(index)} 
								/>
							);
						})}
					</StyledTabs>
				</AppBar>

				<button
					onClick={handleSeeAllClick}
					className="ml-0 sm:ml-4 w-full sm:w-auto px-3 py-2 sm:px-4 bg-slate-700 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 shadow-sm"
				>
					<svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
					</svg>
					<span>Expand</span>
				</button>
			</div>
			
			{orderedTables.map((table, index) => (
				<TabPanel value={value} index={index} dir={theme.direction} key={index}>
					{table.tables.filteredTable || table.tables.fullTable}
				</TabPanel>
			))}

			<ScreenOverlay title={currentOverlay.title} children={currentOverlay.table} />
		</Box>
	) : (
		<div className="flex items-center justify-center py-12">
			<div className="text-center">
				<svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
				<p className="text-gray-500 text-sm">No data available</p>
			</div>
		</div>
	);
}
