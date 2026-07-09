import type { NextApiRequest, NextApiResponse } from "next";
import { getAdminSession } from "@lib/auth/server";
import { resolveConfirmation } from "@lib/admin/confirmations";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
	const session = await getAdminSession({ req, res });
	if (!session) return res.status(401).json({ error: "unauthorized" });

	const { bpi_id, source, decision } = req.body ?? {};
	if (!bpi_id || typeof bpi_id !== "string") return res.status(400).json({ error: "bpi_id_required" });
	if (!source || typeof source !== "string") return res.status(400).json({ error: "source_required" });
	if (decision !== "confirmed" && decision !== "rejected") return res.status(400).json({ error: "invalid_decision" });

	const result = await resolveConfirmation({
		bpi_id, source, decision,
		resolved_by: (session.user as any)?.email ?? "unknown",
	});
	if (!result.ok) return res.status(400).json(result);
	return res.status(200).json(result);
}
