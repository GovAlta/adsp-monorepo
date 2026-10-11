import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError, PLANNER_ROLES, PlannerRole } from '../types';

// ✓ ASVS:V3.5.1 — JWT signature validated on every request via ADSP SDK passport-jwt strategy
// ✓ CAS:RULE-001 — authentication enforced at route level before any handler executes
// ✓ ASVS:V4.1.3 — access control decision made server-side; user cannot self-elevate role

/**
 * requireAuth — enforces that a valid JWT was presented and validated by passport-jwt.
 * Passport-jwt strategy (configured by initializePlatform) runs first; this guard checks
 * that req.user was populated by the strategy.
 *
 * Returns HTTP 401 if no user context is present.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // ✓ ASVS:V3.5.2 — bearer token presence verified; missing token yields 401
  if (!req.user || !req.user.userId) {
    next(new UnauthorizedError('Valid JWT bearer token is required'));
    return;
  }
  next();
}

/**
 * requireRole — enforces that the authenticated user holds at least one of the
 * specified roles. Implements the BR-007 three-level RBAC hierarchy.
 *
 * Returns HTTP 403 if none of the required roles are present.
 * @param roles — array of required PlannerRole values; user must have AT LEAST one
 */
export function requireRole(roles: PlannerRole[]) {
  // ✓ ASVS:V4.1.1 — role-based authorization; server-side role check on every request
  // ✓ CAS:RULE-012 — least-privilege: users granted only the roles they need
  return function roleCheck(req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = roles.some((role) => userRoles.includes(role));

    if (!hasRequiredRole) {
      next(
        new ForbiddenError(
          `Role required: one of [${roles.join(', ')}]. ` +
            `User has roles: [${userRoles.join(', ')}]`,
        ),
      );
      return;
    }

    next();
  };
}

/**
 * requireAdmin — shorthand guard for planner-admin OR tenant-admin access.
 * Used on administrative endpoints (audit log, pattern management, bulk operations).
 */
export const requireAdmin = requireRole([PLANNER_ROLES.PLANNER_ADMIN, PLANNER_ROLES.TENANT_ADMIN]);

/**
 * requirePlannerUser — shorthand guard for any planner role (planner-user or above).
 * Used on standard planning session endpoints.
 */
export const requirePlannerUser = requireRole([
  PLANNER_ROLES.PLANNER_USER,
  PLANNER_ROLES.PLANNER_ADMIN,
  PLANNER_ROLES.TENANT_ADMIN,
]);
