import React from "react";
import { styled, useTheme } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

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
	color: "rgba(0, 0, 0, 0.85)",
	fontFamily: ["-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", '"Helvetica Neue"', "Arial", "sans-serif", '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"'].join(","),
	backgroundColor: "#3874CB",
	opacity: "40%",
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
	"&.Mui-focusVisible": {
		backgroundColor: "green",
	},
}));

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div role="tabpanel" hidden={value !== index} id={`full-width-tabpanel-${index}`} aria-labelledby={`full-width-tab-${index}`} {...other}>
			{value === index && (
				<Box sx={{ p: 0, maxHeight: "30rem" }}>
					<Typography>{children}</Typography>
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
	const theme = useTheme();
	const [value, setValue] = React.useState(0);

	const handleChange = (event: React.SyntheticEvent, newValue: number) => {
		setValue(newValue);
	};

	const lastTable = tables.length - 1;
	return (
		<Box sx={{ width: "80vw", margin: "4rem auto" }}>
			<AppBar position="static" sx={{ backgroundColor: "transparent", boxShadow: "none" }}>
				<StyledTabs value={value} onChange={handleChange} aria-label="full width tabs example">
					{tables.map((table, index) =>
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
			{tables.map((table, index) => (
				<TabPanel value={value} index={index} dir={theme.direction} key={index}>
					{table.tables.filteredTable || table.tables.fullTable}
				</TabPanel>
			))}
		</Box>
	);
}
