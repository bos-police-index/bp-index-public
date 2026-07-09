export default function VerifyRequestPage() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 px-4">
			<div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
				<div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
					<svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
					</svg>
				</div>
				<h1 className="text-xl font-bold text-gray-900">Check your inbox</h1>
				<p className="text-sm text-gray-600 mt-2">
					We just sent you a sign-in link. Click it to finish signing in.
				</p>
				<p className="mt-4 text-xs text-gray-500">
					In dev, the link is printed to the Next.js server console instead.
				</p>
				<a
					href="/auth/signin"
					className="inline-block mt-6 text-sm text-emerald-700 hover:text-emerald-800 font-medium"
				>
					&larr; Back to sign-in
				</a>
			</div>
		</div>
	);
}
