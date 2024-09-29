import { bpi_deep_green, bpi_light_gray, bpi_light_green } from "@styles/theme/lightTheme";
import { Card } from "antd";
import { ColumnObject } from "./Glossary";

interface IndexCardProps {
	column: ColumnObject;
}

export default function GlossaryCard({ column }: IndexCardProps) {
	return (
		<Card
			key={column.name}
			style={{
				borderColor: "transparent",
				// boxShadow: "0px 0px 4px 4px rgba(0, 0, 0, 0.1)",
				color: bpi_deep_green,
				width: "14rem",
				height: "170px",
				margin: "1rem 1.5rem",
				alignContent: "center",
				transition: "transform 0.5s",
				backgroundColor: "white",
			}}
		>
			<div style={{ color: bpi_light_green }}>
				<div style={{ fontWeight: "600", position: "absolute", left: 0, top: 0, padding: "2rem 1.5rem", fontSize: "medium" }}>{column.name}</div>
				<div style={{ fontSize: "small", marginTop: "1rem" }}>{column.description}</div>
			</div>
		</Card>
	);
}
