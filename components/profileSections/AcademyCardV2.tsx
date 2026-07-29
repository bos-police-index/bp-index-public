import React from "react";
import MissingData from "@components/MissingData";
import SourceBadgeV2 from "@components/SourceBadgeV2";

interface Props {
	rows: V2AcademyRow[];
}

function fmtDate(s: string | null): string {
	if (!s) return "—";
	try {
		return new Date(String(s).slice(0,10)+"T00:00:00Z").toLocaleDateString(undefined, { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" });
	} catch {
		return s;
	}
}

export default function AcademyCardV2({ rows }: Props) {
	const latest = rows && rows.length > 0 ? rows[0] : null;
	const demo = latest; // demographics are per-person; take from the most recent record

	return (
		<div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
			<div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-slate-50">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<div className="flex items-center space-x-2 sm:space-x-3">
						<div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-teal-100">
							<svg className="w-3 h-3 sm:w-4 sm:h-4 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422A12.083 12.083 0 0112 21.5a12.083 12.083 0 01-6.16-10.922L12 14z" />
							</svg>
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h2 className="text-base sm:text-lg font-semibold text-gray-900">Academy &amp; Training</h2>
								<span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs font-semibold border border-emerald-200">v2</span>
							</div>
							<p className="text-xs sm:text-sm text-gray-600">MPTC recruit-academy graduation records (matched by MPTC ID)</p>
						</div>
					</div>
					{latest && <SourceBadgeV2 source={latest.source} asOf={latest.asOf} />}
				</div>
			</div>

			<div className="p-4 sm:p-6">
				{!rows || rows.length === 0 ? (
					<MissingData
						variant="card"
						title="No academy record on file"
						message="This officer has no MPTC recruit-academy graduation record matched by MPTC ID."
					/>
				) : (
					<>
						{demo && (demo.gender || demo.yearOfBirth || demo.race) && (
							<div className="flex flex-wrap gap-x-6 gap-y-1 mb-4 text-sm text-gray-600">
								{demo.gender && <span><span className="text-gray-400">Gender:</span> {demo.gender}</span>}
								{demo.yearOfBirth && <span><span className="text-gray-400">Year of birth:</span> {demo.yearOfBirth}</span>}
								{demo.race && <span><span className="text-gray-400">Race:</span> {demo.race}</span>}
							</div>
						)}
						<div className="space-y-3">
							{rows.map((r, i) => (
								<div key={i} className="flex items-start gap-3 rounded-xl border border-gray-200 p-3">
									<div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0">
										<svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
									</div>
									<div className="min-w-0">
										<div className="font-medium text-gray-900">{r.className || "Recruit Academy"}</div>
										<div className="text-xs text-gray-600 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
											<span>{r.enrollmentStatus || "—"}{r.classEndDate ? ` · ${fmtDate(r.classEndDate)}` : ""}</span>
											{r.sendingOrg && <span className="text-gray-400">Sending agency: <span className="text-gray-600">{r.sendingOrg}</span></span>}
										</div>
									</div>
								</div>
							))}
						</div>
					</>
				)}
			</div>
		</div>
	);
}
