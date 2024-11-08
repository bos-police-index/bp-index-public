"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Card } from "antd";
import { tableDefinitions } from "../../utility/tableDefinitions";
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
				backgroundColor: "white",
				height: "auto", //fix this later to be 100vh - height of Navbar
				width: "100%",
			}}
		>
			<div style={{ maxWidth: "1128px", margin: "0 auto", color: "#3874CB" }}>
				<div style={{ display: "flex", justifyContent: "start", alignItems: "center", padding: "0 1rem" }}>
					<p style={{ color: bpi_light_green, marginTop: "1rem" }}>
						*Click{" "}
						<button onClick={handleSeeAllClick}>
							<u>here</u>
						</button>{" "}
						to view and download the full glossary
					</p>
				</div>

				<div className={"flex flex-row flex-wrap gap-3 items-center justify-start pb-12 pt-8"}>
					{tableDefinitions.map((table) => (
						<Card
							key={table.table}
							style={{
								borderColor: bpi_deep_green,
								boxShadow: "0px 0px 4px 4px rgba(0, 0, 0, 0.1)",
								color: bpi_deep_green,
								width: "241px",
								height: "170px",
								margin: "1rem 1rem",
								alignContent: "center",
								transition: "transform 0.5s",
								backgroundColor: cardFlipped == table.table ? bpi_light_green : "transparent",
								opacity: table.isFake ? "50%" : "100%",
								pointerEvents: table.isFake ? "none" : "all",
							}}
							onMouseEnter={() => handleHover(table)}
							onMouseLeave={handleLeave}
						>
							<Link
								href={{
									pathname: "/data/tables/[table_name]",
									query: { table_name: table.query },
								}}
								className={`flex flex-col items-center justify-center text-lg font-medium rounded-lg overflow-clip gap-4`}
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									color: cardFlipped === table.table ? "white" : bpi_deep_green,
									backgroundColor: cardFlipped !== table.table ? "white" : bpi_light_green,
									lineHeight: "1.3",
								}}
							>
								{cardFlipped == table.table ? (
									<div style={{ fontSize: "medium" }}>{table.shortDescription}</div>
								) : (
									<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: bpi_deep_green }}>
										<div>{table.image.component}</div>
										<div style={{ textAlign: "center" }}>{table.table}</div>
									</div>
								)}
							</Link>
						</Card>
					))}

					{/* dummy cards */}
					{[...Array(5)].map((_, index) => (
						<Card
							key={`dummy-${index}`}
							style={{
								borderColor: "none",
								boxShadow: "0px 0px 4px 4px rgba(0, 0, 0, 0.1)",
								color: "#3874CB",
								width: "241px",
								height: "170px",
								margin: "1rem 1rem",
								alignContent: "center",
								transition: "transform 0.5s",
								backgroundColor: "#F0F0F0",
								pointerEvents: "none",
							}}
						/>
					))}
				</div>
			</div>
			<ScreenOverlay title={currentOverlay.title} children={currentOverlay.table} />
		</div>
	);
}
