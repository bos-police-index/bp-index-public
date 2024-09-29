"use client";

import GlossaryCard from "./GlossaryCard";

export interface ColumnObject {
	name: string;
	description: string;
}

interface GlossaryProps {
	columnObjects: ColumnObject[];
}

const GlossaryItem: React.FC<{ columnObject: ColumnObject }> = ({ columnObject }) => {
	return <GlossaryCard column={columnObject} />;
	{
		/* <div style={{ position: "relative", width: "100%", height: "auto", marginBottom: "1rem" }}>
			<b style={{ color: "#3874CB", fontSize: "x-large", fontWeight: "600", position: "absolute", left: 0 }}>&#9643;{columnObject.name}</b>
			<p style={{ marginLeft: "20vw", wordWrap: "break-word", fontSize: "medium" }}>{columnObject.description}</p>
		</div> */
	}
};

const Glossary: React.FC<GlossaryProps> = ({ columnObjects }) => {
	return (
		<div style={{ display: "flex", maxWidth: "100%", flexWrap: "wrap", marginTop: "4rem" }}>
			{columnObjects.map((col, index) => (
				<GlossaryItem key={index} columnObject={col} />
			))}
		</div>
	);
};

export default Glossary;
