"use client";
import getHeaderWithDescription from "@utility/columnDefinitions";
import { functionMapping } from "@utility/createMUIGrid";
import { OverridableComponent } from "@mui/material/OverridableComponent";
import { SvgIconTypeMap } from "@mui/material";
import { bpi_deep_green } from "@styles/theme/lightTheme";
import { Typography } from "antd";

export interface ColumnObject {
	name: string;
	description: string;
}

export interface GlossaryProps {
	columnObjects: ColumnObject[];
}

export interface ColumnObject {
	name: string;
	description: string;
}

export interface GlossaryProps {
	columnObjects: ColumnObject[];
}

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
	tableDefinitions?: TableDefinition[];
	columnObjects?: ColumnObject[];
	total: boolean;
}

export const gatherAllDefinitions = (data: TableDefinition[]) => {
	var currTable;
	const definitions = [];

	for (const [key, dataset] of Object.entries(data)) {
		currTable = functionMapping[dataset.query];
		if (!dataset.isFake) {
			console.log(dataset.query);
			definitions.push(...getHeaderWithDescription(currTable));
		}
	}
	return definitions.sort((a, b) => a.name.localeCompare(b.name));
};

const GlossaryItem: React.FC<{ columnObject: ColumnObject; isTotal: boolean; last: boolean; firstAppearance: boolean }> = ({ columnObject, isTotal, last, firstAppearance }) => {
	return (
		<tr className="border-black">
			{isTotal ? (
				<td className="border border-black p-2 font-bold text-center" style={{ width: "5%", borderTopWidth: firstAppearance ? "1px" : 0, borderBottomWidth: last ? "1px" : 0, borderRightWidth: 0, borderColor: "black" }}>
					{firstAppearance ? columnObject.name.substring(0, 1) : ""}
				</td>
			) : (
				""
			)}

			<td className="border border-black p-2 font-bold bg-gray-100 pl-[5%]" style={{ width: "37.5%" }}>
				{columnObject.name}
			</td>
			<td className="border border-black p-2 pl-[5%]" style={{ width: "50%" }}>
				{columnObject.description}
			</td>
		</tr>
	);
};

const GlossaryTotal: React.FC<GlossaryTotalProps> = ({ tableDefinitions, columnObjects, total }) => {
	if ((total && !tableDefinitions) || (!total && !columnObjects)) {
		return <div className="text-xl">No glossary items available.</div>;
	}

	var rows = [];
	if (total) {
		rows = gatherAllDefinitions(tableDefinitions);
	} else {
		rows = columnObjects;
	}
	let seenLetters = {};
	return (
		<div className="max-w-5xl mx-auto bg-white mb-[2rem] p-[7rem]" style={{ boxShadow: "0px 0px 10px 2px rgba(0, 0, 0, 0.2)" }}>
			{total ? (
				<Typography.Title style={{ color: bpi_deep_green, fontWeight: "600" }} level={1}>
					BPI Glossary
				</Typography.Title>
			) : (
				<></>
			)}
			<table className="border-collapse table-fixed w-full border border-black ">
				<tbody>
					{rows.map((col, index) => {
						// check if first letter has been seen before
						let firstAppearance: boolean = false;
						if (!seenLetters[col.name.substring(0, 1)]) {
							firstAppearance = true;
							seenLetters[col.name.substring(0, 1)] = 1;
						}

						return <GlossaryItem key={index} columnObject={col} isTotal={total} last={rows.length === index + 1} firstAppearance={firstAppearance} />;
					})}
				</tbody>
			</table>
		</div>
	);
};

export default GlossaryTotal;
