import React, { useMemo, useState } from "react";
import MissingData from "@components/MissingData";
import { formatMoneyNoCents } from "@utility/textFormatHelpers";
import { bpi_deep_green, bpi_light_green } from "@styles/theme/lightTheme";

interface Props {
	rows: V2PayRelativeRow[];
}

const n = (v: number | string | null | undefined) => (v == null || v === "" ? null : Number(v));
const money = (v: number | string | null | undefined) => (n(v) == null ? "—" : `$${formatMoneyNoCents(n(v))}`);

/**
 * Relative pay by category (review round 2: "Relative ranking by category e.g. annual
 * average — compared to other officers that year"). Each pay category is compared with
 * everyone in the officer's peer group paid that year: sworn officers, or — for civilian
 * titles — other civilian BPD employees (production.vw_v2_pay_relative).
 */
export default function PayComparisonCardV2({ rows }: Props) {
	const years = useMemo(() => Array.from(new Set((rows ?? []).map((r) => r.year))).sort((a, b) => b - a), [rows]);
	const [year, setYear] = useState<number | null>(null);
	const selected = year ?? years[0] ?? null;
	const yearRows = useMemo(() => (rows ?? []).filter((r) => r.year === selected), [rows, selected]);
	const total = yearRows.find((r) => r.category === "total");
	const peerLabel = total?.peerGroup === "civilian" ? "civilian BPD employees" : "sworn officers";

	return (
		<div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
			<div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-blue-50">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<div className="flex items-center space-x-2 sm:space-x-3">
						<div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${bpi_light_green}30` }}>
							<svg className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: bpi_deep_green }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
							</svg>
						</div>
						<div>
							<h2 className="text-base sm:text-lg font-semibold text-gray-900">Pay Compared with Other Officers</h2>
							<p className="text-xs sm:text-sm text-gray-600">Each pay category vs. the average and ranking of peers paid the same year</p>
						</div>
					</div>
					{years.length > 1 && (
						<div className="flex flex-wrap gap-1">
							{years.map((y) => (
								<button
									key={y}
									type="button"
									onClick={() => setYear(y)}
									className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${y === selected ? "text-white border-transparent" : "text-gray-700 border-gray-200 bg-white hover:bg-gray-50"}`}
									style={y === selected ? { backgroundColor: bpi_deep_green } : undefined}
								>
									{y}
								</button>
							))}
						</div>
					)}
				</div>
			</div>

			<div className="p-3 sm:p-6">
				{!total ? (
					<MissingData variant="card" title="No pay comparison available" message="This officer has no earnings on file (2020–2025), so there is nothing to compare." />
				) : (
					<>
						<p className="text-sm text-gray-700 mb-4">
							In <span className="font-semibold">{selected}</span>, compared with the <span className="font-semibold">{total.peers.toLocaleString()}</span> {peerLabel} paid that year
							{total.title ? <> (title that year: <span className="font-medium">{total.title}</span>)</> : null}.
						</p>
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b-2 border-emerald-500">
										<th className="py-2 pr-3 font-semibold">Category</th>
										<th className="py-2 pr-3 font-semibold text-right">This officer</th>
										<th className="py-2 pr-3 font-semibold text-right">Peer average</th>
										<th className="py-2 pr-3 font-semibold text-right">Peer median</th>
										<th className="py-2 pr-3 font-semibold text-right">vs. average</th>
										<th className="py-2 pr-3 font-semibold">Rank among peers</th>
									</tr>
								</thead>
								<tbody>
									{yearRows.map((r) => {
										const amount = n(r.amount) ?? 0;
										const ratio = n(r.ratioToAvg);
										const top = Math.max(1, 100 - r.percentile);
										return (
											<tr key={r.category} className={`border-b border-gray-100 ${r.category === "total" ? "font-semibold bg-gray-50" : ""}`}>
												<td className="py-2 pr-3 text-gray-800">{r.categoryLabel}</td>
												<td className="py-2 pr-3 text-right tabular-nums text-gray-900">{amount > 0 ? money(amount) : <span className="text-gray-400">$0</span>}</td>
												<td className="py-2 pr-3 text-right tabular-nums text-gray-600">{money(r.peerAvg)}</td>
												<td className="py-2 pr-3 text-right tabular-nums text-gray-600">{money(r.peerMedian)}</td>
												<td className={`py-2 pr-3 text-right tabular-nums ${ratio != null && ratio >= 1.5 ? "text-amber-700 font-semibold" : "text-gray-700"}`}>
													{ratio != null && amount > 0 ? `${ratio.toFixed(2)}×` : "—"}
												</td>
												<td className="py-2 pr-3">
													{amount > 0 ? (
														<div className="flex items-center gap-2 min-w-[180px]">
															<div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden" title={`Earned more than ${r.percentile}% of peers`}>
																<div className="h-full rounded-full" style={{ width: `${Math.max(2, r.percentile)}%`, backgroundColor: top <= 10 ? "#d97706" : bpi_light_green }} />
															</div>
															<span className="text-xs text-gray-700 whitespace-nowrap">
																Top {top}% <span className="text-gray-400">(#{r.rank.toLocaleString()})</span>
															</span>
														</div>
													) : (
														<span className="text-xs text-gray-400">None this year</span>
													)}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
						<p className="mt-3 text-[11px] text-gray-400 leading-relaxed">
							Peers are everyone with the same kind of job title (sworn officers, or civilian employees) on the BPD payroll that year; someone with no pay in a category counts as $0 in it.
							&ldquo;Top X%&rdquo; is the share of peers who earned as much or more; rank #1 is the highest. Source: data.boston.gov Employee Earnings.
						</p>
					</>
				)}
			</div>
		</div>
	);
}
