"use client";

interface ColumnObject {
	name: string;
	description: string;
}

interface GlossaryProps {
	columnObjects: ColumnObject[];
}

const GlossaryItem: React.FC<{ columnObject: ColumnObject }> = ({ columnObject }) => {
	return (
		<div style={{ position: "relative", width: "100%", height: "auto", marginBottom: "1rem" }}>
			<b style={{ color: "#3874CB", fontSize: "x-large", fontWeight: "600", position: "absolute", left: 0 }}>&#9643;{columnObject.name}</b>
			<p style={{ marginLeft: "20vw", wordWrap: "break-word", fontSize: "medium" }}>{columnObject.description}</p>
		</div>
	);
};

const Glossary: React.FC<GlossaryProps> = ({ columnObjects }) => {
	return (
		<div style={{ display: "flex", alignItems: "start", justifyContent: "start", width: "60vw", margin: "3rem auto", flexDirection: "column" }}>
			<p style={{ fontSize: "xx-large", fontWeight: "bold", textDecoration: "underline" }}>Glossary</p>
			<div style={{ alignItems: "start" }}>
				{columnObjects.map((col, index) => (
					<GlossaryItem key={index} columnObject={col} />
				))}
			</div>
		</div>
	);
};

export default Glossary;
