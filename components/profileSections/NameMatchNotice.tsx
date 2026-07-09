import React from "react";

/**
 * Per-component provenance notice for the name-matched data sources (earnings,
 * NLG complaints, POST). Shows nothing for hard-matched (employee_id) data.
 *   - name-matched, not confirmed -> amber "matched by name, unconfirmed"
 *   - name-matched, admin-confirmed -> green "confirmed by an admin"
 */
export default function NameMatchNotice({ rows }: { rows: Array<{ linkMethod?: string; confirmed?: boolean }> }) {
	const nameRows = (rows || []).filter((r) => r.linkMethod === "name");
	if (nameRows.length === 0) return null; // all hard-matched → no notice

	const allConfirmed = nameRows.every((r) => r.confirmed);

	if (allConfirmed) {
		return (
			<div className="mb-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs bg-emerald-50 border-emerald-200 text-emerald-800">
				<svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<span>This data was matched to the officer by <strong>name</strong> and has been <strong>confirmed by an admin</strong>.</span>
			</div>
		);
	}

	return (
		<div className="mb-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs bg-amber-50 border-amber-200 text-amber-800">
			<svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
			</svg>
			<span>
				This data has no verified officer ID, so it was matched by <strong>name</strong> and <strong>may not belong to this officer</strong>. Not yet confirmed — verify before relying on it.
			</span>
		</div>
	);
}
