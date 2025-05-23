"use client";
import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import HistogramRectangle, { PayCategories } from "./Rectangle";
import { bpi_deep_green } from "@styles/theme/lightTheme";

const MARGIN = { top: 30, right: 30, bottom: 40, left: 50 };
const BUCKET_NUMBER = 20;
const BUCKET_PADDING = 1;

type HistogramProps = {
	width: number;
	height: number;
	data: number[];
	verticalLineX: number;
	mode: PayCategories;
};

export const Histogram = ({ width, height, data, verticalLineX, mode }: HistogramProps) => {
	const axesRef = useRef(null);
	const boundsWidth = width - MARGIN.right - MARGIN.left;
	const boundsHeight = height - MARGIN.top - MARGIN.bottom;

	if (!data) {
		data = [];
	}

	const domain: [number, number] = useMemo(() => {
		if (!data || !data.length) {
			console.error("Histogram data is missing or invalid.");
			return [0, 0];
		}
		return [0, Math.max(...data)];
	}, [data]);

	const xScale = useMemo(() => {
		return d3.scaleLinear().domain(domain).range([10, boundsWidth]);
	}, [data, width]);

	const buckets = useMemo(() => {
		if (!data || !Array.isArray(data)) {
			console.error("Invalid data passed to Histogram.");
			return [];
		}
		const bucketGenerator = d3
			.bin()
			.value((d) => d)
			.domain(domain)
			.thresholds(xScale.ticks(BUCKET_NUMBER));
		return bucketGenerator(data);
	}, [data, xScale]);

	// Calculate total frequency and normalized heights
	const normalizedBuckets = useMemo(() => {
		const totalCount = buckets.reduce((sum, bucket) => sum + (bucket?.length || 0), 0);
		return buckets.map((bucket) => ({
			...bucket,
			normalizedHeight: (bucket?.length || 0) / totalCount,
		}));
	}, [buckets]);

	// allow y axis to grow past 0.5 if it needs to
	const maxNormalizedHeight = Math.max(...normalizedBuckets.map((bucket) => bucket.normalizedHeight));
	const yMax = maxNormalizedHeight > 0.5 ? Math.ceil(maxNormalizedHeight * 10) / 10 : 0.5;

	// Fixed y scale from 0 to the determined max value
	const yScale = useMemo(() => {
		return d3.scaleLinear().range([boundsHeight, 0]).domain([0, yMax]);
	}, [boundsHeight, yMax]);

	useEffect(() => {
		const svgElement = d3.select(axesRef.current);
		svgElement.selectAll("*").remove();

		const minTick = Math.round(domain[0] / 1000) * 1000;
		const maxTick = Math.round(domain[1] / 1000) * 1000;
		const middleTick = Math.round((minTick + maxTick) / 2000) * 1000;
		let ticks;
		if (domain[1] == Number.NEGATIVE_INFINITY) {
			ticks = [minTick];
		} else {
			ticks = [minTick, middleTick, maxTick];
		}

		// Create x-axis with formatted ticks
		const xAxisGenerator = d3.axisBottom(xScale).tickValues(ticks).tickFormat(d3.format("$,.0f")); // Format numbers with commas

		svgElement.append("g").attr("transform", `translate(0, ${boundsHeight})`).call(xAxisGenerator);

		const yAxisGenerator = d3.axisLeft(yScale).ticks(5).tickFormat(d3.format(".0%")); // Format y-axis as percentages
		svgElement.append("g").call(yAxisGenerator);
	}, [xScale, yScale, boundsHeight]);

	const allRects = normalizedBuckets.map((bucket, i) => {
		const { x0, x1, normalizedHeight } = bucket;
		if (x0 === undefined || x1 === undefined) {
			return null;
		}
		return <HistogramRectangle key={i} x={xScale(x0) + BUCKET_PADDING / 2} width={xScale(x1) - xScale(x0) - BUCKET_PADDING} y={yScale(normalizedHeight)} height={boundsHeight - yScale(normalizedHeight)} mode={mode} />;
	});

	const verticalLinePosition = verticalLineX != null && verticalLineX != 0 ? xScale(verticalLineX) : null;

	const sortedData = useMemo(() => [...data].sort((a, b) => a - b), [data]);

	// Used to calculate percentile
	const percentile = useMemo(() => {
		if (!sortedData.length || verticalLineX == null) return null;

		// Find the rank of the employee in the sorted data
		const rank = sortedData.filter((value) => value <= verticalLineX).length;

		// Percentile calculation (rank / total count)
		return ((rank / sortedData.length) * 100).toFixed(1); // Keep 1 decimal place
	}, [sortedData, verticalLineX]);

	return (
		<div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: bpi_deep_green, fontSize: "small", flexDirection: "column" }}>
			<svg width={width} height={height}>
				<g width={boundsWidth} height={boundsHeight} transform={`translate(${MARGIN.left},${MARGIN.top})`}>
					{allRects}
					{verticalLinePosition != null && (
						<>
							<line x1={verticalLinePosition} y1={0} x2={verticalLinePosition} y2={boundsHeight} stroke={"red"} strokeWidth={2} />
							{percentile !== null && (
								<text x={verticalLinePosition} y={-5} fill="red" textAnchor="middle" fontSize="12px" fontWeight="bold">
									{percentile}%
								</text>
							)}
						</>
					)}
				</g>
				<g width={boundsWidth} height={boundsHeight} ref={axesRef} transform={`translate(${MARGIN.left},${MARGIN.top})`} />
			</svg>
			<p>*No red line means the officer did not receive pay in that category that year*</p>
		</div>
	);
};

export default Histogram;
