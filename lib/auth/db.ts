import { Pool } from "pg";

// Single shared pool for NextAuth and any other server-side DB work.
// search_path includes `auth` first so the NextAuth pg-adapter finds its tables
// (users, accounts, sessions, verification_token) in the `auth` schema without
// modification. `production` and `public` follow for everything else.
declare global {
	// eslint-disable-next-line no-var
	var _pgPool: Pool | undefined;
}

export const pool: Pool =
	global._pgPool ??
	new Pool({
		connectionString: process.env.DATABASE_URL,
		max: 5,
		// Railway external endpoints require SSL; we don't have a cert pinned in dev
		// so allow unauthorized. Production should fix this.
		ssl: { rejectUnauthorized: false },
	});

// On first checkout, set the search_path so NextAuth's `users` lookups find auth.users.
pool.on("connect", (client) => {
	client.query("SET search_path = auth, production, public").catch((e) => {
		// non-fatal; queries that need a schema-qualified table still work
		// eslint-disable-next-line no-console
		console.warn("failed to set search_path on new pg connection:", e?.message);
	});
});

if (process.env.NODE_ENV !== "production") {
	global._pgPool = pool;
}
