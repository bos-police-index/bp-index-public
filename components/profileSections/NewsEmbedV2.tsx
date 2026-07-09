import React, { useState } from "react";
import { bpi_deep_green, bpi_light_green } from "@styles/theme/lightTheme";

interface Props {
	firstName: string | null | undefined;
	lastName: string | null | undefined;
	badgeNo?: number | null;
}

/**
 * V2 news section. Phase-1 implementation: live Google News iframe-embed.
 * No backend call, no API budget. Phase-3 will replace this with an
 * integrated NewsAPI/SerpApi feed populating production.v2_news_article.
 */
export default function NewsEmbedV2({ firstName, lastName, badgeNo }: Props) {
	const name = [firstName, lastName].filter(Boolean).join(" ").trim();
	const [expanded, setExpanded] = useState(false);

	if (!name) {
		return (
			<div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 p-4 sm:p-6">
				<div className="text-sm text-gray-500">News search needs a name to query — none available for this officer yet.</div>
			</div>
		);
	}

	const query = `"${name}" "Boston Police"`;
	const newsUrl = `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

	return (
		<div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
			<div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
					<div className="flex items-center space-x-2 sm:space-x-3">
						<div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-purple-100">
							<svg className="w-3 h-3 sm:w-4 sm:h-4 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
							</svg>
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h2 className="text-base sm:text-lg font-semibold text-gray-900">News &amp; Articles</h2>
								<span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs font-semibold border border-emerald-200">v2</span>
							</div>
							<p className="text-xs sm:text-sm text-gray-600">Live Google News results — verify before relying on any match</p>
						</div>
					</div>
					<a
						href={newsUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-emerald-700 hover:text-emerald-800"
					>
						Open in Google News
						<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7v7m0 0L10 21l-7-7L14 3z" />
						</svg>
					</a>
				</div>
			</div>
			<div className="p-3 sm:p-4">
				<div className="rounded-xl bg-amber-50 border border-amber-200 p-3 mb-3 text-xs sm:text-sm text-amber-900">
					<strong>Heads-up:</strong> these results are an automated keyword search for{" "}
					<code className="bg-white px-1 py-0.5 rounded text-[11px]">{query}</code>. Common-name false positives are likely.
					Phase 3 will replace this embed with API-curated, deduplicated results.
				</div>
				{!expanded ? (
					<button
						onClick={() => setExpanded(true)}
						className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-600 hover:border-emerald-400 hover:bg-emerald-50/40 transition-colors"
					>
						Load Google News results for {name}
					</button>
				) : (
					<div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 600 }}>
						<iframe
							src={newsUrl}
							title={`Google News results for ${name}`}
							referrerPolicy="no-referrer"
							sandbox="allow-scripts allow-same-origin allow-popups"
							style={{ width: "100%", height: "100%", border: 0 }}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
