import { passkey } from '@better-auth/passkey';
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

// §3.5, §17.2: Better-Auth replaces Payload's built-in auth shim for
// Recipe Keepers in Phase 2. Passkey-only — no passwords. SSO comes
// later via Better-Auth's OIDC plugin when an organizational IdP lands.
//
// We point Better-Auth at the same Postgres database as Payload so
// the Users collection and the Better-Auth account/session tables
// share a transactional surface. The tables Better-Auth needs are
// migrated by `pnpm --filter @confectory/cms run auth:migrate`.

const databaseUrl = process.env.DATABASE_URL ?? 'postgres://localhost:5432/confectory';

export const auth = betterAuth({
  // Shared connection pool — keeps roundtrips inside the same TLS
  // session as the Payload reads.
  database: new Pool({ connectionString: databaseUrl }),
  // §17.2: passkey-only. Phase 3 may add OIDC if a Recipe Keeper team
  // requires SSO.
  emailAndPassword: { enabled: false },
  // §15.4 RBAC. Better-Auth doesn't track roles natively, so we extend
  // the user model. The default role is recipe_keeper; the Founder /
  // architect / viewer roles are assigned out-of-band by an existing
  // architect or by direct DB edit during onboarding.
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'recipe_keeper',
        required: true,
      },
      display_name: {
        type: 'string',
        required: false,
      },
    },
  },
  // §17.1 mirror: short session cookie life, refresh on activity.
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  secret: process.env.BETTER_AUTH_SECRET ?? 'dev-secret-replace-me',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  plugins: [passkey()],
});

export type Auth = typeof auth;
