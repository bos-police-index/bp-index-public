"use client";
import * as React from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { bpi_light_gray, bpi_light_green } from "@styles/theme/lightTheme";

export interface CollapsibleDescriptionProps {
	title: string;
	content: string;
	defaultOpen?: boolean;
}

export default function CollapsibleDescription({ title, content, defaultOpen }: CollapsibleDescriptionProps) {
	const formatContent = (text) => {
		const paragraphs = text.split("\n").filter(Boolean); // Filter out empty strings

		// Map paragraphs to add bullet points to lines starting with '-'
		const formattedText = paragraphs.map((paragraph, index) => {
			if (paragraph.trim().startsWith("-")) {
				return (
					<li key={index} style={{ marginBottom: "0.5rem" }}>
						{paragraph.trim().slice(1).trim()} {/* Remove '-' and trim */}
					</li>
				);
			} else {
				return (
					<p key={index} style={{ marginBottom: "1rem" }}>
						{paragraph.trim()}
					</p>
				);
			}
		});

		return formattedText;
	};

	return (
		<div>
			<Accordion defaultExpanded={defaultOpen ? defaultOpen : false}>
				<AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1-content" sx={{ backgroundColor: bpi_light_green, borderTopLeftRadius: "0.5rem", borderTopRightRadius: "0.5rem" }}>
					<Typography color="white" fontWeight={500}>
						{title}
					</Typography>
				</AccordionSummary>
				<AccordionDetails sx={{ backgroundColor: bpi_light_gray, borderRadius: "0.5rem" }}>{formatContent(content)}</AccordionDetails>
			</Accordion>
		</div>
	);
}
