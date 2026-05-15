import type { Access, FieldAccess, PayloadRequest } from 'payload';

export type Role = 'recipe_keeper' | 'founder' | 'architect' | 'viewer';

function userRole(req: PayloadRequest): Role | undefined {
  return (req.user as { role?: Role } | null | undefined)?.role;
}

export const isAuthenticated: Access = ({ req }) => Boolean(req.user);

export const hasRole =
  (...roles: Role[]): Access =>
  ({ req }) => {
    const role = userRole(req);
    return role ? roles.includes(role) : false;
  };

export const hasRoleField =
  (...roles: Role[]): FieldAccess =>
  ({ req }) => {
    const role = userRole(req);
    return role ? roles.includes(role) : false;
  };

// §15.4: Recipe Keepers author. Founder + Architect can touch anything.
export const canAuthor = hasRole('recipe_keeper', 'founder', 'architect');
export const canApprove = hasRole('founder', 'architect');
export const canRead = hasRole('recipe_keeper', 'founder', 'architect', 'viewer');

export const canApproveField = hasRoleField('founder', 'architect');
