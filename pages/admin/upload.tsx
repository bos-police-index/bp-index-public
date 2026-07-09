import { useCallback, useRef, useState } from "react";
import type { InferGetServerSidePropsType } from "next";
import AdminLayout from "@components/admin/AdminLayout";
import { withAdmin } from "@lib/auth/server";

export const getServerSideProps = withAdmin(async (_ctx, session) => {
	return { props: { userEmail: session!.user?.email ?? null } };
});

type PreviewResp = {
	filename: string;
	totalRows: number;
	detection: {
		sheetName: string;
		headers: string[];
		mapping: Record<string, string>;
		unmapped: string[];
		missing: string[];
	};
	sample: Record<string, any>[];
};

type CommitResp = {
	runId: string;
	rowsIn: number;
	rowsInsertedRaw: number;
	rowsReconciledCanonical: number | null;
	filename: string;
};

export default function AdminUpload({ userEmail }: InferGetServerSidePropsType<typeof getServerSideProps>) {
	const [file, setFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<PreviewResp | null>(null);
	const [busy, setBusy] = useState<"" | "preview" | "commit">("");
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<CommitResp | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const dragRef = useRef<HTMLDivElement>(null);

	const reset = () => {
		setFile(null);
		setPreview(null);
		setResult(null);
		setError(null);
		if (inputRef.current) inputRef.current.value = "";
	};

	const fetchPreview = useCallback(async (f: File) => {
		setBusy("preview"); setError(null); setPreview(null); setResult(null);
		try {
			const fd = new FormData();
			fd.append("file", f);
			const r = await fetch("/api/admin/upload-iad-preview", { method: "POST", body: fd });
			const j = await r.json();
			if (!r.ok) throw new Error(j.detail || j.error || "preview failed");
			setPreview(j as PreviewResp);
		} catch (e: any) {
			setError(String(e?.message || e));
		} finally {
			setBusy("");
		}
	}, []);

	const onPickFile = (f: File | null) => {
		setFile(f);
		if (f) fetchPreview(f);
	};

	const commit = async () => {
		if (!file) return;
		setBusy("commit"); setError(null);
		try {
			const fd = new FormData();
			fd.append("file", file);
			const r = await fetch("/api/admin/upload-iad-commit", { method: "POST", body: fd });
			const j = await r.json();
			if (!r.ok) throw new Error(j.detail || j.error || "commit failed");
			setResult(j as CommitResp);
		} catch (e: any) {
			setError(String(e?.message || e));
		} finally {
			setBusy("");
		}
	};

	const onDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		dragRef.current?.classList.add("border-emerald-500", "bg-emerald-50");
	};
	const onDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		dragRef.current?.classList.remove("border-emerald-500", "bg-emerald-50");
	};
	const onDrop = (e: React.DragEvent) => {
		e.preventDefault();
		onDragLeave(e);
		const f = e.dataTransfer.files?.[0] || null;
		if (f) onPickFile(f);
	};

	const mappingEntries = preview ? Object.entries(preview.detection.mapping) : [];
	const sampleHeaders = preview ? Object.keys(preview.sample[0] ?? {}) : [];

	return (
		<AdminLayout current="upload" userEmail={userEmail}>
			<h1 className="text-2xl font-bold text-gray-900">Upload BPD IAD Complaints (xlsx)</h1>
			<p className="text-sm text-gray-600 mt-1 max-w-3xl">
				Upload a refreshed <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">BPD COMPLAINTS - IAD CASES *.xlsx</code> file.
				The server parses it, shows a preview, and on commit replaces <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">production.raw_employee_ia</code> with the new rows,
				then re-runs the reconciler to refresh <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">v2_officer_misconduct</code> for the profile pages.
			</p>

			{/* Step 1: file drop */}
			<div
				ref={dragRef}
				onDragOver={onDragOver}
				onDragLeave={onDragLeave}
				onDrop={onDrop}
				className="mt-6 rounded-2xl border-2 border-dashed border-gray-300 bg-white p-8 text-center transition-colors"
			>
				<svg className="w-10 h-10 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
				</svg>
				<div className="text-sm text-gray-700">
					{file ? (
						<>
							<span className="font-medium">{file.name}</span>{" "}
							<span className="text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
							<button onClick={reset} className="ml-3 text-xs text-emerald-700 hover:underline">choose another</button>
						</>
					) : (
						<>
							Drag &amp; drop the .xlsx here, or{" "}
							<button onClick={() => inputRef.current?.click()} className="text-emerald-700 hover:underline font-medium">browse</button>
						</>
					)}
				</div>
				<input
					ref={inputRef}
					type="file"
					accept=".xlsx,.xls"
					className="hidden"
					onChange={(e) => onPickFile(e.target.files?.[0] || null)}
				/>
			</div>

			{busy === "preview" && <div className="mt-4 text-sm text-gray-600 italic">Parsing…</div>}

			{error && (
				<div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
					<strong>Failed:</strong> {error}
				</div>
			)}

			{preview && (
				<>
					{/* Step 2: detected mapping */}
					<div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-semibold text-gray-900">Detected columns</h2>
							<div className="text-xs text-gray-500">Sheet: <code>{preview.detection.sheetName}</code> · {preview.totalRows.toLocaleString()} rows</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-sm">
							{mappingEntries.length === 0 ? (
								<div className="text-amber-700">⚠ No recognized columns. Check the file headers.</div>
							) : (
								mappingEntries.map(([canonical, sourceCol]) => (
									<div key={canonical} className="flex items-center gap-2">
										<code className="text-xs bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">{canonical}</code>
										<svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
										</svg>
										<span className="text-gray-700 truncate" title={sourceCol}>{sourceCol}</span>
									</div>
								))
							)}
						</div>
						{preview.detection.unmapped.length > 0 && (
							<details className="mt-3">
								<summary className="text-xs text-gray-500 cursor-pointer">
									{preview.detection.unmapped.length} unmapped column{preview.detection.unmapped.length === 1 ? "" : "s"} (ignored)
								</summary>
								<div className="mt-2 text-xs text-gray-600 flex flex-wrap gap-1">
									{preview.detection.unmapped.map((u) => (
										<code key={u} className="bg-slate-100 px-2 py-0.5 rounded">{u}</code>
									))}
								</div>
							</details>
						)}
						{preview.detection.missing.length > 0 && (
							<div className="mt-3 text-xs text-amber-700">
								Missing canonical fields (will be NULL): {preview.detection.missing.join(", ")}
							</div>
						)}
					</div>

					{/* Step 3: sample */}
					<div className="mt-4 rounded-2xl border border-gray-200 bg-white overflow-hidden">
						<div className="px-5 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">
							Sample (first {preview.sample.length} rows)
						</div>
						<div className="overflow-x-auto">
							<table className="w-full text-xs">
								<thead className="bg-gray-50 border-b border-gray-200">
									<tr>
										{sampleHeaders.map((h) => (
											<th key={h} className="text-left px-3 py-2 font-medium text-gray-700 whitespace-nowrap">{h}</th>
										))}
									</tr>
								</thead>
								<tbody>
									{preview.sample.map((row, i) => (
										<tr key={i} className="border-b border-gray-100 last:border-0">
											{sampleHeaders.map((h) => (
												<td key={h} className="px-3 py-1.5 text-gray-700 whitespace-nowrap max-w-xs truncate" title={String(row[h] ?? "")}>
													{row[h] == null || row[h] === "" ? <span className="text-gray-300">—</span> : String(row[h])}
												</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					{/* Step 4: commit */}
					<div className="mt-6 flex items-center gap-3">
						<button
							onClick={commit}
							disabled={busy !== "" || !!result}
							className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
						>
							{busy === "commit" ? "Committing…" : result ? "Committed" : `Commit ${preview.totalRows.toLocaleString()} rows`}
						</button>
						<div className="text-xs text-gray-500">
							Replaces all rows in <code>production.raw_employee_ia</code> and re-runs <code>production.run_misconduct_from_legacy()</code>.
						</div>
					</div>

					{result && (
						<div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900">
							<div className="font-semibold">✓ Upload committed</div>
							<ul className="mt-2 space-y-0.5 text-xs">
								<li>Run ID: <code>{result.runId}</code></li>
								<li>Raw rows inserted: {result.rowsInsertedRaw.toLocaleString()}</li>
								<li>Canonical allegations: {result.rowsReconciledCanonical?.toLocaleString() ?? "—"}</li>
								<li>File: {result.filename}</li>
							</ul>
							<button onClick={reset} className="mt-3 text-xs text-emerald-700 hover:underline">Upload another file</button>
						</div>
					)}
				</>
			)}
		</AdminLayout>
	);
}
