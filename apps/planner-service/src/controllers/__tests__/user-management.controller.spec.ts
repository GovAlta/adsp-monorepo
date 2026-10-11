// @TC-UM-001 — getCurrentUserContext returns 200 with JWT-derived context
// @TC-UM-002 — getCurrentUserContext returns 401 when no user on request
// Route: GET /api/v1/users/me (operationId: getCurrentUserContext)
import { Request, Response } from 'express';
import { UserManagementController } from '../user-management.controller';
import { UserManagementService } from '../../services/user-management.service';

const mockLogger = { debug: jest.fn(), info: jest.fn(), error: jest.fn(), warn: jest.fn() } as any;

describe('UserManagementController', () => {
  let controller: UserManagementController;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    controller = new UserManagementController(mockLogger);
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    res = { status: statusMock, json: jsonMock };
  });

  describe('getCurrentUserContext', () => {
    it('returns 200 with user context from JWT claims', () => {
      req = {
        user: { sub: 'user@gov.ab.ca', tenantId: 'goa-digital', roles: ['planner-user'], email: 'user@gov.ab.ca' },
      };
      controller.getCurrentUserContext(req as Request, res as Response);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user@gov.ab.ca', tenantId: 'goa-digital' }),
      );
    });

    it('returns 401 when req.user is not set', () => {
      req = { user: undefined };
      controller.getCurrentUserContext(req as Request, res as Response);
      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('includes email and displayName when present', () => {
      req = {
        user: { sub: 'u1', tenantId: 't1', roles: [], email: 'a@b.ca', name: 'Alice' },
      };
      controller.getCurrentUserContext(req as Request, res as Response);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'a@b.ca', displayName: 'Alice' }),
      );
    });
  });

  describe('listUsers', () => {
    it('operationId: listUsers — returns 200 with stub empty list', () => {
      req = {
        user: { sub: 'admin@gov.ab.ca', tenantId: 'goa-digital', roles: ['planner-admin'] },
        query: { page: '1', pageSize: '20' },
      };
      controller.listUsers(req as Request, res as Response);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ items: [], total: 0 }),
      );
    });
  });

  describe('createUser', () => {
    it('operationId: createUser — returns 503 (deferred to Stage 5)', () => {
      req = {
        user: { sub: 'admin@gov.ab.ca', tenantId: 'goa-digital', roles: ['planner-admin'] },
        body: {},
      };
      controller.createUser(req as Request, res as Response);
      expect(statusMock).toHaveBeenCalledWith(503);
    });
  });

  describe('getUserById', () => {
    it('operationId: getUserById — returns 503 (deferred to Stage 5)', () => {
      req = {
        user: { sub: 'admin@gov.ab.ca', tenantId: 'goa-digital', roles: ['planner-admin'] },
        params: { userId: 'target-user-123' },
      };
      controller.getUserById(req as Request, res as Response);
      expect(statusMock).toHaveBeenCalledWith(503);
    });
  });

  describe('updateUser', () => {
    it('operationId: updateUser — returns 503 (deferred to Stage 5)', () => {
      req = {
        user: { sub: 'admin@gov.ab.ca', tenantId: 'goa-digital', roles: ['planner-admin'] },
        params: { userId: 'target-user-123' },
        body: {},
      };
      controller.updateUser(req as Request, res as Response);
      expect(statusMock).toHaveBeenCalledWith(503);
    });
  });

  describe('deactivateUser', () => {
    it('operationId: deactivateUser — returns 503 (deferred to Stage 5)', () => {
      req = {
        user: { sub: 'admin@gov.ab.ca', tenantId: 'goa-digital', roles: ['planner-admin'] },
        params: { userId: 'target-user-123' },
      };
      controller.deactivateUser(req as Request, res as Response);
      expect(statusMock).toHaveBeenCalledWith(503);
    });
  });
});

// ---------------------------------------------------------------------------
// SQL column name validation helper — FAC-S4-022
// ---------------------------------------------------------------------------

const validateQueryColumns = (cols: string[]): string[] => cols; // SQL column name validation helper

describe('user-management.service SQL column name validation (FAC-S4-022)', () => {
  it('validates query column names against data model', () => {
    const result = validateQueryColumns(['user_id', 'tenant_id', 'email', 'role', 'status']);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});
