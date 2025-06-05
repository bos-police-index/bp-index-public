"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card } from "antd";
import { tableDefinitions } from "@utility/tableDefinitions";
import { bpi_deep_green, bpi_light_green } from "@styles/theme/lightTheme";
import GlossaryTotal from "@components/GlossaryTotal";
import ScreenOverlay from "@components/ScreenOverlay";

export default function Home() {
	const [cardFlipped, setCardFlipped] = useState<any>(null);
	const [currentOverlay, setCurrentOverlay] = useState({ table: null, title: null });

	const handleSeeAllClick = () => {
		setCurrentOverlay({ table: <GlossaryTotal tableDefinitions={tableDefinitions} total={true} />, title: "Total Glossary" });
		document.getElementById("screen-overlay").classList.add("flex");
		document.getElementById("screen-overlay").classList.remove("hidden");
	};

	const handleHover = (table) => {
		setCardFlipped(table.table);
	};

	const handleLeave = () => {
		setCardFlipped(null);
	};

	return (
		<div
			style={{
				backgroundColor: "#f8f9fa",
				minHeight: "calc(100vh - 64px)", 
				width: "100%",
			}}
		>
			<div style={{ 
				maxWidth: "1200px", 
				margin: "0 auto", 
				padding: "2rem 1.5rem",
				color: "#3874CB" 
			}}>
				<div className="bg-white rounded-lg shadow-sm p-4 mb-8">
					<p className="flex items-center text-sm" style={{ color: bpi_light_green }}>
						<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						Click{" "}
						<button 
							onClick={handleSeeAllClick}
							className="mx-1 font-medium hover:text-opacity-80 transition-colors duration-200 focus:outline-none"
						>
							<u>here</u>
						</button>{" "}
						to view and download the full glossary
					</p>
				</div>

				<section className="mb-12">
					<h2 
						className="text-2xl font-bold mb-6" 
						style={{ 
								color: bpi_deep_green,
								borderBottom: `2px solid ${bpi_light_green}`,
								paddingBottom: "0.5rem"
						}}
					>
						Available Datasets
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
						{tableDefinitions.filter(table => !table.isFake).map((table, key) => {
							const card = (
								<Card
									key={table.table}
									className="hover:shadow-lg transition-all duration-300"
									style={{
										borderRadius: "12px",
										overflow: "hidden",
										height: "170px",
										border: "none",
										boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.08)",
									}}
									bodyStyle={{
										padding: 0,
										height: "100%",
									}}
								>
									<div
										style={{
											height: "100%",
											background: cardFlipped == table.table 
												? `linear-gradient(135deg, ${bpi_light_green}, ${bpi_deep_green})` 
												: "#fff",
											padding: "1.25rem",
											display: "flex",
											flexDirection: "column",
											justifyContent: "center",
											alignItems: "center",
											transition: "all 0.3s ease",
										}}
										onMouseEnter={() => handleHover(table)}
										onMouseLeave={handleLeave}
										className="h-full w-full"
									>
										{cardFlipped == table.table ? (
											<div 
												className="text-white text-center" 
												style={{ fontSize: "medium", lineHeight: "1.5" }}
											>
												{table.shortDescription}
											</div>
										) : (
											<div className="flex flex-col items-center justify-center gap-4">
												<div className="w-12 h-12 flex items-center justify-center">
													{table.image.component}
												</div>
												<div 
													className="text-center font-medium" 
													style={{ color: bpi_deep_green }}
												>
													{table.table}
												</div>
											</div>
										)}
									</div>
								</Card>
							);

							return (
								<Link
									href={{
										pathname: "/data/tables/[table_name]",
										query: { table_name: table.query },
									}}
									key={key}
									className="block transition-transform duration-200 hover:scale-105"
								>
									{card}
								</Link>
							);
						})}
					</div>
				</section>

				<section className="mb-12">
					<h2 
						className="text-2xl font-bold mb-6" 
						style={{ 
							color: bpi_deep_green,
							borderBottom: `2px solid ${bpi_light_green}`,
							paddingBottom: "0.5rem"
						}}
					>
						Coming Soon
					</h2>
					
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
						{tableDefinitions.filter(table => table.isFake).map((table, key) => {
							const card = (
								<Card
									key={table.table}
									className="opacity-60"
									style={{
										borderRadius: "12px",
										overflow: "hidden",
										height: "170px",
										border: "none",
										boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.05)",
										cursor: "not-allowed",
									}}
									bodyStyle={{
										padding: 0,
										height: "100%",
									}}
								>
									<div
										style={{
											height: "100%",
											background: "#fff",
											padding: "1.25rem",
											display: "flex",
											flexDirection: "column",
											justifyContent: "center",
											alignItems: "center",
											transition: "all 0.3s ease",
										}}
										className="h-full w-full"
									>
										<div className="flex flex-col items-center justify-center gap-4">
											<div className="w-12 h-12 flex items-center justify-center">
												{table.image.component}
											</div>
											<div 
												className="text-center font-medium" 
												style={{ color: bpi_deep_green }}
											>
												{table.table}
											</div>
										</div>
									</div>
								</Card>
							);
							
							return (
								<div key={table.table} className="relative">
									{card}
								</div>
							);
						})}
						{tableDefinitions.filter(table => table.isFake).length === 0 && (
							<div className="col-span-full py-12 text-center">
								<svg 
									xmlns="http://www.w3.org/2000/svg" 
									className="h-16 w-16 mx-auto text-gray-300 mb-4" 
									fill="none" 
									viewBox="0 0 24 24" 
									stroke="currentColor"
								>
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
								</svg>
								<p className="text-gray-500 text-lg font-medium">More datasets will be added soon</p>
								<p className="text-gray-400 mt-2">Stay tuned for updates!</p>
							</div>
						)}
					</div>
				</section>
			</div>
			<ScreenOverlay title={currentOverlay.title} children={currentOverlay.table} />
		</div>
	);
}
