import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import { promises as fs } from "fs";
import { getAdminSession } from "@lib/auth/server";
import { parseIadXlsx } from "@lib/admin/iad-xlsx";

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
	const session = await getAdminSession({ req, res });
	if (!session) return res.status(401).json({ error: "unauthorized" });

	let buffer: Buffer;
	let filename: string;
	try {
		const form = formidable({ maxFileSize: 50 * 1024 * 1024 });
		const [, files] = await form.parse(req);
		const f = Array.isArray(files.file) ? files.file[0] : files.file;
		if (!f) return res.status(400).json({ error: "no_file" });
		buffer = await fs.readFile(f.filepath);
		filename = f.originalFilename || "upload.xlsx";
		await fs.unlink(f.filepath).catch(() => {});
	} catch (e: any) {
		return res.status(400).json({ error: "upload_failed", detail: String(e?.message || e) });
	}

	try {
		const result = parseIadXlsx(buffer);
		return res.status(200).json({
			filename,
			totalRows: result.totalRows,
			detection: result.detection,
			sample: result.rows.slice(0, 50),
		});
	} catch (e: any) {
		return res.status(400).json({ error: "parse_failed", detail: String(e?.message || e) });
	}
}
