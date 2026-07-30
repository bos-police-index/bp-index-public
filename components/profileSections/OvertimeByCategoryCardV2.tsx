import React, { useMemo } from "react";
import MissingData from "@components/MissingData";

interface Props {
	rows: V2OvertimeCategoryRow[];
}

// Distinct color per category (stable by label).
const CATEGORY_COLORS: Record<string, string> = {
	"Special Events": "#2563eb",
	"Court": "#7c3aed",
	"Extended Tours": "#0891b2",
	"Replacement Personnel": "#d97706",
	"Additional Tour / Call-out": "#059669",
};
const fallbackColor = "#64748b";

export default function OvertimeByCategoryCardV2({ rows }: Props) {
	const summary = useMemo(() => {
		const sorted = [...(rows || [])].sort((a, b) => (Number(b.totalHours) || 0) - (Number(a.totalHours) || 0));
		const totalHours = sorted.reduce((s, r) => s + (Number(r.totalHours) || 0), 0);
		const totalItems = sorted.reduce((s, r) => s + (Number(r.lineItems) || 0), 0);
		const maxHours = sorted.reduce((m, r) => Math.max(m, Number(r.totalHours) || 0), 0);
		const fys = sorted.flatMap((r) => [r.firstFy, r.lastFy]).filter((v): v is number => v != null);
		return {
			sorted,
			totalHours,
			totalItems,
			maxHours,
			minFy: fys.length ? Math.min(...fys) : null,
			maxFy: fys.length ? Math.max(...fys) : null,
		};
	}, [rows]);

	return (
		<div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
			<div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-slate-50">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<div className="flex items-center space-x-2 sm:space-x-3">
						<div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-blue-100">
							<svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h2 className="text-base sm:text-lg font-semibold text-gray-900">Overtime by Category</h2>
								<span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs font-semibold border border-emerald-200">v2</span>
							</div>
							<p className="text-xs sm:text-sm text-gray-600">Overtime hours by category (matched by employee id)</p>
						</div>
					</div>
					<span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] sm:text-xs font-medium border border-slate-200">
						Hours paid · FY2023–FY2026
					</span>
				</div>
			</div>

			<div className="p-3 sm:p-6">
				{!rows || rows.length === 0 ? (
					<MissingData
						variant="card"
						title="No overtime on file"
						message="This officer has no sworn-overtime records in the dataset (currently covering fiscal years 2023–2026)."
					/>
				) : (
					<>
						<div className="flex flex-wrap items-center gap-x-6 gap-y-1 mb-4 text-sm">
							<span><span className="text-gray-400">Total hours:</span> <span className="font-semibold text-gray-900">{summary.totalHours.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span></span>
							<span><span className="text-gray-400">Line items:</span> <span className="font-semibold text-gray-900">{summary.totalItems.toLocaleString()}</span></span>
							{summary.minFy && <span className="text-gray-500">FY{summary.minFy === summary.maxFy ? summary.minFy : `${summary.minFy}–${summary.maxFy}`}</span>}
						</div>

						<div className="space-y-2.5">
							{summary.sorted.map((r) => {
								const hours = Number(r.totalHours) || 0;
								const pct = summary.maxHours > 0 ? Math.max(2, (hours / summary.maxHours) * 100) : 0;
								const label = r.categoryLabel || "—";
								const color = CATEGORY_COLORS[label] || fallbackColor;
								const share = summary.totalHours > 0 ? (hours / summary.totalHours) * 100 : 0;
								return (
									<div key={label}>
										<div className="flex items-center justify-between text-sm mb-0.5">
											<span className="font-medium text-gray-800">{label}</span>
											<span className="text-gray-600">
												<span className="font-semibold text-gray-900">{hours.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span> hrs
												<span className="text-gray-400"> · {share.toFixed(0)}% · {(Number(r.lineItems) || 0).toLocaleString()} items</span>
											</span>
										</div>
										<div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
											<div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
										</div>
									</div>
								);
							})}
						</div>

						<p className="mt-4 text-xs text-gray-400">
							Overtime hours paid by category, matched to this officer by employee id. Source: BPD sworn-overtime files (public records). Reported in hours, not dollars.
						</p>
					</>
				)}
			</div>
		</div>
	);
}
