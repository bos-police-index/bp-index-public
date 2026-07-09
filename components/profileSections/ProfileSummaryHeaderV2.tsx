import React from "react";
import LocalPoliceIcon from "@mui/icons-material/LocalPolice";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import { bpi_deep_green, bpi_light_green } from "@styles/theme/lightTheme";
import { formatMoneyNoCents } from "@utility/textFormatHelpers";

interface Props {
	profile: V2OfficerProfile | null;
	earnings?: V2EarningsRow[];
	misconduct?: V2MisconductRow[];
	fio?: V2FioRow[];
	paidDetail?: V2PaidDetailRow[];
	traffic?: V2TrafficCitationRow[];
	incidents?: V2IncidentRow[];
}

const ROSTER_SOURCE_LABELS: Record<string, string> = {
	fall_2025_roster: "2025 personnel roster",
	responsive_records: "PeopleSoft HR feed",
	tskprof_2010_2022: "assignment roster (2010–2022)",
	alpha_listing: "alphabetical roster (2020)",
};

function fmtAsOf(s: string | null | undefined): string | null {
	if (!s) return null;
	try { return new Date(s).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
	catch { return s; }
}

function scrollToSection(id: string) {
	const el = typeof document !== "undefined" ? document.getElementById(id) : null;
	if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Stat({ label, value, accent, targetId }: { label: string; value: string; accent?: string; targetId?: string }) {
	const base = "rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-center backdrop-blur-sm";
	const inner = (
		<>
			<div className={`text-lg sm:text-xl font-bold tabular-nums ${accent ?? "text-white"}`}>{value}</div>
			<div className="text-[10px] sm:text-[11px] text-slate-300 uppercase tracking-wide">{label}</div>
		</>
	);
	if (!targetId) return <div className={base}>{inner}</div>;
	return (
		<button
			type="button"
			onClick={() => scrollToSection(targetId)}
			title={`Jump to ${label}`}
			className={`${base} w-full cursor-pointer transition-colors hover:bg-white/20 hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40`}
		>
			{inner}
		</button>
	);
}

export default function ProfileSummaryHeaderV2({ profile, earnings = [], misconduct = [], fio = [], paidDetail = [], traffic = [], incidents = [] }: Props) {
	if (!profile) return null;

	const name = [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(" ") || "Unnamed Officer";
	const latestEarn = [...earnings].sort((a, b) => (b.year ?? 0) - (a.year ?? 0))[0];
	const totalPay = latestEarn?.totalPay ?? null;
	const confirmed = profile.identityConfidence === "confirmed";
	const asOf = fmtAsOf(profile.identityAsOf);

	return (
		<div className="rounded-2xl overflow-hidden shadow-lg bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
			<div className="px-4 sm:px-6 py-4 sm:py-5">
				<div className="flex flex-col sm:flex-row sm:items-center gap-4">
					<div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
						<div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-xl border border-white/20 flex-shrink-0"
							style={{ background: `linear-gradient(135deg, ${bpi_light_green}, ${bpi_deep_green})` }}>
							<LocalPoliceIcon style={{ fontSize: "1.75rem", color: "white" }} />
						</div>
						<div className="min-w-0">
							<div className="flex items-center gap-2 flex-wrap">
								<h2 className="text-xl sm:text-2xl font-bold tracking-tight break-words">{name}</h2>
								<span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${confirmed ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30" : "bg-amber-500/20 text-amber-200 border-amber-400/30"}`}>
									{confirmed ? "confirmed identity" : "provisional identity"}
								</span>
							</div>
							<div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-300">
								<span className="inline-flex items-center gap-1"><MilitaryTechIcon className="w-4 h-4 text-slate-400" />{profile.rank || "Rank unknown"}</span>
								<span>{profile.badgeNo ? `Badge #${profile.badgeNo}` : "Badge n/a"}</span>
								{profile.employeeId != null && <span className="text-slate-400">Emp #{profile.employeeId}</span>}
								{asOf && <span className="text-slate-400">· as of {asOf}{profile.rosterSource ? ` (${ROSTER_SOURCE_LABELS[profile.rosterSource] || profile.rosterSource})` : ""}</span>}
							</div>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
					<Stat label={`Pay ${latestEarn?.year ?? ""}`.trim()} value={totalPay != null ? `$${formatMoneyNoCents(totalPay)}` : "—"} accent="text-emerald-300" targetId="sec-earnings" />
					<Stat label="IA cases" value={misconduct.length.toLocaleString()} accent={misconduct.length > 0 ? "text-red-300" : undefined} targetId="sec-ia" />
					<Stat label="FIO" value={fio.length.toLocaleString()} targetId="sec-fio" />
					<Stat label="Paid details" value={paidDetail.length.toLocaleString()} targetId="sec-paid-details" />
					<Stat label="Citations" value={traffic.length.toLocaleString()} targetId="sec-traffic" />
					<Stat label="Incidents" value={incidents.length.toLocaleString()} targetId="sec-incidents" />
				</div>
			</div>
		</div>
	);
}
