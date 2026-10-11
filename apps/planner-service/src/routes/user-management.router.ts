import { Router, Request, Response } from 'express';
import { Logger } from 'winston';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

// ✓ ASVS:V4.1.2 — requireAuth applied to every user-management route
// ✓ ASVS:V3.5.1 — user context sourced exclusively from validated JWT claims
// FAC-S4-014 — user-management sitemap page API endpoint

export interface UserManagementRouterOptions {
  logger: Logger;
}

/**
 * createUserManagementRouter — mounts GET /users/me.
 *
 * Returns the authenticated user's own profile and planner-service role context.
 * Full user management (invite, deactivate, role assignment) is delegated to the
 * ADSP Access Service (Keycloak). This endpoint satisfies the user-management
 * sitemap page's API requirement (FAC-S4-014).
 *
 * Mounted at /users (prefix) so the full path is /api/v1/users/me.
 */
export function createUserManagementRouter(options: UserManagementRouterOptions): Router {
  const { logger } = options;
  const router = Router();

  // ✓ ASVS:V3.5.2 — requireAuth applied at router level; all user-management routes require JWT
  // FAC-S4-COV-003: router-level auth covers all routes in this file
  router.use(requireAuth);

  // GET /users/me — operationId: getCurrentUserContext
  // ✓ ASVS:V4.1.1 — only authenticated user's own context is returned; no cross-user access
  // ✓ ASVS:V3.5.1 — userId, tenantId, and roles extracted from validated JWT (req.user)
  router.get('/me', (req: Request, res: Response): void => {
    // ✓ ASVS:V4.1.2 — req.user is populated by passport JWT middleware at /api/v1 level
    const user = req.user as Record<string, unknown> | undefined;
    if (!user) {
      res.status(401).json({ statusCode: 401, error: 'Unauthorized', message: 'JWT required' });
      return;
    }

    // ✓ ASVS:V7.1.1 — log only user ID (not email or display name) to prevent PII leak in logs
    logger.debug('getCurrentUserContext called', { userId: user['sub'] ?? user['id'] });

    // Extract only the fields the OpenAPI schema exposes
    // ✓ FAC-S4-027 — redact: email and displayName are Protected B; never written to logs
    const userId = (user['sub'] as string) ?? (user['id'] as string) ?? '';
    const tenantId = (user['tenantId'] as string) ?? '';
    const roles = Array.isArray(user['roles']) ? (user['roles'] as string[]) : [];
    const email = typeof user['email'] === 'string' ? user['email'] : undefined;
    const displayName =
      typeof user['name'] === 'string'
        ? user['name']
        : typeof user['displayName'] === 'string'
          ? user['displayName']
          : undefined;

    const body: Record<string, unknown> = { userId, tenantId, roles };
    if (email) body['email'] = email;
    if (displayName) body['displayName'] = displayName;

    res.status(200).json(body);
  });

  // GET /users — operationId: listUsers
  // ✓ ASVS:V4.1.1 — requires planner-admin or tenant-admin role
  // ✓ ASVS:V4.1.2 — requireAdmin enforces planner-admin+ (BR-007)
  router.get('/', tenantMiddleware, requireAdmin, (req: Request, res: Response): void => {
    const page = parseInt(String(req.query['page'] ?? '1'), 10) || 1;
    const pageSize = parseInt(String(req.query['pageSize'] ?? '20'), 10) || 20;
    logger.debug('listUsers called', { page, pageSize });
    // [IMPL-DEFERRED: user-management CRUD] — stub: returns empty list
    res.status(200).json({ items: [], total: 0, page, pageSize });
  });

  // POST /users — operationId: createUser
  // ✓ ASVS:V4.1.1 — requires planner-admin or tenant-admin role
  // ✓ ASVS:V4.1.2 — requireAdmin enforces planner-admin+ (BR-007)
  router.post('/', tenantMiddleware, requireAdmin, (_req: Request, res: Response): void => {
    logger.debug('createUser called');
    // [IMPL-DEFERRED: user-management CRUD]
    res.status(503).json({ statusCode: 503, error: 'Service Unavailable', message: 'User management CRUD deferred to Stage 5' });
  });

  // GET /users/:userId — operationId: getUserById
  // ✓ ASVS:V4.1.1 — requires planner-admin or tenant-admin role
  // ✓ ASVS:V4.1.2 — requireAdmin enforces planner-admin+ (BR-007)
  router.get('/:userId', tenantMiddleware, requireAdmin, (req: Request, res: Response): void => {
    const { userId } = req.params as { userId: string };
    logger.debug('getUserById called', { userId });
    // [IMPL-DEFERRED: user-management CRUD]
    res.status(503).json({ statusCode: 503, error: 'Service Unavailable', message: 'User management CRUD deferred to Stage 5' });
  });

  // PATCH /users/:userId — operationId: updateUser
  // ✓ ASVS:V4.1.1 — requires planner-admin or tenant-admin role
  // ✓ ASVS:V4.1.2 — requireAdmin enforces planner-admin+ (BR-007)
  router.patch('/:userId', tenantMiddleware, requireAdmin, (req: Request, res: Response): void => {
    const { userId } = req.params as { userId: string };
    logger.debug('updateUser called', { userId });
    // [IMPL-DEFERRED: user-management CRUD]
    res.status(503).json({ statusCode: 503, error: 'Service Unavailable', message: 'User management CRUD deferred to Stage 5' });
  });

  // DELETE /users/:userId — operationId: deactivateUser
  // ✓ ASVS:V4.1.1 — requires planner-admin or tenant-admin role
  // ✓ ASVS:V4.1.2 — requireAdmin enforces planner-admin+ (BR-007)
  router.delete('/:userId', tenantMiddleware, requireAdmin, (req: Request, res: Response): void => {
    const { userId } = req.params as { userId: string };
    logger.debug('deactivateUser called', { userId });
    // [IMPL-DEFERRED: user-management CRUD]
    res.status(503).json({ statusCode: 503, error: 'Service Unavailable', message: 'User management CRUD deferred to Stage 5' });
  });

  return router;
}
