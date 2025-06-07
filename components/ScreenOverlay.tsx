import React, { useRef, useCallback, useEffect, useState } from "react";
import { TbArrowBackUp } from "react-icons/tb";
import { pdf } from "@react-pdf/renderer";
import { createSvgIcon } from "@mui/material";

import { bpi_deep_green, bpi_light_green } from "@styles/theme/lightTheme";
import { gatherAllDefinitions } from "./GlossaryTotal";
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
	const isGlossary = title?.includes("Glossary");
	const [isVisible, setIsVisible] = useState(false);
	const overlayRef = useRef<HTMLDivElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	
	const hideOverlay = useCallback(() => {
		if (isGlossary) {
			setIsVisible(false);
			setTimeout(() => {
				document.getElementById("screen-overlay")?.classList.add("hidden");
				document.getElementById("screen-overlay")?.classList.remove("flex");
			}, 300); 
		} else {
			document.getElementById("screen-overlay")?.classList.add("hidden");
			document.getElementById("screen-overlay")?.classList.remove("flex");
		}
	}, [isGlossary]);
	
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (isGlossary && 
				isVisible && 
				panelRef.current && 
				!panelRef.current.contains(event.target as Node)) {
				hideOverlay();
			}
		};
		
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isGlossary, isVisible, hideOverlay]);
	
	useEffect(() => {
		const overlay = document.getElementById("screen-overlay");
		if (!overlay) return;

		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.attributeName === 'class') {
					const element = mutation.target as HTMLElement;
					const isNowVisible = element.classList.contains('flex');
					setIsVisible(isNowVisible);

					if (isGlossary) {
						const wrapperElement = document.getElementById("wrapper"); 
						if (wrapperElement) {
							if (isNowVisible) {
								wrapperElement.style.transition = "padding-right 0.3s ease-in-out";
								wrapperElement.style.paddingRight = "450px";
							} else {
								wrapperElement.style.transition = "padding-right 0.3s ease-in-out";
								wrapperElement.style.paddingRight = "0px";
							}
						}
					}
				}
			});
		});
		
		observer.observe(overlay, { attributes: true });
		
		return () => {
			observer.disconnect();

			if (isGlossary) {
				const wrapperElement = document.getElementById("wrapper"); 
				if (wrapperElement && wrapperElement.style.paddingRight === "450px") {
					wrapperElement.style.paddingRight = "0px"; 
				}
			}
		};
	}, [isGlossary]);
	
	return (
		<div 
			id="screen-overlay" 
			ref={overlayRef}
			className={`fixed z-20 hidden ${isGlossary ? 
				'top-0 right-0 h-screen' : 
				'top-0 left-0 w-screen h-screen backdrop-blur-lg bg-white/[.3]'
			}`}
			style={{
				transform: isGlossary ? (isVisible ? 'translateX(0)' : 'translateX(100%)') : 'none',
				transition: 'transform 0.3s ease-in-out'
			}}
		>
			{isGlossary && (
				<div 
					ref={panelRef}
					className="h-full flex flex-col bg-white shadow-2xl"
					style={{ 
						width: '450px',
						boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.15)'
					}}
				>
					{/* Title and Buttons Container */}
					<div 
						className="border-b border-gray-100 py-6 px-8 flex flex-row justify-between items-center"
						style={{
							background: 'linear-gradient(to right, #fafafa, #ffffff)'
						}}
					>
						<div className="flex items-center space-x-3">
							<span
								className="w-1 h-6 rounded-full"
								style={{ backgroundColor: bpi_deep_green }}
							></span>
							<p style={{ color: bpi_deep_green }} className="text-2xl font-bold">
								{title}
							</p>
						</div>
						<div className="flex space-x-4">
							<button 
								onClick={() => generatePdfAndDownload(children.props.columnObjects || children.props.tableDefinitions, title)} 
								className="rounded-full p-2 flex items-center justify-center hover:bg-gray-50 active:scale-90 transition-all duration-300" 
								style={{ color: bpi_deep_green }}
								title="Download as PDF"
							>
								<ExportIcon className="text-2xl" style={{ color: bpi_deep_green }} />
							</button>
							<button
								onClick={hideOverlay}
								className="rounded-full p-2 flex items-center justify-center active:scale-90 transition-all duration-300"
								style={{
									background: `linear-gradient(135deg, ${bpi_light_green} 0%, ${bpi_deep_green} 100%)`,
									boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
								}}
								title="Close"
							>
								<TbArrowBackUp className="text-xl text-white" />
							</button>
						</div>
					</div>

					{/* Children Content */}
					<div className="overflow-y-auto px-8 py-4 flex-1 bg-white">
						{children}
					</div>
				</div>
			)}
			
			{!isGlossary && (
				<div className="flex flex-col w-full h-full items-center">
					{/* Content Container */}
					<div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl mt-10 overflow-hidden">
						{/* Title and Buttons Container */}
						<div className="w-full px-8 py-6 flex flex-row justify-between items-center border-b border-gray-100"
							style={{
								background: 'linear-gradient(to right, #fafafa, #ffffff)'
							}}
						>
							<div className="flex items-center space-x-3">
								<span
									className="w-1 h-6 rounded-full"
									style={{ backgroundColor: bpi_deep_green }}
								></span>
								<p style={{ color: bpi_deep_green }} className="text-2xl font-bold">
									{title}
								</p>
							</div>
							<button
								onClick={hideOverlay}
								className="rounded-full p-3 flex items-center justify-center active:scale-90 transition-all duration-300"
								style={{
									background: `linear-gradient(135deg, ${bpi_light_green} 0%, ${bpi_deep_green} 100%)`,
									boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
								}}
								title="Close"
							>
								<TbArrowBackUp className="text-xl text-white" />
							</button>
						</div>

						{/* Children Content */}
						<div className="w-full px-8 py-6 bg-white">
							{children}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
