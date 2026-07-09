-- NextAuth.js Postgres schema (standard layout from @next-auth/pg-adapter docs).
-- Lives in its own `auth` schema so it's clearly separate from production data.
-- An `is_admin` flag on the users table gates /admin/* routes.
--
-- IMPORTANT: bootstrap your own email by running this migration with the
-- BOOTSTRAP_ADMIN_EMAIL environment variable set, OR manually INSERT a row into
-- auth.users with is_admin=true after running. The default INSERT below uses
-- am5815@bu.edu (the inventoried researcher email); change as needed.

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text,
    email           text UNIQUE NOT NULL,
    "emailVerified" timestamptz,
    image           text,
    is_admin        boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth.accounts (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId"            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type                text NOT NULL,
    provider            text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token       text,
    access_token        text,
    expires_at          bigint,
    id_token            text,
    scope               text,
    session_state       text,
    token_type          text,
    UNIQUE (provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS auth.sessions (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId"       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires        timestamptz NOT NULL,
    "sessionToken" text UNIQUE NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth.sessions ("userId");

CREATE TABLE IF NOT EXISTS auth.verification_token (
    identifier text NOT NULL,
    token      text NOT NULL,
    expires    timestamptz NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- Bootstrap admin so the requesting user can sign in without database access on day one.
-- Replace the email below if needed.
INSERT INTO auth.users (email, is_admin)
VALUES ('am5815@bu.edu', true)
ON CONFLICT (email) DO UPDATE SET is_admin = true;
