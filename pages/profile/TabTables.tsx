import React, { useState } from "react";
import { styled, useTheme } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { Button } from "antd";
import ScreenOverlay from "@components/ScreenOverlay";

interface Table {
	title: string;
	tables: DataTables;
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
		backgroundColor: "#1890ff",
	},
	"& .MuiTabs-flexContainer": {
		justifyContent: "start",
	},
});

const sectionHeaderColor = "#3874CB";

const StyledTab = styled(Tab)(({ theme }) => ({
	textTransform: "none",
	minWidth: 0,
	[theme.breakpoints.up("sm")]: {
		minWidth: 0,
	},
	fontWeight: theme.typography.fontWeightRegular,
	marginRight: theme.spacing(0.5),
	color: "white",
	fontFamily: ["-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", '"Helvetica Neue"', "Arial", "sans-serif", '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"'].join(","),
	backgroundColor: sectionHeaderColor,
	opacity: "50%",
	"&:hover": {
		color: "#40a9ff",
		opacity: 1,
	},
	"&.Mui-selected": {
		backgroundColor: sectionHeaderColor,
		color: "white",
		fontWeight: theme.typography.fontWeightMedium,
		opacity: "100%",
	},
}));

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div role="tabpanel" hidden={value !== index} id={`full-width-tabpanel-${index}`} aria-labelledby={`full-width-tab-${index}`} {...other}>
			{value === index && (
				<Box sx={{ p: 0, maxHeight: "30rem" }}>
					<Typography component={"span"} variant={"body2"}>
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
	const policeFinancialIndex = tables?.findIndex((table) => table.title === "Police Financial");
	const officerIaIndex = tables?.findIndex((table) => table.title === "Officer IA");

	let orderedTables: Table[] = [];
	if (policeFinancialIndex !== -1) {
		orderedTables.push(tables[policeFinancialIndex]);
	}
	if (officerIaIndex !== -1) {
		orderedTables.push(tables[officerIaIndex]);
	}

	orderedTables = orderedTables.concat(tables.filter((table, index) => index !== policeFinancialIndex && index !== officerIaIndex));
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
		<Box sx={{ width: "80vw", margin: "4rem auto", marginBottom: "10rem" }}>
			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-around" }}>
				<AppBar position="static" sx={{ backgroundColor: "transparent", boxShadow: "none" }}>
					<StyledTabs value={value} onChange={handleChange} aria-label="full width tabs example">
						{orderedTables.map((table, index) =>
							index === 0 ? (
								<StyledTab style={{ borderTopLeftRadius: "1rem" }} label={table.title} key={index} {...a11yProps(index)} />
							) : index === lastTable ? (
								<StyledTab style={{ borderTopRightRadius: "1rem" }} label={table.title} key={index} {...a11yProps(index)} />
							) : (
								<StyledTab label={table.title} key={index} {...a11yProps(index)} />
							),
						)}
					</StyledTabs>
				</AppBar>

				<Button type="primary" shape="round" onClick={handleSeeAllClick} className={"bg-[sectionHeaderColor] text-white font-urbanist active:scale-[.95] p-2 w-32 shadow-xl transition-button duration-300 hover:bg-primary-hover"} style={{ marginLeft: "-5rem" }}>
					See All
				</Button>
			</div>
			{orderedTables.map((table, index) => (
				<TabPanel value={value} index={index} dir={theme.direction} key={index}>
					{table.tables.filteredTable || table.tables.fullTable}
				</TabPanel>
			))}

			<ScreenOverlay title={currentOverlay.title} children={currentOverlay.table} />
		</Box>
	) : (
		<></>
	);
}
