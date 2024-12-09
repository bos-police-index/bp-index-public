import { createTheme } from "@mui/material/styles";

const lightTheme = createTheme({
	palette: {
		mode: "light",
	},
});

export const bpi_deep_green = "#296351";
export const bpi_light_green = "#439679";
export const bpi_light_gray = "#F5F5F5";
export const bpi_white = "#ffffff";

export const payCategoryColorMap = {
	regularPay: "#163F79",
	detailPay: "#F1A150",
	otherPay: "#C1C1C1",
	injuredPay: "#F9DB48",
	retroPay: "#83D391",
	quinnPay: "#B726F6",
	otPay: "#C8403B",
	totalPay: "black",
};

export default lightTheme;
