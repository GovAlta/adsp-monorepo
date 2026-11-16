import { AdspId, adspId, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { Express } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { applyTaskMiddleware } from '..';
import { QueueEntity, TaskEntity } from '../model';
import { DirectoryServiceRoles, ExportServiceRoles, TaskServiceRoles } from '../roles';
import { TaskPriority, TaskStatus } from '../types';

// Verifies the request validation, roles, and error responses documented in task.swagger.yml by sending requests
// through the routers as mounted in the service (authenticated with a tenant context, then the routers, then the error
// handler).
describe('task router documented behaviour', () => {
  const serviceId = adspId`urn:ads:platform:task-service`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const documented = createDocumentedResponseRecorder(join(__dirname, 'task.swagger.yml'));

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
    ({ id, name: id, email: `${id}@test.co`, tenantId, isCore: false, roles, ...overrides }) as User;
  const admin = user('admin', [TaskServiceRoles.Admin]);
  const reader = user('reader', [TaskServiceRoles.TaskReader]);
  const writer = user('writer', [TaskServiceRoles.TaskWriter, TaskServiceRoles.TaskReader]);
  const worker = user('worker', ['intake-assessor']);
  const otherWorker = user('other-worker', ['intake-assessor']);
  const assigner = user('assigner', ['intake-supervisor']);
  const plain = user('plain', []);
  const coreReader = user('core-reader', [TaskServiceRoles.TaskReader], { tenantId: undefined, isCore: true });
  const exportJob = user('export-job', [ExportServiceRoles.ExportJob], { tenantId: undefined, isCore: true });
  const resolver = user('resolver', [DirectoryServiceRoles.ResourceResolver], { tenantId: undefined, isCore: true });

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
  });

  describe('GET /task/v1/tasks', () => {
    it('retrieves tasks for a reader', async () => {
      const res = await request(createApp(reader)).get('/task/v1/tasks?top=5');
      expect(res.status).toBe(200);
    });

    it('retrieves tasks for a core export job with tenantId', async () => {
      const res = await request(createApp(exportJob)).get(`/task/v1/tasks?tenantId=${tenantId}`);
      expect(res.status).toBe(200);
    });

    it('responds 400 for an invalid top', async () => {
      const res = await request(createApp(reader)).get('/task/v1/tasks?top=0');
      expect(res.status).toBe(400);
    });

    it('responds 400 without a tenant context', async () => {
      const res = await request(createApp(coreReader)).get('/task/v1/tasks');
      expect(res.status).toBe(400);
    });

    it('responds 401 without a token', async () => {
      const res = await request(createApp(null)).get('/task/v1/tasks');
      expect(res.status).toBe(401);
    });

    it('responds 403 for a worker without a task service role', async () => {
      const res = await request(createApp(worker)).get('/task/v1/tasks');
      expect(res.status).toBe(403);
    });
  });

  describe('GET /task/v1/tasks/{id}', () => {
    it('retrieves the task for a queue worker', async () => {
      const res = await request(createApp(worker)).get(`/task/v1/tasks/${taskId}`);
      expect(res.status).toBe(200);
      expect(res.body.urn).toBe(`urn:ads:platform:task-service:v1:/tasks/${taskId}`);
    });

    it('retrieves the task for the directory resource resolver', async () => {
      const res = await request(createApp(resolver)).get(`/task/v1/tasks/${taskId}?tenantId=${tenantId}`);
      expect(res.status).toBe(200);
    });

    it('responds 400 for an ID that is not a UUID', async () => {
      const res = await request(createApp(reader)).get('/task/v1/tasks/not-a-uuid');
      expect(res.status).toBe(400);
    });

    it('responds 401 without a token', async () => {
      const res = await request(createApp(null)).get(`/task/v1/tasks/${taskId}`);
      expect(res.status).toBe(401);
    });

    it('responds 403 for a user without a role for the queue', async () => {
      const res = await request(createApp(plain)).get(`/task/v1/tasks/${taskId}`);
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown task', async () => {
      const res = await request(createApp(reader)).get(`/task/v1/tasks/${unknownTaskId}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /task/v1/tasks/{id}', () => {
    it('updates the task for a writer', async () => {
      const res = await request(createApp(writer))
        .patch(`/task/v1/tasks/${taskId}`)
        .send({ description: 'Process application 123 (resubmitted)', priority: 2 });
      expect(res.status).toBe(200);
      expect(res.body.priority).toBe('High');
    });

    it('responds 400 for a name that is too long', async () => {
      const res = await request(createApp(writer))
        .patch(`/task/v1/tasks/${taskId}`)
        .send({ name: 'x'.repeat(51) });
      expect(res.status).toBe(400);
    });

    it('responds 400 for an unrecognized priority', async () => {
      const res = await request(createApp(writer)).patch(`/task/v1/tasks/${taskId}`).send({ priority: 5 });
      expect(res.status).toBe(400);
    });

    it('responds 401 without a token', async () => {
      const res = await request(createApp(null)).patch(`/task/v1/tasks/${taskId}`).send({});
      expect(res.status).toBe(401);
    });

    it('responds 403 for a reader', async () => {
      const res = await request(createApp(reader)).patch(`/task/v1/tasks/${taskId}`).send({ description: 'new' });
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown task', async () => {
      const res = await request(createApp(writer)).patch(`/task/v1/tasks/${unknownTaskId}`).send({});
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /task/v1/tasks/{id}/data', () => {
    it('updates the data of an in progress task for the worker', async () => {
      status = TaskStatus.InProgress;
      const res = await request(createApp(worker))
        .patch(`/task/v1/tasks/${taskId}/data`)
        .send({ decision: 'approved' });
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ decision: 'approved' });
    });

    it('responds 400 for a task that is not in progress', async () => {
      const res = await request(createApp(worker))
        .patch(`/task/v1/tasks/${taskId}/data`)
        .send({ decision: 'approved' });
      expect(res.status).toBe(400);
    });

    it('responds 400 for a body that is not an object', async () => {
      status = TaskStatus.InProgress;
      const res = await request(createApp(worker)).patch(`/task/v1/tasks/${taskId}/data`).send([1, 2]);
      expect(res.status).toBe(400);
    });

    it('responds 401 without a token', async () => {
      const res = await request(createApp(null)).patch(`/task/v1/tasks/${taskId}/data`).send({});
      expect(res.status).toBe(401);
    });

    it('responds 403 for a worker the task is not assigned to', async () => {
      status = TaskStatus.InProgress;
      assignedTo = { id: worker.id, name: worker.name, email: worker.email };
      const res = await request(createApp(otherWorker)).patch(`/task/v1/tasks/${taskId}/data`).send({});
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown task', async () => {
      const res = await request(createApp(worker)).patch(`/task/v1/tasks/${unknownTaskId}/data`).send({});
      expect(res.status).toBe(404);
    });
  });

  describe('POST /task/v1/tasks/{id}', () => {
    it('assigns the task for an assigner', async () => {
      const res = await request(createApp(assigner))
        .post(`/task/v1/tasks/${taskId}`)
        .send({ operation: 'assign', assignTo: { id: worker.id, name: worker.name, email: worker.email } });
      expect(res.status).toBe(200);
      expect(res.body.assignment.assignedTo.id).toBe(worker.id);
    });

    it('lets a worker assign the task to themselves', async () => {
      const res = await request(createApp(worker))
        .post(`/task/v1/tasks/${taskId}`)
        .send({ operation: 'assign', assignTo: { id: worker.id, name: worker.name, email: worker.email } });
      expect(res.status).toBe(200);
    });

    it('sets the priority for a writer', async () => {
      const res = await request(createApp(writer))
        .post(`/task/v1/tasks/${taskId}`)
        .send({ operation: 'set-priority', priority: 'Urgent' });
      expect(res.status).toBe(200);
      expect(res.body.priority).toBe('Urgent');
    });

    it('starts the task for a worker', async () => {
      const res = await request(createApp(worker)).post(`/task/v1/tasks/${taskId}`).send({ operation: 'start' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(TaskStatus.InProgress);
    });

    it('completes the task for a worker', async () => {
      status = TaskStatus.InProgress;
      const res = await request(createApp(worker)).post(`/task/v1/tasks/${taskId}`).send({ operation: 'complete' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(TaskStatus.Completed);
    });

    it('cancels the task for a reader', async () => {
      const res = await request(createApp(reader))
        .post(`/task/v1/tasks/${taskId}`)
        .send({ operation: 'cancel', reason: 'Application was withdrawn by the applicant.' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(TaskStatus.Cancelled);
    });

    it('responds 400 for an unrecognized operation', async () => {
      const res = await request(createApp(worker)).post(`/task/v1/tasks/${taskId}`).send({ operation: 'pause' });
      expect(res.status).toBe(400);
    });

    it('responds 400 for completing a task that is not in progress', async () => {
      const res = await request(createApp(worker)).post(`/task/v1/tasks/${taskId}`).send({ operation: 'complete' });
      expect(res.status).toBe(400);
    });

    it('responds 401 without a token', async () => {
      const res = await request(createApp(null)).post(`/task/v1/tasks/${taskId}`).send({ operation: 'start' });
      expect(res.status).toBe(401);
    });

    it('responds 403 for a worker assigning the task to someone else', async () => {
      const res = await request(createApp(worker))
        .post(`/task/v1/tasks/${taskId}`)
        .send({ operation: 'assign', assignTo: { id: 'someone-else', name: 'Someone', email: 'someone@test.co' } });
      expect(res.status).toBe(403);
    });

    it('responds 403 for a reader starting the task', async () => {
      const res = await request(createApp(reader)).post(`/task/v1/tasks/${taskId}`).send({ operation: 'start' });
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown task', async () => {
      const res = await request(createApp(worker)).post(`/task/v1/tasks/${unknownTaskId}`).send({ operation: 'start' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /task/v1/tasks/{id}', () => {
    it('deletes the task for an admin', async () => {
      const res = await request(createApp(admin)).delete(`/task/v1/tasks/${taskId}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ deleted: true });
    });

    it('responds 400 for an ID that is not a UUID', async () => {
      const res = await request(createApp(admin)).delete('/task/v1/tasks/not-a-uuid');
      expect(res.status).toBe(400);
    });

    it('responds 401 without a token', async () => {
      const res = await request(createApp(null)).delete(`/task/v1/tasks/${taskId}`);
      expect(res.status).toBe(401);
    });

    it('responds 403 for a writer', async () => {
      const res = await request(createApp(writer)).delete(`/task/v1/tasks/${taskId}`);
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown task', async () => {
      const res = await request(createApp(admin)).delete(`/task/v1/tasks/${unknownTaskId}`);
      expect(res.status).toBe(404);
    });
  });
});
