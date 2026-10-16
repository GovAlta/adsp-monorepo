import { adspId } from '@abgov/adsp-service-sdk';
import type { EventService, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import * as express from 'express';
import type { Request, Response } from 'express';
import * as request from 'supertest';
import { Logger } from 'winston';
import { createPlannerRouter, getSolution, requirePlannerAdmin, requirePlannerUser } from './router';
import { PlannerServiceRoles } from './roles';
import { getSpecialist } from './specialists';
import { BusinessPattern, Solution, SpecialistChat } from './types';
import type { LlmAnalysis, LlmConsultation, PlannerLlm, SpecialistReply } from './llm';
import { solutionCreated } from './events';
import { DISCOVERY_FACTORS } from './discovery';
import { BUILT_IN_PATTERNS } from './patterns';

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

  it('requirePlannerAdmin allows planner admins', () => {
    const req = { tenant: { id: tenantId }, user: makeUser('a', [PlannerServiceRoles.Admin]) } as unknown as Request;
    requirePlannerAdmin(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('requirePlannerAdmin rejects planner users who are not admins', () => {
    const req = { tenant: { id: tenantId }, user: makeUser('u', [PlannerServiceRoles.User]) } as unknown as Request;
    requirePlannerAdmin(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('requirePlannerAdmin rejects missing tenant', () => {
    const req = { user: makeUser('a', [PlannerServiceRoles.Admin]) } as unknown as Request;
    requirePlannerAdmin(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
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

describe('planner router routes', () => {
  const SOLUTION_ID = '5f0a1c52-7d0e-4c1b-9a8e-3b6f2d1e4a70';
  const owner = makeUser('owner-1', [PlannerServiceRoles.User]);
  const admin = makeUser('admin-1', [PlannerServiceRoles.Admin]);
  const stranger = makeUser('stranger-1', [PlannerServiceRoles.User]);

  const repository = { get: jest.fn(), find: jest.fn(), save: jest.fn(), delete: jest.fn() };
  const patternRepository = { find: jest.fn(), save: jest.fn(), delete: jest.fn() };
  const chatRepository = { find: jest.fn(), get: jest.fn(), save: jest.fn(), delete: jest.fn() };
  const eventService = { send: jest.fn() };
  const logger = { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const getConfiguration = jest.fn();

  const CHAT_ID = 'b7e2f6a1-4c3d-4e8f-9a1b-2c3d4e5f6a7b';
  const storedChat = (overrides: Partial<SpecialistChat> = {}): SpecialistChat => ({
    id: CHAT_ID,
    tenantId,
    service: 'form-service',
    solutionId: undefined,
    title: 'Earlier question',
    createdById: 'owner-1',
    createdByName: 'owner-1',
    createdOn: new Date('2026-03-01T10:00:00.000Z'),
    updatedOn: new Date('2026-03-01T10:05:00.000Z'),
    messages: [
      { role: 'user', content: 'Earlier question', at: '2026-03-01T10:00:00.000Z', intent: 'ask' },
      { role: 'assistant', content: 'Earlier answer', at: '2026-03-01T10:00:01.000Z', mode: 'rules' },
    ],
    ...overrides,
  });

  const buildApp = (user: User | null = owner, withTenant = true, llm?: PlannerLlm) => {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      if (withTenant) {
        req.tenant = { id: tenantId } as unknown as Request['tenant'];
      }
      req.user = user as User;
      req.getConfiguration = getConfiguration;
      next();
    });
    app.use(
      '/planner/v1',
      createPlannerRouter({
        apiId: adspId`urn:ads:platform:project-planner-service:v1`,
        logger: logger as unknown as Logger,
        solutionRepository: repository,
        patternRepository,
        specialistChatRepository: chatRepository,
        eventService: eventService as unknown as EventService,
        llm,
      }),
    );
    app.use((err: { extra?: { statusCode?: number }; message: string }, _req, res, _next) => {
      res.status(err.extra?.statusCode || 500).send({ error: err.message });
    });
    return app;
  };

  const solutionOwnedBy = (createdById: string): Solution => ({ ...makeSolution(createdById), id: SOLUTION_ID });

  beforeEach(() => {
    repository.save.mockImplementation(async (s: Solution) => s);
    patternRepository.find.mockResolvedValue([]);
    patternRepository.save.mockImplementation(async (_tenantId: unknown, pattern: BusinessPattern) => pattern);
    getConfiguration.mockResolvedValue([undefined]);
    chatRepository.find.mockResolvedValue([]);
    chatRepository.save.mockImplementation(async (c: SpecialistChat) => c);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /patterns', () => {
    it('returns the 19 built-in patterns when no tenant configuration exists', async () => {
      const res = await request(buildApp()).get('/planner/v1/patterns');

      expect(res.status).toBe(200);
      expect(res.body.results).toHaveLength(19);
    });

    it('adds tenant-defined patterns with defaults for omitted fields', async () => {
      getConfiguration.mockResolvedValueOnce([
        {
          patterns: {
            'land-title': {
              id: 'land-title',
              name: 'Land Title',
              domainLanguage: ['parcel'],
              strongSignals: [],
              serviceMappings: [],
            },
          },
        },
      ]);

      const res = await request(buildApp()).get('/planner/v1/patterns');

      expect(res.body.results).toHaveLength(20);
      expect(res.body.results.find((p) => p.id === 'land-title').clarifyingQuestions).toEqual([]);
    });

    it('lets a tenant pattern override a built-in pattern with the same id', async () => {
      getConfiguration.mockResolvedValueOnce([
        {
          patterns: {
            'case-management': {
              id: 'case-management',
              name: 'Custom Cases',
              domainLanguage: [],
              strongSignals: [],
              serviceMappings: [],
            },
          },
        },
      ]);

      const res = await request(buildApp()).get('/planner/v1/patterns');

      expect(res.body.results.find((p) => p.id === 'case-management').name).toBe('Custom Cases');
    });

    it('returns 403 for a user without a planner role', async () => {
      const res = await request(buildApp(makeUser('nobody', []))).get('/planner/v1/patterns');

      expect(res.status).toBe(403);
    });

    it('returns 400 when there is no tenant context', async () => {
      const res = await request(buildApp(owner, false)).get('/planner/v1/patterns');

      expect(res.status).toBe(400);
    });

    it('returns 500 when configuration retrieval fails', async () => {
      getConfiguration.mockRejectedValueOnce(new Error('configuration unavailable'));

      const res = await request(buildApp()).get('/planner/v1/patterns');

      expect(res.status).toBe(500);
    });
  });

  describe('GET /patterns/:patternId', () => {
    it('returns the requested pattern', async () => {
      const res = await request(buildApp()).get('/planner/v1/patterns/case-management');

      expect(res.body.name).toBe('Case Management');
    });

    it('returns 404 for an unknown pattern', async () => {
      const res = await request(buildApp()).get('/planner/v1/patterns/unknown-pattern');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /patterns/match', () => {
    it('returns ranked matches for the supplied text', async () => {
      const res = await request(buildApp())
        .post('/planner/v1/patterns/match')
        .send({ text: 'Staff review each application, assign cases, and escalate with audit history and notes.' });

      expect(res.body.matches[0].patternId).toBe('case-management');
    });

    it('returns clarifying questions when the best match has low confidence', async () => {
      const res = await request(buildApp()).post('/planner/v1/patterns/match').send({ text: 'We handle a complaint' });

      expect(res.body.questions.length).toBeGreaterThan(0);
    });

    it('returns no questions when nothing matches', async () => {
      const res = await request(buildApp()).post('/planner/v1/patterns/match').send({ text: 'zzz' });

      expect(res.body.questions).toEqual([]);
    });

    it('returns 400 when text is missing', async () => {
      const res = await request(buildApp()).post('/planner/v1/patterns/match').send({});

      expect(res.status).toBe(400);
    });

    it('returns 500 when configuration retrieval fails', async () => {
      getConfiguration.mockRejectedValueOnce(new Error('configuration unavailable'));

      const res = await request(buildApp()).post('/planner/v1/patterns/match').send({ text: 'complaint' });

      expect(res.status).toBe(500);
    });
  });

  describe('GET /patterns/:patternId failures', () => {
    it('returns 500 when configuration retrieval fails', async () => {
      getConfiguration.mockRejectedValueOnce(new Error('configuration unavailable'));

      const res = await request(buildApp()).get('/planner/v1/patterns/case-management');

      expect(res.status).toBe(500);
    });
  });

  const landTitlePattern: BusinessPattern = {
    id: 'land-title',
    name: 'Land Title',
    description: 'Registering parcels of land.',
    domainLanguage: ['parcel', 'conveyance'],
    commonFeatures: ['title search'],
    strongSignals: [{ description: 'Titles are registered against parcels', keywords: ['parcel', 'title'] }],
    weakSignals: [],
    serviceMappings: [{ service: 'form-service', reason: 'Capture registration applications.' }],
    clarifyingQuestions: ['Who may register a title?'],
    assumptions: [],
    knownUnknowns: [],
  };
  const validBody = {
    name: 'Grant Intake',
    description: 'Applicants request funding.',
    domainLanguage: ['grant', 'funding'],
    strongSignals: [{ description: 'Applicants request money', keywords: ['grant'] }],
    serviceMappings: [{ service: 'form-service', reason: 'Collect applications.' }],
  };

  describe('pattern catalogue layering', () => {
    it('tags built-in patterns with the built-in source', async () => {
      const res = await request(buildApp()).get('/planner/v1/patterns/case-management');

      expect(res.body.source).toBe('built-in');
    });

    it('tags patterns that exist only in configuration as custom', async () => {
      getConfiguration.mockResolvedValueOnce([{ patterns: { 'land-title': landTitlePattern } }]);

      const res = await request(buildApp()).get('/planner/v1/patterns/land-title');

      expect(res.body.source).toBe('custom');
    });

    it('tags configuration overrides of built-in ids as customized', async () => {
      getConfiguration.mockResolvedValueOnce([
        { patterns: { 'case-management': { ...landTitlePattern, id: 'case-management' } } },
      ]);

      const res = await request(buildApp()).get('/planner/v1/patterns/case-management');

      expect(res.body.source).toBe('customized');
    });

    it('tags stored patterns with new ids as custom', async () => {
      patternRepository.find.mockResolvedValueOnce([landTitlePattern]);

      const res = await request(buildApp()).get('/planner/v1/patterns/land-title');

      expect(res.body.source).toBe('custom');
    });

    it('tags stored patterns that replace a built-in id as customized', async () => {
      patternRepository.find.mockResolvedValueOnce([{ ...landTitlePattern, id: 'case-management' }]);

      const res = await request(buildApp()).get('/planner/v1/patterns');

      expect(res.body.results.find((p) => p.id === 'case-management').source).toBe('customized');
    });

    it('lets stored patterns override configuration patterns with the same id', async () => {
      getConfiguration.mockResolvedValueOnce([{ patterns: { 'land-title': { ...landTitlePattern, name: 'Configured' } } }]);
      patternRepository.find.mockResolvedValueOnce([{ ...landTitlePattern, name: 'Stored' }]);

      const res = await request(buildApp()).get('/planner/v1/patterns/land-title');

      expect(res.body.name).toBe('Stored');
    });

    it('fills defaults for omitted fields on stored patterns', async () => {
      const { clarifyingQuestions: _omitted, ...partial } = landTitlePattern;
      patternRepository.find.mockResolvedValueOnce([partial as BusinessPattern]);

      const res = await request(buildApp()).get('/planner/v1/patterns/land-title');

      expect(res.body.clarifyingQuestions).toEqual([]);
    });

    it('loads stored patterns for the request tenant', async () => {
      await request(buildApp()).get('/planner/v1/patterns');

      expect(patternRepository.find).toHaveBeenCalledWith(tenantId);
    });

    it('matches text against stored tenant patterns', async () => {
      patternRepository.find.mockResolvedValueOnce([landTitlePattern]);

      const res = await request(buildApp())
        .post('/planner/v1/patterns/match')
        .send({ text: 'Each parcel needs a conveyance and a registered title.' });

      expect(res.body.matches[0].patternId).toBe('land-title');
    });

    it('returns 500 when stored patterns cannot be loaded', async () => {
      patternRepository.find.mockRejectedValueOnce(new Error('database unavailable'));

      const res = await request(buildApp()).get('/planner/v1/patterns');

      expect(res.status).toBe(500);
    });
  });

  describe('POST /patterns', () => {
    const post = (body: unknown, user: User | null = admin, withTenant = true) =>
      request(buildApp(user, withTenant)).post('/planner/v1/patterns').send(body as object);

    it('returns 403 for a planner user who is not an admin', async () => {
      const res = await post(validBody, owner);

      expect(res.status).toBe(403);
    });

    it('does not save the pattern when the user is not an admin', async () => {
      await post(validBody, owner);

      expect(patternRepository.save).not.toHaveBeenCalled();
    });

    it('returns 400 when there is no tenant context', async () => {
      const res = await post(validBody, admin, false);

      expect(res.status).toBe(400);
    });

    it('returns 201 when an admin creates a pattern', async () => {
      const res = await post(validBody);

      expect(res.status).toBe(201);
    });

    it('defaults the pattern id to a slug of the name', async () => {
      const res = await post({ ...validBody, name: '  Grant Intake & Funding! ' });

      expect(res.body.id).toBe('grant-intake-funding');
    });

    it('uses the supplied id when one is given', async () => {
      const res = await post({ ...validBody, id: 'grants-2026' });

      expect(res.body.id).toBe('grants-2026');
    });

    it('tags the created pattern as custom', async () => {
      const res = await post(validBody);

      expect(res.body.source).toBe('custom');
    });

    it('saves the pattern for the tenant with the creating user', async () => {
      await post(validBody);

      expect(patternRepository.save).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({ id: 'grant-intake' }),
        admin,
      );
    });

    it('stores only known fields, trimmed, with defaults for optional arrays', async () => {
      await post({ ...validBody, name: '  Grant Intake  ', isAdmin: true, source: 'built-in' });

      expect(patternRepository.save).toHaveBeenCalledWith(
        tenantId,
        {
          id: 'grant-intake',
          name: 'Grant Intake',
          description: 'Applicants request funding.',
          domainLanguage: ['grant', 'funding'],
          commonFeatures: [],
          strongSignals: [{ description: 'Applicants request money', keywords: ['grant'] }],
          weakSignals: [],
          serviceMappings: [{ service: 'form-service', reason: 'Collect applications.' }],
          clarifyingQuestions: [],
          assumptions: [],
          knownUnknowns: [],
        },
        admin,
      );
    });

    it('drops blank list entries and signals without keywords when sanitizing', async () => {
      await post({
        ...validBody,
        domainLanguage: ['grant', '   ', 7],
        strongSignals: [
          { description: 'Applicants request money', keywords: ['grant'] },
          { description: 'Weak entry', keywords: [' '] },
        ],
      });

      expect(patternRepository.save).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({
          domainLanguage: ['grant'],
          strongSignals: [{ description: 'Applicants request money', keywords: ['grant'] }],
        }),
        admin,
      );
    });

    it('returns 400 when the name cannot produce a valid id', async () => {
      const res = await post({ ...validBody, name: '!!' });

      expect(res.status).toBe(400);
    });

    it('does not save when the name cannot produce a valid id', async () => {
      await post({ ...validBody, name: '!!' });

      expect(patternRepository.save).not.toHaveBeenCalled();
    });

    it('returns 400 when the pattern id already exists as a built-in', async () => {
      const res = await post({ ...validBody, id: 'case-management' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when the pattern id already exists as a stored pattern', async () => {
      patternRepository.find.mockResolvedValueOnce([landTitlePattern]);

      const res = await post({ ...validBody, id: 'land-title' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when the slugged name collides with an existing pattern', async () => {
      const res = await post({ ...validBody, name: 'Case Management' });

      expect(res.status).toBe(400);
    });

    it('does not save a duplicate pattern', async () => {
      await post({ ...validBody, id: 'case-management' });

      expect(patternRepository.save).not.toHaveBeenCalled();
    });

    it('returns 400 for an explicit id that is malformed', async () => {
      const res = await post({ ...validBody, id: 'Not Valid' });

      expect(res.status).toBe(400);
    });

    it('returns 500 when saving fails', async () => {
      patternRepository.save.mockRejectedValueOnce(new Error('database unavailable'));

      const res = await post(validBody);

      expect(res.status).toBe(500);
    });

    const { name: _name, ...withoutName } = validBody;
    const { domainLanguage: _domainLanguage, ...withoutDomainLanguage } = validBody;
    const { strongSignals: _strongSignals, ...withoutStrongSignals } = validBody;
    const { serviceMappings: _serviceMappings, ...withoutServiceMappings } = validBody;
    test.each([
      ['name is missing', withoutName],
      ['name is blank', { ...validBody, name: '   ' }],
      ['name exceeds 100 characters', { ...validBody, name: 'n'.repeat(101) }],
      ['description is not a string', { ...validBody, description: 42 }],
      ['domainLanguage is missing', withoutDomainLanguage],
      ['domainLanguage is empty', { ...validBody, domainLanguage: [] }],
      ['strongSignals is missing', withoutStrongSignals],
      ['strongSignals is empty', { ...validBody, strongSignals: [] }],
      ['a strong signal has no description', { ...validBody, strongSignals: [{ keywords: ['grant'] }] }],
      ['a strong signal has no keywords', { ...validBody, strongSignals: [{ description: 'Money', keywords: [] }] }],
      ['a weak signal has no keywords', { ...validBody, weakSignals: [{ description: 'Money', keywords: [] }] }],
      ['serviceMappings is missing', withoutServiceMappings],
      ['serviceMappings is empty', { ...validBody, serviceMappings: [] }],
      [
        'a service mapping names an unknown service',
        { ...validBody, serviceMappings: [{ service: 'teleport-service', reason: 'Not real.' }] },
      ],
      [
        'a service mapping has no reason',
        { ...validBody, serviceMappings: [{ service: 'form-service', reason: ' ' }] },
      ],
      ['commonFeatures is not an array', { ...validBody, commonFeatures: 'title search' }],
    ])('returns 400 when %s', async (_case, body) => {
      const res = await post(body);

      expect(res.status).toBe(400);
    });

    it('does not save a pattern that fails validation', async () => {
      await post({ ...validBody, serviceMappings: [{ service: 'teleport-service', reason: 'Not real.' }] });

      expect(patternRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('PUT /patterns/:patternId', () => {
    const put = (patternId: string, body: unknown = validBody, user: User | null = admin) =>
      request(buildApp(user)).put(`/planner/v1/patterns/${patternId}`).send(body as object);

    it('returns 403 for a planner user who is not an admin', async () => {
      const res = await put('case-management', validBody, owner);

      expect(res.status).toBe(403);
    });

    it('saves a tenant copy of a built-in pattern', async () => {
      await put('case-management');

      expect(patternRepository.save).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({ id: 'case-management', name: 'Grant Intake' }),
        admin,
      );
    });

    it('tags an updated built-in pattern as customized', async () => {
      const res = await put('case-management');

      expect(res.body.source).toBe('customized');
    });

    it('returns 200 when updating a built-in pattern', async () => {
      const res = await put('case-management');

      expect(res.status).toBe(200);
    });

    it('tags an updated custom pattern as custom', async () => {
      patternRepository.find.mockResolvedValueOnce([landTitlePattern]);

      const res = await put('land-title');

      expect(res.body.source).toBe('custom');
    });

    it('keeps the path id when the body supplies a different id', async () => {
      patternRepository.find.mockResolvedValueOnce([landTitlePattern]);

      const res = await put('land-title', { ...validBody, id: 'other-id' });

      expect(res.body.id).toBe('land-title');
    });

    it('updates patterns that only exist in configuration', async () => {
      getConfiguration.mockResolvedValueOnce([{ patterns: { 'land-title': landTitlePattern } }]);

      const res = await put('land-title');

      expect(res.status).toBe(200);
    });

    it('returns 404 for an unknown pattern', async () => {
      const res = await put('unknown-pattern');

      expect(res.status).toBe(404);
    });

    it('does not save when the pattern is unknown', async () => {
      await put('unknown-pattern');

      expect(patternRepository.save).not.toHaveBeenCalled();
    });

    it('returns 400 when the body fails validation', async () => {
      const res = await put('case-management', { ...validBody, domainLanguage: [] });

      expect(res.status).toBe(400);
    });

    it('returns 400 when a service mapping names an unknown service', async () => {
      const res = await put('case-management', {
        ...validBody,
        serviceMappings: [{ service: 'teleport-service', reason: 'Not real.' }],
      });

      expect(res.status).toBe(400);
    });

    it('returns 400 when the path id is malformed', async () => {
      const res = await put('X', validBody);

      expect(res.status).toBe(400);
    });

    it('returns 500 when saving fails', async () => {
      patternRepository.save.mockRejectedValueOnce(new Error('database unavailable'));

      const res = await put('case-management');

      expect(res.status).toBe(500);
    });
  });

  describe('DELETE /patterns/:patternId', () => {
    const del = (patternId: string, user: User | null = admin) =>
      request(buildApp(user)).delete(`/planner/v1/patterns/${patternId}`);

    it('returns 403 for a planner user who is not an admin', async () => {
      const res = await del('land-title', owner);

      expect(res.status).toBe(403);
    });

    it('returns 204 when a stored custom pattern is deleted', async () => {
      patternRepository.delete.mockResolvedValueOnce(true);

      const res = await del('land-title');

      expect(res.status).toBe(204);
    });

    it('deletes the stored pattern for the tenant', async () => {
      patternRepository.delete.mockResolvedValueOnce(true);

      await del('land-title');

      expect(patternRepository.delete).toHaveBeenCalledWith(tenantId, 'land-title');
    });

    it('returns 204 when deleting a customized built-in pattern to restore the built-in', async () => {
      patternRepository.delete.mockResolvedValueOnce(true);

      const res = await del('case-management');

      expect(res.status).toBe(204);
    });

    it('restores the built-in pattern after its customization is deleted', async () => {
      patternRepository.delete.mockResolvedValueOnce(true);
      patternRepository.find.mockResolvedValueOnce([]);
      await del('case-management');

      const res = await request(buildApp()).get('/planner/v1/patterns/case-management');

      expect(res.body.source).toBe('built-in');
    });

    it('returns 400 when deleting a built-in pattern with no stored override', async () => {
      patternRepository.delete.mockResolvedValueOnce(false);

      const res = await del('case-management');

      expect(res.status).toBe(400);
    });

    it('returns 400 when deleting a configured pattern with no stored override', async () => {
      patternRepository.delete.mockResolvedValueOnce(false);
      getConfiguration.mockResolvedValueOnce([{ patterns: { 'land-title': landTitlePattern } }]);

      const res = await del('land-title');

      expect(res.status).toBe(400);
    });

    it('returns 404 for an unknown pattern', async () => {
      patternRepository.delete.mockResolvedValueOnce(false);

      const res = await del('unknown-pattern');

      expect(res.status).toBe(404);
    });

    it('returns 500 when deletion fails', async () => {
      patternRepository.delete.mockRejectedValueOnce(new Error('database unavailable'));

      const res = await del('land-title');

      expect(res.status).toBe(500);
    });
  });

  describe('GET /specialists', () => {
    it('returns the specialist catalog', async () => {
      const res = await request(buildApp()).get('/planner/v1/specialists');

      expect(res.body.results).toHaveLength(13);
    });
  });

  describe('GET /solutions', () => {
    const emptyPage = { results: [], page: { size: 0 } };

    it('scopes a regular user to their own solutions', async () => {
      repository.find.mockResolvedValueOnce(emptyPage);

      await request(buildApp(owner)).get('/planner/v1/solutions');

      expect(repository.find).toHaveBeenCalledWith(10, undefined, {
        tenantId,
        status: undefined,
        createdById: 'owner-1',
      });
    });

    it('does not scope an admin to a creator', async () => {
      repository.find.mockResolvedValueOnce(emptyPage);

      await request(buildApp(admin)).get('/planner/v1/solutions');

      expect(repository.find).toHaveBeenCalledWith(10, undefined, {
        tenantId,
        status: undefined,
        createdById: undefined,
      });
    });

    it('passes top, after and status query parameters to the repository', async () => {
      repository.find.mockResolvedValueOnce(emptyPage);

      await request(buildApp(admin)).get('/planner/v1/solutions?top=25&after=MQ&status=analyzed');

      expect(repository.find).toHaveBeenCalledWith(25, 'MQ', {
        tenantId,
        status: 'analyzed',
        createdById: undefined,
      });
    });

    it('returns the repository page', async () => {
      repository.find.mockResolvedValueOnce({ results: [{ id: 'x' }], page: { size: 1 } });

      const res = await request(buildApp(admin)).get('/planner/v1/solutions');

      expect(res.body.page.size).toBe(1);
    });

    it.each([['top=0'], ['top=101'], ['status=bogus']])('returns 400 for invalid query %s', async (qs) => {
      const res = await request(buildApp()).get(`/planner/v1/solutions?${qs}`);

      expect(res.status).toBe(400);
    });

    it('returns 500 when the repository fails', async () => {
      repository.find.mockRejectedValueOnce(new Error('db down'));

      const res = await request(buildApp()).get('/planner/v1/solutions');

      expect(res.status).toBe(500);
    });
  });

  describe('POST /solutions', () => {
    it('creates a draft solution owned by the caller', async () => {
      const res = await request(buildApp(owner))
        .post('/planner/v1/solutions')
        .send({ name: 'Permit intake', problemStatement: 'Applicants submit permit forms.' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        name: 'Permit intake',
        status: 'draft',
        scenario: 'new',
        createdById: 'owner-1',
        revision: 1,
      });
    });

    it('stores the problem statement in the initial state', async () => {
      const res = await request(buildApp(owner))
        .post('/planner/v1/solutions')
        .send({ name: 'Permit intake', problemStatement: 'Applicants submit permit forms.' });

      expect(res.body.state.problemStatement).toBe('Applicants submit permit forms.');
    });

    it('uses the supplied scenario', async () => {
      const res = await request(buildApp(owner))
        .post('/planner/v1/solutions')
        .send({ name: 'Legacy replacement', scenario: 'existing-app' });

      expect(res.body.scenario).toBe('existing-app');
    });

    it('sends a solution-created event', async () => {
      await request(buildApp(owner)).post('/planner/v1/solutions').send({ name: 'Permit intake' });

      expect(eventService.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'solution-created' }));
    });

    it('logs the creation', async () => {
      await request(buildApp(owner)).post('/planner/v1/solutions').send({ name: 'Permit intake' });

      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Permit intake'), expect.any(Object));
    });

    it.each([
      ['missing name', {}],
      ['empty name', { name: '' }],
      ['unknown scenario', { name: 'Permit intake', scenario: 'bogus' }],
      ['non-string problem statement', { name: 'Permit intake', problemStatement: 5 }],
    ])('returns 400 for %s', async (_label, body) => {
      const res = await request(buildApp(owner)).post('/planner/v1/solutions').send(body);

      expect(res.status).toBe(400);
    });

    it('does not send an event when saving fails', async () => {
      repository.save.mockRejectedValueOnce(new Error('db down'));

      await request(buildApp(owner)).post('/planner/v1/solutions').send({ name: 'Permit intake' });

      expect(eventService.send).not.toHaveBeenCalled();
    });
  });

  describe('GET /solutions/:id', () => {
    it('returns the solution to its owner', async () => {
      repository.get.mockResolvedValueOnce(solutionOwnedBy('owner-1'));

      const res = await request(buildApp(owner)).get(`/planner/v1/solutions/${SOLUTION_ID}`);

      expect(res.body.id).toBe(SOLUTION_ID);
    });

    it('returns the solution to an admin who is not the owner', async () => {
      repository.get.mockResolvedValueOnce(solutionOwnedBy('owner-1'));

      const res = await request(buildApp(admin)).get(`/planner/v1/solutions/${SOLUTION_ID}`);

      expect(res.status).toBe(200);
    });

    it('returns 403 to a non-owner without admin role', async () => {
      repository.get.mockResolvedValueOnce(solutionOwnedBy('owner-1'));

      const res = await request(buildApp(stranger)).get(`/planner/v1/solutions/${SOLUTION_ID}`);

      expect(res.status).toBe(403);
    });

    it('returns 404 when the solution does not exist', async () => {
      repository.get.mockResolvedValueOnce(null);

      const res = await request(buildApp(owner)).get(`/planner/v1/solutions/${SOLUTION_ID}`);

      expect(res.status).toBe(404);
    });

    it('returns 400 when the id is not a UUID', async () => {
      const res = await request(buildApp(owner)).get('/planner/v1/solutions/not-a-uuid');

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /solutions/:id', () => {
    const patch = (body: object, user: User = owner) =>
      request(buildApp(user)).patch(`/planner/v1/solutions/${SOLUTION_ID}`).send(body);

    beforeEach(() => {
      repository.get.mockResolvedValue(solutionOwnedBy('owner-1'));
    });

    it('updates name, description and status', async () => {
      const res = await patch({ name: 'Renamed', description: 'Updated', status: 'in-progress' });

      expect(res.body).toMatchObject({ name: 'Renamed', description: 'Updated', status: 'in-progress' });
    });

    it('increments the revision', async () => {
      const res = await patch({ name: 'Renamed' });

      expect(res.body.revision).toBe(2);
    });

    it('keeps existing values for omitted fields', async () => {
      const res = await patch({ description: 'Only description' });

      expect(res.body.name).toBe('S');
    });

    it('updates the problem statement', async () => {
      const res = await patch({ problemStatement: 'Inspectors record findings.' });

      expect(res.body.state.problemStatement).toBe('Inspectors record findings.');
    });

    it('recomputes confidence when the problem statement changes', async () => {
      const res = await patch({
        problemStatement:
          'Applicants submit permits. Staff review and approve applications. Notifications are sent on decisions.',
      });

      expect(res.body.state.confidence.score).toBeGreaterThan(0);
    });

    it('does not recompute confidence when the problem statement is unchanged', async () => {
      const res = await patch({ name: 'Renamed' });

      expect(res.body.state.confidence).toBeUndefined();
    });

    it('refreshes stale discovery factors when the problem statement changes', async () => {
      repository.get.mockResolvedValue({
        ...solutionOwnedBy('owner-1'),
        state: {
          ...solutionOwnedBy('owner-1').state,
          discovery: {
            messages: [],
            confidence: 0,
            threshold: 50,
            factors: [{ id: 'problem', label: 'Problem and goals', score: 0, note: 'Not described yet.' }],
            ready: false,
            mode: 'rules',
            updatedOn: '2026-01-01T00:00:00Z',
          },
        },
      });

      const res = await patch({
        problemStatement:
          'Applicants submit permits. Staff review and approve applications. Notifications are sent on decisions.',
      });

      expect(res.body.state.discovery.factors[0].score).toBeGreaterThan(0);
      expect(res.body.state.confidence.score).toBeGreaterThan(0);
    });

    it('assigns an id and user source to concepts that lack them', async () => {
      const res = await patch({ concepts: [{ type: 'actor', name: 'inspector' }] });

      expect(res.body.state.concepts[0]).toMatchObject({
        type: 'actor',
        name: 'inspector',
        source: 'user',
        id: expect.any(String),
      });
    });

    it('preserves supplied concept id and source', async () => {
      const res = await patch({ concepts: [{ id: 'c-1', type: 'actor', name: 'inspector', source: 'pattern' }] });

      expect(res.body.state.concepts[0]).toMatchObject({ id: 'c-1', source: 'pattern' });
    });

    it('defaults decision id, date and decider', async () => {
      const res = await patch({ decisions: [{ title: 'Auth', decision: 'Use Alberta.ca account', reason: 'Citizens' }] });

      expect(res.body.state.decisions[0]).toMatchObject({
        id: expect.any(String),
        decidedOn: expect.any(String),
        decidedBy: 'owner-1',
      });
    });

    it('preserves supplied decision metadata', async () => {
      const res = await patch({
        decisions: [{ id: 'd-1', title: 'Auth', decision: 'x', reason: 'y', decidedOn: '2026-01-01', decidedBy: 'pm' }],
      });

      expect(res.body.state.decisions[0]).toMatchObject({ id: 'd-1', decidedOn: '2026-01-01', decidedBy: 'pm' });
    });

    it('defaults question status and raisedBy', async () => {
      const res = await patch({ questions: [{ question: 'Is review required?' }] });

      expect(res.body.state.questions[0]).toMatchObject({ status: 'open', raisedBy: 'user', id: expect.any(String) });
    });

    it('preserves supplied question status', async () => {
      const res = await patch({
        questions: [{ id: 'q-1', question: 'Is review required?', status: 'answered', raisedBy: 'planner' }],
      });

      expect(res.body.state.questions[0]).toMatchObject({ id: 'q-1', status: 'answered', raisedBy: 'planner' });
    });

    it('sends a solution-updated event with the update operation', async () => {
      await patch({ name: 'Renamed' });

      expect(eventService.send).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'solution-updated', payload: expect.objectContaining({ operation: 'update' }) }),
      );
    });

    it('allows an admin to update another user solution', async () => {
      const res = await patch({ name: 'Renamed' }, admin);

      expect(res.status).toBe(200);
    });

    it('returns 403 for a non-owner without admin role', async () => {
      const res = await patch({ name: 'Renamed' }, stranger);

      expect(res.status).toBe(403);
    });

    it.each([
      ['unknown status', { status: 'bogus' }],
      ['empty name', { name: '' }],
      ['non-array concepts', { concepts: 'actor' }],
      ['unknown concept type', { concepts: [{ type: 'bogus', name: 'x' }] }],
      ['empty concept name', { concepts: [{ type: 'actor', name: '' }] }],
      ['non-array decisions', { decisions: 'x' }],
      ['non-array questions', { questions: 'x' }],
    ])('returns 400 for %s', async (_label, body) => {
      const res = await patch(body);

      expect(res.status).toBe(400);
    });

    it('returns 400 when the revision conflicts', async () => {
      repository.save.mockRejectedValueOnce(new InvalidOperationError('Solution was modified by another request'));

      const res = await patch({ name: 'Renamed' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /solutions/:id', () => {
    const remove = (user: User = owner) => request(buildApp(user)).delete(`/planner/v1/solutions/${SOLUTION_ID}`);

    beforeEach(() => {
      repository.get.mockResolvedValue(solutionOwnedBy('owner-1'));
    });

    it('reports deleted true when the repository deleted the solution', async () => {
      repository.delete.mockResolvedValueOnce(true);

      const res = await remove();

      expect(res.body).toEqual({ deleted: true });
    });

    it('sends a solution-deleted event when deleted', async () => {
      repository.delete.mockResolvedValueOnce(true);

      await remove();

      expect(eventService.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'solution-deleted' }));
    });

    it('does not send an event when nothing was deleted', async () => {
      repository.delete.mockResolvedValueOnce(false);

      await remove();

      expect(eventService.send).not.toHaveBeenCalled();
    });

    it('allows an admin to delete another user solution', async () => {
      repository.delete.mockResolvedValueOnce(true);

      const res = await remove(admin);

      expect(res.status).toBe(200);
    });

    it('returns 403 for a non-owner without admin role', async () => {
      const res = await remove(stranger);

      expect(res.status).toBe(403);
    });

    it('returns 500 when the repository fails', async () => {
      repository.delete.mockRejectedValueOnce(new Error('db down'));

      const res = await remove();

      expect(res.status).toBe(500);
    });
  });

  describe('POST /solutions/:id/analyze', () => {
    const analyze = (body: object = {}, user: User = owner) =>
      request(buildApp(user)).post(`/planner/v1/solutions/${SOLUTION_ID}/analyze`).send(body);
    const caseText =
      'Staff review each application, assign cases, add notes and attachments, and escalate. Status moves through stages with audit history.';

    beforeEach(() => {
      repository.get.mockResolvedValue(solutionOwnedBy('owner-1'));
    });

    it('moves a draft solution to analyzed', async () => {
      const res = await analyze({ text: caseText });

      expect(res.body.status).toBe('analyzed');
    });

    it('records pattern matches from the supplied text', async () => {
      const res = await analyze({ text: caseText });

      expect(res.body.state.patternMatches[0].patternId).toBe('case-management');
    });

    it('builds hypotheses with service recommendations', async () => {
      const res = await analyze({ text: caseText });

      expect(res.body.state.hypotheses[0].recommendations.length).toBeGreaterThan(0);
    });

    it('adds extracted concepts', async () => {
      const res = await analyze({ text: caseText });

      expect(res.body.state.concepts.length).toBeGreaterThan(0);
    });

    it('computes next steps', async () => {
      const res = await analyze({ text: caseText });

      expect(res.body.state.nextSteps.length).toBeGreaterThan(0);
    });

    it('stores the analyzed text as the problem statement', async () => {
      const res = await analyze({ text: caseText });

      expect(res.body.state.problemStatement).toBe(caseText);
    });

    it('uses the stored problem statement when no text is supplied', async () => {
      const stored = solutionOwnedBy('owner-1');
      stored.state.problemStatement = 'We handle a complaint';
      repository.get.mockResolvedValueOnce(stored);

      const res = await analyze();

      expect(res.body.state.patternMatches[0].patternId).toBe('complaint-intake');
    });

    it('raises clarifying questions for non-high confidence hypotheses', async () => {
      const res = await analyze({ text: 'We handle a complaint' });

      expect(res.body.state.questions.every((q) => q.raisedBy === 'planner' && q.status === 'open')).toBe(true);
    });

    it('does not duplicate questions that already exist', async () => {
      const first = await analyze({ text: 'We handle a complaint' });
      const existing = solutionOwnedBy('owner-1');
      existing.state.questions = first.body.state.questions;
      repository.get.mockResolvedValueOnce(existing);

      const second = await analyze({ text: 'We handle a complaint' });

      expect(second.body.state.questions).toHaveLength(first.body.state.questions.length);
    });

    it('keeps the status of a solution that is already past draft', async () => {
      repository.get.mockResolvedValueOnce({ ...solutionOwnedBy('owner-1'), status: 'in-progress' });

      const res = await analyze({ text: caseText });

      expect(res.body.status).toBe('in-progress');
    });

    it('refreshes stale discovery confidence instead of keeping the old score', async () => {
      repository.get.mockResolvedValueOnce({
        ...solutionOwnedBy('owner-1'),
        state: {
          ...solutionOwnedBy('owner-1').state,
          discovery: {
            messages: [],
            confidence: 0,
            threshold: 50,
            factors: [{ id: 'problem', label: 'Problem and goals', score: 0, note: 'Not described yet.' }],
            ready: false,
            mode: 'rules',
            updatedOn: '2026-01-01T00:00:00Z',
          },
        },
      });

      const res = await analyze({ text: caseText });

      expect(res.body.state.discovery.factors[0].score).toBeGreaterThan(0);
      expect(res.body.state.confidence.score).toBeGreaterThan(0);
    });

    it('sends a solution-updated event with the analyze operation', async () => {
      await analyze({ text: caseText });

      expect(eventService.send).toHaveBeenCalledWith(
        expect.objectContaining({ payload: expect.objectContaining({ operation: 'analyze' }) }),
      );
    });

    it('returns 400 when there is no text and no problem statement', async () => {
      const res = await analyze();

      expect(res.status).toBe(400);
    });

    it('returns 400 when text is not a string', async () => {
      const res = await analyze({ text: 42 });

      expect(res.status).toBe(400);
    });

    it('returns 403 for a non-owner without admin role', async () => {
      const res = await analyze({ text: caseText }, stranger);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /solutions/:id/consult/:service', () => {
    const consult = (service: string) =>
      request(buildApp(owner)).post(`/planner/v1/solutions/${SOLUTION_ID}/consult/${service}`);

    beforeEach(() => {
      repository.get.mockResolvedValue(solutionOwnedBy('owner-1'));
    });

    it('returns the consultation result for the specialist', async () => {
      const res = await consult('form');

      expect(res.body).toMatchObject({ service: 'form-service', fit: 'optional' });
    });

    it('records the specialist as consulted', async () => {
      await consult('form-service');

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          state: expect.objectContaining({
            specialists: [expect.objectContaining({ service: 'form-service', status: 'consulted' })],
          }),
        }),
      );
    });

    it('keeps the existing progress status of a previously handed-off specialist', async () => {
      const stored = solutionOwnedBy('owner-1');
      stored.state.specialists = [{ service: 'form-service', status: 'completed', updatedOn: '2026-01-01' }];
      repository.get.mockResolvedValueOnce(stored);

      await consult('form-service');

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          state: expect.objectContaining({
            specialists: [expect.objectContaining({ service: 'form-service', status: 'completed' })],
          }),
        }),
      );
    });

    it('sends a solution-updated event with the consult operation', async () => {
      await consult('form');

      expect(eventService.send).toHaveBeenCalledWith(
        expect.objectContaining({ payload: expect.objectContaining({ operation: 'consult' }) }),
      );
    });

    it('returns 404 for an unknown specialist', async () => {
      const res = await consult('unknown');

      expect(res.status).toBe(404);
    });

    describe('chat recording', () => {
      const consultWith = (body: object = {}, user: User = owner) =>
        request(buildApp(user)).post(`/planner/v1/solutions/${SOLUTION_ID}/consult/form-service`).send(body);
      const savedChat = (): SpecialistChat => chatRepository.save.mock.calls[0][0];

      it("looks for the user's existing chat for the specialist and solution", async () => {
        await consultWith();

        expect(chatRepository.find).toHaveBeenCalledWith({
          tenantId,
          createdById: 'owner-1',
          service: 'form-service',
          solutionId: SOLUTION_ID,
        });
      });

      it('creates a new chat for the consulting user when none exists', async () => {
        await consultWith();

        expect(savedChat()).toMatchObject({
          tenantId,
          service: 'form-service',
          solutionId: SOLUTION_ID,
          createdById: 'owner-1',
          createdByName: 'owner-1',
        });
      });

      it('assigns a uuid to a new chat', async () => {
        await consultWith();

        expect(savedChat().id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      });

      it('titles a new chat with the default question when none is given', async () => {
        await consultWith();

        expect(savedChat().title).toBe('Consult on this solution');
      });

      it('titles a new chat with the question', async () => {
        await consultWith({ question: 'Can applicants save drafts?' });

        expect(savedChat().title).toBe('Can applicants save drafts?');
      });

      it('truncates the title of a new chat to 100 characters', async () => {
        await consultWith({ question: 'q'.repeat(150) });

        expect(savedChat().title).toHaveLength(100);
      });

      it('records the default question as the user message when none is given', async () => {
        await consultWith();

        expect(savedChat().messages[0]).toMatchObject({
          role: 'user',
          content: 'Consult on this solution',
          intent: 'consult',
        });
      });

      it('records the question as the user message', async () => {
        await consultWith({ question: 'Can applicants save drafts?' });

        expect(savedChat().messages[0].content).toBe('Can applicants save drafts?');
      });

      it('appends the proposal to the user message', async () => {
        await consultWith({ question: 'Is this sound?', proposal: 'Use one intake form with draft saving.' });

        expect(savedChat().messages[0].content).toBe(
          'Is this sound?\n\nPlan to validate:\nUse one intake form with draft saving.',
        );
      });

      it('appends the proposal to the default question when only a proposal is given', async () => {
        await consultWith({ proposal: 'Use one intake form with draft saving.' });

        expect(savedChat().messages[0].content).toBe(
          'Consult on this solution\n\nPlan to validate:\nUse one intake form with draft saving.',
        );
      });

      it('records the rule-based reason as the assistant message in rules mode', async () => {
        const res = await consultWith();

        expect(savedChat().messages[1]).toMatchObject({
          role: 'assistant',
          content: res.body.reason,
          intent: 'consult',
          mode: 'rules',
        });
      });

      it('records the consultation result on the assistant message', async () => {
        const res = await consultWith();

        expect(JSON.parse(JSON.stringify(savedChat().messages[1].consult))).toEqual(res.body);
      });

      it('records exactly the user and assistant messages for a new chat', async () => {
        await consultWith();

        expect(savedChat().messages).toHaveLength(2);
      });

      it('appends the exchange to the existing chat instead of creating another', async () => {
        const existing = storedChat({ solutionId: SOLUTION_ID });
        chatRepository.find.mockResolvedValueOnce([existing]);

        await consultWith({ question: 'Anything else?' });

        expect(savedChat()).toMatchObject({ id: CHAT_ID, title: 'Earlier question' });
      });

      it('keeps earlier messages when appending to an existing chat', async () => {
        const existing = storedChat({ solutionId: SOLUTION_ID });
        chatRepository.find.mockResolvedValueOnce([existing]);

        await consultWith({ question: 'Anything else?' });

        expect(savedChat().messages.map((m) => m.content)).toEqual([
          'Earlier question',
          'Earlier answer',
          'Anything else?',
          expect.any(String),
        ]);
      });

      it('returns the consultation result unchanged', async () => {
        const res = await consultWith();

        expect(res.body).toMatchObject({ service: 'form-service', fit: 'optional' });
      });

      it('returns 400 when the existing chat is full', async () => {
        const full = Array.from({ length: 200 }, (_, i) => ({
          role: 'user' as const,
          content: `Question ${i}`,
          at: '2026-03-01T10:00:00.000Z',
        }));
        chatRepository.find.mockResolvedValueOnce([storedChat({ messages: full })]);

        const res = await consultWith();

        expect(res.status).toBe(400);
      });

      it('does not save a chat when the specialist is unknown', async () => {
        await consult('unknown');

        expect(chatRepository.save).not.toHaveBeenCalled();
      });

      it('returns 500 when the chat lookup fails', async () => {
        chatRepository.find.mockRejectedValueOnce(new Error('connection lost'));

        const res = await consultWith();

        expect(res.status).toBe(500);
      });

      it('returns 500 when saving the chat fails', async () => {
        chatRepository.save.mockRejectedValueOnce(new Error('connection lost'));

        const res = await consultWith();

        expect(res.status).toBe(500);
      });
    });
  });

  describe('PUT /solutions/:id/questions/:questionId', () => {
    const QUESTION_ID = '8c1d5e2a-3b4f-4a6d-9e7c-1f2a3b4c5d6e';
    const answerQuestion = (body: object = { answer: 'The director' }, user: User = owner, questionId = QUESTION_ID) =>
      request(buildApp(user)).put(`/planner/v1/solutions/${SOLUTION_ID}/questions/${questionId}`).send(body);

    beforeEach(() => {
      const stored = solutionOwnedBy('owner-1');
      stored.state.questions = [
        { id: QUESTION_ID, question: 'Who approves?', raisedBy: 'ai', status: 'answered', answer: 'Old answer' },
        { id: 'other-id', question: 'How many users?', raisedBy: 'planner', status: 'open' },
      ];
      repository.get.mockResolvedValue(stored);
    });

    it('marks the question as answered with the trimmed answer', async () => {
      const res = await answerQuestion({ answer: '  The director  ' });

      expect(res.body.state.questions[0]).toEqual({
        id: QUESTION_ID,
        question: 'Who approves?',
        raisedBy: 'ai',
        status: 'answered',
        answer: 'The director',
      });
    });

    it('leaves other questions untouched', async () => {
      const res = await answerQuestion();

      expect(res.body.state.questions[1]).toEqual({
        id: 'other-id',
        question: 'How many users?',
        raisedBy: 'planner',
        status: 'open',
      });
    });

    it.each([['empty', ''], ['whitespace only', '   ']])('reopens the question when the answer is %s', async (_name, answer) => {
      const res = await answerQuestion({ answer });

      expect(res.body.state.questions[0]).toEqual({ id: QUESTION_ID, question: 'Who approves?', raisedBy: 'ai', status: 'open' });
    });

    it('sends a solution-updated event with the answer operation', async () => {
      await answerQuestion();

      expect(eventService.send).toHaveBeenCalledWith(
        expect.objectContaining({ payload: expect.objectContaining({ operation: 'answer' }) }),
      );
    });

    it('increments the revision', async () => {
      const res = await answerQuestion();

      expect(res.body.revision).toBe(2);
    });

    it('returns 404 for an unknown question', async () => {
      const res = await answerQuestion({ answer: 'x' }, owner, '11111111-2222-4333-8444-555555555555');

      expect(res.status).toBe(404);
    });

    it.each([
      ['missing', {}],
      ['not a string', { answer: 7 }],
      ['too long', { answer: 'x'.repeat(5001) }],
    ])('returns 400 when the answer is %s', async (_name, body) => {
      const res = await answerQuestion(body);

      expect(res.status).toBe(400);
    });

    it('returns 400 for a malformed question id', async () => {
      const res = await answerQuestion({ answer: 'x' }, owner, 'not-a-uuid');

      expect(res.status).toBe(400);
    });

    it('returns 403 for a user who does not own the solution', async () => {
      const res = await answerQuestion({ answer: 'x' }, stranger);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /solutions/:id/export', () => {
    const exportSolution = (user: User = owner) =>
      request(buildApp(user)).get(`/planner/v1/solutions/${SOLUTION_ID}/export`);

    beforeEach(() => {
      repository.get.mockResolvedValue(solutionOwnedBy('owner-1'));
    });

    it('returns the solution as a JSON attachment', async () => {
      const res = await exportSolution();

      expect(res.headers['content-disposition']).toBe(`attachment; filename="planner-${SOLUTION_ID}.json"`);
    });

    it('includes solution details and state', async () => {
      const res = await exportSolution();

      expect(res.body).toMatchObject({
        id: SOLUTION_ID,
        name: 'S',
        scenario: 'new',
        status: 'draft',
        revision: 1,
        exportedAt: expect.any(String),
        state: expect.objectContaining({ questions: [] }),
      });
    });

    it('does not expose the tenant id', async () => {
      const res = await exportSolution();

      expect(res.body.tenantId).toBeUndefined();
    });

    it('allows an admin to export another user\'s solution', async () => {
      const res = await exportSolution(admin);

      expect(res.status).toBe(200);
    });

    it('returns 403 for a user who does not own the solution', async () => {
      const res = await exportSolution(stranger);

      expect(res.status).toBe(403);
    });

    it('returns 404 when the solution does not exist', async () => {
      repository.get.mockResolvedValueOnce(null);

      const res = await exportSolution();

      expect(res.status).toBe(404);
    });
  });

  describe('AI-assisted planning', () => {
    const MODEL = 'GOA-Default';
    const llm = { model: MODEL, analyze: jest.fn(), discover: jest.fn(), blueprint: jest.fn(), consult: jest.fn(), converse: jest.fn() };
    const aiText = 'Residents submit grant applications that officers review and approve.';

    const aiAnalysis: LlmAnalysis = {
      concepts: [
        { id: 'c-1', type: 'actor', name: 'Grant officer', source: 'extracted', confidence: 0.7 },
        { id: 'c-2', type: 'document', name: 'Grant application', source: 'extracted', confidence: 0.7 },
      ],
      matches: [
        {
          patternId: 'case-management',
          patternName: 'Case Management',
          score: 8,
          level: 'high',
          matchedLanguage: [],
          matchedSignals: [],
          explanation: 'Officers work each application as a case.',
        },
      ],
      hypotheses: [
        {
          id: 'h-1',
          title: 'Grant case workflow',
          patternId: 'case-management',
          confidence: 'high',
          rationale: 'Applications are reviewed as cases.',
          recommendations: [{ service: 'form-service', reason: 'Collect applications', order: 1 }],
          assumptions: [],
          unknowns: [],
        },
      ],
      questions: ['Who approves grants above the delegated limit?'],
      reply: 'Grant applications look like a case management problem.',
      model: MODEL,
    };

    const consultation: LlmConsultation = {
      advice: 'Start with a single intake form for grant applicants.',
      questions: ['Which fields are mandatory?'],
      risks: ['Duplicate submissions'],
      supports: [],
      constraints: [],
      model: MODEL,
    };

    const analyze = (app: express.Express, body: object = { text: aiText }) =>
      request(app).post(`/planner/v1/solutions/${SOLUTION_ID}/analyze`).send(body);
    const consult = (app: express.Express, body: object = {}) =>
      request(app).post(`/planner/v1/solutions/${SOLUTION_ID}/consult/form-service`).send(body);

    beforeEach(() => {
      repository.get.mockResolvedValue(solutionOwnedBy('owner-1'));
    });

    describe('GET /analysis/options', () => {
      it('offers ai and rules modes with ai as default when an llm is configured', async () => {
        const res = await request(buildApp(owner, true, llm)).get('/planner/v1/analysis/options');

        expect(res.body).toEqual({ modes: ['ai', 'rules'], defaultMode: 'ai', model: MODEL });
      });

      it('offers only rules mode when no llm is configured', async () => {
        const res = await request(buildApp()).get('/planner/v1/analysis/options');

        expect(res.body).toEqual({ modes: ['rules'], defaultMode: 'rules' });
      });

      it('returns 403 for a user without a planner role', async () => {
        const res = await request(buildApp(makeUser('nobody', []), true, llm)).get('/planner/v1/analysis/options');

        expect(res.status).toBe(403);
      });
    });

    describe('POST /solutions/:id/chat', () => {
      const message = 'The director approves everything above $10,000.';
      const chat = (app: express.Express, body: object = { message }) =>
        request(app).post(`/planner/v1/solutions/${SOLUTION_ID}/chat`).send(body);

      beforeEach(() => {
        const stored = solutionOwnedBy('owner-1');
        stored.state.problemStatement = aiText;
        repository.get.mockResolvedValue(stored);
      });

      it('passes the message and stored problem statement to the llm', async () => {
        llm.analyze.mockResolvedValueOnce(aiAnalysis);

        await chat(buildApp(owner, true, llm));

        expect(llm.analyze).toHaveBeenCalledWith(aiText, expect.any(Array), [], { answers: [], conversation: [], message });
      });

      it('appends the user message and assistant reply to the conversation', async () => {
        llm.analyze.mockResolvedValueOnce(aiAnalysis);

        const res = await chat(buildApp(owner, true, llm));

        expect(res.body.state.conversation).toEqual([
          { role: 'user', content: message, at: expect.any(String) },
          { role: 'assistant', content: aiAnalysis.reply, at: expect.any(String) },
        ]);
      });

      it('trims the message before using it', async () => {
        llm.analyze.mockResolvedValueOnce(aiAnalysis);

        await chat(buildApp(owner, true, llm), { message: `  ${message}  ` });

        expect(llm.analyze.mock.calls[0][3].message).toBe(message);
      });

      it('keeps the problem statement unchanged in ai mode', async () => {
        llm.analyze.mockResolvedValueOnce(aiAnalysis);

        const res = await chat(buildApp(owner, true, llm));

        expect(res.body.state.problemStatement).toBe(aiText);
      });

      it('sends a solution-updated event with the chat operation', async () => {
        llm.analyze.mockResolvedValueOnce(aiAnalysis);

        await chat(buildApp(owner, true, llm));

        expect(eventService.send).toHaveBeenCalledWith(
          expect.objectContaining({ payload: expect.objectContaining({ operation: 'chat' }) }),
        );
      });

      it('appends the failure warning to the assistant reply when the llm throws', async () => {
        llm.analyze.mockRejectedValueOnce(new Error('Model request failed (HTTP 503)'));

        const res = await chat(buildApp(owner, true, llm));

        expect(res.body.state.conversation[1].content).toContain(
          '(AI analysis failed (Model request failed (HTTP 503)); used rule-based analysis.)',
        );
      });

      it('folds the message into the problem statement in rules mode', async () => {
        const res = await chat(buildApp(owner, true, llm), { message, mode: 'rules' });

        expect(res.body.state.problemStatement).toBe(`${aiText}\n${message}`);
      });

      it('replies with a rule-based notice in rules mode', async () => {
        const res = await chat(buildApp(owner, true, llm), { message, mode: 'rules' });

        expect(res.body.state.conversation[1].content).toContain('Rule-based analysis refreshed');
      });

      it('falls back to rules with a warning when no llm is configured', async () => {
        const res = await chat(buildApp(), { message, mode: 'ai' });

        expect(res.body.state.analysis.warning).toBe('AI analysis is not configured; used rule-based analysis.');
      });

      it.each([
        ['missing', {}],
        ['empty', { message: '' }],
        ['whitespace only', { message: '   ' }],
        ['not a string', { message: 42 }],
        ['too long', { message: 'x'.repeat(5001) }],
        ['with an invalid mode', { message: 'Hello', mode: 'bogus' }],
      ])('returns 400 when the message is %s', async (_name, body) => {
        const res = await chat(buildApp(owner, true, llm), body);

        expect(res.status).toBe(400);
      });

      it('returns 403 for a user who does not own the solution', async () => {
        const res = await chat(buildApp(stranger, true, llm));

        expect(res.status).toBe(403);
      });

      it('returns 500 when saving fails', async () => {
        llm.analyze.mockResolvedValueOnce(aiAnalysis);
        repository.save.mockRejectedValueOnce(new Error('db down'));

        const res = await chat(buildApp(owner, true, llm));

        expect(res.status).toBe(500);
      });
    });

    describe('POST /solutions/:id/discovery', () => {
      const vagueProblem = 'We handle grants.';
      const detailedProblem =
        'Our goal is to reduce the backlog of grant applications. Applicants submit a form with documents, ' +
        'staff review and approve each one, applicants get an email and can track status, and privacy legislation applies.';
      const lowFactors = [
        { id: 'problem', score: 30, note: 'Goal unclear' },
        { id: 'users', score: 10 },
      ];
      const highFactors = DISCOVERY_FACTORS.map((f) => ({ id: f.id, score: 80 }));
      const discovery = (app: express.Express, body: object = {}) =>
        request(app).post(`/planner/v1/solutions/${SOLUTION_ID}/discovery`).send(body);
      const storeSolution = (problemStatement: string, state: Partial<Solution['state']> = {}) => {
        const stored = solutionOwnedBy('owner-1');
        stored.state = { ...stored.state, problemStatement, ...state };
        repository.get.mockResolvedValue(stored);
      };

      beforeEach(() => {
        storeSolution(vagueProblem);
      });

      it('rejects discovery when the problem statement is blank', async () => {
        storeSolution('   ');

        const res = await discovery(buildApp(owner, true, llm));

        expect(res.status).toBe(400);
      });

      it('rejects an invalid mode', async () => {
        const res = await discovery(buildApp(owner, true, llm), { mode: 'magic' });

        expect(res.status).toBe(400);
      });

      it('rejects an empty message', async () => {
        const res = await discovery(buildApp(owner, true, llm), { message: '' });

        expect(res.status).toBe(400);
      });

      it('returns 403 for a user who does not own the solution', async () => {
        const res = await discovery(buildApp(stranger, true, llm));

        expect(res.status).toBe(403);
      });

      it('returns 500 when the solution cannot be saved', async () => {
        llm.discover.mockResolvedValueOnce({ reply: 'Who uses it?', factors: lowFactors, model: MODEL });
        repository.save.mockRejectedValueOnce(new Error('database unavailable'));

        const res = await discovery(buildApp(owner, true, llm));

        expect(res.status).toBe(500);
      });

      it('passes the problem, trimmed message and patterns to the llm', async () => {
        llm.discover.mockResolvedValueOnce({ reply: 'Who uses it?', factors: lowFactors, model: MODEL });

        await discovery(buildApp(owner, true, llm), { message: '  Officers approve grants.  ' });

        expect(llm.discover).toHaveBeenCalledWith(
          vagueProblem,
          [{ role: 'user', content: 'Officers approve grants.' }],
          expect.any(Array),
        );
      });

      it('persists the assistant reply as discovery progress when confidence is below the threshold', async () => {
        llm.discover.mockResolvedValueOnce({ reply: 'Who uses it?', factors: lowFactors, model: MODEL });

        const res = await discovery(buildApp(owner, true, llm));

        expect(res.body.state.discovery.messages).toEqual([
          expect.objectContaining({ role: 'assistant', content: 'Who uses it?' }),
        ]);
      });

      it('records ai mode and model on the discovery state', async () => {
        llm.discover.mockResolvedValueOnce({ reply: 'Who uses it?', factors: lowFactors, model: MODEL });

        const res = await discovery(buildApp(owner, true, llm));

        expect(res.body.state.discovery).toMatchObject({ mode: 'ai', model: MODEL, ready: false });
      });

      it('does not run the analysis while confidence is below the threshold', async () => {
        llm.discover.mockResolvedValueOnce({ reply: 'Who uses it?', factors: lowFactors, model: MODEL });

        const res = await discovery(buildApp(owner, true, llm));

        expect(res.body.status).toBe('draft');
      });

      it('sends a solution-updated event with the discovery operation', async () => {
        llm.discover.mockResolvedValueOnce({ reply: 'Who uses it?', factors: lowFactors, model: MODEL });

        await discovery(buildApp(owner, true, llm));

        expect(eventService.send).toHaveBeenCalledWith(
          expect.objectContaining({ payload: expect.objectContaining({ operation: 'discovery' }) }),
        );
      });

      it('sets the overall confidence from the merged factor scores', async () => {
        llm.discover.mockResolvedValueOnce({ reply: 'Who uses it?', factors: lowFactors, model: MODEL });

        const res = await discovery(buildApp(owner, true, llm));

        expect(res.body.state.confidence).toMatchObject({ score: res.body.state.discovery.confidence, threshold: 50 });
      });

      it('appends the user message before the assistant reply', async () => {
        llm.discover.mockResolvedValueOnce({ reply: 'Who uses it?', factors: lowFactors, model: MODEL });

        const res = await discovery(buildApp(owner, true, llm), { message: 'Officers approve grants.' });

        expect(res.body.state.discovery.messages.map((m) => m.role)).toEqual(['user', 'assistant']);
      });

      it('keeps earlier discovery messages when continuing', async () => {
        storeSolution(vagueProblem, {
          discovery: {
            messages: [{ role: 'assistant', content: 'What is the goal?', at: '2026-03-01T10:00:00.000Z' }],
            confidence: 10,
            threshold: 50,
            factors: [],
            ready: false,
            mode: 'ai',
            updatedOn: '2026-03-01T10:00:00.000Z',
          },
        });
        llm.discover.mockResolvedValueOnce({ reply: 'Who uses it?', factors: lowFactors, model: MODEL });

        const res = await discovery(buildApp(owner, true, llm), { message: 'Reduce the backlog.' });

        expect(res.body.state.discovery.messages).toHaveLength(3);
      });

      it('keeps the solution presented when a later reply scores below the threshold', async () => {
        storeSolution(vagueProblem, {
          discovery: {
            messages: [],
            confidence: 70,
            threshold: 50,
            factors: [],
            ready: true,
            mode: 'ai',
            updatedOn: '2026-03-01T10:00:00.000Z',
          },
        });
        llm.discover.mockResolvedValueOnce({ reply: 'Noted.', factors: lowFactors, model: MODEL });

        const res = await discovery(buildApp(owner, true, llm), { message: 'One more detail.' });

        expect(res.body.state.discovery.ready).toBe(true);
      });

      it('discards earlier discovery messages when restart is true', async () => {
        storeSolution(vagueProblem, {
          discovery: {
            messages: [{ role: 'assistant', content: 'What is the goal?', at: '2026-03-01T10:00:00.000Z' }],
            confidence: 10,
            threshold: 50,
            factors: [],
            ready: false,
            mode: 'ai',
            updatedOn: '2026-03-01T10:00:00.000Z',
          },
        });
        llm.discover.mockResolvedValueOnce({ reply: 'Who uses it?', factors: lowFactors, model: MODEL });

        const res = await discovery(buildApp(owner, true, llm), { restart: true });

        expect(res.body.state.discovery.messages).toHaveLength(1);
      });

      it('falls back to rule-based discovery with a warning when the llm fails', async () => {
        llm.discover.mockRejectedValueOnce(new Error('Model request failed (HTTP 503)'));

        const res = await discovery(buildApp(owner, true, llm));

        expect(res.body.state.discovery).toMatchObject({
          mode: 'rules',
          warning: 'AI discovery failed (Model request failed (HTTP 503)); used rule-based discovery.',
        });
      });

      it('logs a warning when the llm fails', async () => {
        llm.discover.mockRejectedValueOnce(new Error('Model request failed (HTTP 503)'));

        await discovery(buildApp(owner, true, llm));

        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('AI discovery failed'));
      });

      it('replies with rule-based questions when the llm fails', async () => {
        llm.discover.mockRejectedValueOnce(new Error('Model request failed (HTTP 503)'));

        const res = await discovery(buildApp(owner, true, llm));

        expect(res.body.state.discovery.messages[0].content).toContain('to propose a solution). To get there');
      });

      it('uses rules with a warning when ai is requested but no llm is configured', async () => {
        const res = await discovery(buildApp(), { mode: 'ai' });

        expect(res.body.state.discovery).toMatchObject({
          mode: 'rules',
          warning: 'AI analysis is not configured; used rule-based discovery.',
        });
      });

      it('defaults to rules without a warning when no llm is configured', async () => {
        const res = await discovery(buildApp());

        expect(res.body.state.discovery.warning).toBeUndefined();
      });

      it('uses rules without calling the llm when rules mode is requested', async () => {
        await discovery(buildApp(owner, true, llm), { mode: 'rules' });

        expect(llm.discover).not.toHaveBeenCalled();
      });

      it('presents the solution when rule-based confidence reaches the threshold', async () => {
        storeSolution(detailedProblem);

        const res = await discovery(buildApp(), { mode: 'rules' });

        expect(res.body).toMatchObject({ status: 'analyzed', state: { discovery: { ready: true } } });
      });

      it('presents the solution when the llm reports confidence at the threshold', async () => {
        llm.discover.mockResolvedValueOnce({ reply: 'I understand it.', factors: highFactors, model: MODEL });
        llm.analyze.mockResolvedValueOnce(aiAnalysis);

        const res = await discovery(buildApp(owner, true, llm));

        expect(res.body.state.analysis).toMatchObject({ mode: 'ai', model: MODEL });
      });

      it('analyzes the problem statement when ready', async () => {
        llm.discover.mockResolvedValueOnce({ reply: 'I understand it.', factors: highFactors, model: MODEL });
        llm.analyze.mockResolvedValueOnce(aiAnalysis);

        await discovery(buildApp(owner, true, llm));

        expect(llm.analyze).toHaveBeenCalledWith(vagueProblem, expect.any(Array), [], expect.any(Object));
      });

      it('sends discovery messages to the analysis as conversation context', async () => {
        llm.discover.mockResolvedValueOnce({ reply: 'I understand it.', factors: highFactors, model: MODEL });
        llm.analyze.mockResolvedValueOnce(aiAnalysis);

        await discovery(buildApp(owner, true, llm), { message: 'Officers approve grants.' });

        expect(llm.analyze.mock.calls[0][3].conversation).toEqual([
          { role: 'user', content: 'Officers approve grants.' },
          { role: 'assistant', content: 'I understand it.' },
        ]);
      });

      it('sends an analyze solution-updated event when ready', async () => {
        llm.discover.mockResolvedValueOnce({ reply: 'I understand it.', factors: highFactors, model: MODEL });
        llm.analyze.mockResolvedValueOnce(aiAnalysis);

        await discovery(buildApp(owner, true, llm));

        expect(eventService.send).toHaveBeenCalledWith(
          expect.objectContaining({ payload: expect.objectContaining({ operation: 'analyze' }) }),
        );
      });

      it('proceeds below the threshold when force is true', async () => {
        llm.discover.mockResolvedValueOnce({ reply: 'Who uses it?', factors: lowFactors, model: MODEL });
        llm.analyze.mockResolvedValueOnce(aiAnalysis);

        const res = await discovery(buildApp(owner, true, llm), { force: true });

        expect(res.body.status).toBe('analyzed');
      });

      it('explains that the solution was proposed at low confidence when force is true', async () => {
        llm.discover.mockResolvedValueOnce({ reply: 'Who uses it?', factors: lowFactors, model: MODEL });
        llm.analyze.mockResolvedValueOnce(aiAnalysis);

        const res = await discovery(buildApp(owner, true, llm), { force: true });

        expect(res.body.state.discovery.messages[0].content).toContain('Proceeding with a proposed solution at');
      });

      it('does not add the low-confidence note when force is true but confidence is sufficient', async () => {
        llm.discover.mockResolvedValueOnce({ reply: 'I understand it.', factors: highFactors, model: MODEL });
        llm.analyze.mockResolvedValueOnce(aiAnalysis);

        const res = await discovery(buildApp(owner, true, llm), { force: true });

        expect(res.body.state.discovery.messages[0].content).toBe('I understand it.');
      });

      it('includes the discovery answers in rule-based pattern matching', async () => {
        storeSolution('We handle a complaint');

        const res = await discovery(buildApp(), {
          mode: 'rules',
          force: true,
          message: 'Staff review each application, assign cases, and escalate with audit history and notes.',
        });

        expect(res.body.state.patternMatches[0].patternId).toBe('case-management');
      });
    });

    describe('POST /solutions/:id/analyze confidence', () => {
      it('sets the overall confidence on the analyzed solution', async () => {
        llm.analyze.mockResolvedValueOnce(aiAnalysis);

        const res = await analyze(buildApp(owner, true, llm));

        expect(res.body.state.confidence).toMatchObject({ threshold: 50, factors: expect.any(Array) });
      });
    });

    describe('POST /solutions/:id/analyze', () => {
      it('uses the llm by default when one is configured', async () => {
        llm.analyze.mockResolvedValueOnce(aiAnalysis);

        const res = await analyze(buildApp(owner, true, llm));

        expect(res.body.state.analysis).toMatchObject({ mode: 'ai', model: MODEL });
      });

      it('passes the text, patterns, existing concepts and empty context to the llm', async () => {
        llm.analyze.mockResolvedValueOnce(aiAnalysis);

        await analyze(buildApp(owner, true, llm));

        expect(llm.analyze).toHaveBeenCalledWith(
          aiText,
          expect.arrayContaining([expect.objectContaining({ id: 'case-management' })]),
          [],
          { answers: [], conversation: [], message: undefined },
        );
      });

      it('passes answered questions and prior conversation to the llm as context', async () => {
        const stored = solutionOwnedBy('owner-1');
        stored.state.questions = [
          { id: 'q-1', question: 'Who approves?', raisedBy: 'ai', status: 'answered', answer: 'The director' },
          { id: 'q-2', question: 'How many users?', raisedBy: 'ai', status: 'open' },
        ];
        stored.state.conversation = [{ role: 'user', content: 'Earlier message', at: '2026-01-01T00:00:00.000Z' }];
        repository.get.mockResolvedValueOnce(stored);
        llm.analyze.mockResolvedValueOnce(aiAnalysis);

        await analyze(buildApp(owner, true, llm));

        expect(llm.analyze.mock.calls[0][3]).toEqual({
          answers: [{ question: 'Who approves?', answer: 'The director' }],
          conversation: [{ role: 'user', content: 'Earlier message' }],
          message: undefined,
        });
      });

      it('does not append to the conversation when analyzing without a message', async () => {
        llm.analyze.mockResolvedValueOnce(aiAnalysis);

        const res = await analyze(buildApp(owner, true, llm));

        expect(res.body.state.conversation).toEqual([]);
      });

      it('stores the llm matches and hypotheses', async () => {
        llm.analyze.mockResolvedValueOnce(aiAnalysis);

        const res = await analyze(buildApp(owner, true, llm));

        expect(res.body.state.hypotheses[0].title).toBe('Grant case workflow');
      });

      it('does not record a warning when ai analysis succeeds', async () => {
        llm.analyze.mockResolvedValueOnce(aiAnalysis);

        const res = await analyze(buildApp(owner, true, llm));

        expect(res.body.state.analysis.warning).toBeUndefined();
      });

      it('records an analyzedOn timestamp', async () => {
        llm.analyze.mockResolvedValueOnce(aiAnalysis);

        const res = await analyze(buildApp(owner, true, llm));

        expect(new Date(res.body.state.analysis.analyzedOn).getTime()).not.toBeNaN();
      });

      it('attributes llm questions to ai', async () => {
        llm.analyze.mockResolvedValueOnce(aiAnalysis);

        const res = await analyze(buildApp(owner, true, llm));

        expect(res.body.state.questions).toEqual([
          expect.objectContaining({ question: 'Who approves grants above the delegated limit?', raisedBy: 'ai', status: 'open' }),
        ]);
      });

      it('skips llm concepts that duplicate existing concepts ignoring case', async () => {
        const stored = solutionOwnedBy('owner-1');
        stored.state.concepts = [{ id: 'x', type: 'actor', name: 'GRANT OFFICER', source: 'user' }];
        repository.get.mockResolvedValueOnce(stored);
        llm.analyze.mockResolvedValueOnce(aiAnalysis);

        const res = await analyze(buildApp(owner, true, llm));

        expect(res.body.state.concepts.map((c) => c.name)).toEqual(['GRANT OFFICER', 'Grant application']);
      });

      it('drops duplicate concepts returned within the same llm response', async () => {
        llm.analyze.mockResolvedValueOnce({
          ...aiAnalysis,
          concepts: [...aiAnalysis.concepts, { ...aiAnalysis.concepts[0], id: 'c-3' }],
        });

        const res = await analyze(buildApp(owner, true, llm));

        expect(res.body.state.concepts).toHaveLength(2);
      });

      it('skips llm questions that already exist on the solution', async () => {
        const stored = solutionOwnedBy('owner-1');
        stored.state.questions = [
          { id: 'q-1', question: 'Who approves grants above the delegated limit?', raisedBy: 'user', status: 'open' },
        ];
        repository.get.mockResolvedValueOnce(stored);
        llm.analyze.mockResolvedValueOnce(aiAnalysis);

        const res = await analyze(buildApp(owner, true, llm));

        expect(res.body.state.questions).toHaveLength(1);
      });

      it('uses the llm when ai mode is explicitly requested', async () => {
        llm.analyze.mockResolvedValueOnce(aiAnalysis);

        const res = await analyze(buildApp(owner, true, llm), { text: aiText, mode: 'ai' });

        expect(res.body.state.analysis.mode).toBe('ai');
      });

      it('skips the llm when rules mode is requested', async () => {
        await analyze(buildApp(owner, true, llm), { text: aiText, mode: 'rules' });

        expect(llm.analyze).not.toHaveBeenCalled();
      });

      it('records rules mode without a warning when rules mode is requested', async () => {
        const res = await analyze(buildApp(owner, true, llm), { text: aiText, mode: 'rules' });

        expect(res.body.state.analysis).toEqual({ mode: 'rules', analyzedOn: expect.any(String) });
      });

      it('falls back to rules with a warning when the llm throws', async () => {
        llm.analyze.mockRejectedValueOnce(new Error('Model request failed (HTTP 503)'));

        const res = await analyze(buildApp(owner, true, llm));

        expect(res.body.state.analysis).toMatchObject({
          mode: 'rules',
          warning: 'AI analysis failed (Model request failed (HTTP 503)); used rule-based analysis.',
        });
      });

      it('logs a warning when the llm throws', async () => {
        llm.analyze.mockRejectedValueOnce(new Error('Model request failed (HTTP 503)'));

        await analyze(buildApp(owner, true, llm));

        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('AI analysis failed'));
      });

      it('still saves the solution as analyzed when the llm throws', async () => {
        llm.analyze.mockRejectedValueOnce(new Error('timeout'));

        const res = await analyze(buildApp(owner, true, llm));

        expect(res.body.status).toBe('analyzed');
      });

      it('warns that ai is not configured when ai mode is requested without an llm', async () => {
        const res = await analyze(buildApp(), { text: aiText, mode: 'ai' });

        expect(res.body.state.analysis).toMatchObject({
          mode: 'rules',
          warning: 'AI analysis is not configured; used rule-based analysis.',
        });
      });

      it('does not warn when no llm is configured and no mode is requested', async () => {
        const res = await analyze(buildApp());

        expect(res.body.state.analysis.warning).toBeUndefined();
      });

      it('returns 400 when the mode is not ai or rules', async () => {
        const res = await analyze(buildApp(owner, true, llm), { text: aiText, mode: 'magic' });

        expect(res.status).toBe(400);
      });
    });

    describe('POST /solutions/:id/consult/:service', () => {
      it('merges the llm advice into the consultation result', async () => {
        llm.consult.mockResolvedValueOnce(consultation);

        const res = await consult(buildApp(owner, true, llm));

        expect(res.body.advice).toBe(consultation.advice);
      });

      it('keeps the rule-based questions alongside the llm questions', async () => {
        llm.consult.mockResolvedValueOnce(consultation);

        const res = await consult(buildApp(owner, true, llm));

        expect(res.body.questions).toEqual(expect.arrayContaining(['Which fields are mandatory?', ...getSpecialist('form-service').questions]));
      });

      it('passes the user question to the llm', async () => {
        llm.consult.mockResolvedValueOnce(consultation);

        await consult(buildApp(owner, true, llm), { question: 'Can applicants save drafts?' });

        expect(llm.consult).toHaveBeenCalledWith(
          expect.objectContaining({ problemStatement: '' }),
          expect.objectContaining({ service: 'form-service' }),
          'Can applicants save drafts?',
          undefined,
        );
      });

      it('passes the proposal to the llm as the fourth argument', async () => {
        llm.consult.mockResolvedValueOnce(consultation);

        await consult(buildApp(owner, true, llm), { proposal: 'Use one intake form with draft saving.' });

        expect(llm.consult).toHaveBeenCalledWith(
          expect.objectContaining({ problemStatement: '' }),
          expect.objectContaining({ service: 'form-service' }),
          undefined,
          'Use one intake form with draft saving.',
        );
      });

      it('returns 400 when the proposal is not a string', async () => {
        const res = await consult(buildApp(owner, true, llm), { proposal: 42 });

        expect(res.status).toBe(400);
      });

      it('skips the llm when rules mode is requested', async () => {
        await consult(buildApp(owner, true, llm), { mode: 'rules' });

        expect(llm.consult).not.toHaveBeenCalled();
      });

      it('falls back to rule-based guidance silently when the llm throws', async () => {
        llm.consult.mockRejectedValueOnce(new Error('Model request failed'));

        const res = await consult(buildApp(owner, true, llm));

        expect(res.status).toBe(200);
      });

      it('returns the rule-based advice when the llm throws', async () => {
        llm.consult.mockRejectedValueOnce(new Error('Model request failed'));

        const res = await consult(buildApp(owner, true, llm));

        expect(res.body.advice).not.toBe(consultation.advice);
      });

      it('logs a warning when the llm consultation fails', async () => {
        llm.consult.mockRejectedValueOnce(new Error('Model request failed'));

        await consult(buildApp(owner, true, llm));

        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('AI consultation failed'));
      });

      it('does not call an llm when none is configured', async () => {
        const res = await consult(buildApp(), { mode: 'ai' });

        expect(res.status).toBe(200);
      });

      it('returns 400 when the question is not a string', async () => {
        const res = await consult(buildApp(owner, true, llm), { question: 42 });

        expect(res.status).toBe(400);
      });

      it('records the llm advice as the assistant message in ai mode', async () => {
        llm.consult.mockResolvedValueOnce(consultation);

        await consult(buildApp(owner, true, llm));

        expect(chatRepository.save.mock.calls[0][0].messages[1]).toMatchObject({
          role: 'assistant',
          content: consultation.advice,
          intent: 'consult',
          mode: 'ai',
        });
      });

      it('records the llm validation verdict on the assistant message', async () => {
        const validation = { verdict: 'needs-changes' as const, findings: ['Drafts have no expiry.'] };
        llm.consult.mockResolvedValueOnce({ ...consultation, validation });

        await consult(buildApp(owner, true, llm), { proposal: 'Use one intake form.' });

        expect(chatRepository.save.mock.calls[0][0].messages[1].validation).toEqual(validation);
      });

      it('records rules mode when the llm consultation fails', async () => {
        llm.consult.mockRejectedValueOnce(new Error('Model request failed'));

        await consult(buildApp(owner, true, llm));

        expect(chatRepository.save.mock.calls[0][0].messages[1].mode).toBe('rules');
      });
    });

    describe('POST /solutions/:id/blueprint', () => {
      const generated = {
        core: {
          overview: { title: '', summary: 'AI blueprint summary.', objectives: [], scope: [], outOfScope: [], stakeholders: [], successMeasures: [], risks: [] },
        },
        services: [{ service: 'form-service', role: 'Collects grant applications', capabilities: ['Draft saving'] }],
        model: MODEL,
      };
      const analysed = (patternId = 'case-management'): Solution => {
        const solution = solutionOwnedBy('owner-1');
        solution.state.problemStatement = aiText;
        solution.state.hypotheses = [
          {
            ...aiAnalysis.hypotheses[0],
            patternId,
            recommendations: [
              { service: 'file-service', reason: 'Store attachments', order: 2 },
              { service: 'form-service', reason: 'Collect applications', order: 1 },
            ],
          },
        ];
        return solution;
      };
      const consultMessage = (overrides: object = {}) => ({
        role: 'assistant' as const,
        content: 'Saved advice',
        at: '2026-03-01T10:00:01.000Z',
        intent: 'consult',
        consult: { service: 'form-service', fit: 'recommended', reason: 'Saved reason', advice: 'Saved advice', questions: [], dependencies: [], risks: ['Saved risk'] },
        ...overrides,
      });
      const blueprint = (app: express.Express, body: object = {}) =>
        request(app).post(`/planner/v1/solutions/${SOLUTION_ID}/blueprint`).send(body);

      beforeEach(() => {
        repository.get.mockResolvedValue(analysed());
        llm.blueprint.mockResolvedValue(generated);
        llm.consult.mockResolvedValue(consultation);
      });

      it('returns 400 when the solution has no hypotheses', async () => {
        repository.get.mockResolvedValueOnce(solutionOwnedBy('owner-1'));

        const res = await blueprint(buildApp(owner, true, llm));

        expect(res.status).toBe(400);
      });

      it.each([{ mode: 'fast' }, { refreshConsultations: 'sometimes' }])('returns 400 for invalid body %p', async (body) => {
        const res = await blueprint(buildApp(owner, true, llm), body);

        expect(res.status).toBe(400);
      });

      it('returns 404 when the solution does not exist', async () => {
        repository.get.mockResolvedValueOnce(undefined);

        const res = await blueprint(buildApp(owner, true, llm));

        expect(res.status).toBe(404);
      });

      it('generates an ai blueprint by default when an llm is configured', async () => {
        const res = await blueprint(buildApp(owner, true, llm));

        expect(res.body.state.blueprint).toMatchObject({ mode: 'ai', model: MODEL });
      });

      it('merges the ai overview into the blueprint', async () => {
        const res = await blueprint(buildApp(owner, true, llm));

        expect(res.body.state.blueprint.overview.summary).toBe('AI blueprint summary.');
      });

      it('applies the ai service roles to the service mapping', async () => {
        const res = await blueprint(buildApp(owner, true, llm));

        expect(res.body.state.blueprint.serviceMapping[0]).toMatchObject({ service: 'form-service', role: 'Collects grant applications' });
      });

      it('passes the specialist notes to the llm', async () => {
        await blueprint(buildApp(owner, true, llm));

        expect(llm.blueprint).toHaveBeenCalledWith(
          expect.objectContaining({ problemStatement: aiText }),
          [expect.objectContaining({ service: 'form-service' }), expect.objectContaining({ service: 'file-service' })],
        );
      });

      it('consults each recommended service that has no saved consultation', async () => {
        await blueprint(buildApp(owner, true, llm));

        expect(llm.consult).toHaveBeenCalledTimes(2);
      });

      it('records each new consultation in the user chat', async () => {
        await blueprint(buildApp(owner, true, llm));

        expect(chatRepository.save).toHaveBeenCalledTimes(2);
      });

      it('marks notes from a fresh ai consultation with the ai source', async () => {
        const res = await blueprint(buildApp(owner, true, llm));

        expect(res.body.state.blueprint.specialistNotes[0]).toMatchObject({ service: 'form-service', source: 'ai', summary: consultation.advice });
      });

      it('marks notes from a failed ai consultation with the rules source', async () => {
        llm.consult.mockRejectedValue(new Error('Model request failed'));

        const res = await blueprint(buildApp(owner, true, llm));

        expect(res.body.state.blueprint.specialistNotes[0].source).toBe('rules');
      });

      it('marks the specialists as consulted', async () => {
        const res = await blueprint(buildApp(owner, true, llm));

        expect(res.body.state.specialists.map((s: { service: string }) => s.service).sort()).toEqual(['file-service', 'form-service']);
      });

      const savedChats = () => [
        storedChat({ solutionId: SOLUTION_ID, messages: [consultMessage({ consult: { ...consultMessage().consult, advice: 'Older advice' }, content: 'Older advice' }), consultMessage()] }),
        storedChat({ id: 'chat-2', service: 'file-service', solutionId: SOLUTION_ID, messages: [consultMessage({ consult: { ...consultMessage().consult, service: 'file-service' } })] }),
      ];

      it('does not consult again when every service has a saved consultation', async () => {
        chatRepository.find.mockResolvedValue(savedChats());

        await blueprint(buildApp(owner, true, llm));

        expect(llm.consult).not.toHaveBeenCalled();
      });

      it('reuses the latest saved consultation as the specialist note', async () => {
        chatRepository.find.mockResolvedValue(savedChats());

        const res = await blueprint(buildApp(owner, true, llm));

        expect(res.body.state.blueprint.specialistNotes[0]).toMatchObject({ source: 'saved-consultation', summary: 'Saved advice', consultedOn: '2026-03-01T10:00:01.000Z' });
      });

      it("looks up the user's chats for the solution", async () => {
        await blueprint(buildApp(owner, true, llm));

        expect(chatRepository.find).toHaveBeenCalledWith({ tenantId, createdById: 'owner-1', solutionId: SOLUTION_ID });
      });

      it('consults again when the saved chat has no consult message', async () => {
        chatRepository.find.mockResolvedValue([storedChat({ solutionId: SOLUTION_ID })]);

        await blueprint(buildApp(owner, true, llm));

        expect(llm.consult).toHaveBeenCalledTimes(2);
      });

      it('consults again for every service when refreshConsultations is true', async () => {
        chatRepository.find.mockResolvedValue([storedChat({ solutionId: SOLUTION_ID, messages: [consultMessage()] })]);

        await blueprint(buildApp(owner, true, llm), { refreshConsultations: true });

        expect(llm.consult).toHaveBeenCalledTimes(2);
      });

      it('adds recent non-consult assistant replies as chat highlights', async () => {
        chatRepository.find.mockResolvedValue([
          storedChat({ solutionId: SOLUTION_ID, messages: [consultMessage(), { role: 'assistant', content: 'Enable draft saving.', at: '2026-03-02T10:00:00.000Z' }] }),
        ]);

        const res = await blueprint(buildApp(owner, true, llm));

        expect(res.body.state.blueprint.specialistNotes[0].chatHighlights).toEqual(['Enable draft saving.']);
      });

      it('builds a rule-based blueprint in rules mode', async () => {
        const res = await blueprint(buildApp(owner, true, llm), { mode: 'rules' });

        expect(res.body.state.blueprint).toMatchObject({ mode: 'rules' });
      });

      it('does not call the llm blueprint in rules mode', async () => {
        await blueprint(buildApp(owner, true, llm), { mode: 'rules' });

        expect(llm.blueprint).not.toHaveBeenCalled();
      });

      it('builds a rule-based blueprint when no llm is configured and no mode is given', async () => {
        const res = await blueprint(buildApp(), {});

        expect(res.body.state.blueprint.warning).toBeUndefined();
      });

      it('warns that ai is not configured when ai mode is requested without an llm', async () => {
        const res = await blueprint(buildApp(), { mode: 'ai' });

        expect(res.body.state.blueprint).toMatchObject({ mode: 'rules', warning: 'AI analysis is not configured; used a rule-based blueprint.' });
      });

      it('falls back to a rule-based blueprint with a warning when the llm fails', async () => {
        llm.blueprint.mockRejectedValueOnce(new Error('Model request failed'));

        const res = await blueprint(buildApp(owner, true, llm));

        expect(res.body.state.blueprint).toMatchObject({
          mode: 'rules',
          warning: 'AI blueprint failed (Model request failed); used a rule-based blueprint.',
        });
      });

      it('logs a warning when the llm blueprint fails', async () => {
        llm.blueprint.mockRejectedValueOnce(new Error('Model request failed'));

        await blueprint(buildApp(owner, true, llm));

        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('AI blueprint failed'));
      });

      it('uses the matched pattern features for scope when the hypothesis has no pattern', async () => {
        const solution = analysed('');
        solution.state.patternMatches = [{ patternId: 'case-management' } as Solution['state']['patternMatches'][number]];
        repository.get.mockResolvedValue(solution);

        const res = await blueprint(buildApp(owner, true, llm), { mode: 'rules' });

        expect(res.body.state.blueprint.overview.scope).toEqual(BUILT_IN_PATTERNS.find((p) => p.id === 'case-management').commonFeatures.slice(0, 8));
      });

      it('uses the hypothesis pattern features for scope', async () => {
        const res = await blueprint(buildApp(owner, true, llm), { mode: 'rules' });

        expect(res.body.state.blueprint.overview.scope).toEqual(BUILT_IN_PATTERNS.find((p) => p.id === 'case-management').commonFeatures.slice(0, 8));
      });

      it('copes with a solution that has neither a hypothesis pattern nor pattern matches', async () => {
        repository.get.mockResolvedValue(analysed(''));

        const res = await blueprint(buildApp(owner, true, llm), { mode: 'rules' });

        expect(res.status).toBe(200);
      });

      it('sends a solution-updated event with the blueprint operation', async () => {
        await blueprint(buildApp(owner, true, llm));

        expect(eventService.send).toHaveBeenCalledWith(
          expect.objectContaining({ payload: expect.objectContaining({ operation: 'blueprint' }) }),
        );
      });

      it('saves the blueprint on the solution state', async () => {
        await blueprint(buildApp(owner, true, llm));

        expect(repository.save).toHaveBeenCalledWith(
          expect.objectContaining({ state: expect.objectContaining({ blueprint: expect.objectContaining({ mode: 'ai' }) }) }),
        );
      });

      it('returns 403 for a solution owned by another user', async () => {
        const res = await blueprint(buildApp(stranger, true, llm));

        expect(res.status).toBe(403);
      });
    });

    describe('POST /specialists/:service/chat', () => {
      const userMessage = 'How do I let applicants save drafts?';
      const messages = [{ role: 'user', content: userMessage }];
      const specialistReply: SpecialistReply = {
        reply: 'Enable draft saving on the form definition.',
        suggestions: ['Set an expiry for drafts'],
        samples: [{ language: 'json', title: 'Form definition', code: '{"supportDrafts":true}' }],
        followUps: ['How long should drafts be kept?'],
        model: MODEL,
      };
      const chat = (app: express.Express, body: object = { message: userMessage }, service = 'form-service') =>
        request(app).post(`/planner/v1/specialists/${service}/chat`).send(body);
      const savedChat = (): SpecialistChat => chatRepository.save.mock.calls[0][0];

      it('returns the llm reply in ai mode', async () => {
        llm.converse.mockResolvedValueOnce(specialistReply);

        const res = await chat(buildApp(owner, true, llm));

        expect(res.body).toEqual({
          chatId: expect.any(String),
          service: 'form-service',
          mode: 'ai',
          ...specialistReply,
        });
      });

      it('resolves the specialist from its short name', async () => {
        llm.converse.mockResolvedValueOnce(specialistReply);

        const res = await chat(buildApp(owner, true, llm), { message: userMessage }, 'form');

        expect(res.body.service).toBe('form-service');
      });

      it('passes the specialist, messages and default ask intent to the llm without a solution state', async () => {
        llm.converse.mockResolvedValueOnce(specialistReply);

        await chat(buildApp(owner, true, llm));

        expect(llm.converse).toHaveBeenCalledWith(
          expect.objectContaining({ service: 'form-service' }),
          messages,
          'ask',
          undefined,
        );
      });

      it('passes the requested intent to the llm', async () => {
        llm.converse.mockResolvedValueOnce(specialistReply);

        await chat(buildApp(owner, true, llm), { message: userMessage, intent: 'validate' });

        expect(llm.converse).toHaveBeenCalledWith(expect.anything(), messages, 'validate', undefined);
      });

      it('does not look up a solution when no solutionId is supplied', async () => {
        llm.converse.mockResolvedValueOnce(specialistReply);

        await chat(buildApp(owner, true, llm));

        expect(repository.get).not.toHaveBeenCalled();
      });

      it('falls back to rule-based guidance when the llm throws', async () => {
        llm.converse.mockRejectedValueOnce(new Error('Model request failed (HTTP 503)'));

        const res = await chat(buildApp(owner, true, llm));

        expect(res.body).toMatchObject({
          service: 'form-service',
          mode: 'rules',
          warning: 'AI specialist was unavailable; showing rule-based guidance.',
          samples: [],
        });
      });

      it('logs a warning when the llm chat fails', async () => {
        llm.converse.mockRejectedValueOnce(new Error('Model request failed (HTTP 503)'));

        await chat(buildApp(owner, true, llm));

        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('AI specialist chat failed'));
      });

      it('warns that ai is not configured when ai mode is requested without an llm', async () => {
        const res = await chat(buildApp(), { message: userMessage, mode: 'ai' });

        expect(res.body).toMatchObject({ mode: 'rules', warning: 'AI is not configured; showing rule-based guidance.' });
      });

      it('returns rule-based guidance without a warning when no llm is configured and no mode is requested', async () => {
        const res = await chat(buildApp());

        expect(res.body.warning).toBeUndefined();
      });

      it('skips the llm when rules mode is requested', async () => {

        await chat(buildApp(owner, true, llm), { message: userMessage, mode: 'rules' });

        expect(llm.converse).not.toHaveBeenCalled();
      });

      it('returns rule-based guidance without a warning when rules mode is requested', async () => {
        const res = await chat(buildApp(owner, true, llm), { message: userMessage, mode: 'rules', intent: 'recommend' });

        expect(res.body).toMatchObject({ service: 'form-service', mode: 'rules', followUps: getSpecialist('form-service').questions });
      });

      it('omits the warning when rules mode is requested explicitly', async () => {
        const res = await chat(buildApp(owner, true, llm), { message: userMessage, mode: 'rules' });

        expect(res.body.warning).toBeUndefined();
      });

      it('returns 404 for an unknown specialist', async () => {
        const res = await chat(buildApp(owner, true, llm), { message: userMessage }, 'payments');

        expect(res.status).toBe(404);
      });

      it('rejects the legacy messages array because a message is required', async () => {
        const res = await chat(buildApp(owner, true, llm), { messages });

        expect(res.status).toBe(400);
      });

      it.each([
        ['missing', {}],
        ['empty', { message: '' }],
        ['only whitespace', { message: '   ' }],
        ['not a string', { message: 42 }],
        ['longer than 5000 characters', { message: 'x'.repeat(5001) }],
        ['with a chatId that is not a UUID', { message: userMessage, chatId: 'abc' }],
        ['with an invalid intent', { message: userMessage, intent: 'chat' }],
        ['with a solutionId that is not a UUID', { message: userMessage, solutionId: 'abc' }],
        ['with an invalid mode', { message: userMessage, mode: 'bogus' }],
      ])('returns 400 when the request is %s', async (_name, body) => {
        const res = await chat(buildApp(owner, true, llm), body);

        expect(res.status).toBe(400);
      });

      it('accepts a message of exactly 5000 characters', async () => {
        llm.converse.mockResolvedValueOnce(specialistReply);

        const res = await chat(buildApp(owner, true, llm), { message: 'x'.repeat(5000) });

        expect(res.status).toBe(200);
      });

      it('returns 400 when there is no tenant context', async () => {
        const res = await chat(buildApp(owner, false, llm));

        expect(res.status).toBe(400);
      });

      it('does not save a chat when the request is invalid', async () => {
        await chat(buildApp(owner, true, llm), {});

        expect(chatRepository.save).not.toHaveBeenCalled();
      });

      describe('with a new chat', () => {
        it('returns the id of the saved chat', async () => {
          llm.converse.mockResolvedValueOnce(specialistReply);

          const res = await chat(buildApp(owner, true, llm));

          expect(res.body.chatId).toBe(savedChat().id);
        });

        it('does not load a chat', async () => {
          await chat(buildApp(owner, true, llm));

          expect(chatRepository.get).not.toHaveBeenCalled();
        });

        it('saves the chat for the requesting user and specialist', async () => {
          await chat(buildApp(owner, true, llm));

          expect(savedChat()).toMatchObject({
            tenantId,
            service: 'form-service',
            createdById: 'owner-1',
            createdByName: 'owner-1',
            solutionId: undefined,
          });
        });

        it('assigns a uuid to the chat', async () => {
          await chat(buildApp(owner, true, llm));

          expect(savedChat().id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
        });

        it('titles the chat with the first message', async () => {
          await chat(buildApp(owner, true, llm));

          expect(savedChat().title).toBe(userMessage);
        });

        it('truncates the title to 100 characters', async () => {
          await chat(buildApp(owner, true, llm), { message: 'a'.repeat(300) });

          expect(savedChat().title).toBe('a'.repeat(100));
        });

        it('stores the trimmed message', async () => {
          await chat(buildApp(owner, true, llm), { message: `  ${userMessage}  ` });

          expect(savedChat().messages[0].content).toBe(userMessage);
        });

        it('records the user message with the requested intent', async () => {
          await chat(buildApp(owner, true, llm), { message: userMessage, intent: 'design' });

          expect(savedChat().messages[0]).toMatchObject({ role: 'user', content: userMessage, intent: 'design' });
        });

        it('records the llm reply as the assistant message', async () => {
          llm.converse.mockResolvedValueOnce(specialistReply);

          await chat(buildApp(owner, true, llm));

          expect(savedChat().messages[1]).toMatchObject({
            role: 'assistant',
            content: specialistReply.reply,
            intent: 'ask',
            mode: 'ai',
            model: MODEL,
            suggestions: specialistReply.suggestions,
            samples: specialistReply.samples,
            followUps: specialistReply.followUps,
          });
        });

        it('records the warning on the assistant message when falling back to rules', async () => {
          llm.converse.mockRejectedValueOnce(new Error('Model request failed (HTTP 503)'));

          await chat(buildApp(owner, true, llm));

          expect(savedChat().messages[1]).toMatchObject({
            mode: 'rules',
            warning: 'AI specialist was unavailable; showing rule-based guidance.',
          });
        });

        it('records exactly the user and assistant messages', async () => {
          await chat(buildApp(owner, true, llm));

          expect(savedChat().messages).toHaveLength(2);
        });

        it('stores the solution the chat is about', async () => {
          repository.get.mockResolvedValueOnce(solutionOwnedBy('owner-1'));

          await chat(buildApp(owner, true, llm), { message: userMessage, solutionId: SOLUTION_ID });

          expect(savedChat().solutionId).toBe(SOLUTION_ID);
        });

        it('returns 500 when saving the chat fails', async () => {
          chatRepository.save.mockRejectedValueOnce(new Error('connection lost'));

          const res = await chat(buildApp(owner, true, llm));

          expect(res.status).toBe(500);
        });
      });

      describe('with an existing chatId', () => {
        const followUp = 'Can drafts expire?';
        const continueChat = (body: object = {}, user: User = owner, service = 'form-service') =>
          chat(buildApp(user, true, llm), { message: followUp, chatId: CHAT_ID, ...body }, service);

        beforeEach(() => {
          chatRepository.get.mockResolvedValue(storedChat());
          llm.converse.mockResolvedValue(specialistReply);
        });

        it('loads the chat within the tenant', async () => {
          await continueChat();

          expect(chatRepository.get).toHaveBeenCalledWith(tenantId, CHAT_ID);
        });

        it('passes the stored history followed by the new message to the llm', async () => {
          await continueChat();

          expect(llm.converse).toHaveBeenCalledWith(
            expect.anything(),
            [
              { role: 'user', content: 'Earlier question' },
              { role: 'assistant', content: 'Earlier answer' },
              { role: 'user', content: followUp },
            ],
            'ask',
            undefined,
          );
        });

        it('returns the id of the existing chat', async () => {
          const res = await continueChat();

          expect(res.body.chatId).toBe(CHAT_ID);
        });

        it('appends the exchange to the stored messages', async () => {
          await continueChat();

          expect(savedChat().messages.map((m) => m.content)).toEqual([
            'Earlier question',
            'Earlier answer',
            followUp,
            specialistReply.reply,
          ]);
        });

        it('keeps the original title, creator and creation date', async () => {
          await continueChat();

          expect(savedChat()).toMatchObject({
            id: CHAT_ID,
            title: 'Earlier question',
            createdById: 'owner-1',
            createdOn: new Date('2026-03-01T10:00:00.000Z'),
          });
        });

        it('advances the updated timestamp', async () => {
          await continueChat();

          expect(new Date(savedChat().updatedOn).getTime()).toBeGreaterThan(
            new Date('2026-03-01T10:05:00.000Z').getTime(),
          );
        });

        it('returns 404 when the chat does not exist', async () => {
          chatRepository.get.mockResolvedValue(null);

          const res = await continueChat();

          expect(res.status).toBe(404);
        });

        it("returns 404 when the chat belongs to another user", async () => {
          const res = await continueChat({}, stranger);

          expect(res.status).toBe(404);
        });

        it("does not call the llm or save when the chat belongs to another user", async () => {
          await continueChat({}, stranger);

          expect([llm.converse.mock.calls.length, chatRepository.save.mock.calls.length]).toEqual([0, 0]);
        });

        it('does not let a planner admin continue another user\'s chat', async () => {
          const res = await continueChat({}, admin);

          expect(res.status).toBe(404);
        });

        it('returns 400 when the chat belongs to a different specialist', async () => {
          chatRepository.get.mockResolvedValue(storedChat({ service: 'file-service' }));

          const res = await continueChat();

          expect(res.body.error).toBe('The chat belongs to a different specialist.');
        });

        it('does not save when the chat belongs to a different specialist', async () => {
          chatRepository.get.mockResolvedValue(storedChat({ service: 'file-service' }));

          await continueChat();

          expect(chatRepository.save).not.toHaveBeenCalled();
        });

        it('uses the solution stored on the chat in preference to the one in the request', async () => {
          const otherSolutionId = 'c9d8e7f6-a5b4-4c3d-8e2f-1a0b9c8d7e6f';
          const solution = solutionOwnedBy('owner-1');
          chatRepository.get.mockResolvedValue(storedChat({ solutionId: SOLUTION_ID }));
          repository.get.mockResolvedValueOnce(solution);

          await continueChat({ solutionId: otherSolutionId });

          expect(repository.get).toHaveBeenCalledWith(tenantId, SOLUTION_ID);
        });

        it('passes the stored solution state to the llm', async () => {
          const solution = solutionOwnedBy('owner-1');
          chatRepository.get.mockResolvedValue(storedChat({ solutionId: SOLUTION_ID }));
          repository.get.mockResolvedValueOnce(solution);

          await continueChat();

          expect(llm.converse).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'ask', solution.state);
        });

        it('keeps the stored solution on the saved chat', async () => {
          chatRepository.get.mockResolvedValue(storedChat({ solutionId: SOLUTION_ID }));
          repository.get.mockResolvedValueOnce(solutionOwnedBy('owner-1'));

          await continueChat();

          expect(savedChat().solutionId).toBe(SOLUTION_ID);
        });

        it('accepts an exchange that brings the chat to exactly 200 messages', async () => {
          const messages198 = Array.from({ length: 198 }, (_, i) => ({
            role: 'user' as const,
            content: `Question ${i}`,
            at: '2026-03-01T10:00:00.000Z',
          }));
          chatRepository.get.mockResolvedValue(storedChat({ messages: messages198 }));

          const res = await continueChat();

          expect(res.status).toBe(200);
        });

        it('returns 400 when the exchange would take the chat beyond 200 messages', async () => {
          const messages199 = Array.from({ length: 199 }, (_, i) => ({
            role: 'user' as const,
            content: `Question ${i}`,
            at: '2026-03-01T10:00:00.000Z',
          }));
          chatRepository.get.mockResolvedValue(storedChat({ messages: messages199 }));

          const res = await continueChat();

          expect(res.body.error).toBe('This chat is full; start a new chat.');
        });

        it('does not save a full chat', async () => {
          const full = Array.from({ length: 200 }, (_, i) => ({
            role: 'user' as const,
            content: `Question ${i}`,
            at: '2026-03-01T10:00:00.000Z',
          }));
          chatRepository.get.mockResolvedValue(storedChat({ messages: full }));

          await continueChat();

          expect(chatRepository.save).not.toHaveBeenCalled();
        });

        it('returns 500 when loading the chat fails', async () => {
          chatRepository.get.mockRejectedValue(new Error('connection lost'));

          const res = await continueChat();

          expect(res.status).toBe(500);
        });
      });

      describe('with a solutionId', () => {
        it('returns 404 when the solution does not exist', async () => {
          repository.get.mockResolvedValueOnce(undefined);

          const res = await chat(buildApp(owner, true, llm), { message: userMessage, solutionId: SOLUTION_ID });

          expect(res.status).toBe(404);
        });

        it('returns 403 when the solution belongs to another non-admin user', async () => {
          repository.get.mockResolvedValueOnce(solutionOwnedBy('owner-1'));

          const res = await chat(buildApp(stranger, true, llm), { message: userMessage, solutionId: SOLUTION_ID });

          expect(res.status).toBe(403);
        });

        it('does not save a chat when the solution belongs to another non-admin user', async () => {
          repository.get.mockResolvedValueOnce(solutionOwnedBy('owner-1'));

          await chat(buildApp(stranger, true, llm), { message: userMessage, solutionId: SOLUTION_ID });

          expect(chatRepository.save).not.toHaveBeenCalled();
        });

        it('passes the solution state to the llm for the owner', async () => {
          const solution = solutionOwnedBy('owner-1');
          repository.get.mockResolvedValueOnce(solution);
          llm.converse.mockResolvedValueOnce(specialistReply);

          await chat(buildApp(owner, true, llm), { message: userMessage, solutionId: SOLUTION_ID });

          expect(llm.converse).toHaveBeenCalledWith(expect.anything(), messages, 'ask', solution.state);
        });

        it('passes the solution state to the llm for a planner admin', async () => {
          const solution = solutionOwnedBy('owner-1');
          repository.get.mockResolvedValueOnce(solution);
          llm.converse.mockResolvedValueOnce(specialistReply);

          await chat(buildApp(admin, true, llm), { message: userMessage, solutionId: SOLUTION_ID });

          expect(llm.converse).toHaveBeenCalledWith(expect.anything(), messages, 'ask', solution.state);
        });
      });
    });
  });

  describe('specialist chat history', () => {
    const OTHER_CHAT_ID = 'd1e2f3a4-b5c6-4d7e-8f90-a1b2c3d4e5f6';
    const get = (path: string, user: User | null = owner, withTenant = true) =>
      request(buildApp(user, withTenant)).get(`/planner/v1/specialists/chats${path}`);
    const remove = (path: string, user: User | null = owner) =>
      request(buildApp(user)).delete(`/planner/v1/specialists/chats${path}`);

    describe('access control', () => {
      const noRole = makeUser('nobody', []);

      it.each([
        ['GET /specialists/chats', () => get('', noRole)],
        ['GET /specialists/chats/export', () => get('/export', noRole)],
        ['GET /specialists/chats/:chatId', () => get(`/${CHAT_ID}`, noRole)],
        ['GET /specialists/chats/:chatId/export', () => get(`/${CHAT_ID}/export`, noRole)],
        ['DELETE /specialists/chats/:chatId', () => remove(`/${CHAT_ID}`, noRole)],
      ])('%s returns 403 for a user without a planner role', async (_name, call) => {
        const res = await call();

        expect(res.status).toBe(403);
      });

      it.each([
        ['GET /specialists/chats', () => get('', noRole)],
        ['GET /specialists/chats/export', () => get('/export', noRole)],
        ['GET /specialists/chats/:chatId', () => get(`/${CHAT_ID}`, noRole)],
        ['GET /specialists/chats/:chatId/export', () => get(`/${CHAT_ID}/export`, noRole)],
        ['DELETE /specialists/chats/:chatId', () => remove(`/${CHAT_ID}`, noRole)],
      ])('%s does not touch the repository for a user without a planner role', async (_name, call) => {
        await call();

        expect(
          chatRepository.find.mock.calls.length +
            chatRepository.get.mock.calls.length +
            chatRepository.delete.mock.calls.length,
        ).toBe(0);
      });
    });

    describe('GET /specialists/chats', () => {
      it('searches only the requesting user\'s chats in the tenant', async () => {
        await get('');

        expect(chatRepository.find).toHaveBeenCalledWith({
          tenantId,
          createdById: 'owner-1',
          service: undefined,
          solutionId: undefined,
        });
      });

      it('scopes the search to a different user when that user asks', async () => {
        await get('', stranger);

        expect(chatRepository.find).toHaveBeenCalledWith(expect.objectContaining({ createdById: 'stranger-1' }));
      });

      it('scopes the search of a planner admin to their own chats', async () => {
        await get('', admin);

        expect(chatRepository.find).toHaveBeenCalledWith(expect.objectContaining({ createdById: 'admin-1' }));
      });

      it('filters by service', async () => {
        await get('?service=form-service');

        expect(chatRepository.find).toHaveBeenCalledWith(expect.objectContaining({ service: 'form-service' }));
      });

      it('filters by solution', async () => {
        await get(`?solutionId=${SOLUTION_ID}`);

        expect(chatRepository.find).toHaveBeenCalledWith(expect.objectContaining({ solutionId: SOLUTION_ID }));
      });

      it('returns 400 when the solutionId filter is not a UUID', async () => {
        const res = await get('?solutionId=abc');

        expect(res.status).toBe(400);
      });

      it('returns 400 when there is no tenant context', async () => {
        const res = await get('', owner, false);

        expect(res.status).toBe(400);
      });

      it('returns summaries without message content', async () => {
        chatRepository.find.mockResolvedValueOnce([storedChat({ solutionId: SOLUTION_ID })]);

        const res = await get('');

        expect(res.body).toEqual({
          results: [
            {
              id: CHAT_ID,
              service: 'form-service',
              solutionId: SOLUTION_ID,
              title: 'Earlier question',
              createdOn: '2026-03-01T10:00:00.000Z',
              updatedOn: '2026-03-01T10:05:00.000Z',
              messageCount: 2,
            },
          ],
        });
      });

      it('preserves the order returned by the repository', async () => {
        chatRepository.find.mockResolvedValueOnce([storedChat({ id: OTHER_CHAT_ID }), storedChat()]);

        const res = await get('');

        expect(res.body.results.map((r: { id: string }) => r.id)).toEqual([OTHER_CHAT_ID, CHAT_ID]);
      });

      it('returns an empty list when the user has no chats', async () => {
        const res = await get('');

        expect(res.body).toEqual({ results: [] });
      });

      it('returns 500 when the repository fails', async () => {
        chatRepository.find.mockRejectedValueOnce(new Error('connection lost'));

        const res = await get('');

        expect(res.status).toBe(500);
      });
    });

    describe('GET /specialists/chats/export', () => {
      it('searches only the requesting user\'s chats', async () => {
        await get('/export', stranger);

        expect(chatRepository.find).toHaveBeenCalledWith(
          expect.objectContaining({ tenantId, createdById: 'stranger-1' }),
        );
      });

      it('applies the service and solution filters', async () => {
        await get(`/export?service=form-service&solutionId=${SOLUTION_ID}`);

        expect(chatRepository.find).toHaveBeenCalledWith(
          expect.objectContaining({ service: 'form-service', solutionId: SOLUTION_ID }),
        );
      });

      it('sets the download filename', async () => {
        const res = await get('/export');

        expect(res.headers['content-disposition']).toBe('attachment; filename="planner-specialist-chats.json"');
      });

      it('includes an export timestamp', async () => {
        const res = await get('/export');

        expect(new Date(res.body.exportedAt).toISOString()).toBe(res.body.exportedAt);
      });

      it('exports full chats without tenant or creator identifiers', async () => {
        chatRepository.find.mockResolvedValueOnce([storedChat({ solutionId: SOLUTION_ID })]);

        const res = await get('/export');

        expect(res.body.chats).toEqual([
          {
            id: CHAT_ID,
            service: 'form-service',
            solutionId: SOLUTION_ID,
            title: 'Earlier question',
            createdByName: 'owner-1',
            createdOn: '2026-03-01T10:00:00.000Z',
            updatedOn: '2026-03-01T10:05:00.000Z',
            messages: storedChat().messages,
          },
        ]);
      });

      it('exports an empty list when the user has no chats', async () => {
        const res = await get('/export');

        expect(res.body.chats).toEqual([]);
      });

      it('is not mistaken for a chat id', async () => {
        await get('/export');

        expect(chatRepository.get).not.toHaveBeenCalled();
      });

      it('returns 400 when the solutionId filter is not a UUID', async () => {
        const res = await get('/export?solutionId=abc');

        expect(res.status).toBe(400);
      });

      it('returns 500 when the repository fails', async () => {
        chatRepository.find.mockRejectedValueOnce(new Error('connection lost'));

        const res = await get('/export');

        expect(res.status).toBe(500);
      });
    });

    describe('GET /specialists/chats/:chatId', () => {
      it('loads the chat within the tenant', async () => {
        chatRepository.get.mockResolvedValueOnce(storedChat());

        await get(`/${CHAT_ID}`);

        expect(chatRepository.get).toHaveBeenCalledWith(tenantId, CHAT_ID);
      });

      it('returns the full chat without tenant or creator identifiers', async () => {
        chatRepository.get.mockResolvedValueOnce(storedChat());

        const res = await get(`/${CHAT_ID}`);

        expect(res.body).toEqual({
          id: CHAT_ID,
          service: 'form-service',
          title: 'Earlier question',
          createdByName: 'owner-1',
          createdOn: '2026-03-01T10:00:00.000Z',
          updatedOn: '2026-03-01T10:05:00.000Z',
          messages: storedChat().messages,
        });
      });

      it('returns 404 when the chat does not exist', async () => {
        chatRepository.get.mockResolvedValueOnce(null);

        const res = await get(`/${CHAT_ID}`);

        expect(res.status).toBe(404);
      });

      it('returns 404 when the chat belongs to another user', async () => {
        chatRepository.get.mockResolvedValueOnce(storedChat());

        const res = await get(`/${CHAT_ID}`, stranger);

        expect(res.status).toBe(404);
      });

      it('returns 404 when a planner admin requests another user\'s chat', async () => {
        chatRepository.get.mockResolvedValueOnce(storedChat());

        const res = await get(`/${CHAT_ID}`, admin);

        expect(res.status).toBe(404);
      });

      it('returns 400 when the chat id is not a UUID', async () => {
        const res = await get('/not-a-uuid');

        expect(res.status).toBe(400);
      });

      it('returns 500 when the repository fails', async () => {
        chatRepository.get.mockRejectedValueOnce(new Error('connection lost'));

        const res = await get(`/${CHAT_ID}`);

        expect(res.status).toBe(500);
      });
    });

    describe('GET /specialists/chats/:chatId/export', () => {
      it('sets a download filename containing the chat id', async () => {
        chatRepository.get.mockResolvedValueOnce(storedChat());

        const res = await get(`/${CHAT_ID}/export`);

        expect(res.headers['content-disposition']).toBe(`attachment; filename="planner-chat-${CHAT_ID}.json"`);
      });

      it('returns the full chat with an export timestamp', async () => {
        chatRepository.get.mockResolvedValueOnce(storedChat());

        const res = await get(`/${CHAT_ID}/export`);

        expect(res.body).toEqual({
          exportedAt: expect.any(String),
          id: CHAT_ID,
          service: 'form-service',
          title: 'Earlier question',
          createdByName: 'owner-1',
          createdOn: '2026-03-01T10:00:00.000Z',
          updatedOn: '2026-03-01T10:05:00.000Z',
          messages: storedChat().messages,
        });
      });

      it('returns 404 when the chat does not exist', async () => {
        chatRepository.get.mockResolvedValueOnce(null);

        const res = await get(`/${CHAT_ID}/export`);

        expect(res.status).toBe(404);
      });

      it('returns 404 when the chat belongs to another user', async () => {
        chatRepository.get.mockResolvedValueOnce(storedChat());

        const res = await get(`/${CHAT_ID}/export`, stranger);

        expect(res.status).toBe(404);
      });

      it('does not set a download header when the chat belongs to another user', async () => {
        chatRepository.get.mockResolvedValueOnce(storedChat());

        const res = await get(`/${CHAT_ID}/export`, stranger);

        expect(res.headers['content-disposition']).toBeUndefined();
      });

      it('returns 400 when the chat id is not a UUID', async () => {
        const res = await get('/not-a-uuid/export');

        expect(res.status).toBe(400);
      });

      it('returns 500 when the repository fails', async () => {
        chatRepository.get.mockRejectedValueOnce(new Error('connection lost'));

        const res = await get(`/${CHAT_ID}/export`);

        expect(res.status).toBe(500);
      });
    });

    describe('DELETE /specialists/chats/:chatId', () => {
      it('returns 204 when the chat is deleted', async () => {
        chatRepository.get.mockResolvedValueOnce(storedChat());

        const res = await remove(`/${CHAT_ID}`);

        expect(res.status).toBe(204);
      });

      it('deletes the chat within the tenant', async () => {
        chatRepository.get.mockResolvedValueOnce(storedChat());

        await remove(`/${CHAT_ID}`);

        expect(chatRepository.delete).toHaveBeenCalledWith(tenantId, CHAT_ID);
      });

      it('returns 404 when the chat does not exist', async () => {
        chatRepository.get.mockResolvedValueOnce(null);

        const res = await remove(`/${CHAT_ID}`);

        expect(res.status).toBe(404);
      });

      it('returns 404 when the chat belongs to another user', async () => {
        chatRepository.get.mockResolvedValueOnce(storedChat());

        const res = await remove(`/${CHAT_ID}`, stranger);

        expect(res.status).toBe(404);
      });

      it('does not delete a chat that belongs to another user', async () => {
        chatRepository.get.mockResolvedValueOnce(storedChat());

        await remove(`/${CHAT_ID}`, admin);

        expect(chatRepository.delete).not.toHaveBeenCalled();
      });

      it('returns 400 when the chat id is not a UUID', async () => {
        const res = await remove('/not-a-uuid');

        expect(res.status).toBe(400);
      });

      it('returns 500 when loading the chat fails', async () => {
        chatRepository.get.mockRejectedValueOnce(new Error('connection lost'));

        const res = await remove(`/${CHAT_ID}`);

        expect(res.status).toBe(500);
      });

      it('returns 500 when deleting the chat fails', async () => {
        chatRepository.get.mockResolvedValueOnce(storedChat());
        chatRepository.delete.mockRejectedValueOnce(new Error('connection lost'));

        const res = await remove(`/${CHAT_ID}`);

        expect(res.status).toBe(500);
      });
    });
  });

  describe('POST /solutions/:id/handoff/:service', () => {
    const handoff = (service: string, body: object = {}) =>
      request(buildApp(owner)).post(`/planner/v1/solutions/${SOLUTION_ID}/handoff/${service}`).send(body);

    beforeEach(() => {
      repository.get.mockResolvedValue(solutionOwnedBy('owner-1'));
    });

    it('returns the specialist workspace path', async () => {
      const res = await handoff('form');

      expect(res.body.workspacePath).toBe('/admin/services/form');
    });

    it('defaults the specialist status to in-workspace', async () => {
      const res = await handoff('form');

      expect(res.body.solution.state.specialists[0]).toMatchObject({ service: 'form-service', status: 'in-workspace' });
    });

    it('records the supplied status and notes', async () => {
      const res = await handoff('form-service', { status: 'completed', notes: 'Form published.' });

      expect(res.body.solution.state.specialists[0]).toMatchObject({ status: 'completed', notes: 'Form published.' });
    });

    it('moves the solution to in-progress', async () => {
      const res = await handoff('form');

      expect(res.body.solution.status).toBe('in-progress');
    });

    it('includes the solution id in the handoff context', async () => {
      const res = await handoff('form');

      expect(res.body.context.solutionId).toBe(SOLUTION_ID);
    });

    it('includes the matching recommendation in the handoff context', async () => {
      const stored = solutionOwnedBy('owner-1');
      stored.state.hypotheses = [
        {
          id: 'h-1',
          title: 'Case Management solution',
          patternId: 'case-management',
          confidence: 'high',
          rationale: '',
          recommendations: [{ service: 'form-service', reason: 'Intake forms.', order: 3 }],
          assumptions: [],
          unknowns: [],
        },
      ];
      repository.get.mockResolvedValueOnce(stored);

      const res = await handoff('form');

      expect(res.body.context.recommendation).toEqual({ service: 'form-service', reason: 'Intake forms.', order: 3 });
    });

    it('replaces earlier progress for the same specialist', async () => {
      const stored = solutionOwnedBy('owner-1');
      stored.state.specialists = [{ service: 'form-service', status: 'consulted', updatedOn: '2026-01-01' }];
      repository.get.mockResolvedValueOnce(stored);

      const res = await handoff('form');

      expect(res.body.solution.state.specialists).toHaveLength(1);
    });

    it('sends a solution-updated event with the handoff operation', async () => {
      await handoff('form');

      expect(eventService.send).toHaveBeenCalledWith(
        expect.objectContaining({ payload: expect.objectContaining({ operation: 'handoff' }) }),
      );
    });

    it('returns 404 for an unknown specialist', async () => {
      const res = await handoff('unknown');

      expect(res.status).toBe(404);
    });

    it('returns 400 for an invalid specialist status', async () => {
      const res = await handoff('form', { status: 'bogus' });

      expect(res.status).toBe(400);
    });
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
