"use client";

import { bpi_deep_green, bpi_light_gray, bpi_light_green } from "@styles/theme/lightTheme";
import GlossaryCard from "./GlossaryCard";

export interface ColumnObject {
	name: string;
	description: string;
}

interface GlossaryProps {
	columnObjects: ColumnObject[];
}

const GlossaryItem: React.FC<{ columnObject: ColumnObject; isEven: boolean }> = ({ columnObject, isEven }) => {
	return (
		<div className={`flex p-4 ${isEven ? "bg-gray-100" : "bg-white"}`}>
			<div className="w-1/3 font-bold pr-4">{columnObject.name}</div>
			<div className="w-2/3">{columnObject.description}</div>
		</div>
	);
};

const Glossary: React.FC<GlossaryProps> = ({ columnObjects }) => {
	if (!columnObjects || columnObjects.length === 0) {
		return <div className="text-xl">No glossary items available.</div>;
	}

	return (
		<div className="max-w-5xl mx-auto bg-white shadow-lg mb-[2rem]">
			<div className="text-xl">
				{columnObjects.map((col, index) => (
					<GlossaryItem key={index} columnObject={col} isEven={index % 2 === 0} />
				))}
			</div>
		</div>
	);
};

export default Glossary;