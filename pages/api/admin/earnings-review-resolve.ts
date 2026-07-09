import type { NextApiRequest, NextApiResponse } from "next";
import { getAdminSession } from "@lib/auth/server";
import { resolveEarningsReview } from "@lib/admin/earnings-review";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
	const session = await getAdminSession({ req, res });
	if (!session) return res.status(401).json({ error: "unauthorized" });

	const { review_id, bpi_id, action } = req.body ?? {};
	if (!review_id || typeof review_id !== "string") {
		return res.status(400).json({ error: "review_id_required" });
	}
	if (action !== "assign" && action !== "skip") {
		return res.status(400).json({ error: "invalid_action" });
	}
	if (action === "assign" && (!bpi_id || typeof bpi_id !== "string")) {
		return res.status(400).json({ error: "bpi_id_required_for_assign" });
	}

	const result = await resolveEarningsReview({
		review_id,
		bpi_id: action === "assign" ? bpi_id : null,
		resolved_by: (session.user as any)?.email ?? "unknown",
	});
	if (!result.ok) return res.status(400).json(result);
	return res.status(200).json(result);
}
