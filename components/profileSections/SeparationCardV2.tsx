import React from "react";
import MissingData from "@components/MissingData";
import SourceBadgeV2 from "@components/SourceBadgeV2";

interface Props {
	rows: V2SeparationRow[];
}

function fmtDate(s: string | null): string {
	if (!s) return "—";
	try {
		return new Date(String(s).slice(0,10)+"T00:00:00Z").toLocaleDateString(undefined, { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" });
	} catch {
		return s;
	}
}

/** Severity styling for separation type — highlight the accountability-relevant ones. */
function sepClass(t: string | null): string {
	const s = (t || "").toLowerCase();
	if (s.includes("terminat") || s.includes("suspend") || s.includes("ndi") || s.includes("decert"))
		return "bg-red-100 text-red-800 border border-red-300";
	if (s.includes("in lieu"))
		return "bg-amber-100 text-amber-900 border border-amber-300";
	if (s.includes("retire"))
		return "bg-blue-100 text-blue-800 border border-blue-200";
	if (s.includes("resign"))
		return "bg-slate-100 text-slate-700 border border-slate-200";
	return "bg-gray-100 text-gray-700 border border-gray-200";
}

function isNoAgency(employer: string | null): boolean {
	const s = (employer || "").toLowerCase();
	return !employer || s.includes("unassociated") || s.includes("none");
}

export default function SeparationCardV2({ rows }: Props) {
	const latest = rows && rows.length > 0 ? rows[0] : null;

	return (
		<div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
			<div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-slate-50">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<div className="flex items-center space-x-2 sm:space-x-3">
						<div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-indigo-100">
							<svg className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h2 className="text-base sm:text-lg font-semibold text-gray-900">Agency &amp; Separation History</h2>
								<span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs font-semibold border border-emerald-200">v2</span>
							</div>
							<p className="text-xs sm:text-sm text-gray-600">MA POST Commission agency changes &amp; nature of separation (matched by MPTC ID)</p>
						</div>
					</div>
					{latest && <SourceBadgeV2 source={latest.source} asOf={latest.asOf} />}
				</div>
			</div>

			<div className="p-4 sm:p-6">
				{!rows || rows.length === 0 ? (
					<MissingData
						variant="card"
						title="No separation record on file"
						message="This officer has no MA POST agency-change / separation record matched by MPTC ID. That typically means no separation has been reported to the Commission."
					/>
				) : (
					<div className="space-y-4">
						{rows.map((r, i) => (
							<div key={i} className="rounded-xl border border-gray-200 p-4">
								<div className="flex flex-wrap items-center gap-2 mb-3">
									<span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${sepClass(r.separationType)}`}>
										{r.separationType || "Separation"}
									</span>
									<span className="text-sm text-gray-500">as of {fmtDate(r.separationDate)}</span>
								</div>
								<div className="flex items-center gap-2 text-sm">
									<span className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-700">{r.formerEmployer || "—"}</span>
									<svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
									<span className={`px-2 py-1 rounded-lg border ${isNoAgency(r.currentEmployer) ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-800"}`}>
										{r.currentEmployer || "—"}
									</span>
								</div>
								{(r.certStatus || r.certExpiration) && (
									<div className="mt-3 text-xs text-gray-500">
										Certification: <span className="text-gray-700 font-medium">{r.certStatus || "—"}</span>
										{r.certExpiration && <> · expires {fmtDate(r.certExpiration)}</>}
									</div>
								)}
							</div>
						))}
						<p className="text-[11px] text-gray-400 italic">
							&ldquo;In Lieu of Discipline&rdquo;, &ldquo;Terminated&rdquo;, &ldquo;Suspended by Commission&rdquo;, and &ldquo;Listed in NDI&rdquo; (National Decertification Index) are accountability-significant separations.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
