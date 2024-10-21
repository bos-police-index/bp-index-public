"use client";
import getHeaderWithDescription from "@utility/columnDefinitions";
import { ColumnObject, GlossaryProps } from "./Glossary";
import { functionMapping } from "@utility/createMUIGrid";
import { IconWrapperProps } from "@utility/tableDefinitions";
import { OverridableComponent } from "@mui/material/OverridableComponent";
import { SvgIconTypeMap } from "@mui/material";

interface TableDefinition {
	source: string | React.JSX.Element;
	table: string;
	query: string;
	image: {
		component: React.JSX.Element;
		src: OverridableComponent<SvgIconTypeMap<{}, "svg">> & {};
	};
	isFake: boolean;
	shortDescription: string;
	longDescription: string;
	years: string;
}

interface GlossaryTotalProps {
	tableDefinitions: TableDefinition[];
}

const gatherAllDefinitions = (data: GlossaryTotalProps) => {
	var currTable;
	const definitions = [];

	for (const [key, dataset] of Object.entries(data.tableDefinitions)) {
		
		currTable = functionMapping[dataset.query];
		if (!dataset.isFake) {
			console.log(dataset.query);
			definitions.push(...getHeaderWithDescription(currTable));
		}
		
	}
	return definitions.sort((a, b) => a.name.localeCompare(b.name));
};

const GlossaryItem: React.FC<{ columnObject: ColumnObject; isEven: boolean }> = ({ columnObject, isEven }) => {
	return (
		<div className={`flex p-4 ${isEven ? "bg-gray-100" : "bg-white"}`}>
			<div className="w-1/3 font-bold pr-4">{columnObject.name}</div>
			<div className="w-2/3">{columnObject.description}</div>
		</div>
	);
};

const GlossaryTotal: React.FC<GlossaryTotalProps> = (tableDefinitions) => {
	if (!tableDefinitions) {
		return <div className="text-xl">No glossary items available.</div>;
	}

	const orderedRows = gatherAllDefinitions(tableDefinitions);

	return (
		<div className="max-w-5xl mx-auto bg-white shadow-lg mb-[2rem]">
			<div className="text-xl">
				{orderedRows.map((col, index) => (
					<GlossaryItem key={index} columnObject={col} isEven={index % 2 === 0} />
				))}
			</div>
		</div>
	);
};

export default GlossaryTotal;
