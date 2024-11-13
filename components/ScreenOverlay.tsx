import { TbArrowBackUp } from "react-icons/tb";
import React from "react";
import { bpi_deep_green, bpi_light_green } from "@styles/theme/lightTheme";
import { createSvgIcon } from "@mui/material";
import { PDFDownloadLink, Document, Page, Text } from "@react-pdf/renderer";
import { pdf } from "@react-pdf/renderer";
import GlossaryTotal, { gatherAllDefinitions } from "./GlossaryTotal";
import PdfDownloadGlossary from "./PdfDownloadGlossary";

interface ScreenOverlayProps {
	title: string;
	children: React.ReactNode | any;
}

const ExportIcon = createSvgIcon(<path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z" />, "SaveAlt");

const generatePdfAndDownload = async (columnObjects: any[], title: string) => {
	const seenLetters: Record<string, boolean> = {};
	let rows = [];
	if (columnObjects[0].name) {
		rows = columnObjects.map((col: any) => {
			const letter = col.name.substring(0, 1);
			const firstAppearance = !seenLetters[letter];
			if (firstAppearance) seenLetters[letter] = true;

			return {
				letter: firstAppearance ? letter : "",
				name: col.name,
				description: col.description,
			};
		});
	} else {
		rows = gatherAllDefinitions(columnObjects);
	}

	const blob = await pdf(<PdfDownloadGlossary rows={rows} title={title} />).toBlob();
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = title.includes("Total") ? "BPI-Glossary.pdf" : `${title}.pdf`;
	link.click();

	URL.revokeObjectURL(link.href);
};

export default function ScreenOverlay({ title, children }: ScreenOverlayProps) {
	return (
		<div id="screen-overlay" className="absolute top-0 left-0 z-20 w-screen h-screen backdrop-blur-lg bg-white/[.3] hidden">
			<div className="flex flex-col w-full h-full items-center">
				{/* Title and Buttons Container */}
				<div className="w-full max-w-[60rem] px-10 py-16 flex flex-row justify-between items-center">
					<p style={{ color: bpi_deep_green }} className="text-3xl font-bold">
						{title}
					</p>
					<div className="flex space-x-4">
						{title?.includes("Glossary") ? (
							<button onClick={() => generatePdfAndDownload(children.props.columnObjects || children.props.tableDefinitions, title)} className="rounded-lg p-2 w-32 flex items-center justify-center active:scale-90 transition duration-300" style={{ color: bpi_deep_green }}>
								{false ? "Preparing..." : <ExportIcon className="text-4xl" style={{ color: bpi_deep_green }} />}
							</button>
						) : (
							<></>
						)}
						<button
							onClick={() => {
								document.getElementById("screen-overlay")?.classList.add("hidden");
								document.getElementById("screen-overlay")?.classList.remove("flex");
							}}
							className="rounded-lg p-2 w-32 flex items-center justify-center active:scale-90 shadow-xl transition duration-300"
							style={{
								backgroundColor: bpi_light_green,
								transition: "background-color 0.3s",
							}}
							onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = bpi_deep_green)}
							onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = bpi_light_green)}
						>
							<TbArrowBackUp className="text-3xl text-white" />
						</button>
					</div>
				</div>

				{/* Children Content */}
				<div className="w-full max-w-[60rem] px-10 flex-1">{children}</div>
			</div>
		</div>
	);
}
