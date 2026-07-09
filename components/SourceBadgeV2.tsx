import React from "react";

interface SourceBadgeV2Props {
	source: string | null | undefined;
	asOf: string | Date | null | undefined;
	className?: string;
}

const SOURCE_LABELS: Record<string, string> = {
	mass_post_commission: "MA POST Commission",
	boston_open_data: "data.boston.gov",
	bpd_internal: "BPD Internal Affairs (FOIA)",
};

function formatAsOf(asOf: string | Date | null | undefined): string {
	if (!asOf) return "";
	try {
		const d = typeof asOf === "string" ? new Date(asOf) : asOf;
		if (isNaN(d.getTime())) return "";
		return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
	} catch {
		return "";
	}
}

/**
 * Small provenance pill shown in v2 section headers.
 * Mirrors the "Source Materials" UX from window.statereference.com.
 */
export default function SourceBadgeV2({ source, asOf, className = "" }: SourceBadgeV2Props) {
	if (!source) return null;
	const label = SOURCE_LABELS[source] ?? source;
	const formatted = formatAsOf(asOf);
	return (
		<div
			className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] sm:text-xs text-slate-600 font-medium ${className}`}
			title={formatted ? `${label} — updated ${formatted}` : label}
		>
			<svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
			</svg>
			<span className="truncate">{label}</span>
			{formatted && <span className="text-slate-400">·</span>}
			{formatted && <span className="text-slate-500">{formatted}</span>}
		</div>
	);
}
