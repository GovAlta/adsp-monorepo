import { adspId } from '@abgov/adsp-service-sdk';
import type { AuditService, EventService, User } from '@abgov/adsp-service-sdk';
import * as express from 'express';
import type { Request } from 'express';
import * as request from 'supertest';
import { Logger } from 'winston';
import {
  PatternCreatedAuditAction,
  PatternDeletedAuditAction,
  PatternUpdatedAuditAction,
  SolutionAdminAccessedAuditAction,
  SolutionAnalyzedAuditAction,
  SolutionCreatedAuditAction,
  SolutionDeletedAuditAction,
  SolutionExportedAuditAction,
  SpecialistChatDeletedAuditAction,
  SpecialistChatExportedAuditAction,
} from './audit';
import type { LlmAnalysis, PlannerLlm } from './llm';
import { BUILT_IN_PATTERNS } from './patterns';
import { PlannerServiceRoles } from './roles';
import { createPlannerRouter } from './router';
import { BusinessPattern, Solution, SpecialistChat } from './types';
import { contentHash } from './versioning';

const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
const SOLUTION_ID = '5f0a1c52-7d0e-4c1b-9a8e-3b6f2d1e4a70';
const CHAT_ID = 'b7e2f6a1-4c3d-4e8f-9a1b-2c3d4e5f6a7b';
const MODEL = 'GOA-Default';
const PROBLEM = 'Residents submit confidential grant applications that officers review.';

const makeUser = (id: string, roles: string[]): User =>
  ({ id, name: id, email: `${id}@example.com`, tenantId, roles, isCore: false }) as unknown as User;

const owner = makeUser('owner-1', [PlannerServiceRoles.User]);
const admin = makeUser('admin-1', [PlannerServiceRoles.Admin]);

const solutionOwnedBy = (createdById: string, state: Partial<Solution['state']> = {}): Solution => ({
  id: SOLUTION_ID,
  tenantId,
  name: 'Grants',
  scenario: 'new',
  status: 'draft',
  createdById,
  createdByName: createdById,
  createdOn: new Date(),
  updatedOn: new Date(),
  version: 1,
  state: {
    problemStatement: PROBLEM,
    concepts: [],
    decisions: [],
    questions: [],
    patternMatches: [],
    hypotheses: [],
    specialists: [],
    nextSteps: [],
    ...state,
  },
});

const storedChat = (overrides: Partial<SpecialistChat> = {}): SpecialistChat => ({
  id: CHAT_ID,
  tenantId,
  service: 'form-service',
  solutionId: SOLUTION_ID,
  title: 'Private question about grants',
  createdById: 'owner-1',
  createdByName: 'owner-1',
  createdOn: new Date(),
  updatedOn: new Date(),
  messages: [{ role: 'user', content: 'Private question about grants', at: '2026-03-01T10:00:00.000Z' }],
  ...overrides,
});

const aiAnalysis: LlmAnalysis = {
  concepts: [],
  matches: [],
  hypotheses: [],
  questions: [],
  resolvedQuestionIds: [],
  reply: 'Looks like case management.',
  model: MODEL,
};

describe('planner router audit', () => {
  const repository = { get: jest.fn(), find: jest.fn(), save: jest.fn(), delete: jest.fn() };
  const patternRepository = { find: jest.fn(), save: jest.fn(), delete: jest.fn() };
  const chatRepository = {
    find: jest.fn(),
    findBySolution: jest.fn(),
    get: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const versionRepository = {
    list: jest.fn(),
    get: jest.fn(),
    latest: jest.fn(),
    create: jest.fn(),
    rename: jest.fn(),
  };
  const eventService = { send: jest.fn() };
  const auditService = { record: jest.fn(), query: jest.fn(), flush: jest.fn(), droppedEventCount: 0 };
  const logger = { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const getConfiguration = jest.fn();
  const llm = {
    model: MODEL,
    analyze: jest.fn(),
    discover: jest.fn(),
    blueprint: jest.fn(),
    acceptanceCriteria: jest.fn(),
    consult: jest.fn(),
    converse: jest.fn(),
  };

  const buildApp = (user: User = owner, withLlm?: PlannerLlm) => {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.tenant = { id: tenantId } as unknown as Request['tenant'];
      req.user = user;
      req.getConfiguration = getConfiguration;
      next();
    });
    app.use(
      '/planner/v1',
      createPlannerRouter({
        logger: logger as unknown as Logger,
        solutionRepository: repository,
        patternRepository,
        specialistChatRepository: chatRepository,
        solutionVersionRepository: versionRepository,
        eventService: eventService as unknown as EventService,
        auditService: auditService as unknown as AuditService,
        llm: withLlm,
      }),
    );
    app.use((err: { extra?: { statusCode?: number }; message: string }, _req, res, _next) => {
      res.status(err.extra?.statusCode || 500).send({ error: err.message });
    });
    return app;
  };
  const aiApp = (user: User = owner) => buildApp(user, llm as unknown as PlannerLlm);

  const recorded = (action: { name: string }) =>
    auditService.record.mock.calls.filter(([recordedAction]) => recordedAction.name === action.name).map(([, d]) => d);
  // The admin access record is sent when the response finishes.
  const settle = () => new Promise((resolve) => setImmediate(resolve));

  beforeEach(() => {
    repository.save.mockImplementation(async (s: Solution) => s);
    patternRepository.find.mockResolvedValue([]);
    patternRepository.save.mockImplementation(async (_tenantId: unknown, pattern: BusinessPattern) => pattern);
    getConfiguration.mockResolvedValue([undefined]);
    chatRepository.find.mockResolvedValue([]);
    chatRepository.findBySolution.mockResolvedValue([]);
    chatRepository.save.mockImplementation(async (c: SpecialistChat) => c);
    versionRepository.create.mockImplementation(async (_tenantId: unknown, _solutionId: string, content) => ({
      number: 2,
      name: 'Version 2',
      createdOn: new Date(),
      contentHash: contentHash(content),
      content,
      changedSections: [],
    }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('solutions', () => {
    it('records planner.solution.created without the problem statement', async () => {
      const res = await request(buildApp())
        .post('/planner/v1/solutions')
        .send({ name: 'Grants', scenario: 'prototype', problemStatement: PROBLEM });

      expect(res.status).toBe(201);
      expect(auditService.record).toHaveBeenCalledWith(SolutionCreatedAuditAction, {
        tenantId,
        actor: { id: 'owner-1', type: 'user', name: 'owner-1', roles: [PlannerServiceRoles.User] },
        resource: { type: 'solution', id: res.body.id, name: 'Grants' },
        correlationId: undefined,
        metadata: { scenario: 'prototype' },
      });
      expect(JSON.stringify(auditService.record.mock.calls)).not.toContain(PROBLEM);
    });

    it('does not record a solution that fails validation', async () => {
      await request(buildApp()).post('/planner/v1/solutions').send({});

      expect(auditService.record).not.toHaveBeenCalled();
    });

    it('records planner.solution.deleted', async () => {
      repository.get.mockResolvedValue(solutionOwnedBy('owner-1'));
      repository.delete.mockResolvedValue(true);

      await request(buildApp()).delete(`/planner/v1/solutions/${SOLUTION_ID}`);

      expect(recorded(SolutionDeletedAuditAction)).toEqual([
        expect.objectContaining({
          resource: { type: 'solution', id: SOLUTION_ID, name: 'Grants' },
          metadata: { scenario: 'new', status: 'draft' },
        }),
      ]);
    });

    it('does not record a delete that removed nothing', async () => {
      repository.get.mockResolvedValue(solutionOwnedBy('owner-1'));
      repository.delete.mockResolvedValue(false);

      await request(buildApp()).delete(`/planner/v1/solutions/${SOLUTION_ID}`);

      expect(auditService.record).not.toHaveBeenCalled();
    });

    it('does not record an admin who is not allowed to delete another user’s solution', async () => {
      repository.get.mockResolvedValue(solutionOwnedBy('owner-1'));

      const res = await request(buildApp(admin)).delete(`/planner/v1/solutions/${SOLUTION_ID}`);
      await settle();

      expect(res.status).toBe(403);
      expect(auditService.record).not.toHaveBeenCalled();
    });
  });

  describe('exports', () => {
    it('records planner.solution.exported for the solution, without admin access for the owner', async () => {
      repository.get.mockResolvedValue(solutionOwnedBy('owner-1'));
      versionRepository.latest.mockResolvedValue(null);

      await request(buildApp()).get(`/planner/v1/solutions/${SOLUTION_ID}/export`);
      await settle();

      expect(recorded(SolutionExportedAuditAction)).toEqual([
        expect.objectContaining({
          resource: { type: 'solution', id: SOLUTION_ID, name: 'Grants' },
          metadata: { scope: 'solution', version: 1, unsavedChanges: true },
        }),
      ]);
      expect(recorded(SolutionAdminAccessedAuditAction)).toEqual([]);
    });

    it('records planner.solution.exported for a version', async () => {
      const solution = solutionOwnedBy('owner-1');
      repository.get.mockResolvedValue(solution);
      versionRepository.get.mockResolvedValue({
        number: 1,
        name: 'Version 1',
        createdOn: new Date(),
        contentHash: 'hash',
        content: { name: 'Grants', scenario: 'new', status: 'draft', state: solution.state, specialistChats: [] },
        changedSections: [],
      });

      await request(buildApp()).get(`/planner/v1/solutions/${SOLUTION_ID}/versions/1/export`);

      expect(recorded(SolutionExportedAuditAction)).toEqual([
        expect.objectContaining({ metadata: { scope: 'version', version: 1 } }),
      ]);
    });

    it('records the export and admin access when an admin exports another user’s solution', async () => {
      repository.get.mockResolvedValue(solutionOwnedBy('owner-1'));
      versionRepository.latest.mockResolvedValue(null);

      await request(buildApp(admin)).get(`/planner/v1/solutions/${SOLUTION_ID}/export`);
      await settle();

      expect(recorded(SolutionExportedAuditAction)).toHaveLength(1);
      expect(recorded(SolutionAdminAccessedAuditAction)).toEqual([
        expect.objectContaining({
          actor: expect.objectContaining({ id: 'admin-1' }),
          metadata: { ownerId: 'owner-1', operation: 'export' },
        }),
      ]);
    });
  });

  describe('admin access', () => {
    it.each([
      ['reads', 'get', '', 'read'],
      ['lists the versions of', 'get', '/versions', 'read'],
      ['changes', 'patch', '', 'update'],
    ])(
      'records planner.solution.admin-accessed when an admin %s another user’s solution',
      async (_, method, path, op) => {
        repository.get.mockResolvedValue(solutionOwnedBy('owner-1'));
        versionRepository.latest.mockResolvedValue(null);
        versionRepository.list.mockResolvedValue([]);

        const res = await request(buildApp(admin))[method](`/planner/v1/solutions/${SOLUTION_ID}${path}`).send({});
        await settle();

        expect(res.status).toBe(200);
        expect(recorded(SolutionAdminAccessedAuditAction)).toEqual([
          {
            tenantId,
            actor: { id: 'admin-1', type: 'user', name: 'admin-1', roles: [PlannerServiceRoles.Admin] },
            resource: { type: 'solution', id: SOLUTION_ID, name: 'Grants' },
            correlationId: undefined,
            metadata: { ownerId: 'owner-1', operation: op },
          },
        ]);
      },
    );

    it('does not record the owner reading their own solution', async () => {
      repository.get.mockResolvedValue(solutionOwnedBy('owner-1'));

      await request(buildApp()).get(`/planner/v1/solutions/${SOLUTION_ID}`);
      await settle();

      expect(auditService.record).not.toHaveBeenCalled();
    });

    it('does not record an admin reading their own solution', async () => {
      repository.get.mockResolvedValue(solutionOwnedBy('admin-1'));

      await request(buildApp(admin)).get(`/planner/v1/solutions/${SOLUTION_ID}`);
      await settle();

      expect(auditService.record).not.toHaveBeenCalled();
    });

    it('does not record an admin request that fails', async () => {
      repository.get.mockResolvedValue(solutionOwnedBy('owner-1'));
      repository.save.mockRejectedValue(new Error('database unavailable'));

      const res = await request(buildApp(admin)).patch(`/planner/v1/solutions/${SOLUTION_ID}`).send({ name: 'x' });
      await settle();

      expect(res.status).toBe(500);
      expect(auditService.record).not.toHaveBeenCalled();
    });

    it('does not record admin listing of solutions', async () => {
      repository.find.mockResolvedValue({ results: [solutionOwnedBy('owner-1')], page: {} });

      await request(buildApp(admin)).get('/planner/v1/solutions');
      await settle();

      expect(auditService.record).not.toHaveBeenCalled();
    });
  });

  describe('planner.solution.analyzed', () => {
    beforeEach(() => {
      repository.get.mockResolvedValue(solutionOwnedBy('owner-1'));
    });

    it('records an AI analysis with the mode and model but no problem text', async () => {
      llm.analyze.mockResolvedValueOnce(aiAnalysis);

      await request(aiApp()).post(`/planner/v1/solutions/${SOLUTION_ID}/analyze`).send({});

      expect(recorded(SolutionAnalyzedAuditAction)).toEqual([
        expect.objectContaining({
          resource: { type: 'solution', id: SOLUTION_ID, name: 'Grants' },
          metadata: { endpoint: 'analyze', mode: 'ai', model: MODEL, fellBack: false },
        }),
      ]);
      expect(JSON.stringify(auditService.record.mock.calls)).not.toContain(PROBLEM);
    });

    it('records the fallback to rules when the model is unavailable', async () => {
      llm.analyze.mockRejectedValueOnce(new Error('Model request failed (HTTP 503)'));

      await request(aiApp()).post(`/planner/v1/solutions/${SOLUTION_ID}/analyze`).send({});

      expect(recorded(SolutionAnalyzedAuditAction)).toEqual([
        expect.objectContaining({ metadata: { endpoint: 'analyze', mode: 'rules', model: MODEL, fellBack: true } }),
      ]);
    });

    it('does not record a rules analysis, since nothing is sent to the model', async () => {
      await request(aiApp()).post(`/planner/v1/solutions/${SOLUTION_ID}/analyze`).send({ mode: 'rules' });

      expect(llm.analyze).not.toHaveBeenCalled();
      expect(recorded(SolutionAnalyzedAuditAction)).toEqual([]);
    });

    it('does not record when no model is configured', async () => {
      await request(buildApp()).post(`/planner/v1/solutions/${SOLUTION_ID}/analyze`).send({});

      expect(recorded(SolutionAnalyzedAuditAction)).toEqual([]);
    });

    it('records a chat refinement without the message', async () => {
      llm.analyze.mockResolvedValueOnce(aiAnalysis);

      await request(aiApp())
        .post(`/planner/v1/solutions/${SOLUTION_ID}/chat`)
        .send({ message: 'Officers need approval limits' });

      expect(recorded(SolutionAnalyzedAuditAction)).toEqual([
        expect.objectContaining({ metadata: { endpoint: 'chat', mode: 'ai', model: MODEL, fellBack: false } }),
      ]);
      expect(JSON.stringify(auditService.record.mock.calls)).not.toContain('approval limits');
    });

    it('records discovery', async () => {
      llm.discover.mockResolvedValueOnce({
        reply: 'Who uses it?',
        factors: [{ id: 'users', score: 10 }],
        model: MODEL,
      });

      await request(aiApp()).post(`/planner/v1/solutions/${SOLUTION_ID}/discovery`).send({});

      expect(recorded(SolutionAnalyzedAuditAction)).toEqual([
        expect.objectContaining({ metadata: { endpoint: 'discovery', mode: 'ai', model: MODEL, fellBack: false } }),
      ]);
    });

    it('records a specialist consultation with the service', async () => {
      llm.consult.mockResolvedValueOnce({
        advice: 'Use a form.',
        questions: [],
        risks: [],
        supports: [],
        constraints: [],
        model: MODEL,
      });

      await request(aiApp()).post(`/planner/v1/solutions/${SOLUTION_ID}/consult/form-service`).send({});

      expect(recorded(SolutionAnalyzedAuditAction)).toEqual([
        expect.objectContaining({
          metadata: { endpoint: 'consult', mode: 'ai', model: MODEL, fellBack: false, service: 'form-service' },
        }),
      ]);
    });

    it('records a blueprint that fell back to rules', async () => {
      repository.get.mockResolvedValue(
        solutionOwnedBy('owner-1', {
          hypotheses: [
            {
              id: 'h-1',
              title: 'Grant case workflow',
              patternId: 'case-management',
              confidence: 'high',
              rationale: 'Cases',
              recommendations: [{ service: 'form-service', reason: 'Collect applications', order: 1 }],
              assumptions: [],
              unknowns: [],
            },
          ],
        }),
      );
      llm.consult.mockRejectedValue(new Error('Model request failed'));
      llm.blueprint.mockRejectedValue(new Error('Model request failed'));

      const res = await request(aiApp()).post(`/planner/v1/solutions/${SOLUTION_ID}/blueprint`).send({});

      expect(res.status).toBe(200);
      expect(recorded(SolutionAnalyzedAuditAction)).toEqual([
        expect.objectContaining({ metadata: { endpoint: 'blueprint', mode: 'rules', model: MODEL, fellBack: true } }),
      ]);
    });

    it('records a specialist chat with solution context, and nothing without it', async () => {
      llm.converse.mockResolvedValue({ reply: 'Enable drafts.', model: MODEL });

      await request(aiApp())
        .post('/planner/v1/specialists/form-service/chat')
        .send({ message: 'How do drafts work?', solutionId: SOLUTION_ID });
      await request(aiApp()).post('/planner/v1/specialists/form-service/chat').send({ message: 'Hello' });

      expect(recorded(SolutionAnalyzedAuditAction)).toEqual([
        expect.objectContaining({
          metadata: { endpoint: 'specialist-chat', mode: 'ai', model: MODEL, fellBack: false, service: 'form-service' },
        }),
      ]);
    });

    it('records admin access when an admin chats with a specialist about another user’s solution', async () => {
      llm.converse.mockResolvedValue({ reply: 'Enable drafts.', model: MODEL });

      await request(aiApp(admin))
        .post('/planner/v1/specialists/form-service/chat')
        .send({ message: 'How do drafts work?', solutionId: SOLUTION_ID });

      expect(recorded(SolutionAdminAccessedAuditAction)).toEqual([
        expect.objectContaining({ metadata: { ownerId: 'owner-1', operation: 'read' } }),
      ]);
    });
  });

  describe('patterns', () => {
    const body = {
      name: 'Grant intake',
      domainLanguage: ['grant'],
      strongSignals: [{ description: 'Grants', keywords: ['grant'] }],
      serviceMappings: [{ service: 'form-service', reason: 'Intake' }],
    };

    it('records planner.pattern.created', async () => {
      await request(buildApp(admin)).post('/planner/v1/patterns').send(body);

      expect(auditService.record).toHaveBeenCalledWith(
        PatternCreatedAuditAction,
        expect.objectContaining({
          tenantId,
          resource: { type: 'pattern', id: 'grant-intake', name: 'Grant intake' },
          metadata: { source: 'custom' },
        }),
      );
    });

    it('records planner.pattern.updated with a change set when a built-in is customized', async () => {
      const builtIn = BUILT_IN_PATTERNS.find((p) => p.id === 'case-management');

      await request(buildApp(admin))
        .put('/planner/v1/patterns/case-management')
        .send({ ...builtIn, name: 'Case work' });

      const [details] = recorded(PatternUpdatedAuditAction);
      expect(details.metadata).toEqual({ source: 'customized', previousSource: 'built-in' });
      expect(details.changeSet.before.name).toBe(builtIn.name);
      expect(details.changeSet.after.name).toBe('Case work');
      expect(details.changeSet.before.source).toBeUndefined();
    });

    it('records planner.pattern.deleted for a reset customized built-in', async () => {
      patternRepository.find.mockResolvedValue([{ ...BUILT_IN_PATTERNS[0], name: 'Custom name' }]);
      patternRepository.delete.mockResolvedValue(true);

      await request(buildApp(admin)).delete(`/planner/v1/patterns/${BUILT_IN_PATTERNS[0].id}`);

      expect(auditService.record).toHaveBeenCalledWith(
        PatternDeletedAuditAction,
        expect.objectContaining({
          resource: { type: 'pattern', id: BUILT_IN_PATTERNS[0].id, name: 'Custom name' },
          metadata: { source: 'customized' },
        }),
      );
    });

    it('does not record a pattern that cannot be deleted', async () => {
      patternRepository.delete.mockResolvedValue(false);

      await request(buildApp(admin)).delete(`/planner/v1/patterns/${BUILT_IN_PATTERNS[0].id}`);

      expect(auditService.record).not.toHaveBeenCalled();
    });

    it('does not record a user who is not a planner admin', async () => {
      await request(buildApp(owner)).post('/planner/v1/patterns').send(body);

      expect(auditService.record).not.toHaveBeenCalled();
    });
  });

  describe('specialist chats', () => {
    it('records planner.specialist-chat.exported for one chat without its title or messages', async () => {
      chatRepository.get.mockResolvedValue(storedChat());

      await request(buildApp()).get(`/planner/v1/specialists/chats/${CHAT_ID}/export`);

      expect(recorded(SpecialistChatExportedAuditAction)).toEqual([
        expect.objectContaining({
          resource: { type: 'specialist-chat', id: CHAT_ID },
          metadata: { scope: 'single', chatCount: 1, service: 'form-service', solutionId: SOLUTION_ID },
        }),
      ]);
      expect(JSON.stringify(auditService.record.mock.calls)).not.toContain('Private question');
    });

    it('records planner.specialist-chat.exported for all chats without a resource', async () => {
      chatRepository.find.mockResolvedValue([storedChat(), storedChat({ id: 'other' })]);

      await request(buildApp()).get(
        `/planner/v1/specialists/chats/export?service=form-service&solutionId=${SOLUTION_ID}`,
      );

      const [details] = recorded(SpecialistChatExportedAuditAction);
      expect(details.resource).toBeUndefined();
      expect(details.metadata).toEqual({
        scope: 'all',
        chatCount: 2,
        service: 'form-service',
        solutionId: SOLUTION_ID,
      });
    });

    it('does not record an unknown service filter', async () => {
      await request(buildApp()).get('/planner/v1/specialists/chats/export?service=free%20text');

      expect(recorded(SpecialistChatExportedAuditAction)[0].metadata).toEqual({ scope: 'all', chatCount: 0 });
    });

    it('records planner.specialist-chat.deleted', async () => {
      chatRepository.get.mockResolvedValue(storedChat());

      await request(buildApp()).delete(`/planner/v1/specialists/chats/${CHAT_ID}`);

      expect(auditService.record).toHaveBeenCalledWith(
        SpecialistChatDeletedAuditAction,
        expect.objectContaining({
          resource: { type: 'specialist-chat', id: CHAT_ID },
          metadata: { service: 'form-service', solutionId: SOLUTION_ID },
        }),
      );
    });

    it('does not record deleting another user’s chat', async () => {
      chatRepository.get.mockResolvedValue(storedChat({ createdById: 'someone-else' }));

      await request(buildApp()).delete(`/planner/v1/specialists/chats/${CHAT_ID}`);

      expect(auditService.record).not.toHaveBeenCalled();
    });
  });

  it('does not fail the request when audit recording fails', async () => {
    auditService.record.mockRejectedValue(new Error('audit unavailable'));
    chatRepository.get.mockResolvedValue(storedChat());

    const res = await request(buildApp()).delete(`/planner/v1/specialists/chats/${CHAT_ID}`);
    await settle();

    expect(res.status).toBe(204);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('audit unavailable'), expect.anything());
  });
});
