/**
 * Tiny custom NextAuth v4 Postgres adapter.
 *
 * The official @auth/pg-adapter package targets NextAuth v5 and has tangled
 * peer-deps with next-auth@4 (and the @next-auth/pg-adapter name was never
 * published). This adapter implements just the methods we need for the
 * EmailProvider magic-link flow.
 *
 * Schema is whatever db/migrations/2026_05_12_auth_schema.sql created. The
 * shared pg Pool is configured with search_path='auth, production, public'
 * so unqualified table names resolve.
 */
import type { Adapter, AdapterUser, AdapterSession, VerificationToken } from "next-auth/adapters";
import type { Pool } from "pg";

export default function PgAdapter(pool: Pool): Adapter {
	const userFromRow = (r: any): AdapterUser => ({
		id: r.id,
		name: r.name ?? null,
		email: r.email,
		emailVerified: r.emailVerified ? new Date(r.emailVerified) : null,
		image: r.image ?? null,
		// non-NextAuth standard fields end up on session.user via the session callback
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		...({ is_admin: r.is_admin ?? false } as any),
	});

	return {
		// ---- users ----
		async createUser(user) {
			const { rows } = await pool.query(
				`INSERT INTO auth.users (name, email, "emailVerified", image)
				 VALUES ($1, $2, $3, $4)
				 RETURNING id, name, email, "emailVerified", image, is_admin`,
				[user.name ?? null, user.email, user.emailVerified ?? null, user.image ?? null],
			);
			return userFromRow(rows[0]);
		},
		async getUser(id) {
			const { rows } = await pool.query(
				`SELECT id, name, email, "emailVerified", image, is_admin FROM auth.users WHERE id = $1`,
				[id],
			);
			return rows[0] ? userFromRow(rows[0]) : null;
		},
		async getUserByEmail(email) {
			const { rows } = await pool.query(
				`SELECT id, name, email, "emailVerified", image, is_admin FROM auth.users WHERE email = $1`,
				[email],
			);
			return rows[0] ? userFromRow(rows[0]) : null;
		},
		async getUserByAccount({ provider, providerAccountId }) {
			const { rows } = await pool.query(
				`SELECT u.id, u.name, u.email, u."emailVerified", u.image, u.is_admin
				   FROM auth.users u
				   JOIN auth.accounts a ON a."userId" = u.id
				  WHERE a.provider = $1 AND a."providerAccountId" = $2`,
				[provider, providerAccountId],
			);
			return rows[0] ? userFromRow(rows[0]) : null;
		},
		async updateUser(user) {
			const { rows } = await pool.query(
				`UPDATE auth.users
				    SET name          = COALESCE($2, name),
				        email         = COALESCE($3, email),
				        "emailVerified" = COALESCE($4, "emailVerified"),
				        image         = COALESCE($5, image),
				        updated_at    = now()
				  WHERE id = $1
				  RETURNING id, name, email, "emailVerified", image, is_admin`,
				[user.id, user.name ?? null, user.email ?? null, user.emailVerified ?? null, user.image ?? null],
			);
			return userFromRow(rows[0]);
		},

		// ---- accounts (OAuth) — we only use EmailProvider but stub these so the
		// adapter is complete and won't break if OAuth is added later. ----
		async linkAccount(account) {
			await pool.query(
				`INSERT INTO auth.accounts
				   ("userId", type, provider, "providerAccountId",
				    refresh_token, access_token, expires_at, id_token, scope, session_state, token_type)
				 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
				[
					account.userId,
					account.type,
					account.provider,
					account.providerAccountId,
					account.refresh_token ?? null,
					account.access_token ?? null,
					account.expires_at ?? null,
					account.id_token ?? null,
					account.scope ?? null,
					account.session_state ?? null,
					account.token_type ?? null,
				],
			);
		},
		async unlinkAccount({ provider, providerAccountId }) {
			await pool.query(
				`DELETE FROM auth.accounts WHERE provider = $1 AND "providerAccountId" = $2`,
				[provider, providerAccountId],
			);
		},

		// ---- sessions (database strategy) ----
		async createSession(session) {
			const { rows } = await pool.query(
				`INSERT INTO auth.sessions ("userId", expires, "sessionToken")
				 VALUES ($1, $2, $3)
				 RETURNING "sessionToken", "userId", expires`,
				[session.userId, session.expires, session.sessionToken],
			);
			return rowToSession(rows[0]);
		},
		async getSessionAndUser(sessionToken) {
			const { rows } = await pool.query(
				`SELECT s."sessionToken", s."userId", s.expires,
				        u.id, u.name, u.email, u."emailVerified", u.image, u.is_admin
				   FROM auth.sessions s
				   JOIN auth.users u ON u.id = s."userId"
				  WHERE s."sessionToken" = $1`,
				[sessionToken],
			);
			if (rows.length === 0) return null;
			const r = rows[0];
			return {
				session: rowToSession({ sessionToken: r.sessionToken, userId: r.userId, expires: r.expires }),
				user: userFromRow({
					id: r.id, name: r.name, email: r.email,
					emailVerified: r.emailVerified, image: r.image, is_admin: r.is_admin,
				}),
			};
		},
		async updateSession(session) {
			const { rows } = await pool.query(
				`UPDATE auth.sessions
				    SET expires = COALESCE($2, expires),
				        "userId" = COALESCE($3, "userId")
				  WHERE "sessionToken" = $1
				  RETURNING "sessionToken", "userId", expires`,
				[session.sessionToken, session.expires ?? null, session.userId ?? null],
			);
			return rows[0] ? rowToSession(rows[0]) : null;
		},
		async deleteSession(sessionToken) {
			await pool.query(
				`DELETE FROM auth.sessions WHERE "sessionToken" = $1`,
				[sessionToken],
			);
		},

		// ---- verification tokens (magic links) ----
		async createVerificationToken(token) {
			const { rows } = await pool.query(
				`INSERT INTO auth.verification_token (identifier, token, expires)
				 VALUES ($1, $2, $3)
				 RETURNING identifier, token, expires`,
				[token.identifier, token.token, token.expires],
			);
			return rowToVerificationToken(rows[0]);
		},
		async useVerificationToken({ identifier, token }) {
			const { rows } = await pool.query(
				`DELETE FROM auth.verification_token
				  WHERE identifier = $1 AND token = $2
				  RETURNING identifier, token, expires`,
				[identifier, token],
			);
			return rows[0] ? rowToVerificationToken(rows[0]) : null;
		},
	};
}

function rowToSession(r: any): AdapterSession {
	return {
		sessionToken: r.sessionToken,
		userId: r.userId,
		expires: new Date(r.expires),
	};
}

function rowToVerificationToken(r: any): VerificationToken {
	return {
		identifier: r.identifier,
		token: r.token,
		expires: new Date(r.expires),
	};
}
