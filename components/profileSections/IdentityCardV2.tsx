import React from "react";
import LocalPoliceIcon from "@mui/icons-material/LocalPolice";
import MissingData from "@components/MissingData";
import { bpi_deep_green, bpi_light_green } from "@styles/theme/lightTheme";

interface IdentityCardV2Props {
	profile: V2OfficerProfile | null;
}

function fullName(p: V2OfficerProfile | null): string | null {
	if (!p) return null;
	const parts = [p.firstName, p.middleName, p.lastName].filter(Boolean);
	return parts.length ? parts.join(" ") : null;
}

const ROSTER_SOURCE_LABELS: Record<string, string> = {
	fall_2025_roster: "2025 personnel roster",
	responsive_records: "PeopleSoft HR feed",
	tskprof_2010_2022: "assignment roster (2010–2022)",
	alpha_listing: "alphabetical roster (2020)",
};

function fmtAsOf(s: string | null | undefined): string | null {
	if (!s) return null;
	try {
		return new Date(s).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
	} catch {
		return s;
	}
}

export default function IdentityCardV2({ profile }: IdentityCardV2Props) {
	const name = fullName(profile);

	return (
		<div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
			<div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-blue-50">
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center space-x-2 sm:space-x-3">
						<div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${bpi_light_green}30` }}>
							<LocalPoliceIcon style={{ fontSize: "1rem", color: bpi_deep_green }} />
						</div>
						<div>
							<h2 className="text-base sm:text-lg font-semibold text-gray-900">Officer Identity</h2>
							<p className="text-xs sm:text-sm text-gray-600">Cross-source identity reconciliation</p>
						</div>
					</div>
					<span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs font-semibold border border-emerald-200">v2 · live</span>
				</div>
			</div>

			<div className="p-4 sm:p-6">
				{!profile ? (
					<MissingData
						variant="card"
						title="Not yet in v2 identity map"
						message="This officer hasn't been ingested by the v2 pipeline yet, or their canonical_name didn't match any source. The legacy view below still applies."
					/>
				) : (
					<div className="space-y-4">
						<div>
							<h3 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
								{name || <span className="italic text-gray-400">Name not on file</span>}
							</h3>
							{profile.canonicalName && (
								<p className="text-xs text-gray-400 mt-0.5">canonical_name: <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px]">{profile.canonicalName}</code></p>
							)}
							{fmtAsOf(profile.identityAsOf) && (
								<p className="text-xs text-gray-600 mt-1.5 flex items-center gap-1.5">
									<svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<span>
										Identity as of <strong>{fmtAsOf(profile.identityAsOf)}</strong>
										{profile.rosterSource && ` · ${ROSTER_SOURCE_LABELS[profile.rosterSource] || profile.rosterSource}`}
									</span>
								</p>
							)}
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
							<IdentityField label="BPD Employee ID" value={profile.employeeId} hint="from data.boston.gov roster + earnings" />
							<IdentityField label="MA POST ID" value={profile.mptcId} hint="from MA POST Commission" />
							<IdentityField label="Badge #" value={profile.badgeNo} format={(v) => `#${v}`} />
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function IdentityField<T extends string | number>({
	label,
	value,
	hint,
	format,
}: {
	label: string;
	value: T | null | undefined;
	hint?: string;
	format?: (v: T) => string;
}) {
	const display = value == null || value === "" ? null : format ? format(value as T) : String(value);
	return (
		<div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
			<div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{label}</div>
			<div className="mt-1 text-base font-semibold text-gray-900">
				{display ?? <MissingData variant="field" message={`${label} not on file`} />}
			</div>
			{hint && <div className="mt-0.5 text-[11px] text-gray-400">{hint}</div>}
		</div>
	);
}
