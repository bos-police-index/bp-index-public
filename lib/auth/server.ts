import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./options";

/**
 * Dev-only escape hatch. Hard-gated on NODE_ENV !== 'production' so it can't
 * be enabled by accident on the deployed instance. When active, every
 * getAdminSession() call returns a synthetic admin session so /admin/* is
 * accessible without going through the magic-link flow.
 *
 *   .env:
 *     DEV_BYPASS_AUTH=true
 *
 * A WARN is logged on first use of each Node process so it's obvious in the
 * dev-server output that auth is bypassed.
 */
const DEV_AUTH_BYPASS_ENABLED =
	process.env.NODE_ENV !== "production" &&
	process.env.DEV_BYPASS_AUTH === "true";

let warnedBypass = false;
function logBypassOnce() {
	if (warnedBypass) return;
	warnedBypass = true;
	// eslint-disable-next-line no-console
	console.warn(
		"\n\n⚠️  [auth] DEV_BYPASS_AUTH is active — /admin routes are UNGATED.\n" +
			"   This env var is ignored when NODE_ENV=production, but never set it in any shared environment.\n",
	);
}

const SYNTHETIC_DEV_SESSION = {
	user: {
		id: "dev-bypass",
		name: "Dev Bypass",
		email: "dev-bypass@local",
		is_admin: true,
	},
	expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
} as const;

/**
 * Server-side helper. Returns the authenticated admin session, or null.
 * Use in getServerSideProps and inside API routes.
 */
export async function getAdminSession(
	reqOrCtx:
		| GetServerSidePropsContext
		| { req: NextApiRequest; res: NextApiResponse },
) {
	if (DEV_AUTH_BYPASS_ENABLED) {
		logBypassOnce();
		return SYNTHETIC_DEV_SESSION as any;
	}
	const session = await getServerSession(reqOrCtx.req, reqOrCtx.res, authOptions);
	if (!session?.user) return null;
	if (!(session.user as any).is_admin) return null;
	return session;
}

/**
 * Convenience for getServerSideProps: redirect to signin if not an admin.
 * Usage:
 *   export const getServerSideProps = withAdmin(async (ctx, session) => {
 *     return { props: { whoami: session.user.email } };
 *   });
 */
export function withAdmin<P extends { [k: string]: any } = { [k: string]: any }>(
	handler: (
		ctx: GetServerSidePropsContext,
		session: Awaited<ReturnType<typeof getAdminSession>>,
	) => Promise<{ props: P } | { redirect: any } | { notFound: true }>,
) {
	return async (ctx: GetServerSidePropsContext) => {
		const session = await getAdminSession(ctx);
		if (!session) {
			const callbackUrl = encodeURIComponent(ctx.resolvedUrl || "/admin");
			return {
				redirect: {
					destination: `/auth/signin?callbackUrl=${callbackUrl}`,
					permanent: false,
				},
			};
		}
		return handler(ctx, session);
	};
}
