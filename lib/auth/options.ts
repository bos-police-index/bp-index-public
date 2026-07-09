import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import PgAdapter from "./pg-adapter";
import { pool } from "./db";

/**
 * NextAuth configuration.
 *
 * - Postgres adapter pointing at the `auth` schema we set up in
 *   db/migrations/2026_05_12_auth_schema.sql
 * - EmailProvider: magic-link sign-in. In dev (EMAIL_SERVER empty) we override
 *   sendVerificationRequest to log the link to the server console — no SMTP
 *   needed to test locally.
 * - The `is_admin` flag on auth.users is loaded into the session via the
 *   `session` callback so server-side guards can check it without an extra
 *   query.
 */
export const authOptions: NextAuthOptions = {
	adapter: PgAdapter(pool),
	session: { strategy: "database" },
	pages: {
		signIn: "/auth/signin",
		verifyRequest: "/auth/verify-request",
	},
	providers: [
		EmailProvider({
			from: process.env.EMAIL_FROM,
			server: process.env.EMAIL_SERVER || undefined,
			// In dev (no SMTP) just log the magic link — same flow, no infra needed.
			async sendVerificationRequest({ identifier: email, url }) {
				if (process.env.EMAIL_SERVER) {
					// Production path: real nodemailer transport (next-auth's default).
					// We get here only when EMAIL_SERVER is set, in which case the default
					// behavior of EmailProvider already handles SMTP. So we re-throw to
					// let next-auth use its built-in handler by importing from inside.
					const { default: nodemailer } = await import("nodemailer");
					const transport = nodemailer.createTransport(process.env.EMAIL_SERVER as string);
					await transport.sendMail({
						to: email,
						from: process.env.EMAIL_FROM,
						subject: `Sign in to bp-index admin`,
						text: `Sign in: ${url}\n\nIf you didn't request this, ignore.\n`,
						html: `<p>Sign in to <b>bp-index admin</b>:</p><p><a href="${url}">${url}</a></p><p style="color:#666;font-size:12px">If you didn't request this, ignore.</p>`,
					});
					return;
				}
				// Dev path: console-log the magic link so the researcher can click through
				// without setting up SMTP. The link expires per NextAuth defaults.
				// eslint-disable-next-line no-console
				console.log(`\n\n===== MAGIC LINK (dev) for ${email} =====\n${url}\n==========================================\n\n`);
			},
		}),
	],
	callbacks: {
		async session({ session, user }) {
			if (session.user && user) {
				(session.user as any).id = user.id;
				(session.user as any).is_admin = (user as any).is_admin ?? false;
			}
			return session;
		},
	},
};
