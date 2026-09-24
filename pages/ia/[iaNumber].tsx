import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import { gql } from "@apollo/client";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import { GridColDef } from "@mui/x-data-grid";

import apolloClient from "@lib/apollo-client";
import { v2_officer_ia_case_alias_name } from "@utility/dataViewAliases";
import { bpi_light_green, bpi_deep_green } from "@styles/theme/lightTheme";
import IconWrapper from "@utility/tableDefinitions";
import DataTable from "@components/DataTable";

/*
 * One Internal Affairs case, one row per officer (review round 2: "Split each IA into a
 * single record for each officer"). Officer identity + roll-up come from explore_ia_cases;
 * per-allegation detail and the narrative from vw_v2_officer_ia_case (joined on ia_case_id).
 */

const IA_CASE_OFFICERS = gql`
	query IaCaseOfficers($filters: JSON, $caseNumber: String!) {
		officers: exploreIaCases(filters: $filters, orderBy: OFFICER_NAME_ASC) {
			nodes {
				iaCaseId
				bpiId
				officerName
				officerBadgeNo
				officerRank
				officerCurrentUnit
				iaNumber
				receivedDate
				incidentType
				outcome
				numAllegations
				numSustained
				allegations
				findings
				actionsTaken
				daysHoursSuspended
				officerMatch
				source
			}
		}
		details: ${v2_officer_ia_case_alias_name}(condition: { caseNumber: $caseNumber }) {
			nodes {
				iaCaseId
				occurredDate
				completedDate
				disposition
				narrative
				allegationDetails
			}
		}
	}
`;

interface AllegationDetail {
	allegation: string | null;
	finding: string | null;
	actionTaken: string | null;
	daysHoursSuspended: string | null;
}

const OUTCOME_ORDER = ["Sustained", "Pending", "Not Sustained", "Unfounded", "Exonerated", "Filed/Withdrawn"];

export const getServerSideProps: GetServerSideProps = async (context) => {
	const iaNumber = context.params?.iaNumber as string;
	if (!iaNumber) return { notFound: true };
	try {
		const { data } = await apolloClient.query({
			query: IA_CASE_OFFICERS,
			variables: { filters: JSON.stringify({ ia_number: { in: [iaNumber] } }), caseNumber: iaNumber },
			fetchPolicy: "network-only",
		});
		const details = new Map<string, any>((data?.details?.nodes ?? []).map((d) => [d.iaCaseId, d]));
		const officers = (data?.officers?.nodes ?? []).map((o) => {
			const d = details.get(o.iaCaseId) ?? {};
			let allegationDetails: AllegationDetail[] = [];
			try {
				allegationDetails = typeof d.allegationDetails === "string" ? JSON.parse(d.allegationDetails) : d.allegationDetails ?? [];
			} catch {
				allegationDetails = [];
			}
			return { ...o, id: o.iaCaseId, occurredDate: d.occurredDate ?? null, completedDate: d.completedDate ?? null, disposition: d.disposition ?? null, narrative: d.narrative ?? null, allegationDetails };
		});
		if (officers.length === 0) return { notFound: true };
		return { props: { iaNumber, officers } };
	} catch (error) {
		console.error("Error fetching IA case:", error?.message, error?.graphQLErrors);
		return { notFound: true };
	}
};

const formatDate = (s: string | null) => {
	if (!s) return "N/A";
	const d = new Date(String(s).slice(0, 10) + "T00:00:00Z");
	return isNaN(d.getTime()) ? s : d.toLocaleDateString(undefined, { timeZone: "UTC", year: "numeric", month: "long", day: "numeric" });
};

const statusColor = (finding: string | null) => {
	const f = finding?.toLowerCase() || "";
	if (f.includes("not sustained")) return "bg-orange-100 text-orange-800 border border-orange-200";
	if (f.includes("sustained")) return "bg-red-100 text-red-800 border border-red-200";
	if (f.includes("exonerated")) return "bg-green-100 text-green-800 border border-green-200";
	if (f.includes("unfounded")) return "bg-blue-100 text-blue-800 border border-blue-200";
	if (f.includes("pending")) return "bg-purple-100 text-purple-800 border border-purple-200";
	return "bg-gray-100 text-gray-800 border border-gray-200";
};

export default function IACase({ iaNumber, officers }: InferGetServerSidePropsType<typeof getServerSideProps>) {
	const first = officers[0];
	const caseOutcome = OUTCOME_ORDER.find((o) => officers.some((x) => x.outcome === o)) ?? null;
	const totalAllegations = officers.reduce((a, o) => a + (o.numAllegations ?? 0), 0);
	const narrative = officers.map((o) => o.narrative).find((n) => n && n !== "[redacted]") ?? null;
	const received = officers.map((o) => o.receivedDate).filter(Boolean).sort()[0] ?? null;
	const occurred = officers.map((o) => o.occurredDate).filter(Boolean).sort()[0] ?? null;
	const completed = officers.map((o) => o.completedDate).filter(Boolean).sort().slice(-1)[0] ?? null;
	const disposition = officers.map((o) => o.disposition).find(Boolean) ?? null;

	const cols: GridColDef[] = [
		{
			field: "officerName",
			headerName: "Officer",
			width: 200,
			renderCell: (p) =>
				p.row.bpiId ? (
					<Link href={{ pathname: "/profile/[bpiId]", query: { bpiId: p.row.bpiId } }} style={{ color: bpi_light_green, textDecoration: "none" }}>
						{p.value || "Officer"}
					</Link>
				) : (
					p.value || <span className="italic text-gray-400">Not on file</span>
				),
		},
		{ field: "officerBadgeNo", headerName: "Badge #", width: 100 },
		{ field: "officerRank", headerName: "Rank", width: 140 },
		{ field: "officerCurrentUnit", headerName: "Current Unit", width: 180 },
		{
			field: "outcome",
			headerName: "Outcome",
			width: 140,
			renderCell: (p) => <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(p.value)}`}>{p.value || "N/A"}</span>,
		},
		{
			field: "allegations",
			headerName: "Allegations & findings",
			minWidth: 320,
			flex: 1,
			exportValue: (r) => (r.allegationDetails ?? []).map((a) => `${a.allegation ?? "?"} — ${a.finding ?? "?"}`).join("; ") || r.allegations,
			renderCell: (p) => {
				const list: AllegationDetail[] = p.row.allegationDetails ?? [];
				if (list.length === 0) return p.value || "—";
				return (
					<ul className="py-1 space-y-1">
						{list.map((a, i) => (
							<li key={i} className="text-xs leading-snug">
								<span className="text-gray-800">{a.allegation || "—"}</span>{" "}
								<span className={`ml-1 inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium ${statusColor(a.finding)}`}>{a.finding || "—"}</span>
							</li>
						))}
					</ul>
				);
			},
		} as GridColDef,
		{ field: "actionsTaken", headerName: "Action Taken", width: 200, valueFormatter: (p) => p.value ?? "—" },
		{ field: "daysHoursSuspended", headerName: "Days/Hours Suspended", width: 130, valueFormatter: (p) => p.value ?? "—" },
		{ field: "officerMatch", headerName: "Officer Match", width: 170 },
	];

	const chevron = (
		<svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
			<path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
		</svg>
	);

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
					<nav className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm mb-6 sm:mb-8">
						<Link href="/" className="text-slate-300 hover:text-white transition-colors duration-200">Home</Link>
						{chevron}
						<Link href="/data" className="text-slate-300 hover:text-white transition-colors duration-200">Data</Link>
						{chevron}
						<Link href={{ pathname: "/data/tables/[table_name]", query: { table_name: "officer_misconduct" } }} className="text-slate-300 hover:text-white transition-colors duration-200">
							Internal Affairs Cases
						</Link>
						{chevron}
						<span className="text-slate-400 truncate">Case #{iaNumber}</span>
					</nav>

					<div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
						<div className="flex-shrink-0 mx-auto sm:mx-0">
							<div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-2xl border border-white/20" style={{ background: `linear-gradient(135deg, ${bpi_light_green}, ${bpi_deep_green})` }}>
								<IconWrapper Icon={ReportProblemIcon} color="white" fontSize="2rem" />
							</div>
						</div>
						<div className="flex-1 text-center sm:text-left w-full">
							<h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 tracking-tight break-words">Internal Affairs Case #{iaNumber}</h1>
							<div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4">
								<p className="text-sm sm:text-base lg:text-lg text-gray-200 leading-relaxed">
									{first.incidentType || "Internal Affairs Investigation"} · {officers.length} officer{officers.length === 1 ? "" : "s"} · {totalAllegations} allegation{totalAllegations === 1 ? "" : "s"}
								</p>
								{caseOutcome && <div className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${statusColor(caseOutcome)}`}>{caseOutcome}</div>}
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
					<div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
						<h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Overview</h2>
						<dl className="space-y-3 text-sm">
							<div><dt className="font-medium text-gray-500">Date received</dt><dd className="mt-0.5 text-gray-900 font-medium">{formatDate(received)}</dd></div>
							{occurred && <div><dt className="font-medium text-gray-500">Date of incident</dt><dd className="mt-0.5 text-gray-900 font-medium">{formatDate(occurred)}</dd></div>}
							{completed && <div><dt className="font-medium text-gray-500">Completed</dt><dd className="mt-0.5 text-gray-900 font-medium">{formatDate(completed)}</dd></div>}
							{disposition && <div><dt className="font-medium text-gray-500">Disposition</dt><dd className="mt-0.5 text-gray-900 font-medium">{disposition}</dd></div>}
							<div><dt className="font-medium text-gray-500">Source</dt><dd className="mt-0.5 text-gray-700">{Array.from(new Set(officers.flatMap((o) => (o.source || "").split(", ")).filter(Boolean))).join(", ")}</dd></div>
						</dl>
					</div>
					<div className="md:col-span-2 bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
						<h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Summary</h2>
						{narrative ? (
							<>
								<p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{narrative}</p>
								<p className="mt-3 text-[11px] text-gray-400 italic">Verbatim complaint summary from the BPD IAD records; spelling/wording as recorded in the source.</p>
							</>
						) : (
							<p className="text-sm text-gray-500">No written summary is on file for this case. Each officer&apos;s allegations and findings are listed below.</p>
						)}
					</div>
				</div>

				<div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
					<div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
						<h2 className="text-base sm:text-lg font-semibold text-gray-900">Officers on this case</h2>
						<p className="text-xs sm:text-sm text-gray-600">One record per officer, with that officer&apos;s allegations and findings</p>
					</div>
					<DataTable
						table={officers}
						cols={cols}
						table_name={`IACase-${iaNumber}`}
						pageSize={10}
						pageSizeOptions={[10, 25]}
						rowCount={officers.length}
						hide={[]}
						isServerSideRendered={false}
						checkboxSelection={false}
						filterable={false}
						getRowHeight={() => "auto"}
						initialState={{ sorting: { sortModel: [{ field: "officerName", sort: "asc" }] } }}
						className="w-full bg-transparent"
					/>
				</div>
			</div>
		</div>
	);
}
