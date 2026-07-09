import React from "react";
import { signOut } from "next-auth/react";

interface AdminLayoutProps {
	current: "home" | "upload" | "reconcile" | "earnings-review" | "confirmations" | "pipelines";
	userEmail: string | null;
	children: React.ReactNode;
}

const NAV: { key: AdminLayoutProps["current"]; label: string; href: string }[] = [
	{ key: "home", label: "Overview", href: "/admin" },
	{ key: "upload", label: "Upload", href: "/admin/upload" },
	{ key: "reconcile", label: "Reconcile queue", href: "/admin/reconcile" },
	{ key: "earnings-review", label: "Earnings review", href: "/admin/earnings-review" },
	{ key: "confirmations", label: "Confirm name matches", href: "/admin/confirmations" },
	{ key: "pipelines", label: "Pipelines", href: "/admin/pipelines" },
];

export default function AdminLayout({ current, userEmail, children }: AdminLayoutProps) {
	return (
		<div className="min-h-screen flex bg-slate-50">
			<aside className="w-60 bg-slate-900 text-white flex flex-col">
				<div className="px-4 py-5 border-b border-slate-800">
					<div className="text-lg font-bold">bp-index admin</div>
					<div className="text-[11px] text-slate-400 mt-0.5">v2 pipeline operator</div>
				</div>
				<nav className="flex-1 py-3 px-2 space-y-1">
					{NAV.map((item) => {
						const active = item.key === current;
						return (
							<a
								key={item.key}
								href={item.href}
								className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
									active
										? "bg-emerald-600 text-white font-semibold"
										: "text-slate-300 hover:bg-slate-800 hover:text-white"
								}`}
							>
								{item.label}
							</a>
						);
					})}
				</nav>
				<div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-400 space-y-2">
					{userEmail && <div className="truncate" title={userEmail}>{userEmail}</div>}
					<button
						onClick={() => signOut({ callbackUrl: "/" })}
						className="w-full px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs"
					>
						Sign out
					</button>
					<a href="/" className="block text-center text-slate-500 hover:text-slate-300">&larr; back to public site</a>
				</div>
			</aside>
			<main className="flex-1 overflow-y-auto">
				<div className="max-w-5xl mx-auto px-6 py-6">{children}</div>
			</main>
		</div>
	);
}
