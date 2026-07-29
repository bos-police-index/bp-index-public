import React from "react";
import { formatMoneyNoCents } from "@utility/textFormatHelpers";

interface Props {
	rows: V2EarningsRow[];
}

/**
 * Dependency-free SVG bar chart of total pay per year, with the overtime portion
 * highlighted (accountability-relevant). WokeWindows-style; renders above the
 * earnings table.
 */
export default function EarningsTrendChartV2({ rows }: Props) {
	const byYear = [...(rows || [])]
		.filter((r) => r.year != null && r.totalPay != null)
		.sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
	if (byYear.length < 2) return null; // not worth a chart for 0–1 years

	const maxTotal = Math.max(...byYear.map((r) => r.totalPay || 0), 1);

	// layout
	const W = 640, H = 200, padL = 8, padR = 8, padTop = 24, padBottom = 28;
	const plotH = H - padTop - padBottom;
	const n = byYear.length;
	const slot = (W - padL - padR) / n;
	const barW = Math.min(64, slot * 0.62);

	return (
		<div className="mb-4 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-3">
			<div className="flex items-center justify-between mb-1">
				<span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total pay by year</span>
				<span className="text-[11px] text-gray-500 inline-flex items-center gap-3">
					<span className="inline-flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500" />base + other</span>
					<span className="inline-flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-500" />overtime</span>
				</span>
			</div>
			<svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Total pay by year" style={{ maxHeight: 220 }}>
				{byYear.map((r, i) => {
					const total = r.totalPay || 0;
					const ot = Math.max(0, Math.min(r.otPay || 0, total));
					const base = total - ot;
					const x = padL + i * slot + (slot - barW) / 2;
					const totalH = (total / maxTotal) * plotH;
					const otH = (ot / maxTotal) * plotH;
					const baseH = totalH - otH;
					const yBase = padTop + (plotH - totalH);
					return (
						<g key={r.year ?? i}>
							<title>{`${r.year}: $${formatMoneyNoCents(total)} total · $${formatMoneyNoCents(ot)} overtime`}</title>
							{/* base */}
							<rect x={x} y={yBase + otH} width={barW} height={Math.max(0, baseH)} rx={2} fill="#10b981" />
							{/* overtime (top) */}
							{otH > 0 && <rect x={x} y={yBase} width={barW} height={otH} rx={2} fill="#f59e0b" />}
							{/* total label */}
							<text x={x + barW / 2} y={yBase - 5} textAnchor="middle" fontSize="10" fill="#374151" fontWeight="600">
								${formatMoneyNoCents(total)}
							</text>
							{/* year label */}
							<text x={x + barW / 2} y={H - 10} textAnchor="middle" fontSize="11" fill="#6b7280">
								{r.year}
							</text>
						</g>
					);
				})}
			</svg>
		</div>
	);
}
