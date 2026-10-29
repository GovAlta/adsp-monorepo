import { adspId } from '@abgov/adsp-service-sdk';
import type { EventService, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import * as express from 'express';
import type { Request } from 'express';
import * as request from 'supertest';
import type { SolutionVersion } from './repository';
import { PlannerServiceRoles } from './roles';
import { BlueprintComponent, ComponentReview, Solution, SpecialistChat } from './types';
import { contentHash, versionContent } from './versioning';
import { createVersionRouter } from './versionRouter';

const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

const makeUser = (id: string, roles: string[]): User =>
  ({ id, name: id, tenantId, roles, isCore: false }) as unknown as User;

describe('version router', () => {
  const SOLUTION_ID = '5f0a1c52-7d0e-4c1b-9a8e-3b6f2d1e4a70';
  const CHAT_ID = 'b7e2f6a1-4c3d-4e8f-9a1b-2c3d4e5f6a7b';
  const owner = makeUser('owner-1', [PlannerServiceRoles.User]);
  const admin = makeUser('admin-1', [PlannerServiceRoles.Admin]);
  const stranger = makeUser('stranger-1', [PlannerServiceRoles.User]);

  const repository = { get: jest.fn(), find: jest.fn(), save: jest.fn(), delete: jest.fn() };
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

  const buildApp = (user: User = owner) => {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.tenant = { id: tenantId } as unknown as Request['tenant'];
      req.user = user;
      next();
    });
    app.use(
      '/planner/v1',
      createVersionRouter({
        solutionRepository: repository,
        specialistChatRepository: chatRepository,
        solutionVersionRepository: versionRepository,
        eventService: eventService as unknown as EventService,
      }),
    );
    app.use((err: { extra?: { statusCode?: number }; message: string }, _req, res, _next) => {
      res.status(err.extra?.statusCode || 500).send({ error: err.message });
    });
    return app;
  };

  const solutionOwnedBy = (createdById: string): Solution => ({
    id: SOLUTION_ID,
    tenantId,
    name: 'S',
    scenario: 'new',
    status: 'draft',
    createdById,
    createdByName: 'n',
    createdOn: new Date(),
    updatedOn: new Date(),
    version: 1,
    state: {
      problemStatement: '',
      concepts: [],
      decisions: [],
      questions: [],
      patternMatches: [],
      hypotheses: [],
      specialists: [],
      nextSteps: [],
    },
  });

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

  const blueprintComponent = (order: number, review?: ComponentReview): BlueprintComponent => ({
    order,
    service: 'form-service',
    type: 'Form definition',
    name: `Component ${order}`,
    purpose: 'Collects applications',
    dependsOn: [],
    openDecisions: [],
    target: 'adsp',
    setup: { where: 'Tenant admin', docs: 'https://docs', how: 'Create it' },
    review,
  });

  const withComponents = (base: Solution, components: BlueprintComponent[]): Solution => ({
    ...base,
    state: {
      ...base.state,
      blueprint: { generatedOn: 'x', mode: 'rules', components } as Solution['state']['blueprint'],
    },
  });

  const savedVersion = (
    number: number,
    solution: Solution,
    chats: SpecialistChat[] = [],
    createdOn = new Date('2026-04-01T09:00:00.000Z'),
  ): SolutionVersion => {
    const content = versionContent(solution, chats);
    return { number, name: `Version ${number}`, createdOn, contentHash: contentHash(content), content };
  };

  beforeEach(() => {
    chatRepository.findBySolution.mockResolvedValue([]);
    versionRepository.create.mockImplementation(async (_tenantId: unknown, _solutionId: string, content) => ({
      number: 1,
      name: 'Version 1',
      createdOn: new Date('2026-04-01T09:00:00.000Z'),
      contentHash: contentHash(content),
      content,
    }));
  });

  afterEach(() => {
    jest.resetAllMocks();
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
        version: 1,
        exportedAt: expect.any(String),
        state: expect.objectContaining({ questions: [] }),
      });
    });

    it('does not expose the tenant id', async () => {
      const res = await exportSolution();

      expect(res.body.tenantId).toBeUndefined();
    });

    it('leaves rejected components out of the export', async () => {
      repository.get.mockResolvedValueOnce(
        withComponents(solutionOwnedBy('owner-1'), [
          blueprintComponent(1, 'approved'),
          blueprintComponent(2, 'rejected'),
          blueprintComponent(3),
        ]),
      );

      const res = await exportSolution();

      expect(res.body.state.blueprint.components.map((c: BlueprintComponent) => c.order)).toEqual([1, 3]);
    });

    it("allows an admin to export another user's solution", async () => {
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

    it('reports the latest version when nothing changed since it was saved', async () => {
      const createdOn = new Date('2026-04-02T09:00:00.000Z');
      versionRepository.latest.mockResolvedValueOnce(savedVersion(1, solutionOwnedBy('owner-1'), [], createdOn));

      const res = await exportSolution();

      expect(res.body).toMatchObject({
        version: 1,
        unsavedChanges: false,
        initial: true,
        changedSections: [],
        lastUpdated: createdOn.toISOString(),
      });
    });

    it('lists what the latest version changed from the one before it', async () => {
      const solution = solutionOwnedBy('owner-1');
      versionRepository.latest.mockResolvedValueOnce(savedVersion(2, solution));
      versionRepository.get.mockResolvedValueOnce(
        savedVersion(1, { ...solution, state: { ...solution.state, problemStatement: 'Earlier draft.' } }),
      );

      const res = await exportSolution();

      expect(versionRepository.get).toHaveBeenCalledWith(tenantId, SOLUTION_ID, 1);
      expect(res.body).toMatchObject({
        version: 2,
        unsavedChanges: false,
        initial: false,
        changedSections: ['Problem statement'],
      });
    });

    it('labels changes since the latest version as unsaved', async () => {
      const solution = { ...solutionOwnedBy('owner-1'), updatedOn: new Date('2026-04-03T09:00:00.000Z') };
      repository.get.mockResolvedValueOnce(solution);
      versionRepository.latest.mockResolvedValueOnce(
        savedVersion(1, { ...solution, state: { ...solution.state, problemStatement: 'Earlier draft.' } }),
      );

      const res = await exportSolution();

      expect(res.body).toMatchObject({
        version: 1,
        unsavedChanges: true,
        initial: false,
        changedSections: ['Problem statement'],
        lastUpdated: '2026-04-03T09:00:00.000Z',
      });
    });

    it('counts a newly linked specialist chat as an unsaved change', async () => {
      versionRepository.latest.mockResolvedValueOnce(savedVersion(1, solutionOwnedBy('owner-1')));
      chatRepository.findBySolution.mockResolvedValueOnce([storedChat({ solutionId: SOLUTION_ID })]);

      const res = await exportSolution();

      expect(chatRepository.findBySolution).toHaveBeenCalledWith(tenantId, SOLUTION_ID);
      expect(res.body).toMatchObject({ unsavedChanges: true, changedSections: ['Specialist consultations'] });
    });

    it('includes the linked specialist chats', async () => {
      chatRepository.findBySolution.mockResolvedValueOnce([storedChat({ solutionId: SOLUTION_ID })]);

      const res = await exportSolution();

      expect(res.body.specialistChats).toEqual([
        expect.objectContaining({ id: CHAT_ID, title: 'Earlier question', messages: expect.any(Array) }),
      ]);
    });

    it('treats a solution with no saved version as unsaved and initial', async () => {
      versionRepository.latest.mockResolvedValueOnce(null);

      const res = await exportSolution();

      expect(res.body).toMatchObject({ version: 1, unsavedChanges: true, initial: true, changedSections: [] });
    });

    it('flags the blueprint as out of date when the problem statement changed after it was generated', async () => {
      const base = solutionOwnedBy('owner-1');
      repository.get.mockResolvedValueOnce({
        ...base,
        state: {
          ...base.state,
          problemStatementUpdatedOn: '2026-03-01T00:00:00.000Z',
          blueprint: { generatedOn: '2026-02-01T00:00:00.000Z', mode: 'rules' } as Solution['state']['blueprint'],
        },
      });

      const res = await exportSolution();

      expect(res.body.blueprintOutOfDate).toBe(true);
    });

    it('does not flag the blueprint as out of date when it was generated after the last problem statement edit', async () => {
      const base = solutionOwnedBy('owner-1');
      repository.get.mockResolvedValueOnce({
        ...base,
        state: {
          ...base.state,
          problemStatementUpdatedOn: '2026-01-01T00:00:00.000Z',
          blueprint: { generatedOn: '2026-02-01T00:00:00.000Z', mode: 'rules' } as Solution['state']['blueprint'],
        },
      });

      const res = await exportSolution();

      expect(res.body.blueprintOutOfDate).toBe(false);
    });
  });

  describe('GET /solutions/:id/versions', () => {
    const listVersions = (user: User = owner) =>
      request(buildApp(user)).get(`/planner/v1/solutions/${SOLUTION_ID}/versions`);

    beforeEach(() => {
      repository.get.mockResolvedValue(solutionOwnedBy('owner-1'));
    });

    it('returns the saved versions with the latest number', async () => {
      const summaries = [
        { number: 2, name: 'Approved scope', createdOn: new Date('2026-04-02T09:00:00.000Z') },
        { number: 1, name: 'Version 1', createdOn: new Date('2026-04-01T09:00:00.000Z') },
      ];
      versionRepository.list.mockResolvedValueOnce(summaries);
      versionRepository.latest.mockResolvedValueOnce(savedVersion(2, solutionOwnedBy('owner-1')));

      const res = await listVersions();

      expect(versionRepository.list).toHaveBeenCalledWith(tenantId, SOLUTION_ID);
      expect(res.body).toEqual({
        latest: 2,
        unsavedChanges: false,
        results: summaries.map((summary) => ({ ...summary, createdOn: summary.createdOn.toISOString() })),
      });
    });

    it('reports unsaved changes when the solution differs from the latest version', async () => {
      versionRepository.list.mockResolvedValueOnce([]);
      versionRepository.latest.mockResolvedValueOnce(savedVersion(1, { ...solutionOwnedBy('owner-1'), name: 'Old' }));

      const res = await listVersions();

      expect(res.body.unsavedChanges).toBe(true);
    });

    it('returns 403 for a user who does not own the solution', async () => {
      const res = await listVersions(stranger);

      expect(res.status).toBe(403);
    });

    it('returns 404 when the solution does not exist', async () => {
      repository.get.mockResolvedValueOnce(null);

      const res = await listVersions();

      expect(res.status).toBe(404);
    });
  });

  describe('POST /solutions/:id/versions', () => {
    const saveVersion = (user: User = owner) =>
      request(buildApp(user)).post(`/planner/v1/solutions/${SOLUTION_ID}/versions`);

    beforeEach(() => {
      repository.get.mockResolvedValue(solutionOwnedBy('owner-1'));
    });

    it('saves the current content and linked chats as a new version', async () => {
      const solution = solutionOwnedBy('owner-1');
      const chats = [storedChat({ solutionId: SOLUTION_ID })];
      chatRepository.findBySolution.mockResolvedValueOnce(chats);
      versionRepository.latest.mockResolvedValueOnce(savedVersion(1, { ...solution, name: 'Old' }));

      await saveVersion();

      expect(versionRepository.create).toHaveBeenCalledWith(tenantId, SOLUTION_ID, versionContent(solution, chats));
    });

    it('responds 201 with the version summary', async () => {
      const res = await saveVersion();

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ number: 1, name: 'Version 1', createdOn: '2026-04-01T09:00:00.000Z' });
    });

    it('returns 400 when nothing changed since the latest version', async () => {
      versionRepository.latest.mockResolvedValueOnce(savedVersion(2, solutionOwnedBy('owner-1')));

      const res = await saveVersion();

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('No changes since version 2.');
      expect(versionRepository.create).not.toHaveBeenCalled();
    });

    it('returns 409 when another save took the version number first', async () => {
      versionRepository.create.mockRejectedValueOnce(
        new InvalidOperationError('Version 2 was saved by another request.', { statusCode: 409 }),
      );

      const res = await saveVersion();

      expect(res.status).toBe(409);
    });

    it('sends a version-saved update event', async () => {
      await saveVersion();

      expect(eventService.send).toHaveBeenCalledWith(
        expect.objectContaining({ payload: expect.objectContaining({ operation: 'version-saved' }) }),
      );
    });

    it('returns 403 for a user who does not own the solution', async () => {
      const res = await saveVersion(stranger);

      expect(res.status).toBe(403);
      expect(versionRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /solutions/:id/versions/:number', () => {
    const renameVersion = (body: object, number: number | string = 2, user: User = owner) =>
      request(buildApp(user)).patch(`/planner/v1/solutions/${SOLUTION_ID}/versions/${number}`).send(body);

    beforeEach(() => {
      repository.get.mockResolvedValue(solutionOwnedBy('owner-1'));
      versionRepository.rename.mockImplementation(async (_tenantId, _solutionId, number: number, name: string) => ({
        ...savedVersion(number, solutionOwnedBy('owner-1')),
        name,
      }));
    });

    it('renames the version with the trimmed name', async () => {
      const res = await renameVersion({ name: '  Approved scope  ' });

      expect(versionRepository.rename).toHaveBeenCalledWith(tenantId, SOLUTION_ID, 2, 'Approved scope');
      expect(res.body).toEqual({ number: 2, name: 'Approved scope', createdOn: '2026-04-01T09:00:00.000Z' });
    });

    it('falls back to the default name when the name is blank', async () => {
      await renameVersion({ name: '   ' });

      expect(versionRepository.rename).toHaveBeenCalledWith(tenantId, SOLUTION_ID, 2, 'Version 2');
    });

    test.each([
      ['a name over 100 characters', { name: 'x'.repeat(101) }, 2],
      ['a name that is not a string', { name: 42 }, 2],
      ['version number 0', { name: 'Scope' }, 0],
    ])('returns 400 for %s', async (_case, body, number) => {
      const res = await renameVersion(body, number);

      expect(res.status).toBe(400);
      expect(versionRepository.rename).not.toHaveBeenCalled();
    });

    it('returns 404 when the version does not exist', async () => {
      versionRepository.rename.mockResolvedValueOnce(null);

      const res = await renameVersion({ name: 'Scope' });

      expect(res.status).toBe(404);
    });

    it('sends a version-renamed update event', async () => {
      await renameVersion({ name: 'Scope' });

      expect(eventService.send).toHaveBeenCalledWith(
        expect.objectContaining({ payload: expect.objectContaining({ operation: 'version-renamed' }) }),
      );
    });

    it('returns 403 for a user who does not own the solution', async () => {
      const res = await renameVersion({ name: 'Scope' }, 2, stranger);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /solutions/:id/versions/:number/export', () => {
    const exportVersion = (number = 2, user: User = owner) =>
      request(buildApp(user)).get(`/planner/v1/solutions/${SOLUTION_ID}/versions/${number}/export`);
    const createdOn = new Date('2026-04-02T09:00:00.000Z');
    const current = solutionOwnedBy('owner-1');
    const snapshot = { ...current, name: 'Snapshot', state: { ...current.state, problemStatement: 'Saved.' } };

    beforeEach(() => {
      repository.get.mockResolvedValue(current);
      versionRepository.get.mockImplementation(async (_tenantId, _solutionId, number: number) =>
        number === 2
          ? savedVersion(2, snapshot, [storedChat({ solutionId: SOLUTION_ID })], createdOn)
          : savedVersion(1, current),
      );
    });

    it('exports the version snapshot', async () => {
      const res = await exportVersion();

      expect(res.body).toMatchObject({
        id: SOLUTION_ID,
        name: 'Snapshot',
        version: 2,
        unsavedChanges: false,
        lastUpdated: createdOn.toISOString(),
        updatedOn: createdOn.toISOString(),
        state: expect.objectContaining({ problemStatement: 'Saved.' }),
        specialistChats: [expect.objectContaining({ id: CHAT_ID })],
      });
    });

    it('lists what the version changed from the one before it', async () => {
      const res = await exportVersion();

      expect(res.body).toMatchObject({
        initial: false,
        changedSections: ['Title', 'Problem statement', 'Specialist consultations'],
      });
    });

    it('labels version 1 as the initial version', async () => {
      const res = await exportVersion(1);

      expect(res.body).toMatchObject({ version: 1, initial: true, changedSections: [] });
    });

    it('names the attachment after the version', async () => {
      const res = await exportVersion();

      expect(res.headers['content-disposition']).toBe(`attachment; filename="planner-${SOLUTION_ID}-v2.json"`);
    });

    it('leaves rejected components out of the export', async () => {
      versionRepository.get.mockResolvedValueOnce(
        savedVersion(1, withComponents(current, [blueprintComponent(1), blueprintComponent(2, 'rejected')])),
      );

      const res = await exportVersion(1);

      expect(res.body.state.blueprint.components.map((c: BlueprintComponent) => c.order)).toEqual([1]);
    });

    it('returns 404 when the version does not exist', async () => {
      versionRepository.get.mockResolvedValueOnce(null);

      const res = await exportVersion(3);

      expect(res.status).toBe(404);
    });

    it('returns 403 for a user who does not own the solution', async () => {
      const res = await exportVersion(2, stranger);

      expect(res.status).toBe(403);
    });
  });
});
