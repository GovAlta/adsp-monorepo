import { adspId } from '@abgov/adsp-service-sdk';
import type { AuditService, EventService, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import type { Express, Request } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { PlannerServiceRoles } from './roles';
import { createPlannerRouter } from './router';
import { Hypothesis, Solution, SpecialistChat } from './types';

// The document parsers are third-party modules; the spec only needs the router to reach them.
jest.mock('pdf-parse', () => ({
  PDFParse: class {
    getText = jest.fn().mockResolvedValue({ text: '' });
    destroy = jest.fn().mockResolvedValue(undefined);
  },
}));
jest.mock('mammoth', () => ({ extractRawText: jest.fn().mockResolvedValue({ value: '' }) }));

// Verifies the roles, request validation, and error responses documented in planner.swagger.yml by sending requests
// through the planner router as mounted in the service (authenticated, tenant resolved, then the router, then the
// error handler).
describe('planner router documented behaviour', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const tenant = { id: tenantId, name: 'Test', realm: 'test' };
  const documented = createDocumentedResponseRecorder(join(__dirname, 'planner.swagger.yml'));

  const SOLUTION_ID = '5f0a1c52-7d0e-4c1b-9a8e-3b6f2d1e4a70';
  const UNKNOWN_ID = '0e9d8c7b-6a5f-4e3d-8c1b-0a9f8e7d6c5b';
  const CHAT_ID = 'b7e2f6a1-4c3d-4e8f-9a1b-2c3d4e5f6a7b';

  const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;
  const solutionRepository = { find: jest.fn(), get: jest.fn(), save: jest.fn(), delete: jest.fn() };
  const patternRepository = { find: jest.fn(), save: jest.fn(), delete: jest.fn() };
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
  const auditService = { record: jest.fn(), query: jest.fn(), flush: jest.fn(), droppedEventCount: 0 };

  const tenantUser = (id: string, roles: string[]) =>
    ({ id, name: id, tenantId, isCore: false, roles }) as unknown as User;
  const owner = tenantUser('owner', [PlannerServiceRoles.User]);
  const other = tenantUser('other', [PlannerServiceRoles.User]);
  const admin = tenantUser('admin', [PlannerServiceRoles.Admin]);
  const plain = tenantUser('plain', []);
  const core = { id: 'core', name: 'core', isCore: true, roles: [PlannerServiceRoles.Admin] } as unknown as User;

  const hypothesis: Hypothesis = {
    id: 'h-1',
    title: 'Case management',
    patternId: 'case-management',
    confidence: 'medium',
    rationale: 'Caseworkers manage cases.',
    recommendations: [{ service: 'form-service', reason: 'Collects intake information.', order: 1 }],
    assumptions: [],
    unknowns: [],
  };

  const solution = (overrides: Partial<Solution['state']> = {}): Solution => ({
    id: SOLUTION_ID,
    tenantId,
    name: 'Small business grant',
    scenario: 'new',
    status: 'draft',
    createdById: owner.id,
    createdByName: owner.name,
    createdOn: new Date('2026-10-01T15:04:05.000Z'),
    updatedOn: new Date('2026-10-01T15:04:05.000Z'),
    version: 1,
    state: {
      problemStatement: 'Caseworkers manage cases from intake to decision.',
      concepts: [],
      decisions: [],
      questions: [],
      patternMatches: [],
      hypotheses: [],
      specialists: [],
      nextSteps: [],
      ...overrides,
    },
  });

  const chat = (overrides: Partial<SpecialistChat> = {}): SpecialistChat => ({
    id: CHAT_ID,
    tenantId,
    service: 'form-service',
    title: 'Do applicants need to sign in?',
    createdById: owner.id,
    createdByName: owner.name,
    createdOn: new Date('2026-10-01T15:04:05.000Z'),
    updatedOn: new Date('2026-10-01T15:05:00.000Z'),
    messages: [],
    ...overrides,
  });

  const pattern = {
    name: 'Grant application',
    domainLanguage: ['grant', 'funding'],
    strongSignals: [{ description: 'Applicants apply for funding', keywords: ['grant'] }],
    serviceMappings: [{ service: 'form-service', reason: 'Collects the application.' }],
  };

  function createApp(currentUser: User | null): Express {
    const app = express();
    app.use(documented.middleware);
    app.use(express.json());
    // Stands in for passport (401 without a valid token) and tenantHandler (token tenant for tenant users, the
    // tenantId query parameter for core users), as mounted in main.ts.
    app.use('/planner', (req, res, next) => {
      if (!currentUser) {
        res.status(401).send('Unauthorized');
        return;
      }
      req.user = currentUser;
      req.tenant = (!currentUser.isCore || req.query.tenantId ? tenant : undefined) as Request['tenant'];
      req.getConfiguration = jest.fn().mockResolvedValue([{}]) as Request['getConfiguration'];
      next();
    });
    app.use(
      '/planner/v1',
      createPlannerRouter({
        logger,
        solutionRepository,
        patternRepository,
        specialistChatRepository,
        solutionVersionRepository,
        eventService,
        auditService: auditService as unknown as AuditService,
      }),
    );
    app.use(createErrorHandler(logger));
    return app;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    patternRepository.find.mockResolvedValue([]);
    patternRepository.save.mockImplementation(async (_tenantId, p) => p);
    solutionRepository.get.mockImplementation(async (_tenantId, id) => (id === SOLUTION_ID ? solution() : null));
    solutionRepository.save.mockImplementation(async (s) => s);
    specialistChatRepository.find.mockResolvedValue([]);
    specialistChatRepository.findBySolution.mockResolvedValue([]);
    specialistChatRepository.get.mockImplementation(async (_tenantId, id) => (id === CHAT_ID ? chat() : null));
    specialistChatRepository.save.mockImplementation(async (c) => c);
    solutionVersionRepository.latest.mockResolvedValue(null);
    solutionVersionRepository.create.mockResolvedValue({ number: 2, name: 'Version 2', createdOn: new Date() });
  });

  afterEach(async () => {
    await documented.assertDocumented();
  });

  const userOperations: [string, string][] = [
    ['get', '/planner/v1/analysis/options'],
    ['get', '/planner/v1/patterns'],
    ['get', '/planner/v1/patterns/case-management'],
    ['post', '/planner/v1/patterns/match'],
    ['get', '/planner/v1/specialists'],
    ['post', '/planner/v1/documents/extract'],
    ['get', '/planner/v1/solutions'],
    ['post', '/planner/v1/solutions'],
    ['get', `/planner/v1/solutions/${SOLUTION_ID}`],
    ['patch', `/planner/v1/solutions/${SOLUTION_ID}`],
    ['delete', `/planner/v1/solutions/${SOLUTION_ID}`],
    ['post', `/planner/v1/solutions/${SOLUTION_ID}/analyze`],
    ['post', `/planner/v1/solutions/${SOLUTION_ID}/discovery`],
    ['post', `/planner/v1/solutions/${SOLUTION_ID}/chat`],
    ['post', `/planner/v1/solutions/${SOLUTION_ID}/blueprint`],
    ['put', `/planner/v1/solutions/${SOLUTION_ID}/components/1/review`],
    ['post', `/planner/v1/solutions/${SOLUTION_ID}/consult/form-service`],
    ['post', '/planner/v1/specialists/form-service/chat'],
    ['get', '/planner/v1/specialists/chats'],
    ['get', '/planner/v1/specialists/chats/export'],
    ['get', `/planner/v1/specialists/chats/${CHAT_ID}`],
    ['delete', `/planner/v1/specialists/chats/${CHAT_ID}`],
    ['get', `/planner/v1/specialists/chats/${CHAT_ID}/export`],
  ];
  const adminOperations: [string, string][] = [
    ['post', '/planner/v1/patterns'],
    ['put', '/planner/v1/patterns/case-management'],
    ['delete', '/planner/v1/patterns/case-management'],
  ];
  const send = (app: Express, method: string, path: string) =>
    (request(app) as unknown as Record<string, (path: string) => request.Test>)[method](path);

  describe.each([...userOperations, ...adminOperations])('%s %s', (method, path) => {
    it('returns 401 without a bearer token', async () => {
      const res = await send(createApp(null), method, path);
      expect(res.status).toBe(401);
    });

    it('returns 400 for a core user without a tenant', async () => {
      const res = await send(createApp(core), method, path);
      expect(res.status).toBe(400);
    });

    it('returns 403 for a core user with a tenant', async () => {
      const res = await send(createApp(core), method, `${path}?tenantId=${tenantId}`);
      expect(res.status).toBe(403);
    });

    it('returns 403 for a user without a planner role', async () => {
      const res = await send(createApp(plain), method, path);
      expect(res.status).toBe(403);
    });
  });

  describe.each(adminOperations)('%s %s', (method, path) => {
    it('returns 403 for a user without the planner-admin role', async () => {
      const res = await send(createApp(owner), method, path);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /planner/v1/analysis/options', () => {
    it('returns the rules mode when no model is configured', async () => {
      const res = await request(createApp(owner)).get('/planner/v1/analysis/options');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ modes: ['rules'], defaultMode: 'rules' });
    });
  });

  describe('patterns', () => {
    it('GET /planner/v1/patterns returns the catalogue', async () => {
      const res = await request(createApp(owner)).get('/planner/v1/patterns');
      expect(res.status).toBe(200);
      expect(res.body.results.length).toBeGreaterThan(0);
    });

    it('GET /planner/v1/patterns/{patternId} returns a pattern', async () => {
      const res = await request(createApp(owner)).get('/planner/v1/patterns/case-management');
      expect(res.status).toBe(200);
      expect(res.body.source).toBe('built-in');
    });

    it('GET /planner/v1/patterns/{patternId} returns 404 for an unknown pattern', async () => {
      const res = await request(createApp(owner)).get('/planner/v1/patterns/no-such-pattern');
      expect(res.status).toBe(404);
    });

    it('POST /planner/v1/patterns creates a custom pattern', async () => {
      const res = await request(createApp(admin)).post('/planner/v1/patterns').send(pattern);
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ id: 'grant-application', source: 'custom' });
    });

    it('POST /planner/v1/patterns returns 400 when the pattern already exists', async () => {
      const res = await request(createApp(admin))
        .post('/planner/v1/patterns')
        .send({ ...pattern, id: 'case-management' });
      expect(res.status).toBe(400);
    });

    it('POST /planner/v1/patterns returns 400 for an invalid pattern', async () => {
      const res = await request(createApp(admin))
        .post('/planner/v1/patterns')
        .send({ ...pattern, serviceMappings: [{ service: 'unknown-service', reason: 'x' }] });
      expect(res.status).toBe(400);
    });

    it('PUT /planner/v1/patterns/{patternId} customizes a built-in pattern', async () => {
      const res = await request(createApp(admin)).put('/planner/v1/patterns/case-management').send(pattern);
      expect(res.status).toBe(200);
      expect(res.body.source).toBe('customized');
    });

    it('PUT /planner/v1/patterns/{patternId} returns 400 for an invalid pattern ID', async () => {
      const res = await request(createApp(admin)).put('/planner/v1/patterns/Not_Valid').send(pattern);
      expect(res.status).toBe(400);
    });

    it('PUT /planner/v1/patterns/{patternId} returns 404 for an unknown pattern', async () => {
      const res = await request(createApp(admin)).put('/planner/v1/patterns/no-such-pattern').send(pattern);
      expect(res.status).toBe(404);
    });

    it('DELETE /planner/v1/patterns/{patternId} deletes a stored pattern', async () => {
      patternRepository.delete.mockResolvedValueOnce(true);
      const res = await request(createApp(admin)).delete('/planner/v1/patterns/grant-application');
      expect(res.status).toBe(204);
    });

    it('DELETE /planner/v1/patterns/{patternId} returns 400 for a built-in pattern', async () => {
      patternRepository.delete.mockResolvedValueOnce(false);
      const res = await request(createApp(admin)).delete('/planner/v1/patterns/case-management');
      expect(res.status).toBe(400);
    });

    it('DELETE /planner/v1/patterns/{patternId} returns 404 for an unknown pattern', async () => {
      patternRepository.delete.mockResolvedValueOnce(false);
      const res = await request(createApp(admin)).delete('/planner/v1/patterns/no-such-pattern');
      expect(res.status).toBe(404);
    });

    it('POST /planner/v1/patterns/match ranks matches', async () => {
      const res = await request(createApp(owner))
        .post('/planner/v1/patterns/match')
        .send({ text: 'Caseworkers manage cases from intake to decision.' });
      expect(res.status).toBe(200);
      expect(res.body.matches).toEqual(expect.any(Array));
    });

    it('POST /planner/v1/patterns/match returns 400 without text', async () => {
      const res = await request(createApp(owner)).post('/planner/v1/patterns/match').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('GET /planner/v1/specialists', () => {
    it('returns the specialists', async () => {
      const res = await request(createApp(owner)).get('/planner/v1/specialists');
      expect(res.status).toBe(200);
      expect(res.body.results).toContainEqual(expect.objectContaining({ service: 'form-service' }));
    });
  });

  describe('POST /planner/v1/documents/extract', () => {
    it('extracts the text of a Markdown file', async () => {
      const res = await request(createApp(owner))
        .post('/planner/v1/documents/extract')
        .attach('file', Buffer.from('Applicants apply online.'), 'plan.md');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ text: 'Applicants apply online.' });
    });

    it('returns 400 without a file', async () => {
      const res = await request(createApp(owner)).post('/planner/v1/documents/extract');
      expect(res.status).toBe(400);
    });

    it('returns 400 for an unsupported format', async () => {
      const res = await request(createApp(owner))
        .post('/planner/v1/documents/extract')
        .attach('file', Buffer.from('Applicants apply online.'), 'plan.txt');
      expect(res.status).toBe(400);
    });

    it('returns 400 when the file has no text', async () => {
      const res = await request(createApp(owner))
        .post('/planner/v1/documents/extract')
        .attach('file', Buffer.from('   '), 'plan.md');
      expect(res.status).toBe(400);
    });
  });

  describe('/planner/v1/solutions', () => {
    it('GET lists the caller’s solutions', async () => {
      solutionRepository.find.mockResolvedValueOnce({ results: [solution()], page: { size: 1 } });
      const res = await request(createApp(owner)).get('/planner/v1/solutions?top=5&status=draft');
      expect(res.status).toBe(200);
      expect(solutionRepository.find).toHaveBeenCalledWith(
        5,
        undefined,
        expect.objectContaining({ createdById: 'owner' }),
      );
    });

    it('GET returns 400 for an invalid top', async () => {
      const res = await request(createApp(owner)).get('/planner/v1/solutions?top=101');
      expect(res.status).toBe(400);
    });

    it('POST creates a solution', async () => {
      const res = await request(createApp(owner)).post('/planner/v1/solutions').send({ name: 'Small business grant' });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: 'Small business grant', status: 'draft', createdById: 'owner' });
    });

    it('POST returns 400 without a name', async () => {
      const res = await request(createApp(owner)).post('/planner/v1/solutions').send({ scenario: 'new' });
      expect(res.status).toBe(400);
    });
  });

  describe('/planner/v1/solutions/{id}', () => {
    it('GET returns the solution to its creator', async () => {
      const res = await request(createApp(owner)).get(`/planner/v1/solutions/${SOLUTION_ID}`);
      expect(res.status).toBe(200);
    });

    it('GET returns the solution to a planner-admin', async () => {
      const res = await request(createApp(admin)).get(`/planner/v1/solutions/${SOLUTION_ID}`);
      expect(res.status).toBe(200);
    });

    it('GET returns 400 for an invalid ID', async () => {
      const res = await request(createApp(owner)).get('/planner/v1/solutions/not-a-uuid');
      expect(res.status).toBe(400);
    });

    it('GET returns 403 to another user', async () => {
      const res = await request(createApp(other)).get(`/planner/v1/solutions/${SOLUTION_ID}`);
      expect(res.status).toBe(403);
    });

    it('GET returns 404 for an unknown solution', async () => {
      const res = await request(createApp(owner)).get(`/planner/v1/solutions/${UNKNOWN_ID}`);
      expect(res.status).toBe(404);
    });

    it('PATCH updates the solution', async () => {
      const res = await request(createApp(owner))
        .patch(`/planner/v1/solutions/${SOLUTION_ID}`)
        .send({ status: 'in-progress', decisions: [{ title: 'Sign-in', decision: 'Yes', reason: 'Drafts' }] });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('in-progress');
    });

    it('PATCH returns 400 for an invalid status', async () => {
      const res = await request(createApp(owner))
        .patch(`/planner/v1/solutions/${SOLUTION_ID}`)
        .send({ status: 'done' });
      expect(res.status).toBe(400);
    });

    it('PATCH returns 403 to another user', async () => {
      const res = await request(createApp(other)).patch(`/planner/v1/solutions/${SOLUTION_ID}`).send({ name: 'X' });
      expect(res.status).toBe(403);
    });

    it('PATCH returns 404 for an unknown solution', async () => {
      const res = await request(createApp(owner)).patch(`/planner/v1/solutions/${UNKNOWN_ID}`).send({ name: 'X' });
      expect(res.status).toBe(404);
    });

    it('DELETE deletes the solution for its creator', async () => {
      solutionRepository.delete.mockResolvedValueOnce(true);
      const res = await request(createApp(owner)).delete(`/planner/v1/solutions/${SOLUTION_ID}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ deleted: true });
    });

    it('DELETE returns 400 for an invalid ID', async () => {
      const res = await request(createApp(owner)).delete('/planner/v1/solutions/not-a-uuid');
      expect(res.status).toBe(400);
    });

    it('DELETE returns 403 to a planner-admin who did not create the solution', async () => {
      const res = await request(createApp(admin)).delete(`/planner/v1/solutions/${SOLUTION_ID}`);
      expect(res.status).toBe(403);
    });

    it('DELETE returns 404 for an unknown solution', async () => {
      const res = await request(createApp(owner)).delete(`/planner/v1/solutions/${UNKNOWN_ID}`);
      expect(res.status).toBe(404);
    });
  });

  describe('solution workflow operations', () => {
    const workflow: [string, string, Record<string, unknown>][] = [
      ['analyze', `/planner/v1/solutions/${SOLUTION_ID}/analyze`, { mode: 'rules' }],
      ['discovery', `/planner/v1/solutions/${SOLUTION_ID}/discovery`, { message: 'Caseworkers review each case.' }],
      ['chat', `/planner/v1/solutions/${SOLUTION_ID}/chat`, { message: 'Applicants can appeal.' }],
      ['consult', `/planner/v1/solutions/${SOLUTION_ID}/consult/form-service`, { question: 'Drafts?' }],
    ];

    it.each(workflow)('POST %s succeeds', async (_name, path, body) => {
      const res = await request(createApp(owner)).post(path).send(body);
      expect(res.status).toBe(200);
    });

    it.each(workflow)('POST %s returns 400 for an invalid ID', async (_name, path, body) => {
      const res = await request(createApp(owner)).post(path.replace(SOLUTION_ID, 'not-a-uuid')).send(body);
      expect(res.status).toBe(400);
    });

    it.each(workflow)('POST %s returns 403 to another user', async (_name, path, body) => {
      const res = await request(createApp(other)).post(path).send(body);
      expect(res.status).toBe(403);
    });

    it.each(workflow)('POST %s returns 404 for an unknown solution', async (_name, path, body) => {
      const res = await request(createApp(owner)).post(path.replace(SOLUTION_ID, UNKNOWN_ID)).send(body);
      expect(res.status).toBe(404);
    });

    it('POST analyze returns 400 when there is no problem statement', async () => {
      solutionRepository.get.mockResolvedValueOnce(solution({ problemStatement: '' }));
      const res = await request(createApp(owner)).post(`/planner/v1/solutions/${SOLUTION_ID}/analyze`).send({});
      expect(res.status).toBe(400);
    });

    it('POST discovery returns 400 when there is no problem statement', async () => {
      solutionRepository.get.mockResolvedValueOnce(solution({ problemStatement: ' ' }));
      const res = await request(createApp(owner)).post(`/planner/v1/solutions/${SOLUTION_ID}/discovery`).send({});
      expect(res.status).toBe(400);
    });

    it('POST chat returns 400 without a message', async () => {
      const res = await request(createApp(owner)).post(`/planner/v1/solutions/${SOLUTION_ID}/chat`).send({});
      expect(res.status).toBe(400);
    });

    it('POST consult returns 404 for an unknown specialist', async () => {
      const res = await request(createApp(owner))
        .post(`/planner/v1/solutions/${SOLUTION_ID}/consult/unknown-service`)
        .send({});
      expect(res.status).toBe(404);
    });

    it('POST consult returns 400 when the chat is full', async () => {
      const messages = Array.from({ length: 200 }, () => ({ role: 'user' as const, content: 'x', at: '' }));
      specialistChatRepository.find.mockResolvedValueOnce([chat({ solutionId: SOLUTION_ID, messages })]);
      const res = await request(createApp(owner))
        .post(`/planner/v1/solutions/${SOLUTION_ID}/consult/form-service`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /planner/v1/solutions/{id}/blueprint', () => {
    const path = `/planner/v1/solutions/${SOLUTION_ID}/blueprint`;

    it('generates the blueprint of an analyzed solution', async () => {
      solutionRepository.get.mockResolvedValueOnce(solution({ hypotheses: [hypothesis] }));
      const res = await request(createApp(owner)).post(path).send({ mode: 'rules' });
      expect(res.status).toBe(200);
      expect(res.body.state.blueprint).toBeTruthy();
    });

    it('returns 400 when the solution has not been analyzed', async () => {
      const res = await request(createApp(owner)).post(path).send({});
      expect(res.status).toBe(400);
    });

    it('returns 403 to another user', async () => {
      const res = await request(createApp(other)).post(path).send({});
      expect(res.status).toBe(403);
    });

    it('returns 404 for an unknown solution', async () => {
      const res = await request(createApp(owner)).post(path.replace(SOLUTION_ID, UNKNOWN_ID)).send({});
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /planner/v1/solutions/{id}/components/{order}/review', () => {
    const component = {
      order: 1,
      service: 'form-service',
      type: 'form definition',
      name: 'Grant application',
      purpose: 'Collects applications.',
      dependsOn: [],
      openDecisions: [],
      target: 'adsp' as const,
      setup: { where: '/admin/services/form', docs: '', how: '' },
    };
    const withBlueprint = () =>
      solution({ blueprint: { components: [component] } as unknown as Solution['state']['blueprint'] });
    const path = `/planner/v1/solutions/${SOLUTION_ID}/components/1/review`;

    it('records the review', async () => {
      solutionRepository.get.mockResolvedValueOnce(withBlueprint());
      const res = await request(createApp(owner)).put(path).send({ review: 'approved' });
      expect(res.status).toBe(200);
      expect(res.body.state.blueprint.components[0].review).toBe('approved');
    });

    it('returns 400 for an invalid review', async () => {
      const res = await request(createApp(owner)).put(path).send({ review: 'maybe' });
      expect(res.status).toBe(400);
    });

    it('returns 403 to another user', async () => {
      const res = await request(createApp(other)).put(path).send({ review: 'approved' });
      expect(res.status).toBe(403);
    });

    it('returns 404 for an unknown component', async () => {
      solutionRepository.get.mockResolvedValueOnce(withBlueprint());
      const res = await request(createApp(owner))
        .put(`/planner/v1/solutions/${SOLUTION_ID}/components/2/review`)
        .send({ review: 'approved' });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /planner/v1/specialists/{service}/chat', () => {
    const path = '/planner/v1/specialists/form-service/chat';

    it('replies and saves the exchange', async () => {
      const res = await request(createApp(owner)).post(path).send({ message: 'Do applicants need to sign in?' });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ service: 'form-service', mode: 'rules' });
    });

    it('returns 400 without a message', async () => {
      const res = await request(createApp(owner)).post(path).send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 when the chat belongs to another specialist', async () => {
      specialistChatRepository.get.mockResolvedValueOnce(chat({ service: 'file-service' }));
      const res = await request(createApp(owner)).post(path).send({ message: 'Hi', chatId: CHAT_ID });
      expect(res.status).toBe(400);
    });

    it('returns 403 for a solution of another user', async () => {
      const res = await request(createApp(other)).post(path).send({ message: 'Hi', solutionId: SOLUTION_ID });
      expect(res.status).toBe(403);
    });

    it('returns 404 for an unknown specialist', async () => {
      const res = await request(createApp(owner))
        .post('/planner/v1/specialists/unknown-service/chat')
        .send({ message: 'Hi' });
      expect(res.status).toBe(404);
    });

    it('returns 404 for a chat of another user', async () => {
      const res = await request(createApp(other)).post(path).send({ message: 'Hi', chatId: CHAT_ID });
      expect(res.status).toBe(404);
    });
  });

  describe('saved specialist chats', () => {
    it.each([['/planner/v1/specialists/chats'], ['/planner/v1/specialists/chats/export']])(
      'GET %s returns the caller’s chats',
      async (path) => {
        specialistChatRepository.find.mockResolvedValueOnce([chat()]);
        const res = await request(createApp(owner)).get(`${path}?service=form-service`);
        expect(res.status).toBe(200);
      },
    );

    it.each([['/planner/v1/specialists/chats'], ['/planner/v1/specialists/chats/export']])(
      'GET %s returns 400 for an invalid solutionId',
      async (path) => {
        const res = await request(createApp(owner)).get(`${path}?solutionId=not-a-uuid`);
        expect(res.status).toBe(400);
      },
    );

    const single: [string, string, number][] = [
      ['get', `/planner/v1/specialists/chats/${CHAT_ID}`, 200],
      ['get', `/planner/v1/specialists/chats/${CHAT_ID}/export`, 200],
      ['delete', `/planner/v1/specialists/chats/${CHAT_ID}`, 204],
    ];

    it.each(single)('%s %s succeeds for the caller’s chat', async (method, path, status) => {
      const res = await send(createApp(owner), method, path);
      expect(res.status).toBe(status);
    });

    it.each(single)('%s %s returns 400 for an invalid chat ID', async (method, path) => {
      const res = await send(createApp(owner), method, path.replace(CHAT_ID, 'not-a-uuid'));
      expect(res.status).toBe(400);
    });

    it.each(single)('%s %s returns 404 for a chat of another user', async (method, path) => {
      const res = await send(createApp(other), method, path);
      expect(res.status).toBe(404);
    });
  });
});
