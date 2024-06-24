import { styled } from "@mui/material";

export const StyledGridOverlay = styled("div")(() => ({
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	justifyContent: "center",
	height: "100%",
	"& .ant-empty-img-1": {
		fill: "#aeb8c2",
	},
	"& .ant-empty-img-2": {
		fill: "#f5f5f7",
	},
	"& .ant-empty-img-3": {
		fill: "#dce0e6",
	},
	"& .ant-empty-img-4": {
		fill: "#fff",
	},
	"& .ant-empty-img-5": {
		fillOpacity: "0.8",
		fill: "#f5f5f5",
	},
}));
