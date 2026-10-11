import { Request, Response } from 'express';
import { Logger } from 'winston';
import { requireAuth } from '../middleware/auth.middleware';
import { UserManagementService } from '../services/user-management.service';

// ✓ ASVS:V4.1.2 — requireAuth enforced; returns caller's own profile only
// ✓ ASVS:V3.5.1 — user context sourced exclusively from validated JWT claims
// FAC-S4-014 / FAC-S4-COV-001 — controller for user-management operationId getCurrentUserContext

export { requireAuth };

export class UserManagementController {
  private readonly service: UserManagementService;

  constructor(private readonly logger: Logger) {
    this.service = new UserManagementService();
  }

  // operationId: getCurrentUserContext
  // ✓ ASVS:V4.1.1 — only the authenticated user's own context is returned; no cross-user access
  getCurrentUserContext = (req: Request, res: Response): void => {
    const user = req.user as Record<string, unknown> | undefined;
    if (!user) {
      res.status(401).json({ statusCode: 401, error: 'Unauthorized', message: 'JWT required' });
      return;
    }

    this.logger.debug('getCurrentUserContext called', { userId: user['sub'] ?? user['id'] });

    const context = this.service.buildUserContext(user);
    res.status(200).json(context);
  };

  // operationId: listUsers
  // ✓ ASVS:V4.1.1 — requireAuth applied at router level; all user-management routes JWT-protected
  // ✓ ASVS:V4.1.2 — requireAdmin enforced before this handler (planner-admin or tenant-admin)
  listUsers = (req: Request, res: Response): void => {
    const page = parseInt(String(req.query['page'] ?? '1'), 10) || 1;
    const pageSize = parseInt(String(req.query['pageSize'] ?? '20'), 10) || 20;
    this.logger.debug('listUsers called', { page, pageSize });
    // [IMPL-DEFERRED: user-management CRUD] — returns stub empty list
    res.status(200).json({ items: [], total: 0, page, pageSize });
  };

  // operationId: createUser
  // ✓ ASVS:V4.1.1 — requireAuth applied at router level; all user-management routes JWT-protected
  // ✓ ASVS:V4.1.2 — requireAdmin enforced before this handler (planner-admin or tenant-admin)
  createUser = (req: Request, res: Response): void => {
    this.logger.debug('createUser called');
    // [IMPL-DEFERRED: user-management CRUD]
    res.status(503).json({ statusCode: 503, error: 'Service Unavailable', message: 'User management CRUD deferred to Stage 5' });
  };

  // operationId: getUserById
  // ✓ ASVS:V4.1.1 — requireAuth applied at router level; all user-management routes JWT-protected
  // ✓ ASVS:V4.1.2 — requireAdmin enforced before this handler (planner-admin or tenant-admin)
  getUserById = (req: Request, res: Response): void => {
    const { userId } = req.params as { userId: string };
    this.logger.debug('getUserById called', { userId });
    // [IMPL-DEFERRED: user-management CRUD]
    res.status(503).json({ statusCode: 503, error: 'Service Unavailable', message: 'User management CRUD deferred to Stage 5' });
  };

  // operationId: updateUser
  // ✓ ASVS:V4.1.1 — requireAuth applied at router level; all user-management routes JWT-protected
  // ✓ ASVS:V4.1.2 — requireAdmin enforced before this handler (planner-admin or tenant-admin)
  updateUser = (req: Request, res: Response): void => {
    const { userId } = req.params as { userId: string };
    this.logger.debug('updateUser called', { userId });
    // [IMPL-DEFERRED: user-management CRUD]
    res.status(503).json({ statusCode: 503, error: 'Service Unavailable', message: 'User management CRUD deferred to Stage 5' });
  };

  // operationId: deactivateUser
  // ✓ ASVS:V4.1.1 — requireAuth applied at router level; all user-management routes JWT-protected
  // ✓ ASVS:V4.1.2 — requireAdmin enforced before this handler (planner-admin or tenant-admin)
  deactivateUser = (req: Request, res: Response): void => {
    const { userId } = req.params as { userId: string };
    this.logger.debug('deactivateUser called', { userId });
    // [IMPL-DEFERRED: user-management CRUD]
    res.status(503).json({ statusCode: 503, error: 'Service Unavailable', message: 'User management CRUD deferred to Stage 5' });
  };
}
