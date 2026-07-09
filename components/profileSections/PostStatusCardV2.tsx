import React from "react";
import MissingData from "@components/MissingData";
import SourceBadgeV2 from "@components/SourceBadgeV2";
import NameMatchNotice from "@components/profileSections/NameMatchNotice";
import { bpi_deep_green, bpi_light_green } from "@styles/theme/lightTheme";

interface Props {
	certifications: V2PostCertificationRow[];
	decertifications: V2PostDecertificationRow[];
}

function statusColor(status: string | null): string {
	const s = (status || "").toLowerCase();
	if (s.includes("decertified") || s.includes("revoked")) return "bg-red-100 text-red-800 border border-red-200";
	if (s.includes("suspend")) return "bg-orange-100 text-orange-800 border border-orange-200";
	if (s.includes("certified")) return "bg-green-100 text-green-800 border border-green-200";
	if (s.includes("review")) return "bg-yellow-100 text-yellow-800 border border-yellow-200";
	return "bg-gray-100 text-gray-800 border border-gray-200";
}

function fmtDate(s: string | null): string {
	if (!s) return "—";
	try {
		return new Date(s).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
	} catch {
		return s;
	}
}

export default function PostStatusCardV2({ certifications, decertifications }: Props) {
	const cert = certifications && certifications.length > 0 ? certifications[0] : null;
	const decertCount = decertifications?.length ?? 0;

	return (
		<div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
			<div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<div className="flex items-center space-x-2 sm:space-x-3">
						<div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-blue-100">
							<svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M5 13a7 7 0 1014 0A7 7 0 005 13z" />
							</svg>
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h2 className="text-base sm:text-lg font-semibold text-gray-900">POST Commission Status</h2>
								<span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs font-semibold border border-emerald-200">v2</span>
							</div>
							<p className="text-xs sm:text-sm text-gray-600">Massachusetts statewide certification &amp; discipline</p>
						</div>
					</div>
					{cert && <SourceBadgeV2 source={cert.source} asOf={cert.asOf} />}
				</div>
			</div>
			<div className="p-4 sm:p-6 space-y-4">
				<NameMatchNotice rows={certifications ?? []} />
				{!cert ? (
					<MissingData
						variant="card"
						title="No POST Commission record"
						message="This officer is not currently in the MA POST Commission officer-status CSV. They may be unregistered, retired, or from a non-MA jurisdiction."
					/>
				) : (
					<>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
								<div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Status</div>
								<div className="mt-1">
									<span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(cert.status)}`}>
										{cert.status || "Unknown"}
									</span>
								</div>
							</div>
							<div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
								<div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Expires</div>
								<div className="mt-1 text-base font-semibold text-gray-900">{fmtDate(cert.expiration)}</div>
							</div>
							<div className="bg-gray-50 rounded-xl p-3 border border-gray-100 sm:col-span-2">
								<div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Certification</div>
								<div className="mt-1 text-sm font-mono text-gray-900 break-all">{cert.certification || "—"}</div>
							</div>
							<div className="bg-gray-50 rounded-xl p-3 border border-gray-100 sm:col-span-2">
								<div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Agency</div>
								<div className="mt-1 text-sm text-gray-900">{cert.agency || "—"}</div>
							</div>
							{cert.additionalInfo && (
								<div className="bg-amber-50 rounded-xl p-3 border border-amber-200 sm:col-span-2">
									<div className="text-[11px] font-medium text-amber-700 uppercase tracking-wide">Additional Info</div>
									<div className="mt-1 text-sm text-amber-900 whitespace-pre-wrap">{cert.additionalInfo}</div>
								</div>
							)}
						</div>
					</>
				)}

				{decertCount > 0 && (
					<div className="rounded-xl border border-red-200 bg-red-50 p-3">
						<div className="text-sm font-semibold text-red-800">
							{decertCount} decertification record{decertCount === 1 ? "" : "s"} on file
						</div>
						<ul className="mt-2 text-xs text-red-700 space-y-1">
							{decertifications.slice(0, 3).map((d, i) => (
								<li key={i}>
									<span className="font-medium">{fmtDate(d.decertificationDate)}</span>
									{d.reason ? ` — ${d.reason}` : ""}
									{d.agency ? ` (${d.agency})` : ""}
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</div>
	);
}
