import { adspId } from '@abgov/adsp-service-sdk';
import type { EventService, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import type { Express, Request } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { PlannerServiceRoles } from './roles';
import { Solution } from './types';
import { versionContent } from './versioning';
import { createVersionRouter } from './versionRouter';

// Verifies the roles, request validation, and error responses documented in planner.swagger.yml for the solution
// version and export endpoints, by sending requests through the version router as mounted in the service (under
// /planner/v1, after authentication and tenant resolution, with the error handler last).
describe('version router documented behaviour', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const tenant = { id: tenantId, name: 'Test', realm: 'test' };
  const documented = createDocumentedResponseRecorder(join(__dirname, 'planner.swagger.yml'));

  const SOLUTION_ID = '5f0a1c52-7d0e-4c1b-9a8e-3b6f2d1e4a70';
  const UNKNOWN_ID = '0e9d8c7b-6a5f-4e3d-8c1b-0a9f8e7d6c5b';

  const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;
  const solutionRepository = { find: jest.fn(), get: jest.fn(), save: jest.fn(), delete: jest.fn() };
  const specialistChatRepository = {
    find: jest.fn(),
    findBySolution: jest.fn(),
    get: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const solutionVersionRepository = {
    list: jest.fn(),
    get: jest.fn(),
    latest: jest.fn(),
    create: jest.fn(),
    rename: jest.fn(),
  };
  const eventService = { send: jest.fn() } as unknown as EventService;

  const tenantUser = (id: string, roles: string[]) =>
    ({ id, name: id, tenantId, isCore: false, roles }) as unknown as User;
  const owner = tenantUser('owner', [PlannerServiceRoles.User]);
  const other = tenantUser('other', [PlannerServiceRoles.User]);
  const admin = tenantUser('admin', [PlannerServiceRoles.Admin]);
  const plain = tenantUser('plain', []);
  const core = { id: 'core', name: 'core', isCore: true, roles: [PlannerServiceRoles.Admin] } as unknown as User;

  const solution: Solution = {
    id: SOLUTION_ID,
    tenantId,
    name: 'Small business grant',
    scenario: 'new',
    status: 'analyzed',
    createdById: owner.id,
    createdByName: owner.name,
    createdOn: new Date('2026-10-01T15:04:05.000Z'),
    updatedOn: new Date('2026-10-01T15:20:00.000Z'),
    version: 1,
    state: {
      problemStatement: 'Applicants apply for a small business grant.',
      concepts: [],
      decisions: [],
      questions: [],
      patternMatches: [],
      hypotheses: [],
      specialists: [],
      nextSteps: [],
    },
  };
  const version = (number: number) => ({
    number,
    name: `Version ${number}`,
    createdOn: new Date('2026-10-01T15:20:00.000Z'),
    changedSections: [],
    contentHash: 'hash',
    content: versionContent(solution, []),
  });

  function createApp(currentUser: User | null): Express {
    const app = express();
    app.use(documented.middleware);
    app.use(express.json());
    // Stands in for passport and tenantHandler as mounted in main.ts.
    app.use('/planner', (req, res, next) => {
      if (!currentUser) {
        res.status(401).send('Unauthorized');
        return;
      }
      req.user = currentUser;
      req.tenant = (!currentUser.isCore || req.query.tenantId ? tenant : undefined) as Request['tenant'];
      next();
    });
    app.use(
      '/planner/v1',
      createVersionRouter({ solutionRepository, specialistChatRepository, solutionVersionRepository, eventService }),
    );
    app.use(createErrorHandler(logger));
    return app;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    solutionRepository.get.mockImplementation(async (_tenantId, id) => (id === SOLUTION_ID ? solution : null));
    specialistChatRepository.findBySolution.mockResolvedValue([]);
    solutionVersionRepository.latest.mockResolvedValue(version(1));
    solutionVersionRepository.list.mockResolvedValue([version(1)]);
    solutionVersionRepository.get.mockImplementation(async (_tenantId, _id, number) =>
      number === 1 ? version(1) : null,
    );
    solutionVersionRepository.create.mockResolvedValue(version(2));
    solutionVersionRepository.rename.mockImplementation(async (_tenantId, _id, number, name) =>
      number === 1 ? { ...version(1), name } : null,
    );
  });

  afterEach(async () => {
    await documented.assertDocumented();
  });

  const operations: [string, string, Record<string, unknown>?][] = [
    ['get', `/planner/v1/solutions/${SOLUTION_ID}/export`],
    ['get', `/planner/v1/solutions/${SOLUTION_ID}/versions`],
    ['post', `/planner/v1/solutions/${SOLUTION_ID}/versions/checkpoint`],
    ['patch', `/planner/v1/solutions/${SOLUTION_ID}/versions/1`, { name: 'Before review' }],
    ['get', `/planner/v1/solutions/${SOLUTION_ID}/versions/1/export`],
  ];
  const send = (app: Express, method: string, path: string, body?: Record<string, unknown>) => {
    const req = (request(app) as unknown as Record<string, (path: string) => request.Test>)[method](path);
    return body ? req.send(body) : req;
  };

  describe.each(operations)('%s %s', (method, path, body) => {
    it('succeeds for the creator of the solution', async () => {
      const res = await send(createApp(owner), method, path, body);
      expect(res.status).toBe(200);
    });

    it('succeeds for a planner-admin', async () => {
      const res = await send(createApp(admin), method, path, body);
      expect(res.status).toBe(200);
    });

    it('returns 400 for an invalid solution ID', async () => {
      const res = await send(createApp(owner), method, path.replace(SOLUTION_ID, 'not-a-uuid'), body);
      expect(res.status).toBe(400);
    });

    it('returns 400 for a core user without a tenant', async () => {
      const res = await send(createApp(core), method, path, body);
      expect(res.status).toBe(400);
    });

    it('returns 401 without a bearer token', async () => {
      const res = await send(createApp(null), method, path, body);
      expect(res.status).toBe(401);
    });

    it('returns 403 for a user without a planner role', async () => {
      const res = await send(createApp(plain), method, path, body);
      expect(res.status).toBe(403);
    });

    it('returns 403 for a core user with a tenant', async () => {
      const res = await send(createApp(core), method, `${path}?tenantId=${tenantId}`, body);
      expect(res.status).toBe(403);
    });

    it('returns 403 for another user', async () => {
      const res = await send(createApp(other), method, path, body);
      expect(res.status).toBe(403);
    });

    it('returns 404 for an unknown solution', async () => {
      const res = await send(createApp(owner), method, path.replace(SOLUTION_ID, UNKNOWN_ID), body);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /planner/v1/solutions/{id}/export', () => {
    it('downloads unsaved changes as an attachment', async () => {
      solutionVersionRepository.latest.mockResolvedValueOnce(null);
      const res = await request(createApp(owner)).get(`/planner/v1/solutions/${SOLUTION_ID}/export`);
      expect(res.status).toBe(200);
      expect(res.headers['content-disposition']).toBe(`attachment; filename="planner-${SOLUTION_ID}.json"`);
      expect(res.body).toMatchObject({ id: SOLUTION_ID, unsavedChanges: true, initial: true });
    });
  });

  describe('POST /planner/v1/solutions/{id}/versions/checkpoint', () => {
    it('saves a version when the solution changed', async () => {
      solutionVersionRepository.latest.mockResolvedValueOnce(null);
      const res = await request(createApp(owner)).post(`/planner/v1/solutions/${SOLUTION_ID}/versions/checkpoint`);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ number: 2, name: 'Version 2' });
      expect(eventService.send).toHaveBeenCalled();
    });
  });

  describe('PATCH /planner/v1/solutions/{id}/versions/{number}', () => {
    const path = `/planner/v1/solutions/${SOLUTION_ID}/versions`;

    it('returns 400 for an invalid version number', async () => {
      const res = await request(createApp(owner)).patch(`${path}/0`).send({ name: 'X' });
      expect(res.status).toBe(400);
    });

    it('returns 400 without a name', async () => {
      const res = await request(createApp(owner)).patch(`${path}/1`).send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 for a name over 100 characters', async () => {
      const res = await request(createApp(owner))
        .patch(`${path}/1`)
        .send({ name: 'x'.repeat(101) });
      expect(res.status).toBe(400);
    });

    it('resets an empty name to the default', async () => {
      const res = await request(createApp(owner)).patch(`${path}/1`).send({ name: ' ' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Version 1');
    });

    it('returns 404 for an unknown version', async () => {
      const res = await request(createApp(owner)).patch(`${path}/3`).send({ name: 'X' });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /planner/v1/solutions/{id}/versions/{number}/export', () => {
    const path = `/planner/v1/solutions/${SOLUTION_ID}/versions`;

    it('downloads the version as an attachment', async () => {
      const res = await request(createApp(owner)).get(`${path}/1/export`);
      expect(res.status).toBe(200);
      expect(res.headers['content-disposition']).toBe(`attachment; filename="planner-${SOLUTION_ID}-v1.json"`);
      expect(res.body).toMatchObject({ version: 1, unsavedChanges: false, initial: true });
    });

    it('returns 400 for an invalid version number', async () => {
      const res = await request(createApp(owner)).get(`${path}/first/export`);
      expect(res.status).toBe(400);
    });

    it('returns 404 for an unknown version', async () => {
      const res = await request(createApp(owner)).get(`${path}/3/export`);
      expect(res.status).toBe(404);
    });
  });
});
