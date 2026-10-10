import { adspId } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { getSolution, requirePlannerUser } from './router';
import { PlannerServiceRoles } from './roles';
import { Solution } from './types';
import { solutionCreated } from './events';

const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

const makeSolution = (createdById: string): Solution => ({
  id: 'id-1',
  tenantId,
  name: 'S',
  scenario: 'new',
  status: 'draft',
  createdById,
  createdByName: 'n',
  createdOn: new Date(),
  updatedOn: new Date(),
  revision: 1,
  state: {
    problemStatement: '',
    concepts: [],
    decisions: [],
    questions: [],
    patternMatches: [],
    hypotheses: [],
    specialists: [],
    artifacts: [],
    nextSteps: [],
  },
});

const makeUser = (id: string, roles: string[]): User =>
  ({ id, name: id, tenantId, roles, isCore: false } as unknown as User);

describe('planner router handlers', () => {
  const next = jest.fn();
  const repository = { get: jest.fn(), find: jest.fn(), save: jest.fn(), delete: jest.fn() };

  beforeEach(() => {
    next.mockReset();
    repository.get.mockReset();
  });

  it('requirePlannerUser allows planner users', () => {
    const req = { tenant: { id: tenantId }, user: makeUser('u', [PlannerServiceRoles.User]) } as unknown as Request;
    requirePlannerUser(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('requirePlannerUser rejects users without planner role', () => {
    const req = { tenant: { id: tenantId }, user: makeUser('u', []) } as unknown as Request;
    requirePlannerUser(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('requirePlannerUser rejects missing tenant', () => {
    const req = { user: makeUser('u', [PlannerServiceRoles.User]) } as unknown as Request;
    requirePlannerUser(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('getSolution loads owner solution', async () => {
    repository.get.mockResolvedValueOnce(makeSolution('u'));
    const req = {
      tenant: { id: tenantId },
      params: { id: 'id-1' },
      user: makeUser('u', [PlannerServiceRoles.User]),
    } as unknown as Request;
    await getSolution(repository)(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
    expect(req['solution']).toBeTruthy();
  });

  it('getSolution rejects non-owner', async () => {
    repository.get.mockResolvedValueOnce(makeSolution('other'));
    const req = {
      tenant: { id: tenantId },
      params: { id: 'id-1' },
      user: makeUser('u', [PlannerServiceRoles.User]),
    } as unknown as Request;
    await getSolution(repository)(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(req['solution']).toBeUndefined();
  });

  it('getSolution allows admin on others', async () => {
    repository.get.mockResolvedValueOnce(makeSolution('other'));
    const req = {
      tenant: { id: tenantId },
      params: { id: 'id-1' },
      user: makeUser('a', [PlannerServiceRoles.Admin]),
    } as unknown as Request;
    await getSolution(repository)(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('getSolution 404s when missing', async () => {
    repository.get.mockResolvedValueOnce(null);
    const req = {
      tenant: { id: tenantId },
      params: { id: 'x' },
      user: makeUser('u', [PlannerServiceRoles.User]),
    } as unknown as Request;
    await getSolution(repository)(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });
});

describe('events', () => {
  it('solutionCreated carries solution context', () => {
    const event = solutionCreated(makeUser('u', []), makeSolution('u'));
    expect(event.name).toBe('solution-created');
    expect(event.context).toEqual({ solutionId: 'id-1' });
    expect(event.tenantId).toBe(tenantId);
  });
});
