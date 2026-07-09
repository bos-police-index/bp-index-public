import type { NextApiRequest, NextApiResponse } from "next";
import { getAdminSession } from "@lib/auth/server";
import { getDataset } from "@lib/admin/upload-datasets";
import { parseFile, validateAgainstSchema } from "@lib/admin/parse-upload";
import { readMultipart } from "@lib/admin/read-multipart";

export const config = { api: { bodyParser: false } };

/**
 * Validate an uploaded file against a dataset's published schema WITHOUT writing
 * anything. Returns the header→column mapping, any missing required columns,
 * ignored (unmapped) headers, a row-count and a small sample for confirmation.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
	const session = await getAdminSession({ req, res });
	if (!session) return res.status(401).json({ error: "unauthorized" });

	let upload;
	try {
		upload = await readMultipart(req);
	} catch (e: any) {
		return res.status(400).json({ error: "upload_failed", detail: String(e?.message || e) });
	}

	const dataset = getDataset(upload.fields.dataset || "");
	if (!dataset) return res.status(400).json({ error: "unknown_dataset", detail: `dataset=${upload.fields.dataset}` });

	let parsed;
	try {
		parsed = parseFile(upload.buffer);
	} catch (e: any) {
		return res.status(400).json({ error: "parse_failed", detail: String(e?.message || e) });
	}

	const validation = validateAgainstSchema(dataset, parsed);
	// Sample rows projected onto the canonical columns for a clean preview.
	const sample = parsed.rows.slice(0, 8).map((r) => {
		const o: Record<string, any> = {};
		for (const col of dataset.columns) {
			const header = validation.mapping[col.name];
			o[col.name] = header ? r[header] : "";
		}
		return o;
	});

	return res.status(200).json({
		dataset: dataset.key,
		filename: upload.filename,
		sheetName: parsed.sheetName,
		headers: parsed.headers,
		validation,
		sample,
	});
}
