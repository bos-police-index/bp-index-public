import React from "react";
import { InferGetServerSidePropsType } from "next";
import { GetServerSideProps } from "nextjs-routes";
import Link from "next/link";

import IdentityCardV2 from "@components/profileSections/IdentityCardV2";
import EarningsByYearTableV2 from "@components/profileSections/EarningsByYearTableV2";
import PostStatusCardV2 from "@components/profileSections/PostStatusCardV2";
import OfficerMisconductTableV2 from "@components/profileSections/OfficerMisconductTableV2";
import FioTableV2 from "@components/profileSections/FioTableV2";
import NewsEmbedV2 from "@components/profileSections/NewsEmbedV2";
import OrganizationCardV2 from "@components/profileSections/OrganizationCardV2";
import ProfileSummaryHeaderV2 from "@components/profileSections/ProfileSummaryHeaderV2";
import PaidDetailTableV2 from "@components/profileSections/PaidDetailTableV2";
import TrafficCitationTableV2 from "@components/profileSections/TrafficCitationTableV2";
import IncidentJournalTableV2 from "@components/profileSections/IncidentJournalTableV2";
import { V2_OFFICER_PROFILE, V2_OFFICER_EARNINGS, V2_OFFICER_POST_CERTIFICATIONS, V2_OFFICER_POST_DECERTIFICATIONS, V2_OFFICER_FIO, V2_OFFICER_MISCONDUCT, V2_OFFICER_ASSIGNMENTS, V2_OFFICER_PAID_DETAILS, V2_OFFICER_TRAFFIC, V2_OFFICER_INCIDENTS } from "@lib/graphql/queries";
import { v2_officer_profile_alias_name, v2_earnings_by_year_alias_name, v2_post_certification_alias_name, v2_post_decertification_alias_name, v2_fio_alias_name, v2_officer_misconduct_alias_name, v2_officer_assignment_alias_name, v2_paid_detail_alias_name, v2_traffic_alias_name, v2_incident_alias_name } from "@utility/dataViewAliases";
import { getOfficerProfileData } from "../../services/profile/data_fetchers";

export const getServerSideProps: GetServerSideProps = async (context) => {
	const bpiId = context.params?.bpiId as string;
	if (!bpiId) {
		return { notFound: true };
	}

	/* V2 profile data — the auto-fed pipeline is the sole source now. Each
	   section renders its own MissingData placeholder when empty. */
	const v2_profile_rows     = await getOfficerProfileData(V2_OFFICER_PROFILE(bpiId),               v2_officer_profile_alias_name);
	const v2_earnings_rows    = await getOfficerProfileData(V2_OFFICER_EARNINGS(bpiId),              v2_earnings_by_year_alias_name);
	const v2_post_cert_rows    = await getOfficerProfileData(V2_OFFICER_POST_CERTIFICATIONS(bpiId),   v2_post_certification_alias_name);
	const v2_post_decert_rows  = await getOfficerProfileData(V2_OFFICER_POST_DECERTIFICATIONS(bpiId), v2_post_decertification_alias_name);
	const v2_fio_rows          = await getOfficerProfileData(V2_OFFICER_FIO(bpiId),                   v2_fio_alias_name);
	const v2_misconduct_rows   = await getOfficerProfileData(V2_OFFICER_MISCONDUCT(bpiId),            v2_officer_misconduct_alias_name);
	const v2_paid_detail_rows  = await getOfficerProfileData(V2_OFFICER_PAID_DETAILS(bpiId),          v2_paid_detail_alias_name);
	const v2_traffic_rows      = await getOfficerProfileData(V2_OFFICER_TRAFFIC(bpiId),               v2_traffic_alias_name);
	const v2_incident_rows     = await getOfficerProfileData(V2_OFFICER_INCIDENTS(bpiId),             v2_incident_alias_name);
	const v2_assignment_rows   = await getOfficerProfileData(V2_OFFICER_ASSIGNMENTS(bpiId),           v2_officer_assignment_alias_name);
	const v2_profile: V2OfficerProfile | null = v2_profile_rows && v2_profile_rows.length > 0 ? v2_profile_rows[0] : null;

	return {
		props: {
			v2Profile: v2_profile,
			v2EarningsRows: v2_earnings_rows,
			v2PostCertRows: v2_post_cert_rows,
			v2PostDecertRows: v2_post_decert_rows,
			v2FioRows: v2_fio_rows,
			v2MisconductRows: v2_misconduct_rows,
			v2PaidDetailRows: v2_paid_detail_rows,
			v2TrafficRows: v2_traffic_rows,
			v2IncidentRows: v2_incident_rows,
			v2AssignmentRows: v2_assignment_rows,
		},
	};
};

export default function OfficerProfile(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
	const p = props as any;
	const v2Profile: V2OfficerProfile | null = p.v2Profile;

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Breadcrumb bar */}
			<div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<nav className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm">
						<Link href="/" className="text-slate-300 hover:text-white transition-colors duration-200">Home</Link>
						<svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
						</svg>
						<Link href="/data" className="text-slate-300 hover:text-white transition-colors duration-200">Data</Link>
						<svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
						</svg>
						<span className="text-slate-400 truncate">Officer Profile</span>
					</nav>
				</div>
			</div>

			{/* Main content — v2 sections */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
				<div className="space-y-6 sm:space-y-8">
					<ProfileSummaryHeaderV2
						profile={v2Profile}
						earnings={p.v2EarningsRows ?? []}
						misconduct={p.v2MisconductRows ?? []}
						fio={p.v2FioRows ?? []}
						paidDetail={p.v2PaidDetailRows ?? []}
						traffic={p.v2TrafficRows ?? []}
						incidents={p.v2IncidentRows ?? []}
					/>
					<IdentityCardV2 profile={v2Profile} />
					<OrganizationCardV2 rows={p.v2AssignmentRows ?? []} />
					<div id="sec-earnings" className="scroll-mt-4"><EarningsByYearTableV2 rows={p.v2EarningsRows ?? []} /></div>
					<div id="sec-paid-details" className="scroll-mt-4"><PaidDetailTableV2 rows={p.v2PaidDetailRows ?? []} /></div>
					<PostStatusCardV2
						certifications={p.v2PostCertRows ?? []}
						decertifications={p.v2PostDecertRows ?? []}
					/>
					<div id="sec-ia" className="scroll-mt-4"><OfficerMisconductTableV2 rows={p.v2MisconductRows ?? []} /></div>
					<div id="sec-fio" className="scroll-mt-4"><FioTableV2 rows={p.v2FioRows ?? []} /></div>
					<div id="sec-traffic" className="scroll-mt-4"><TrafficCitationTableV2 rows={p.v2TrafficRows ?? []} /></div>
					<div id="sec-incidents" className="scroll-mt-4"><IncidentJournalTableV2 rows={p.v2IncidentRows ?? []} /></div>
					<NewsEmbedV2
						firstName={v2Profile?.firstName ?? undefined}
						lastName={v2Profile?.lastName ?? undefined}
						badgeNo={v2Profile?.badgeNo ?? undefined}
					/>
				</div>
			</div>
		</div>
	);
}
