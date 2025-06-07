"use client";

import React, { useState, useMemo } from "react";
import { Typography, Input } from "antd";

import getHeaderWithDescription from "@utility/columnDefinitions";
import { functionMapping } from "@utility/createMUIGrid";
import { bpi_deep_green, bpi_light_green } from "@styles/theme/lightTheme";

interface ColumnObject {
	name: string;
	description: string;
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
			definitions.push(...getHeaderWithDescription(currTable));
		}
	}
	return definitions.sort((a, b) => a.name.localeCompare(b.name));
};

const GlossaryItem: React.FC<{ 
	columnObject: ColumnObject | { name: React.ReactNode, description: React.ReactNode }; 
	isTotal: boolean; 
	last: boolean; 
	firstAppearance: boolean;
	isSidePanel?: boolean;
}> = ({ columnObject, isTotal, last, firstAppearance, isSidePanel }) => {
	const getFirstLetter = () => {
		if (typeof columnObject.name === 'string') {
			return columnObject.name.substring(0, 1);
		} else {
			const textContent = React.Children.toArray(columnObject.name)
				.find(child => typeof child === 'string')?.toString() || '';
			return textContent.substring(0, 1);
		}
	};

	return (
		<tr className={`${firstAppearance ? 'mt-2' : ''} hover:bg-gray-50 transition-colors duration-150`}>
			{isTotal ? (
				<td 
					className={`p-2 font-semibold text-center rounded-l-md ${firstAppearance ? 'pt-4' : ''}`} 
					style={{ 
						width: "5%",
						backgroundColor: firstAppearance ? 'rgba(241, 245, 249, 0.7)' : 'transparent'
					}}
				>
					{firstAppearance ? (
						<span 
							className="flex items-center justify-center w-6 h-6 rounded-full mx-auto text-white"
							style={{
								backgroundColor: bpi_deep_green,
								fontSize: '0.75rem',
								fontWeight: 600
							}}
						>
							{getFirstLetter().toUpperCase()}
						</span>
					) : ""}
				</td>
			) : (
				""
			)}

			<td 
				className={`font-medium ${isSidePanel ? 'py-3 px-4 text-sm' : 'p-3 pl-4'} ${firstAppearance ? 'border-t border-gray-100' : ''} ${!isTotal ? 'rounded-l-md' : ''}`} 
				style={{ 
					width: isTotal ? "37.5%" : isSidePanel ? "40%" : "45%",
					backgroundColor: 'rgba(241, 245, 249, 0.5)'
				}}
			>
				{columnObject.name}
			</td>
			<td 
				className={`${isSidePanel ? 'py-3 px-4 text-sm' : 'p-3'} ${firstAppearance ? 'border-t border-gray-100' : ''} rounded-r-md`}
				style={{ 
					width: isTotal ? "50%" : isSidePanel ? "60%" : "55%",
					backgroundColor: 'white'
				}}
			>
				{columnObject.description}
			</td>
		</tr>
	);
};

const GlossaryTotal: React.FC<GlossaryTotalProps> = ({ tableDefinitions, columnObjects, total }) => {
	const [searchTerm, setSearchTerm] = useState('');
	
	if ((total && !tableDefinitions) || (!total && !columnObjects)) {
		return (
			<div className="flex flex-col items-center justify-center p-8 text-gray-500">
				<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
				<div className="text-xl font-medium">No glossary items available</div>
			</div>
		);
	}

	var rows = [];
	if (total) {
		rows = gatherAllDefinitions(tableDefinitions);
	} else {
		rows = columnObjects;
	}
	
	const isSidePanel = !total && columnObjects && columnObjects.length > 0;
	
	const filteredRows = useMemo(() => {
		if (!searchTerm) return rows;
		
		return rows.filter(row => 
			row.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
			row.description.toLowerCase().includes(searchTerm.toLowerCase())
		);
	}, [rows, searchTerm]);
	
	const groupedItems = useMemo(() => {
		const groupedObj = filteredRows.reduce((acc, col) => {
			const firstLetter = col.name.substring(0, 1).toUpperCase();
			if (!acc[firstLetter]) {
				acc[firstLetter] = [];
			}
			// Prevent duplicates
			if (!acc[firstLetter].some(item => item.name === col.name)) {
				acc[firstLetter].push(col);
			}
			return acc;
		}, {});
		
		Object.keys(groupedObj).forEach(letter => {
			groupedObj[letter].sort((a, b) => a.name.localeCompare(b.name));
		});
		
		return groupedObj;
	}, [filteredRows]);
	
	const sortedLetters = Object.keys(groupedItems).sort();
	
	const highlightText = (text, term) => {
		if (!term.trim()) return text;
		
		const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
		const parts = text.split(regex);
		
		return parts.map((part, idx) => 
			regex.test(part) ? 
				<mark key={idx} style={{ backgroundColor: 'rgba(56, 142, 60, 0.2)', padding: 0 }}>{part}</mark> : 
				part
		);
	};

	return (
		<div className={`bg-white ${isSidePanel ? 'p-0' : 'max-w-5xl mx-auto mb-8'}`}>
			{total && (
				<div className="mb-6 flex items-center">
					<div
						className="w-1.5 h-10 rounded-full mr-4"
						style={{ backgroundColor: bpi_deep_green }}
					></div>
					<Typography.Title style={{ color: bpi_deep_green, fontWeight: "600", margin: 0 }} level={2}>
						BPI Glossary
					</Typography.Title>
				</div>
			)}
			
			{/* Search field */}
			<div className="mb-6">
				<Input
					placeholder="Search glossary terms and definitions..."
					onChange={e => setSearchTerm(e.target.value)}
					value={searchTerm}
					className="py-2"
					style={{ 
						borderRadius: '8px',
						boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
					}}
					prefix={
						<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
					}
					suffix={
						searchTerm ? 
							<svg 
								xmlns="http://www.w3.org/2000/svg" 
								className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-700" 
								fill="none" 
								viewBox="0 0 24 24" 
								stroke="currentColor"
								onClick={() => setSearchTerm('')}
							>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						: null
					}
				/>
			</div>
			
			{/* Alphabetic navigation */}
			{!isSidePanel && sortedLetters.length > 0 && (
				<div className="flex mb-6 gap-2 flex-wrap">
					{sortedLetters.map(letter => (
						<a 
							key={letter}
							href={`#letter-${letter}`}
							className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
							style={{
								backgroundColor: bpi_deep_green,
								color: 'white',
								fontWeight: 600,
								fontSize: '0.8rem',
								textDecoration: 'none',
							}}
						>
							{letter}
						</a>
					))}
				</div>
			)}
			
			{sortedLetters.length === 0 ? (
				<div className="flex flex-col items-center justify-center p-8 text-gray-500 mt-4">
					<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<div className="text-xl font-medium mb-1">No matching terms</div>
					<p className="text-center text-gray-400">Try a different search term</p>
				</div>
			) : (
				<div className="space-y-6">
					{sortedLetters.map(letter => (
						<div key={letter} id={`letter-${letter}`} className="mb-4">
							{!isSidePanel && (
								<div 
									className="text-lg font-bold mb-2 pl-2 border-l-4"
									style={{ 
										borderColor: bpi_deep_green,
										color: bpi_deep_green,
										backgroundColor: 'rgba(241, 245, 249, 0.3)',
										padding: '0.5rem 0.75rem',
										borderRadius: '0 4px 4px 0'
									}}
								>
									{letter}
								</div>
							)}
							<table className="border-collapse table-fixed w-full bg-white rounded-lg overflow-hidden">
								<tbody className="divide-y divide-gray-100">
									{groupedItems[letter].map((col, index) => {
										const firstAppearance = index === 0;
										const last = index === groupedItems[letter].length - 1;
										
										const highlightedCol = searchTerm ? {
											...col,
											name: highlightText(col.name, searchTerm),
											description: highlightText(col.description, searchTerm)
										} : col;
										
										return (
											<GlossaryItem 
												key={col.name} 
												columnObject={highlightedCol} 
												isTotal={total} 
												last={last} 
												firstAppearance={firstAppearance} 
												isSidePanel={isSidePanel} 
											/>
										);
									})}
								</tbody>
							</table>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default GlossaryTotal;
