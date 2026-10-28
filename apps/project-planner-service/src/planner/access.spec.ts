import { adspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import type { Request, Response } from 'express';
import {
  getSolution,
  getTenantId,
  isPlannerAdmin,
  loaded,
  loadSolution,
  requirePlannerAdmin,
  requirePlannerUser,
} from './access';
import { PlannerServiceRoles } from './roles';
import { Solution } from './types';

const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
const SOLUTION_ID = '5f0a1c52-7d0e-4c1b-9a8e-3b6f2d1e4a70';

const makeUser = (id: string, roles: string[]): User =>
  ({ id, name: id, tenantId, roles, isCore: false }) as unknown as User;

const owner = makeUser('owner-1', [PlannerServiceRoles.User]);
const admin = makeUser('admin-1', [PlannerServiceRoles.Admin]);
const stranger = makeUser('stranger-1', [PlannerServiceRoles.User]);
const outsider = makeUser('outsider-1', []);

const makeRequest = (user: User, withTenant = true): Request =>
  ({
    tenant: withTenant ? { id: tenantId } : undefined,
    user,
    params: { id: SOLUTION_ID },
  }) as unknown as Request;

const solution = { id: SOLUTION_ID, tenantId, createdById: 'owner-1' } as Solution;

describe('planner access', () => {
  const repository = { get: jest.fn(), find: jest.fn(), save: jest.fn(), delete: jest.fn() };
  const res = {} as Response;
  const next = jest.fn();

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getTenantId', () => {
    it('returns the request tenant id', () => {
      expect(getTenantId(makeRequest(owner))).toBe(tenantId);
    });

    it('throws when the request has no tenant', () => {
      expect(() => getTenantId(makeRequest(owner, false))).toThrow(InvalidOperationError);
    });
  });

  describe('isPlannerAdmin', () => {
    it('is true for a planner admin', () => {
      expect(isPlannerAdmin(admin, tenantId)).toBe(true);
    });

    it('is false for a planner user', () => {
      expect(isPlannerAdmin(owner, tenantId)).toBe(false);
    });
  });

  describe('requirePlannerUser', () => {
    it.each([
      ['planner user', owner],
      ['planner admin', admin],
    ])('lets a %s through', (_name, user) => {
      requirePlannerUser(makeRequest(user), res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('rejects a user without a planner role', () => {
      requirePlannerUser(makeRequest(outsider), res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('rejects a request without a tenant', () => {
      requirePlannerUser(makeRequest(owner, false), res, next);

      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });

  describe('requirePlannerAdmin', () => {
    it('lets a planner admin through', () => {
      requirePlannerAdmin(makeRequest(admin), res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('rejects a planner user', () => {
      requirePlannerAdmin(makeRequest(owner), res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('loadSolution', () => {
    beforeEach(() => {
      repository.get.mockResolvedValue(solution);
    });

    it("returns the owner's solution from the request tenant", async () => {
      await expect(loadSolution(repository, makeRequest(owner), SOLUTION_ID)).resolves.toBe(solution);
      expect(repository.get).toHaveBeenCalledWith(tenantId, SOLUTION_ID);
    });

    it("lets an admin load another user's solution", async () => {
      await expect(loadSolution(repository, makeRequest(admin), SOLUTION_ID)).resolves.toBe(solution);
    });

    it("rejects a user loading another user's solution", async () => {
      await expect(loadSolution(repository, makeRequest(stranger), SOLUTION_ID)).rejects.toThrow(UnauthorizedUserError);
    });

    it('throws not found when the solution does not exist', async () => {
      repository.get.mockResolvedValueOnce(null);

      await expect(loadSolution(repository, makeRequest(owner), SOLUTION_ID)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getSolution', () => {
    it('stores the solution for loaded() and continues', async () => {
      repository.get.mockResolvedValueOnce(solution);
      const req = makeRequest(owner);

      await getSolution(repository)(req, res, next);

      expect(loaded(req)).toBe(solution);
      expect(next).toHaveBeenCalledWith();
    });

    it('passes a load failure to next', async () => {
      repository.get.mockResolvedValueOnce(null);

      await getSolution(repository)(makeRequest(owner), res, next);

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });
});
