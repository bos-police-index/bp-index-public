"use client";
import * as React from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { styled } from "@mui/material/styles";
import { bpi_light_gray, bpi_light_green } from "@styles/theme/lightTheme";

export interface CollapsibleDescriptionProps {
	title: string;
	content: string;
	defaultOpen?: boolean;
}

const StyledAccordion = styled(Accordion)(({ theme }) => ({
	borderRadius: "var(--radius-lg) !important",
	overflow: "hidden",
	boxShadow: "var(--shadow-md)",
	border: "1px solid rgba(0, 0, 0, 0.05)",
	transition: "var(--transition-default)",

	"&:hover": {
		boxShadow: "var(--shadow-lg)",
	},

	"&:before": {
		display: "none",
	},
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
	backgroundColor: "var(--bpi_light_green)",
	transition: "var(--transition-default)",

	"&:hover": {
		backgroundColor: "var(--bpi_deep_green)",
	},

	".MuiAccordionSummary-content": {
		margin: "0.75rem 0",
	},

	".MuiAccordionSummary-expandIconWrapper": {
		color: "var(--white)",
		transition: "transform 0.3s ease-in-out",
	},

	"&.Mui-expanded": {
		".MuiAccordionSummary-expandIconWrapper": {
			transform: "rotate(180deg)",
		},
	},
}));

const StyledAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
	backgroundColor: "var(--light_gray)",
	padding: "1.5rem",

	"& p": {
		marginBottom: "1rem",
		lineHeight: 1.6,
		color: "var(--text-primary)",
	},

	"& li": {
		marginBottom: "0.75rem",
		paddingLeft: "1rem",
		position: "relative",
		lineHeight: 1.6,
		color: "var(--text-primary)",

		"&:before": {
			content: '""',
			position: "absolute",
			left: 0,
			top: "0.6em",
			width: "4px",
			height: "4px",
			backgroundColor: "var(--bpi_deep_green)",
			borderRadius: "50%",
		},
	},
}));

export default function CollapsibleDescription({ title, content, defaultOpen }: CollapsibleDescriptionProps) {
	const formatContent = (text: string) => {
		const paragraphs = text.split("\n").filter(Boolean);

		return paragraphs.map((paragraph, index) => {
			if (paragraph.trim().startsWith("-")) {
				return (
					<li key={index}>
						{paragraph.trim().slice(1).trim()}
					</li>
				);
			} else {
				return (
					<p key={index}>
						{paragraph.trim()}
					</p>
				);
			}
		});
	};

	return (
		<StyledAccordion defaultExpanded={defaultOpen ?? false}>
			<StyledAccordionSummary
				expandIcon={<ExpandMoreIcon />}
				aria-controls="panel1-content"
			>
				<Typography
					color="white"
					fontWeight={600}
					sx={{ fontSize: '1rem' }}
				>
					{title}
				</Typography>
			</StyledAccordionSummary>
			<StyledAccordionDetails>
				{formatContent(content)}
			</StyledAccordionDetails>
		</StyledAccordion>
	);
}
