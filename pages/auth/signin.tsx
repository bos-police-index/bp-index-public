import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function SignInPage() {
	const router = useRouter();
	const callbackUrl = (router.query.callbackUrl as string) || "/admin";
	const error = router.query.error as string | undefined;
	const [email, setEmail] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitting(true);
		await signIn("email", { email, callbackUrl, redirect: true });
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 px-4">
			<div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
				<Link href="/" className="text-xs text-slate-500 hover:text-slate-700">&larr; Back to bp-index</Link>
				<h1 className="text-2xl font-bold text-gray-900 mt-2">Admin sign-in</h1>
				<p className="text-sm text-gray-600 mt-1">
					Enter your email. We'll send a one-time sign-in link. Your address must already be allow-listed as an admin in the bp-index database.
				</p>

				{error && (
					<div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
						{error === "OAuthCallback" || error === "AccessDenied"
							? "That email isn't authorized as an admin. Ask an existing admin to flag your account."
							: `Sign-in failed: ${error}`}
					</div>
				)}

				<form onSubmit={onSubmit} className="mt-6 space-y-4">
					<label className="block">
						<span className="text-sm font-medium text-gray-700">Email</span>
						<input
							type="email"
							required
							autoFocus
							placeholder="you@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none text-sm"
						/>
					</label>
					<button
						type="submit"
						disabled={submitting || !email}
						className="w-full px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{submitting ? "Sending…" : "Send sign-in link"}
					</button>
				</form>

				<p className="mt-6 text-xs text-gray-500">
					In dev, the magic-link URL is printed to the Next.js server console. In production it arrives by email.
				</p>
			</div>
		</div>
	);
}
