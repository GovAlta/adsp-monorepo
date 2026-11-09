import { AdspId, adspId, User } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { Express } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { applyTaskMiddleware } from '..';
import { QueueEntity, TaskEntity } from '../model';
import { TaskServiceRoles } from '../roles';
import { TaskPriority, TaskStatus } from '../types';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

// Verifies the request validation, roles, and error responses documented in queue.swagger.yml by sending requests
// through the routers as mounted in the service (authenticated with a tenant context, then the routers, then the error
// handler).
describe('queue router documented behaviour', () => {
  const serviceId = adspId`urn:ads:platform:task-service`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const documented = createDocumentedResponseRecorder(join(__dirname, 'queue.swagger.yml'));

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;
  const repositoryMock = {
    getTask: jest.fn(),
    getTasks: jest.fn(),
    getTaskMetrics: jest.fn(),
    save: jest.fn((entity: TaskEntity) => Promise.resolve(entity)),
    delete: jest.fn(() => Promise.resolve(true)),
  };
  const eventServiceMock = { send: jest.fn() };
  const commentServiceMock = { createTopic: jest.fn() };
  const directoryMock = { getServiceUrl: jest.fn(), getResourceUrl: jest.fn() };
  const tokenProviderMock = { getAccessToken: jest.fn(() => Promise.resolve('token')) };

  // Queues come from configuration without a tenant ID, as converted in main.ts.
  const queue = new QueueEntity({
    namespace: 'support',
    name: 'intake-processing',
    context: {},
    assignerRoles: ['intake-supervisor'],
    workerRoles: ['intake-assessor'],
  } as never);
  const queues = { 'support:intake-processing': queue };

  const taskId = 'f3a3bc74-494e-4bb5-b5f3-d29a34edd275';
  const unknownTaskId = '0b8f1c52-6d3e-4a7b-9c1d-2e4f6a8b0c3d';

  const user = (id: string, roles: string[], overrides: Partial<User> = {}) =>
    ({
      id,
      name: id,
      email: `${id}@test.co`,
      tenantId,
      isCore: false,
      roles,
      token: { bearer: `${id}-token` },
      ...overrides,
    }) as User;
  const admin = user('admin', [TaskServiceRoles.Admin]);
  const reader = user('reader', [TaskServiceRoles.TaskReader]);
  const writerOnly = user('writer-only', [TaskServiceRoles.TaskWriter]);
  const worker = user('worker', ['intake-assessor']);
  const assigner = user('assigner', ['intake-supervisor']);
  const plain = user('plain', []);
  const coreReader = user('core-reader', [TaskServiceRoles.TaskReader], { tenantId: undefined, isCore: true });

  let status: TaskStatus;
  let assignedTo: { id: string; name: string; email: string };

  // Stands in for the passport authentication and tenantHandler that main.ts mounts on /task.
  function createApp(currentUser: User | null): Express {
    const server = express();
    server.use(documented.middleware);
    server.use(express.json());
    server.use('/task', (req, res, next) => {
      if (!currentUser) {
        res.sendStatus(401);
        return;
      }
      try {
        req.user = currentUser;
        const tenantIdValue = req.query.tenantId as string;
        const contextTenantId =
          currentUser.isCore && tenantIdValue ? AdspId.parse(tenantIdValue) : currentUser.tenantId;
        req.tenant = contextTenantId
          ? ({ id: contextTenantId, name: 'test', realm: 'test' } as typeof req.tenant)
          : undefined;
        req.getConfiguration = jest
          .fn()
          .mockResolvedValue(req.tenant ? [{ queues }, { queues: {} }] : [undefined, { queues: {} }]);
        next();
      } catch (err) {
        next(err);
      }
    });
    applyTaskMiddleware(server, {
      KEYCLOAK_ROOT_URL: 'https://access.test.co',
      serviceId,
      logger: loggerMock,
      directory: directoryMock,
      tokenProvider: tokenProviderMock,
      taskRepository: repositoryMock,
      eventService: eventServiceMock,
      commentService: commentServiceMock,
    });
    server.use(createErrorHandler(loggerMock));
    return server;
  }

  afterEach(async () => {
    await documented.assertDocumented();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    status = TaskStatus.Pending;
    assignedTo = undefined;
    repositoryMock.getTask.mockImplementation((configured: Record<string, QueueEntity>, _tenantId, id: string) =>
      Promise.resolve(
        id === taskId
          ? new TaskEntity(repositoryMock, configured['support:intake-processing'], {
              tenantId,
              id,
              name: 'process-application-123',
              description: 'Process application 123',
              queue: { namespace: 'support', name: 'intake-processing' },
              context: {},
              data: {},
              priority: TaskPriority.Normal,
              status,
              createdOn: new Date(),
              startedOn: null,
              endedOn: null,
              assignment: assignedTo
                ? { assignedOn: new Date(), assignedBy: { id: 'assigner', name: 'assigner' }, assignedTo }
                : null,
            })
          : null,
      ),
    );
    repositoryMock.getTasks.mockResolvedValue({ results: [], page: { size: 0 } });
    repositoryMock.getTaskMetrics.mockResolvedValue([]);
    directoryMock.getServiceUrl.mockResolvedValue(new URL('https://value-service.test.co'));
  });

  const queuePath = '/task/v1/queues/support/intake-processing';
  const unknownQueuePath = '/task/v1/queues/support/unknown';
  const longName = 'x'.repeat(51);

  describe('GET /task/v1/queues', () => {
    it('retrieves the queues for any user of the tenant', async () => {
      const res = await request(createApp(plain)).get('/task/v1/queues');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([expect.objectContaining({ namespace: 'support', name: 'intake-processing' })]);
    });

    it('retrieves the queues for a core user with tenantId', async () => {
      const res = await request(createApp(coreReader)).get(`/task/v1/queues?tenantId=${tenantId}`);
      expect(res.status).toBe(200);
    });

    it('responds 400 for a core user with an invalid tenantId', async () => {
      const res = await request(createApp(coreReader)).get('/task/v1/queues?tenantId=test');
      expect(res.status).toBe(400);
    });

    it('responds 401 without a token', async () => {
      const res = await request(createApp(null)).get('/task/v1/queues');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /task/v1/queues/{namespace}/{name}', () => {
    it('retrieves the queue', async () => {
      const res = await request(createApp(plain)).get(queuePath);
      expect(res.status).toBe(200);
      expect(res.body.workerRoles).toEqual(['intake-assessor']);
    });

    it('responds 400 for a name that is too long', async () => {
      const res = await request(createApp(plain)).get(`/task/v1/queues/support/${longName}`);
      expect(res.status).toBe(400);
    });

    it('responds 401 without a token', async () => {
      const res = await request(createApp(null)).get(queuePath);
      expect(res.status).toBe(401);
    });

    it('responds 404 for an unknown queue', async () => {
      const res = await request(createApp(plain)).get(unknownQueuePath);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /task/v1/queues/{namespace}/{name}/metrics', () => {
    it('retrieves task counts for an assigner', async () => {
      const res = await request(createApp(assigner)).get(`${queuePath}/metrics?notEnded=true`);
      expect(res.status).toBe(200);
      expect(res.body.status.Pending).toBe(0);
    });

    it('retrieves event metrics', async () => {
      axiosMock.get.mockResolvedValue({ data: { values: [{ avg: 60, min: 30, max: 90 }], count: 3 } });
      const res = await request(createApp(reader)).get(`${queuePath}/metrics?includeEventMetrics=true`);
      expect(res.status).toBe(200);
      expect(res.body.rate).toEqual(expect.objectContaining({ created: 3, completed: 3, cancelled: 3 }));
    });

    it('responds 400 for a notEnded that is not boolean', async () => {
      const res = await request(createApp(reader)).get(`${queuePath}/metrics?notEnded=maybe`);
      expect(res.status).toBe(400);
    });

    it('responds 401 without a token', async () => {
      const res = await request(createApp(null)).get(`${queuePath}/metrics`);
      expect(res.status).toBe(401);
    });

    it('responds 403 for a user without a role for the queue', async () => {
      const res = await request(createApp(plain)).get(`${queuePath}/metrics`);
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown queue', async () => {
      const res = await request(createApp(reader)).get(`${unknownQueuePath}/metrics`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /task/v1/queues/{namespace}/{name}/tasks', () => {
    it('retrieves queued tasks for a worker', async () => {
      const res = await request(createApp(worker)).get(`${queuePath}/tasks?top=20`);
      expect(res.status).toBe(200);
    });

    it('responds 400 for a top that is too large', async () => {
      const res = await request(createApp(worker)).get(`${queuePath}/tasks?top=5001`);
      expect(res.status).toBe(400);
    });

    it('responds 401 without a token', async () => {
      const res = await request(createApp(null)).get(`${queuePath}/tasks`);
      expect(res.status).toBe(401);
    });

    it('responds 403 for a user without a role for the queue', async () => {
      const res = await request(createApp(plain)).get(`${queuePath}/tasks`);
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown queue', async () => {
      const res = await request(createApp(worker)).get(`${unknownQueuePath}/tasks`);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /task/v1/queues/{namespace}/{name}/tasks', () => {
    const newTask = { name: 'process-application-123', description: 'Process application 123', priority: 'High' };

    it('creates a task for a writer', async () => {
      const res = await request(createApp(writerOnly)).post(`${queuePath}/tasks`).send(newTask);
      expect(res.status).toBe(200);
      expect(res.body).toEqual(expect.objectContaining({ status: TaskStatus.Pending, priority: 'High' }));
      expect(commentServiceMock.createTopic).toHaveBeenCalled();
    });

    it('creates a task for a core writer with tenantId', async () => {
      const coreWriter = user('core-writer', [TaskServiceRoles.TaskWriter], { tenantId: undefined, isCore: true });
      const res = await request(createApp(coreWriter)).post(`${queuePath}/tasks?tenantId=${tenantId}`).send(newTask);
      expect(res.status).toBe(200);
    });

    it('responds 400 without a name', async () => {
      const res = await request(createApp(writerOnly)).post(`${queuePath}/tasks`).send({ description: 'No name' });
      expect(res.status).toBe(400);
    });

    it('responds 401 without a token', async () => {
      const res = await request(createApp(null)).post(`${queuePath}/tasks`).send(newTask);
      expect(res.status).toBe(401);
    });

    it('responds 403 for a worker', async () => {
      const res = await request(createApp(worker)).post(`${queuePath}/tasks`).send(newTask);
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown queue', async () => {
      const res = await request(createApp(writerOnly)).post(`${unknownQueuePath}/tasks`).send(newTask);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /task/v1/queues/{namespace}/{name}/tasks/{id}', () => {
    it('retrieves the queued task for a worker', async () => {
      const res = await request(createApp(worker)).get(`${queuePath}/tasks/${taskId}`);
      expect(res.status).toBe(200);
    });

    it('responds 400 for an ID that is not a UUID', async () => {
      const res = await request(createApp(worker)).get(`${queuePath}/tasks/not-a-uuid`);
      expect(res.status).toBe(400);
    });

    it('responds 400 without a tenant context', async () => {
      const res = await request(createApp(coreReader)).get(`${queuePath}/tasks/${taskId}`);
      expect(res.status).toBe(400);
    });

    it('responds 401 without a token', async () => {
      const res = await request(createApp(null)).get(`${queuePath}/tasks/${taskId}`);
      expect(res.status).toBe(401);
    });

    it('responds 403 for a user without a role for the queue', async () => {
      const res = await request(createApp(plain)).get(`${queuePath}/tasks/${taskId}`);
      expect(res.status).toBe(403);
    });

    it('responds 404 for a task in another queue', async () => {
      const res = await request(createApp(reader)).get(`/task/v1/queues/support/other-queue/tasks/${taskId}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /task/v1/queues/{namespace}/{name}/tasks/{id}', () => {
    it('updates the queued task for an admin', async () => {
      const res = await request(createApp(admin))
        .patch(`${queuePath}/tasks/${taskId}`)
        .send({ description: 'Process application 123 (resubmitted)' });
      expect(res.status).toBe(200);
    });

    it('responds 400 for a context that is not an object', async () => {
      const res = await request(createApp(admin)).patch(`${queuePath}/tasks/${taskId}`).send({ context: 'intake' });
      expect(res.status).toBe(400);
    });

    it('responds 401 without a token', async () => {
      const res = await request(createApp(null)).patch(`${queuePath}/tasks/${taskId}`).send({});
      expect(res.status).toBe(401);
    });

    it('responds 403 for a worker', async () => {
      const res = await request(createApp(worker)).patch(`${queuePath}/tasks/${taskId}`).send({ description: 'new' });
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown task', async () => {
      const res = await request(createApp(admin)).patch(`${queuePath}/tasks/${unknownTaskId}`).send({});
      expect(res.status).toBe(404);
    });
  });

  describe('POST /task/v1/queues/{namespace}/{name}/tasks/{id}', () => {
    it('starts the queued task for a worker', async () => {
      const res = await request(createApp(worker)).post(`${queuePath}/tasks/${taskId}`).send({ operation: 'start' });
      expect(res.status).toBe(200);
    });

    it('unassigns the queued task for an assigner', async () => {
      assignedTo = { id: worker.id, name: worker.name, email: worker.email };
      const res = await request(createApp(assigner))
        .post(`${queuePath}/tasks/${taskId}`)
        .send({ operation: 'assign', assignTo: null });
      expect(res.status).toBe(200);
      expect(res.body.assignment.assignedTo).toBeNull();
    });

    it('responds 400 without an operation', async () => {
      const res = await request(createApp(worker)).post(`${queuePath}/tasks/${taskId}`).send({});
      expect(res.status).toBe(400);
    });

    it('responds 400 for an unrecognized priority', async () => {
      const res = await request(createApp(assigner))
        .post(`${queuePath}/tasks/${taskId}`)
        .send({ operation: 'set-priority', priority: 'Low' });
      expect(res.status).toBe(400);
    });

    it('responds 401 without a token', async () => {
      const res = await request(createApp(null)).post(`${queuePath}/tasks/${taskId}`).send({ operation: 'start' });
      expect(res.status).toBe(401);
    });

    it('responds 403 for a worker setting the priority', async () => {
      const res = await request(createApp(worker))
        .post(`${queuePath}/tasks/${taskId}`)
        .send({ operation: 'set-priority', priority: 'Urgent' });
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown task', async () => {
      const res = await request(createApp(worker))
        .post(`${queuePath}/tasks/${unknownTaskId}`)
        .send({ operation: 'start' });
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /task/v1/queues/{namespace}/{name}/tasks/{id}/data', () => {
    it('updates the data of the queued task for the worker', async () => {
      status = TaskStatus.InProgress;
      const res = await request(createApp(worker))
        .patch(`${queuePath}/tasks/${taskId}/data`)
        .send({ decision: 'approved' });
      expect(res.status).toBe(200);
    });

    it('responds 400 for a task that is not in progress', async () => {
      const res = await request(createApp(worker)).patch(`${queuePath}/tasks/${taskId}/data`).send({});
      expect(res.status).toBe(400);
    });

    it('responds 401 without a token', async () => {
      const res = await request(createApp(null)).patch(`${queuePath}/tasks/${taskId}/data`).send({});
      expect(res.status).toBe(401);
    });

    it('responds 403 for an admin', async () => {
      status = TaskStatus.InProgress;
      const res = await request(createApp(admin)).patch(`${queuePath}/tasks/${taskId}/data`).send({});
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown task', async () => {
      const res = await request(createApp(worker)).patch(`${queuePath}/tasks/${unknownTaskId}/data`).send({});
      expect(res.status).toBe(404);
    });
  });

  describe.each(['assigners', 'workers'])('GET /task/v1/queues/{namespace}/{name}/%s', (resource) => {
    it('retrieves the users with the queue roles', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: [
          { id: worker.id, username: 'test.user', firstName: 'Test', lastName: 'User', email: 'test.user@gov.ab.ca' },
        ],
      });
      const res = await request(createApp(admin)).get(`${queuePath}/${resource}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id: worker.id, name: 'Test User', email: 'test.user@gov.ab.ca' }]);
    });

    it('responds 400 for a namespace that is too long', async () => {
      const res = await request(createApp(admin)).get(`/task/v1/queues/${longName}/intake-processing/${resource}`);
      expect(res.status).toBe(400);
    });

    it('responds 401 without a token', async () => {
      const res = await request(createApp(null)).get(`${queuePath}/${resource}`);
      expect(res.status).toBe(401);
    });

    it('responds 403 when Keycloak denies the request', async () => {
      axiosMock.get.mockRejectedValueOnce({ response: { status: 403 } });
      axiosMock.isAxiosError.mockReturnValueOnce(true);
      const res = await request(createApp(plain)).get(`${queuePath}/${resource}`);
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown queue', async () => {
      const res = await request(createApp(admin)).get(`${unknownQueuePath}/${resource}`);
      expect(res.status).toBe(404);
    });
  });
});
