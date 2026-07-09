import type { NextApiRequest } from "next";
import formidable from "formidable";
import { promises as fs } from "fs";

/** Read a single uploaded file + text fields from a multipart request. */
export async function readMultipart(req: NextApiRequest): Promise<{
	buffer: Buffer;
	filename: string;
	fields: Record<string, string>;
}> {
	const form = formidable({ maxFileSize: 200 * 1024 * 1024 });
	const [rawFields, files] = await form.parse(req);
	const f = Array.isArray(files.file) ? files.file[0] : files.file;
	if (!f) throw new Error("no_file");
	const buffer = await fs.readFile(f.filepath);
	await fs.unlink(f.filepath).catch(() => {});
	const fields: Record<string, string> = {};
	for (const [k, v] of Object.entries(rawFields)) fields[k] = Array.isArray(v) ? String(v[0]) : String(v);
	return { buffer, filename: f.originalFilename || "upload", fields };
}
