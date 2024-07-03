"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Card } from "antd";
import { tableDefinitions } from "./tableDefinitions";

export default function Home() {
	const [cardFlipped, setCardFlipped] = useState<any>(null);

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
				height: "100%",
				width: "110vw",
				marginLeft: "-11vw",
			}}
		>
			<div style={{ maxWidth: "1128px", margin: "0 auto", color: "#3874CB" }}>
				<div className={"flex flex-row flex-wrap gap-3 items-center justify-start pb-12 pt-20"}>
					{tableDefinitions.map((table) => (
						<Card
							key={table.table}
							style={{
								borderColor: "#3874CB",
								boxShadow: "0px 0px 4px 4px rgba(0, 0, 0, 0.1)",
								color: "#3874CB",
								width: "272px",
								height: "177px",
								alignContent: "center",
								transition: "transform 0.5s",
								// transform: cardFlipped == table.table ? "rotateY(180deg)" : "rotateY(0deg)", // Flipping animation
								backgroundColor: cardFlipped == table.table ? "#3874CB" : "transparent", // Blue background on hover
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
								className={`flex flex-col items-center justify-center text-lg font-medium bg-white rounded-lg overflow-clip gap-4`}
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									color: cardFlipped === table.table ? "white" : "#3874CB",
									backgroundColor: cardFlipped !== table.table ? "white" : "#3874CB",
									lineHeight: "1.5",
								}}
							>
								{cardFlipped == table.table ? (
									<div style={{ fontSize: "small" }}>{table.shortDescription}</div>
								) : (
									<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
										<div>{table.image.component}</div>
										<div style={{ textAlign: "center" }}>{table.table}</div>
									</div>
								)}
							</Link>
						</Card>
					))}
					<p style={{ color: "#B3B3B3", margin: "0 0.5rem" }}>More Coming...</p>
				</div>
			</div>
		</div>
	);
}
