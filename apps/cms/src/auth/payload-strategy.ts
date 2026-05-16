import type { AuthStrategy, User } from 'payload';
import { auth } from './index.ts';

// §3.5, §17.2: a Payload AuthStrategy that delegates to Better-Auth.
// The Better-Auth session cookie is set when the Recipe Keeper signs
// in through the passkey flow; Payload reads that cookie on every
// admin request via this strategy and constructs a Payload User
// envelope for the rest of the framework.
export const betterAuthStrategy: AuthStrategy = {
  name: 'better-auth',
  authenticate: async ({ headers }) => {
    try {
      const session = await auth.api.getSession({ headers });
      if (!session?.user) return { user: null };
      // Better-Auth's user record carries the extended fields we
      // declared (role, display_name). Map to Payload's User shape.
      const beUser = session.user as {
        id: string;
        email?: string | null;
        role?: string;
        display_name?: string | null;
      };
      const user = {
        id: beUser.id,
        email: beUser.email ?? '',
        role: beUser.role ?? 'recipe_keeper',
        display_name: beUser.display_name ?? null,
        collection: 'users',
      } as unknown as User;
      return { user };
    } catch {
      return { user: null };
    }
  },
};
