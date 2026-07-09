import type { NextApiRequest, NextApiResponse } from "next";
import { getAdminSession } from "@lib/auth/server";
import { listPendingReviews } from "@lib/admin/reconcile";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
	const session = await getAdminSession({ req, res });
	if (!session) return res.status(401).json({ error: "unauthorized" });

	const limit = Math.min(parseInt(String(req.query.limit ?? "25"), 10) || 25, 100);
	const offset = Math.max(parseInt(String(req.query.offset ?? "0"), 10) || 0, 0);

	try {
		const result = await listPendingReviews(limit, offset);
		return res.status(200).json(result);
	} catch (e: any) {
		return res.status(500).json({ error: "list_failed", detail: String(e?.message || e) });
	}
}
