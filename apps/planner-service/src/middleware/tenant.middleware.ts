import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../types';

// ✓ ASVS:V4.1.1 — multi-tenant isolation: every request scoped to authenticated tenant
// ✓ CAS:RULE-015 — tenant boundary enforced server-side; cross-tenant access blocked

/**
 * tenantMiddleware — extracts tenantId from req.user (populated by passport-jwt)
 * and makes it available as req.tenantId for downstream handlers.
 *
 * All non-health endpoints must run this middleware after requireAuth.
 * Returns HTTP 401 if no user context, HTTP 403 if tenantId is missing from JWT.
 *
 * SYSREQ-010 compliance: tenant-scoped data isolation enforced at middleware layer.
 */
export function tenantMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    // ✓ ASVS:V3.5.2 — unauthenticated requests rejected before tenant context is used
    next(new UnauthorizedError('Authentication required to access tenant resources'));
    return;
  }

  const tenantId = req.user.tenantId;

  if (!tenantId) {
    // ✓ ASVS:V4.1.1 — tenantId is mandatory on all non-health endpoints
    next(
      new ForbiddenError(
        'JWT is missing required tenantId claim. ' +
          'Ensure the token was issued for a valid tenant context.',
      ),
    );
    return;
  }

  // Augment request with resolved tenantId for use in controllers/services
  // ✓ CAS:RULE-015 — tenantId attached to req; all downstream queries must filter by this value
  (req as Request & { tenantId: string }).tenantId = tenantId;

  next();
}

// Type augmentation for tenantId on Express Request
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}
