import React from "react";
import MissingData from "@components/MissingData";
import SourceBadgeV2 from "@components/SourceBadgeV2";

interface Props {
	rows: V2AssignmentRow[];
}

function fmtDate(s: string | null): string {
	if (!s) return "—";
	try {
		return new Date(s).toLocaleDateString(undefined, { year: "numeric", month: "short" });
	} catch {
		return s;
	}
}

function parseTime(s: string | null): number {
	if (!s) return 0;
	const t = Date.parse(s);
	return Number.isNaN(t) ? 0 : t;
}

interface UnitSpan {
	descr: string;
	workgroup: string | null;
	firstSeen: string | null;
	lastSeen: string | null;
	count: number;
}

/**
 * Collapse the assignment-history rows (one per effective date, often the same
 * unit reaffirmed many times) into one span per distinct unit, tracking the
 * first/last effective dates and how many records back it. Sorted most-recent
 * first so the officer's current/most-recent unit leads.
 */
function toSpans(rows: V2AssignmentRow[]): UnitSpan[] {
	const byUnit = new Map<string, UnitSpan>();
	for (const r of rows) {
		const descr = (r.descr || "").trim();
		if (!descr) continue;
		const existing = byUnit.get(descr);
		if (!existing) {
			byUnit.set(descr, {
				descr,
				workgroup: r.workgroup,
				firstSeen: r.effDate,
				lastSeen: r.effDate,
				count: 1,
			});
		} else {
			existing.count += 1;
			if (parseTime(r.effDate) > parseTime(existing.lastSeen)) existing.lastSeen = r.effDate;
			if (parseTime(r.effDate) < parseTime(existing.firstSeen)) existing.firstSeen = r.effDate;
			if (!existing.workgroup && r.workgroup) existing.workgroup = r.workgroup;
		}
	}
	return Array.from(byUnit.values()).sort((a, b) => parseTime(b.lastSeen) - parseTime(a.lastSeen));
}

export default function OrganizationCardV2({ rows }: Props) {
	const hasData = rows && rows.length > 0;
	const spans = hasData ? toSpans(rows) : [];
	const current = spans[0] ?? null;
	const history = spans.slice(1);

	// Provenance: the assignment view doesn't carry a source column; this dataset
	// is the BPD task-profile assignment extract (2010–2022). asOf = latest eff date.
	const latestEff = hasData
		? rows.reduce((mx, r) => (parseTime(r.effDate) > parseTime(mx) ? r.effDate : mx), rows[0].effDate)
		: null;

	return (
		<div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
			<div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-fuchsia-50">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<div className="flex items-center space-x-2 sm:space-x-3">
						<div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-purple-100">
							<svg className="w-3 h-3 sm:w-4 sm:h-4 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
							</svg>
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h2 className="text-base sm:text-lg font-semibold text-gray-900">Organization &amp; Assignments</h2>
								<span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs font-semibold border border-emerald-200">v2</span>
							</div>
							<p className="text-xs sm:text-sm text-gray-600">Unit assignment history by task profile</p>
						</div>
					</div>
					{hasData && <SourceBadgeV2 source="tskprof_2010_2022" asOf={latestEff} />}
				</div>
			</div>

			<div className="p-4 sm:p-6 space-y-4">
				{!hasData ? (
					<MissingData
						variant="card"
						title="No assignment history on file"
						message="This officer is not present in the task-profile assignment extract (2010–2022)."
					/>
				) : (
					<>
						{/* Current / most-recent unit */}
						{current && (
							<div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
								<div className="text-[11px] font-medium text-purple-600 uppercase tracking-wide">Most recent unit</div>
								<div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
									<span className="text-lg font-semibold text-gray-900">{current.descr}</span>
									{current.workgroup && (
										<span className="text-xs font-mono text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">{current.workgroup}</span>
									)}
								</div>
								<div className="mt-1 text-xs text-gray-600">
									as of {fmtDate(current.lastSeen)}
									{current.firstSeen && current.firstSeen !== current.lastSeen && ` · since ${fmtDate(current.firstSeen)}`}
								</div>
							</div>
						)}

						{/* Prior assignments timeline */}
						{history.length > 0 && (
							<div>
								<div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-2">
									Prior assignments ({history.length})
								</div>
								<ol className="relative border-l-2 border-gray-100 ml-1.5 space-y-3">
									{history.map((u, i) => (
										<li key={`${u.descr}-${i}`} className="ml-4">
											<span className="absolute -left-[7px] mt-1.5 w-3 h-3 rounded-full bg-gray-300 border-2 border-white" />
											<div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
												<span className="text-sm font-medium text-gray-900">{u.descr}</span>
												{u.workgroup && (
													<span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1 py-0.5 rounded">{u.workgroup}</span>
												)}
											</div>
											<div className="text-xs text-gray-500">
												{u.firstSeen && u.lastSeen && u.firstSeen !== u.lastSeen
													? `${fmtDate(u.firstSeen)} – ${fmtDate(u.lastSeen)}`
													: fmtDate(u.lastSeen)}
											</div>
										</li>
									))}
								</ol>
							</div>
						)}

						<div className="text-[10px] text-gray-400 pt-1">
							{rows.length} assignment record{rows.length === 1 ? "" : "s"} across {spans.length} unit{spans.length === 1 ? "" : "s"}.
							Task Profile IDs reflect assignment, not officer identity.
						</div>
					</>
				)}
			</div>
		</div>
	);
}
