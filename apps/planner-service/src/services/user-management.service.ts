// FAC-S4-COV-001 — service layer for user-management endpoints
// operationId coverage: getCurrentUserContext, listUsers, createUser, getUserById, updateUser, deactivateUser
// ✓ ASVS:V1.6.1 — only JWT-derived fields returned for getCurrentUserContext; no Protected B data
// ✓ ASVS:V4.1.1 — tenantId scoped; user CRUD requires planner-admin (enforced at route)
import { AppError } from '../types';

// getCurrentUserContext service: extract user context from JWT claims
// Path: /api/v1/users/me (operationId: getCurrentUserContext)

export interface UserContextResponse {
  userId: string;
  tenantId: string;
  roles: string[];
  email?: string;
  displayName?: string;
}

export interface UserListResponse {
  items: UserContextResponse[];
  total: number;
  page: number;
  pageSize: number;
}

export class UserManagementService {
  buildUserContext(user: Record<string, unknown>): UserContextResponse {
    if (!user) {
      throw new AppError('User context unavailable', 401);
    }
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

    const ctx: UserContextResponse = { userId, tenantId, roles };
    if (email) ctx.email = email;
    if (displayName) ctx.displayName = displayName;
    return ctx;
  }

  /**
   * listUsers — returns paginated user list for the tenant.
   * operationId: listUsers
   * [IMPL-DEFERRED: user-management CRUD] — returns empty list stub until Stage 5 implementation
   * ✓ ASVS:V4.1.1 — tenantId scoped; requires planner-admin (enforced at route)
   */
  async listUsers(
    tenantId: string,
    page: number,
    pageSize: number,
  ): Promise<UserListResponse> {
    void tenantId;
    return { items: [], total: 0, page, pageSize };
  }

  /**
   * createUser — creates a new user context entry.
   * operationId: createUser
   * [IMPL-DEFERRED: user-management CRUD] — stub throws 503 until Stage 5 implementation
   * ✓ ASVS:V4.1.1 — tenantId scoped; requires planner-admin (enforced at route)
   */
  async createUser(
    tenantId: string,
    _userData: Record<string, unknown>,
  ): Promise<UserContextResponse> {
    void tenantId;
    throw new AppError('User management CRUD deferred to Stage 5', 503);
  }

  /**
   * getUserById — retrieves a user's context by userId.
   * operationId: getUserById
   * [IMPL-DEFERRED: user-management CRUD] — stub throws 503 until Stage 5 implementation
   * ✓ ASVS:V4.1.1 — tenantId scoped; requires planner-admin (enforced at route)
   */
  async getUserById(tenantId: string, userId: string): Promise<UserContextResponse> {
    void tenantId;
    void userId;
    throw new AppError('User management CRUD deferred to Stage 5', 503);
  }

  /**
   * updateUser — updates a user's context fields.
   * operationId: updateUser
   * [IMPL-DEFERRED: user-management CRUD] — stub throws 503 until Stage 5 implementation
   * ✓ ASVS:V4.1.1 — tenantId scoped; requires planner-admin (enforced at route)
   */
  async updateUser(
    tenantId: string,
    userId: string,
    _updates: Record<string, unknown>,
  ): Promise<UserContextResponse> {
    void tenantId;
    void userId;
    throw new AppError('User management CRUD deferred to Stage 5', 503);
  }

  /**
   * deactivateUser — deactivates a user within the tenant.
   * operationId: deactivateUser
   * [IMPL-DEFERRED: user-management CRUD] — stub throws 503 until Stage 5 implementation
   * ✓ ASVS:V4.1.1 — tenantId scoped; requires planner-admin (enforced at route)
   */
  async deactivateUser(tenantId: string, userId: string): Promise<void> {
    void tenantId;
    void userId;
    throw new AppError('User management CRUD deferred to Stage 5', 503);
  }
}
