import type { NextApiRequest, NextApiResponse } from "next";
import { getAdminSession } from "@lib/auth/server";
import { resolveReview } from "@lib/admin/reconcile";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
	const session = await getAdminSession({ req, res });
	if (!session) return res.status(401).json({ error: "unauthorized" });

	const { review_id, action, survivor, duplicates } = req.body ?? {};
	if (!review_id || typeof review_id !== "string") {
		return res.status(400).json({ error: "review_id_required" });
	}
	if (action !== "keep_separate" && action !== "merge") {
		return res.status(400).json({ error: "invalid_action" });
	}

	const result = await resolveReview({
		review_id,
		action,
		survivor: survivor || undefined,
		duplicates: Array.isArray(duplicates) ? duplicates : undefined,
		resolved_by: (session.user as any)?.email ?? "unknown",
	});
	if (!result.ok) return res.status(400).json(result);
	return res.status(200).json(result);
}
