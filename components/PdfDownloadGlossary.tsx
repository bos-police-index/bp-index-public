import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatDate, formatDateShort, formatTextDate } from "@utility/textFormatHelpers";

// Define styles for the PDF
const styles = StyleSheet.create({
	page: {
		padding: 20,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 20,
		color: "#006400", // Replace with your `bpi_deep_green` color
	},
	tableContainer: {
		width: "100%",
		marginBottom: 20,
	},
	row: {
		flexDirection: "row", // Makes the row horizontally aligned
		borderBottomWidth: 1,
		borderBottomColor: "#000",
		borderBottomStyle: "solid",
	},
	cell: {
		padding: 8,
		fontSize: 12,
		flex: 1, // Adjusts cell size proportionally
	},
	header: {
		fontWeight: "bold",
		backgroundColor: "#d3d3d3", // Light gray for header
	},
});

const PdfDownloadGlossary = ({ rows }: { rows: any[] }) => (
	<Document>
		<Page size="A4" style={styles.page}>
			{/* Title */}
			<Text style={styles.title}>BPI Glossary</Text>
			<Text style={{ fontSize: "12px" }}>Downloaded: {formatTextDate(Date.now())}</Text>

			{/* Table */}
			<View style={styles.tableContainer}>
				{/* Header */}
				<View style={[styles.row, styles.header]}>
					<Text style={styles.cell}>Column Name</Text>
					<Text style={styles.cell}>Definition</Text>
				</View>

				{/* Rows */}
				{rows.map((row, index) => (
					<View key={index} style={styles.row}>
						<Text style={styles.cell}>{row.name}</Text>
						<Text style={styles.cell}>{row.description}</Text>
					</View>
				))}
			</View>
		</Page>
	</Document>
);

export default PdfDownloadGlossary;
