import { adspId } from '@abgov/adsp-service-sdk';
import type { EventService, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import * as express from 'express';
import type { Request, Response } from 'express';
import * as request from 'supertest';
import { Logger } from 'winston';
import { createPlannerRouter, getSolution, requirePlannerUser } from './router';
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

describe('planner router routes', () => {
  const SOLUTION_ID = '5f0a1c52-7d0e-4c1b-9a8e-3b6f2d1e4a70';
  const owner = makeUser('owner-1', [PlannerServiceRoles.User]);
  const admin = makeUser('admin-1', [PlannerServiceRoles.Admin]);
  const stranger = makeUser('stranger-1', [PlannerServiceRoles.User]);

  const repository = { get: jest.fn(), find: jest.fn(), save: jest.fn(), delete: jest.fn() };
  const eventService = { send: jest.fn() };
  const logger = { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const getConfiguration = jest.fn();

  const buildApp = (user: User | null = owner, withTenant = true) => {
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
        eventService: eventService as unknown as EventService,
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
    getConfiguration.mockResolvedValue([undefined]);
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
