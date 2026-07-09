import React from "react";

interface MissingDataProps {
	title?: string;
	message?: string;
	variant?: "inline" | "card" | "field";
	className?: string;
}

/**
 * Reusable empty-state for cases where source data is missing.
 *
 * - "field": small inline "—" placeholder for individual values inside a row/card
 * - "inline": short banner inside an existing card (one line)
 * - "card": full empty-state card for a whole section
 */
export default function MissingData({
	title,
	message,
	variant = "inline",
	className = "",
}: MissingDataProps) {
	if (variant === "field") {
		return (
			<span
				className={`text-gray-400 ${className}`}
				title={message || "Data not available"}
				aria-label="Data not available"
			>
				—
			</span>
		);
	}

	if (variant === "card") {
		return (
			<div
				className={`flex flex-col items-center justify-center text-center py-10 px-6 bg-gray-50 border border-dashed border-gray-200 rounded-xl ${className}`}
			>
				<svg
					className="w-8 h-8 text-gray-400 mb-3"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={1.5}
						d="M13 16h-1v-4h-1m1-4h.01M12 22a10 10 0 110-20 10 10 0 010 20z"
					/>
				</svg>
				<div className="text-sm font-semibold text-gray-700">
					{title || "No data available"}
				</div>
				{message && (
					<div className="mt-1 text-xs text-gray-500 max-w-md">{message}</div>
				)}
			</div>
		);
	}

	return (
		<div
			className={`flex items-center text-xs sm:text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-2 ${className}`}
		>
			<svg
				className="w-3.5 h-3.5 mr-2 text-gray-400 flex-shrink-0"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={1.5}
					d="M13 16h-1v-4h-1m1-4h.01M12 22a10 10 0 110-20 10 10 0 010 20z"
				/>
			</svg>
			<span>{title || message || "Data not available for this officer"}</span>
		</div>
	);
}
