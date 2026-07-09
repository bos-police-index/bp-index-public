import { useCallback, useMemo, useRef, useState } from "react";
import type { InferGetServerSidePropsType } from "next";
import AdminLayout from "@components/admin/AdminLayout";
import { withAdmin } from "@lib/auth/server";
import { UPLOAD_DATASETS, UploadDataset } from "@lib/admin/upload-datasets";

export const getServerSideProps = withAdmin(async (_ctx, session) => {
	return { props: { userEmail: session!.user?.email ?? null } };
});

type Validation = {
	mapping: Record<string, string | null>;
	missingRequired: string[];
	unmapped: string[];
	rowCount: number;
	ok: boolean;
};

type PreviewResp = {
	dataset: string;
	filename: string;
	sheetName: string;
	headers: string[];
	validation: Validation;
	sample: Record<string, any>[];
};

type CommitResp = {
	runId: string;
	dataset: string;
	filename: string;
	rowsIn: number;
	rowsInsertedRaw: number;
	columnsLoaded: string[];
	ignoredHeaders: string[];
	reconcile: Record<string, any>;
};

export default function AdminUpload({ userEmail }: InferGetServerSidePropsType<typeof getServerSideProps>) {
	const [datasetKey, setDatasetKey] = useState<string>(UPLOAD_DATASETS[0].key);
	const [file, setFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<PreviewResp | null>(null);
	const [busy, setBusy] = useState<"" | "preview" | "commit">("");
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<CommitResp | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const dragRef = useRef<HTMLDivElement>(null);

	const dataset = useMemo<UploadDataset>(
		() => UPLOAD_DATASETS.find((d) => d.key === datasetKey) ?? UPLOAD_DATASETS[0],
		[datasetKey],
	);

	const resetFile = () => {
		setFile(null);
		setPreview(null);
		setResult(null);
		setError(null);
		if (inputRef.current) inputRef.current.value = "";
	};

	const onSelectDataset = (key: string) => {
		setDatasetKey(key);
		resetFile();
	};

	const fetchPreview = useCallback(async (f: File, key: string) => {
		setBusy("preview"); setError(null); setPreview(null); setResult(null);
		try {
			const fd = new FormData();
			fd.append("file", f);
			fd.append("dataset", key);
			const r = await fetch("/api/admin/dataset-preview", { method: "POST", body: fd });
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
		if (f) fetchPreview(f, datasetKey);
	};

	const commit = async () => {
		if (!file) return;
		setBusy("commit"); setError(null);
		try {
			const fd = new FormData();
			fd.append("file", file);
			fd.append("dataset", datasetKey);
			const r = await fetch("/api/admin/dataset-commit", { method: "POST", body: fd });
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

	const downloadTemplate = () => {
		const header = dataset.columns.map((c) => c.name).join(",");
		const blob = new Blob([header + "\n"], { type: "text/csv;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${dataset.key}_template.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const v = preview?.validation;
	const sampleCols = dataset.columns.map((c) => c.name);

	return (
		<AdminLayout current="upload" userEmail={userEmail}>
			<h1 className="text-2xl font-bold text-gray-900">Data uploads</h1>
			<p className="text-sm text-gray-600 mt-1 max-w-3xl">
				Pick a dataset, shape your file to its published schema, then drag it in. Each upload{" "}
				<strong>replaces</strong> that dataset&apos;s raw table and re-runs its reconciler to refresh the officer
				profiles. Files are validated against the schema first — nothing is written unless the required columns are present.
			</p>

			{/* Dataset picker */}
			<div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
				<div className="lg:col-span-1">
					<label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Dataset</label>
					<select
						value={datasetKey}
						onChange={(e) => onSelectDataset(e.target.value)}
						className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
					>
						{UPLOAD_DATASETS.map((d) => (
							<option key={d.key} value={d.key}>{d.label}</option>
						))}
					</select>
					<p className="text-xs text-gray-600 mt-2">{dataset.description}</p>
					<dl className="mt-3 space-y-1 text-xs text-gray-500">
						<div><dt className="inline font-medium text-gray-600">Matches officers on:</dt> <dd className="inline">{dataset.matchOn}</dd></div>
						<div><dt className="inline font-medium text-gray-600">Raw table:</dt> <dd className="inline"><code className="bg-slate-100 px-1 rounded">{dataset.rawTable}</code></dd></div>
						<div><dt className="inline font-medium text-gray-600">Reconciler:</dt> <dd className="inline"><code className="bg-slate-100 px-1 rounded">{dataset.reconciler}</code></dd></div>
					</dl>
					<button onClick={downloadTemplate} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:underline">
						<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
						Download CSV template
					</button>
				</div>

				{/* Schema panel */}
				<div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5">
					<h2 className="text-sm font-semibold text-gray-900">Required upload schema</h2>
					<p className="text-xs text-gray-500 mt-0.5">
						Column headers are matched case- and spacing-insensitively. Extra columns are ignored.
					</p>
					<div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
						{dataset.columns.map((c) => (
							<div key={c.name} className="flex items-start gap-2 text-sm">
								<span className={`mt-0.5 inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.required ? "bg-red-500" : "bg-gray-300"}`} />
								<div className="min-w-0">
									<code className="text-xs font-medium text-gray-800">{c.name}</code>
									{c.required && <span className="ml-1 text-[10px] font-semibold text-red-600 uppercase">required</span>}
									{c.note && <span className="block text-[11px] text-gray-500 leading-tight">{c.note}</span>}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* File drop */}
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
							<button onClick={resetFile} className="ml-3 text-xs text-emerald-700 hover:underline">choose another</button>
						</>
					) : (
						<>
							Drag &amp; drop a <span className="font-medium">.csv</span> or <span className="font-medium">.xlsx</span> for{" "}
							<span className="font-medium">{dataset.label}</span>, or{" "}
							<button onClick={() => inputRef.current?.click()} className="text-emerald-700 hover:underline font-medium">browse</button>
						</>
					)}
				</div>
				<input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => onPickFile(e.target.files?.[0] || null)} />
			</div>

			{busy === "preview" && <div className="mt-4 text-sm text-gray-600 italic">Validating against schema…</div>}

			{error && (
				<div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
					<strong>Failed:</strong> {error}
				</div>
			)}

			{preview && v && (
				<>
					{/* Validation summary */}
					<div className={`mt-6 rounded-2xl border p-5 ${v.ok ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
						<div className="flex items-center justify-between">
							<h2 className={`text-lg font-semibold ${v.ok ? "text-emerald-900" : "text-red-900"}`}>
								{v.ok ? "✓ Schema check passed" : "✗ Schema check failed"}
							</h2>
							<div className="text-xs text-gray-600">Sheet: <code>{preview.sheetName}</code> · {v.rowCount.toLocaleString()} rows</div>
						</div>
						{!v.ok && (
							<div className="mt-2 text-sm text-red-800">
								Missing required column{v.missingRequired.length === 1 ? "" : "s"}: {v.missingRequired.map((m) => <code key={m} className="bg-red-100 px-1 rounded mx-0.5">{m}</code>)}
							</div>
						)}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 mt-3 text-sm">
							{dataset.columns.map((c) => {
								const hit = v.mapping[c.name];
								return (
									<div key={c.name} className="flex items-center gap-2">
										<code className={`text-xs px-2 py-0.5 rounded border ${hit ? "bg-emerald-100 text-emerald-800 border-emerald-200" : c.required ? "bg-red-100 text-red-800 border-red-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>{c.name}</code>
										<svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
										<span className={`truncate ${hit ? "text-gray-700" : "text-gray-400 italic"}`} title={hit ?? ""}>{hit ?? (c.required ? "missing" : "not provided")}</span>
									</div>
								);
							})}
						</div>
						{v.unmapped.length > 0 && (
							<details className="mt-3">
								<summary className="text-xs text-gray-500 cursor-pointer">{v.unmapped.length} extra column{v.unmapped.length === 1 ? "" : "s"} in file (ignored)</summary>
								<div className="mt-2 text-xs text-gray-600 flex flex-wrap gap-1">
									{v.unmapped.map((u) => <code key={u} className="bg-slate-100 px-2 py-0.5 rounded">{u}</code>)}
								</div>
							</details>
						)}
					</div>

					{/* Sample */}
					<div className="mt-4 rounded-2xl border border-gray-200 bg-white overflow-hidden">
						<div className="px-5 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">Sample (first {preview.sample.length} rows, mapped to schema)</div>
						<div className="overflow-x-auto">
							<table className="w-full text-xs">
								<thead className="bg-gray-50 border-b border-gray-200">
									<tr>{sampleCols.map((h) => <th key={h} className="text-left px-3 py-2 font-medium text-gray-700 whitespace-nowrap">{h}</th>)}</tr>
								</thead>
								<tbody>
									{preview.sample.map((row, i) => (
										<tr key={i} className="border-b border-gray-100 last:border-0">
											{sampleCols.map((h) => (
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

					{/* Commit */}
					<div className="mt-6 flex items-center gap-3">
						<button
							onClick={commit}
							disabled={busy !== "" || !!result || !v.ok}
							className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
						>
							{busy === "commit" ? "Committing…" : result ? "Committed" : `Replace ${dataset.label} with ${v.rowCount.toLocaleString()} rows`}
						</button>
						<div className="text-xs text-gray-500">
							Truncates <code>{dataset.rawTable}</code> and runs <code>{dataset.reconciler}</code>.
						</div>
					</div>

					{result && (
						<div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900">
							<div className="font-semibold">✓ Upload committed</div>
							<ul className="mt-2 space-y-0.5 text-xs">
								<li>Run ID: <code>{result.runId}</code></li>
								<li>Raw rows inserted: {result.rowsInsertedRaw.toLocaleString()}</li>
								<li>Columns loaded: {result.columnsLoaded.join(", ")}</li>
								<li>Reconcile result: <code>{JSON.stringify(result.reconcile)}</code></li>
								<li>File: {result.filename}</li>
							</ul>
							<button onClick={resetFile} className="mt-3 text-xs text-emerald-700 hover:underline">Upload another file</button>
						</div>
					)}
				</>
			)}
		</AdminLayout>
	);
}
