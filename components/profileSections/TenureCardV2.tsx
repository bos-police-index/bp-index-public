import React from "react";
import MissingData from "@components/MissingData";

interface Props {
	academy: V2AcademyRow[];
	separation: V2SeparationRow[];
	profile: V2OfficerProfile | null;
	arroyo?: V2OfficerArroyoRow | null;
}

function fmtDate(s: string | null): string {
	if (!s) return "—";
	try {
		return new Date(String(s).slice(0,10)+"T00:00:00Z").toLocaleDateString(undefined, { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" });
	} catch {
		return s;
	}
}

function yearsBetween(a: string, b: string): string {
	const d1 = new Date(a).getTime();
	const d2 = new Date(b).getTime();
	if (isNaN(d1) || isNaN(d2) || d2 < d1) return "";
	const yrs = (d2 - d1) / (365.25 * 24 * 3600 * 1000);
	if (yrs < 1) return `${Math.round(yrs * 12)} mo`;
	return `${yrs.toFixed(1)} yrs`;
}

function statusClass(active: boolean, type: string | null): string {
	if (active) return "bg-emerald-100 text-emerald-800 border border-emerald-200";
	const s = (type || "").toLowerCase();
	if (s.includes("terminat") || s.includes("suspend") || s.includes("ndi") || s.includes("in lieu"))
		return "bg-red-100 text-red-800 border border-red-300";
	return "bg-slate-100 text-slate-700 border border-slate-200";
}

export default function TenureCardV2({ academy, separation, profile, arroyo }: Props) {
	// Start signal, best-available first:
	//   1) academy graduation date (MPTC)        — a dated start proxy
	//   2) appointment/grade date (Arroyo 2010)   — a dated appointment proxy
	//   3) "serving since ≥ YYYY" (Arroyo roster) — a year-only lower bound
	const gradDates = academy.map((a) => a.classEndDate).filter(Boolean) as string[];
	const academyStart = gradDates.length ? gradDates.slice().sort()[0] : null;
	const apptDate = arroyo?.appointmentDate || null;
	const servingSince = arroyo?.servingSince ?? null;

	let start: string | null = null;   // a real date, used for span math
	let startLabel = "";
	let startApprox = false;
	if (academyStart) {
		start = academyStart; startLabel = "Academy graduation (MPTC)";
	} else if (apptDate) {
		start = apptDate; startLabel = "Appointed (grade date)";
	} else if (servingSince) {
		start = `${servingSince}-01-01`; startLabel = `On the roster by ${servingSince}`; startApprox = true;
	}

	// End/status = separation record if present; else treated as active.
	const sep = (separation || []).find((s) => s.separationDate) || separation?.[0] || null;
	const separated = !!(sep && sep.separationDate);
	const end = separated ? sep!.separationDate : null;
	const status = separated ? sep!.separationType || "Separated" : "Active";
	const active = !separated;

	const nothing = !start && !separated;

	return (
		<div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
			<div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
				<div className="flex items-center gap-2 sm:gap-3">
					<div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-slate-200">
						<svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h2 className="text-base sm:text-lg font-semibold text-gray-900">Tenure</h2>
							<span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs font-semibold border border-emerald-200">v2</span>
						</div>
						<p className="text-xs sm:text-sm text-gray-600">Service span &amp; current status</p>
					</div>
				</div>
			</div>

			<div className="p-4 sm:p-6">
				{nothing ? (
					<MissingData
						variant="card"
						title="No tenure data on file"
						message="No academy graduation date (start proxy) or separation record for this officer. An official BPD hire-date source would fill this in."
					/>
				) : (
					<>
						<div className="flex flex-wrap items-center gap-3 sm:gap-5">
							{/* Start */}
							<div>
								<div className="text-[10px] uppercase tracking-wide text-gray-400">Start</div>
								<div className="text-sm font-semibold text-gray-900">{start ? (startApprox ? `≥ ${servingSince}` : fmtDate(start)) : "Unknown"}</div>
								<div className="text-[11px] text-gray-500">{start ? startLabel : "no start record"}</div>
							</div>

							<svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>

							{/* End / status */}
							<div>
								<div className="text-[10px] uppercase tracking-wide text-gray-400">{separated ? "End" : "Status"}</div>
								<div className="flex items-center gap-2">
									<span className="text-sm font-semibold text-gray-900">{separated ? fmtDate(end) : "Serving"}</span>
									<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClass(active, status)}`}>{status}</span>
								</div>
								{separated && sep!.currentEmployer && (
									<div className="text-[11px] text-gray-500">now: {sep!.currentEmployer}</div>
								)}
							</div>

							{/* Duration */}
							{start && (
								<div className="ml-auto text-right">
									<div className="text-[10px] uppercase tracking-wide text-gray-400">Span</div>
									<div className="text-sm font-semibold text-gray-900">
										{startApprox ? "≥ " : ""}{yearsBetween(start, end || new Date().toISOString().slice(0, 10)) || "—"}
										{!separated && <span className="text-[11px] text-gray-500 font-normal"> (ongoing)</span>}
									</div>
								</div>
							)}
						</div>
						<p className="mt-4 text-[11px] text-gray-400 italic">
							Start is the best available proxy for entry into service, not the official BPD date of hire: the MPTC academy graduation date where known, else the appointment/grade date or the earliest year the officer appears on the annual BPD roster (2010–2022). Status/end come from MA POST separation records.
						</p>
					</>
				)}
			</div>
		</div>
	);
}
