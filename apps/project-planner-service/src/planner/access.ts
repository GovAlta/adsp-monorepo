import { AdspId, isAllowedUser, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Request, RequestHandler } from 'express';
import { SolutionRepository } from './repository';
import { PlannerServiceRoles } from './roles';
import { Solution } from './types';

const SOLUTION_KEY = 'solution';
const ALL_ROLES = [PlannerServiceRoles.Admin, PlannerServiceRoles.User];

export const getTenantId = (req: Request): AdspId => {
  const tenantId = req.tenant?.id;
  if (!tenantId) {
    throw new InvalidOperationError('Cannot perform planner operation without tenant context.');
  }
  return tenantId;
};

export const isPlannerAdmin = (user: User, tenantId: AdspId) =>
  isAllowedUser(user, tenantId, PlannerServiceRoles.Admin);

export const requirePlannerUser: RequestHandler = (req, _res, next) => {
  try {
    const tenantId = getTenantId(req);
    if (!isAllowedUser(req.user, tenantId, ALL_ROLES)) {
      throw new UnauthorizedUserError('access planner', req.user);
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const requirePlannerAdmin: RequestHandler = (req, _res, next) => {
  try {
    if (!isPlannerAdmin(req.user, getTenantId(req))) {
      throw new UnauthorizedUserError('manage patterns', req.user);
    }
    next();
  } catch (err) {
    next(err);
  }
};

export async function loadSolution(repository: SolutionRepository, req: Request, id: string): Promise<Solution> {
  const tenantId = getTenantId(req);
  const solution = await repository.get(tenantId, id);
  if (!solution) {
    throw new NotFoundError('solution', id);
  }
  if (solution.createdById !== req.user.id && !isPlannerAdmin(req.user, tenantId)) {
    throw new UnauthorizedUserError('access solution', req.user);
  }
  return solution;
}

export const getSolution =
  (repository: SolutionRepository): RequestHandler =>
  async (req, _res, next) => {
    try {
      req[SOLUTION_KEY] = await loadSolution(repository, req, req.params.id);
      next();
    } catch (err) {
      next(err);
    }
  };

export const loaded = (req: Request): Solution => req[SOLUTION_KEY];
