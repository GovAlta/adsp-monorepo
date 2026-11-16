import { AdspId, adspId, TenantService, User } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { Express } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { parse } from 'yaml';
import { ACCESS_GUIDE_TOPIC_IDS } from './agents/access/guide';
import { AgentBroker } from './model';
import { createAgentRouter } from './router';

jest.mock('./workspace', () => ({
  ...jest.requireActual('./workspace'),
  clearThreadWorkspace: jest.fn().mockResolvedValue(undefined),
}));

// Verifies the roles, tenancy, and responses documented in router.swagger.yml by sending requests through the agent
// router as mounted in main.ts and index.ts (tenant handler, then the authenticated router, then the error handler).
describe('agent router documented behaviour', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const documented = createDocumentedResponseRecorder(join(__dirname, 'router.swagger.yml'));

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const tenantServiceMock = {
    getTenant: jest.fn(),
    getTenants: jest.fn(),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };

  const memoryMock = {
    getThreadById: jest.fn(),
    deleteThread: jest.fn(),
  };

  const createMastraAgent = (id: string, name: string) => ({
    id,
    name,
    generate: jest.fn(),
    getMemory: jest.fn().mockResolvedValue(memoryMock),
  });
  const openAgent = createMastraAgent('my-assistant', 'My Assistant');
  const restrictedAgent = createMastraAgent('formGenerationAgent', 'Form Generation Agent');

  const brokers: Record<string, AgentBroker> = {
    'my-assistant': new AgentBroker(loggerMock, tenantId, [], openAgent as never, {}),
    formGenerationAgent: new AgentBroker(loggerMock, tenantId, [], restrictedAgent as never, {
      userRoles: ['urn:ads:platform:configuration-service:configuration-admin'],
    }),
  };

  const configurationMock = {
    getAgent: jest.fn(async (agentId: string) => brokers[agentId]),
    getAgents: jest.fn(async () => Object.entries(brokers).map(([id, broker]) => ({ id, name: broker.Agent.name }))),
  };

  const user = (roles: string[], overrides: Partial<User> = {}) =>
    ({
      id: '7d2b6c3e-1f4a-4b8e-9c0d-2a5e6f7b8c9d',
      name: 'Test User',
      tenantId,
      isCore: false,
      roles,
      token: { iss: 'http://localhost:8080/auth/realms/test-realm' },
      ...overrides,
    }) as User;
  const agentUser = user(['urn:ads:platform:agent-service:agent-user']);
  const configurationAdmin = user(['urn:ads:platform:configuration-service:configuration-admin']);
  const noRole = user([]);

  function createApp(currentUser: User | null): Express {
    const app = express();
    app.use(documented.middleware);
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = currentUser;
      req.isAuthenticated = (() => !!currentUser) as typeof req.isAuthenticated;
      req.getServiceConfiguration = jest.fn().mockResolvedValue(configurationMock);
      next();
    });
    // Same tenant resolution as the SDK tenantHandler mounted on /agent in main.ts.
    app.use('/agent', async (req, _res, next) => {
      try {
        const { tenantId: tenantIdValue } = req.query;
        const id = req.user?.isCore && tenantIdValue ? AdspId.parse(tenantIdValue as string) : req.user?.tenantId;
        if (id) {
          req.tenant = await tenantServiceMock.getTenant(id);
        }
        next();
      } catch (err) {
        next(err);
      }
    });
    // Mounted as applyAgentMiddleware (index.ts) mounts it.
    app.use(
      '/agent/v1',
      assertAuthenticatedHandler,
      createAgentRouter([], { logger: loggerMock, tenantService: tenantServiceMock as unknown as TenantService }),
    );
    app.use(createErrorHandler(loggerMock));
    return app;
  }

  afterEach(async () => {
    await documented.assertDocumented();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    tenantServiceMock.getTenant.mockResolvedValue({ id: tenantId, name: 'Test', realm: 'test-realm' });
    openAgent.generate.mockResolvedValue({ text: 'A renewal form needs the licence number.', object: undefined });
    restrictedAgent.generate.mockResolvedValue({ text: 'Done.', object: { fields: 3 } });
    memoryMock.getThreadById.mockResolvedValue(null);
    memoryMock.deleteThread.mockResolvedValue(undefined);
  });

  describe('GET /agent/v1/access/scope', () => {
    it('responds with the realm the user may inspect', async () => {
      const res = await request(createApp(agentUser)).get('/agent/v1/access/scope');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: 'available', realm: { id: 'test-realm', kind: 'tenant' } });
    });

    it('responds unavailable with the missing role rather than an error', async () => {
      const res = await request(createApp(noRole)).get('/agent/v1/access/scope');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'unavailable',
        reason: 'MISSING_ROLE',
        missingRoles: ['urn:ads:platform:agent-service:agent-user'],
      });
    });

    it('responds 401 when there is no authenticated user', async () => {
      const res = await request(createApp(null)).get('/agent/v1/access/scope');
      expect(res.status).toBe(401);
    });

    it('responds 400 when a core user sends a tenantId that is not an ADSP ID', async () => {
      const res = await request(createApp(user([], { isCore: true, tenantId: undefined })))
        .get('/agent/v1/access/scope')
        .query({ tenantId: 'my-tenant' });
      expect(res.status).toBe(400);
      expect(res.body.errorMessage).toContain('must begin with');
    });
  });

  describe('GET /agent/v1/access/guide/:topic', () => {
    it('responds with the documented guidance for the topic, for a user without roles', async () => {
      const res = await request(createApp(noRole)).get('/agent/v1/access/guide/token-expiry');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ topic: 'token-expiry', title: 'Token expiry and refresh' });
      expect(res.body.markdown).toContain('Access Token Lifespan');
    });

    it('responds 404 for a topic that does not exist', async () => {
      const res = await request(createApp(agentUser)).get('/agent/v1/access/guide/no-such-topic');
      expect(res.status).toBe(404);
      expect(res.body.errorMessage).toBe("access guide topic with ID 'no-such-topic' could not be found.");
    });

    it('responds 401 when there is no authenticated user', async () => {
      const res = await request(createApp(null)).get('/agent/v1/access/guide/token-expiry');
      expect(res.status).toBe(401);
    });

    it('documents every guide topic', () => {
      const swagger = parse(readFileSync(join(__dirname, 'router.swagger.yml'), 'utf8'));
      const [topic] = swagger['/agent/v1/access/guide/{topic}'].get.parameters;
      expect(topic.schema.enum).toEqual(ACCESS_GUIDE_TOPIC_IDS);
    });
  });

  describe('GET /agent/v1/agents', () => {
    it('lists every agent, including agents restricted by userRoles, for a user without roles', async () => {
      const res = await request(createApp(noRole)).get('/agent/v1/agents');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        agents: [
          { id: 'my-assistant', name: 'My Assistant' },
          { id: 'formGenerationAgent', name: 'Form Generation Agent' },
        ],
      });
    });

    it('uses the tenantId query parameter for a core user', async () => {
      const res = await request(createApp(user([], { isCore: true, tenantId: undefined })))
        .get('/agent/v1/agents')
        .query({ tenantId: tenantId.toString() });
      expect(res.status).toBe(200);
      expect(`${tenantServiceMock.getTenant.mock.calls[0][0]}`).toBe(tenantId.toString());
    });

    it('responds 400 for a tenantId that is not an ADSP ID', async () => {
      const res = await request(createApp(user([], { isCore: true, tenantId: undefined })))
        .get('/agent/v1/agents')
        .query({ tenantId: 'my-tenant' });
      expect(res.status).toBe(400);
    });

    it('responds 401 when there is no authenticated user', async () => {
      const res = await request(createApp(null)).get('/agent/v1/agents');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /agent/v1/agents/:agentId', () => {
    it('responds with the agent ID and name', async () => {
      const res = await request(createApp(noRole)).get('/agent/v1/agents/formGenerationAgent');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 'formGenerationAgent', name: 'Form Generation Agent' });
    });

    it('responds 404 for an agent that is not configured', async () => {
      const res = await request(createApp(agentUser)).get('/agent/v1/agents/unknown');
      expect(res.status).toBe(404);
      expect(res.body.errorMessage).toBe("Agent with ID 'unknown' could not be found.");
    });

    it('responds 400 for a tenantId that is not an ADSP ID', async () => {
      const res = await request(createApp(user([], { isCore: true, tenantId: undefined })))
        .get('/agent/v1/agents/my-assistant')
        .query({ tenantId: 'my-tenant' });
      expect(res.status).toBe(400);
    });

    it('responds 401 when there is no authenticated user', async () => {
      const res = await request(createApp(null)).get('/agent/v1/agents/my-assistant');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /agent/v1/agents/:agentId', () => {
    it('responds with the reply of an agent without userRoles', async () => {
      const res = await request(createApp(noRole))
        .post('/agent/v1/agents/my-assistant')
        .send({ content: 'Which fields should a business licence renewal form include?' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ agent: 'my-assistant', content: 'A renewal form needs the licence number.' });
      expect(openAgent.generate).toHaveBeenCalledWith(
        [{ role: 'user', content: 'Which fields should a business licence renewal form include?' }],
        expect.any(Object),
      );
    });

    it('accepts an array of messages and includes structured output', async () => {
      const res = await request(createApp(configurationAdmin))
        .post('/agent/v1/agents/formGenerationAgent')
        .send([{ content: 'My business is a food truck.' }, { content: [{ type: 'text', text: 'Build a form.' }] }]);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ agent: 'formGenerationAgent', content: 'Done.', output: { fields: 3 } });
    });

    it('responds 403 without one of the userRoles of the agent', async () => {
      const res = await request(createApp(agentUser))
        .post('/agent/v1/agents/formGenerationAgent')
        .send({ content: 'Build a form.' });
      expect(res.status).toBe(403);
      expect(res.body.errorMessage).toBe(
        'User Test User (ID: 7d2b6c3e-1f4a-4b8e-9c0d-2a5e6f7b8c9d) not permitted to use agent.',
      );
      expect(restrictedAgent.generate).not.toHaveBeenCalled();
    });

    it('responds 403 to a core user for an agent with userRoles', async () => {
      const res = await request(
        createApp(
          user(['urn:ads:platform:configuration-service:configuration-admin'], { isCore: true, tenantId: undefined }),
        ),
      )
        .post('/agent/v1/agents/formGenerationAgent')
        .send({ content: 'Build a form.' });
      expect(res.status).toBe(403);
    });

    it('responds 404 for an agent that is not configured', async () => {
      const res = await request(createApp(agentUser)).post('/agent/v1/agents/unknown').send({ content: 'Hello' });
      expect(res.status).toBe(404);
    });

    it('responds 400 for a body that is not valid JSON', async () => {
      const res = await request(createApp(agentUser))
        .post('/agent/v1/agents/my-assistant')
        .set('Content-Type', 'application/json')
        .send('{"content": ');
      expect(res.status).toBe(400);
      expect(res.body.errorMessage).toContain('Malformed request body');
    });

    it('responds 401 when there is no authenticated user', async () => {
      const res = await request(createApp(null)).post('/agent/v1/agents/my-assistant').send({ content: 'Hello' });
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /agent/v1/agents/:agentId/threads/:threadId', () => {
    const threadId = '0f8fad5b-d9cb-469f-a165-70867728950e';

    it("deletes the user's own thread", async () => {
      memoryMock.getThreadById.mockResolvedValueOnce({
        id: threadId,
        resourceId: noRole.id,
        metadata: { tenantId: tenantId.toString() },
      });
      const res = await request(createApp(noRole)).delete(`/agent/v1/agents/my-assistant/threads/${threadId}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ deleted: true });
      expect(memoryMock.deleteThread).toHaveBeenCalledWith(threadId);
    });

    it("responds deleted false for another user's thread", async () => {
      memoryMock.getThreadById.mockResolvedValueOnce({
        id: threadId,
        resourceId: 'another-user',
        metadata: { tenantId: tenantId.toString() },
      });
      const res = await request(createApp(noRole)).delete(`/agent/v1/agents/my-assistant/threads/${threadId}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ deleted: false });
      expect(memoryMock.deleteThread).not.toHaveBeenCalled();
    });

    it('responds 403 without one of the userRoles of the agent', async () => {
      const res = await request(createApp(agentUser)).delete(
        `/agent/v1/agents/formGenerationAgent/threads/${threadId}`,
      );
      expect(res.status).toBe(403);
    });

    it('responds 404 for an agent that is not configured', async () => {
      const res = await request(createApp(agentUser)).delete(`/agent/v1/agents/unknown/threads/${threadId}`);
      expect(res.status).toBe(404);
    });

    it('responds 400 for a tenantId that is not an ADSP ID', async () => {
      const res = await request(createApp(user([], { isCore: true, tenantId: undefined })))
        .delete(`/agent/v1/agents/my-assistant/threads/${threadId}`)
        .query({ tenantId: 'my-tenant' });
      expect(res.status).toBe(400);
    });

    it('responds 401 when there is no authenticated user', async () => {
      const res = await request(createApp(null)).delete(`/agent/v1/agents/my-assistant/threads/${threadId}`);
      expect(res.status).toBe(401);
    });
  });
});
