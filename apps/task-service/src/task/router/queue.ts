import {
  AdspId,
  EventService,
  ServiceDirectory,
  TokenProvider,
  UnauthorizedUserError,
  adspId,
} from '@abgov/adsp-service-sdk';
import { createValidationHandler, NotFoundError, decodeAfter } from '@core-services/core-common';
import axios from 'axios';
import { Request, RequestHandler, Response, Router } from 'express';
import { body, checkSchema, param, query } from 'express-validator';
import * as HttpStatusCodes from 'http-status-codes';
import { DateTime } from 'luxon';
import { Logger } from 'winston';
import { CommentService } from '../comment';
import { TaskCancelledDefinition, TaskCompletedDefinition, TaskCreatedDefinition, taskCreated } from '../events';
import { mapTask } from '../mapper';
import { TaskEntity, QueueEntity } from '../model';
import { TaskRepository } from '../repository';
import { Queue, TaskPriority, TaskServiceConfiguration, TaskStatus } from '../types';
import { getTask, taskOperation, TASK_KEY, updateTask, updateTaskData } from './task';
import { UserInformation } from './types';

interface QueueRouterProps {
  apiId: AdspId;
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  taskRepository: TaskRepository;
  eventService: EventService;
  commentService: CommentService;
  KEYCLOAK_ROOT_URL: string;
}

const QUEUE_KEY = 'queue';

export function mapQueue(entity: QueueEntity): Omit<Queue, 'tenantId'> {
  return {
    namespace: entity.namespace,
    name: entity.name,
    displayName: entity.displayName,
    context: entity.context,
    assignerRoles: entity.assignerRoles,
    workerRoles: entity.workerRoles,
  };
}

export const verifyQueuedTask: RequestHandler = (req, _res, next) => {
  try {
    const { id, namespace, name } = req.params;
    const task: TaskEntity = req[TASK_KEY];
    if (task.queue.namespace !== namespace || task.queue.name !== name) {
      throw new NotFoundError('task', id);
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const getQueues: RequestHandler = async (req, res, next) => {
  try {
    const [{ queues = {} }] = await req.getConfiguration<TaskServiceConfiguration>();
    const queueCollection = Object.entries(queues).map(([_, q]) => mapQueue(q));

    res.send(queueCollection);
  } catch (err) {
    next(err);
  }
};

export const getQueue: RequestHandler = async (req, res, next) => {
  try {
    const { namespace, name } = req.params;
    const key = `${namespace}:${name}`;

    const [{ queues = {} }] = await req.getConfiguration<TaskServiceConfiguration>();

    const queue = queues[key];
    if (!queue) {
      throw new NotFoundError('queue', key);
    }

    req[QUEUE_KEY] = queue;
    next();
  } catch (err) {
    next(err);
  }
};

const VALUE_SERVICE_ID = adspId`urn:ads:platform:value-service`;
export function getQueueMetrics(
  serviceId: AdspId,
  directory: ServiceDirectory,
  tokenProvider: TokenProvider,
  repository: TaskRepository
): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenant = req.tenant;
      const { includeEventMetrics: includeEventMetricsValue, notEnded: notEndedValue } = req.query;
      const includeEventMetrics = includeEventMetricsValue === 'true';
      const notEnded = notEndedValue === 'true';

      const queue: QueueEntity = req[QUEUE_KEY];
      if (!queue.canAccessTask(user)) {
        throw new UnauthorizedUserError('get queue metrics', user);
      }

      let [metrics] = await repository.getTaskMetrics(tenant.id, {
        queue: { namespace: queue.namespace, name: queue.name },
        notEnded,
      });

      // No results means there are no tasks in the queue
      if (!metrics) {
        metrics = {
          namespace: queue.namespace,
          name: queue.name,
          status: {
            [TaskStatus.Pending]: 0,
            [TaskStatus.InProgress]: 0,
            [TaskStatus.Stopped]: 0,
            [TaskStatus.Cancelled]: 0,
            [TaskStatus.Completed]: 0,
          },
          priority: {
            [TaskPriority.Normal]: 0,
            [TaskPriority.High]: 0,
            [TaskPriority.Urgent]: 0,
          },
          assignedTo: {},
        };
      }

      const result = {
        ...(metrics || {}),
        priority: Object.entries(metrics.priority).reduce(
          (counts, [key, number]) => ({ ...counts, [TaskPriority[key]]: number }),
          {} as Record<TaskPriority, number>
        ),
        queue: null,
        completion: null,
        rate: null,
      };

      // Get duration metrics if there are tasks metrics (i.e. queue is not entirely empty).
      if (includeEventMetrics) {
        const valueServiceUrl = await directory.getServiceUrl(VALUE_SERVICE_ID);
        let token = await tokenProvider.getAccessToken();

        const {
          data: {
            values: [queueDuration],
          },
        } = await axios.get<{ values: { avg: number; min: number; max: number }[] }>(
          new URL(
            `value/v1/event-service/values/event/metrics/${serviceId.service}:${queue.namespace}:${queue.name}:queue:duration`,
            valueServiceUrl
          ).href,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              tenantId: tenant.id.toString(),
              interval: 'weekly',
              top: 1,
            },
          }
        );

        token = await tokenProvider.getAccessToken();

        const {
          data: {
            values: [completionDuration],
          },
        } = await axios.get<{ values: { avg: number; min: number; max: number }[] }>(
          new URL(
            `value/v1/event-service/values/event/metrics/${serviceId.service}:${queue.namespace}:${queue.name}:completion:duration`,
            valueServiceUrl
          ).href,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              tenantId: tenant.id.toString(),
              interval: 'weekly',
              top: 1,
            },
          }
        );

        result.queue = queueDuration;
        result.completion = completionDuration;

        const timestampMin = DateTime.now().minus({ days: 7 }).toJSDate();

        token = await tokenProvider.getAccessToken();

        const {
          data: { count: created },
        } = await axios.get<{ count: number }>(
          new URL(`value/v1/event-service/values/event/count`, valueServiceUrl).href,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              tenantId: tenant.id.toString(),
              timestampMin,
              context: JSON.stringify({
                namespace: serviceId.service,
                name: TaskCreatedDefinition.name,
                queueNamespace: queue.namespace,
                queueName: queue.name,
              }),
            },
          }
        );

        token = await tokenProvider.getAccessToken();
        const {
          data: { count: completed },
        } = await axios.get<{ count: number }>(
          new URL(`value/v1/event-service/values/event/count`, valueServiceUrl).href,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              tenantId: tenant.id.toString(),
              timestampMin,
              context: JSON.stringify({
                namespace: serviceId.service,
                name: TaskCompletedDefinition.name,
                queueNamespace: queue.namespace,
                queueName: queue.name,
              }),
            },
          }
        );

        token = await tokenProvider.getAccessToken();

        const {
          data: { count: cancelled },
        } = await axios.get<{ count: number }>(
          new URL(`value/v1/event-service/values/event/count`, valueServiceUrl).href,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              tenantId: tenant.id.toString(),
              timestampMin,
              context: JSON.stringify({
                namespace: serviceId.service,
                name: TaskCancelledDefinition.name,
                queueNamespace: queue.namespace,
                queueName: queue.name,
              }),
            },
          }
        );

        result.rate = {
          since: timestampMin,
          created,
          completed,
          cancelled,
        };
      }

      res.send(result);
    } catch (err) {
      next(err);
    }
  };
}

export const getQueuedTasks =
  (apiId: AdspId, repository: TaskRepository): RequestHandler =>
  async (req, res, next) => {
    try {
      const user = req.user;
      const { top: topValue, after } = req.query;
      const top = topValue ? parseInt(topValue as string) : 10;

      const queue: QueueEntity = req[QUEUE_KEY];
      const tasks = await queue.getTasks(user, repository, top, after as string);

      res.send({
        page: tasks.page,
        results: tasks.results.map((r) => mapTask(apiId, r)),
      });
    } catch (err) {
      next(err);
    }
  };

export function createTask(
  apiId: AdspId,
  logger: Logger,
  repository: TaskRepository,
  eventService: EventService,
  commentService: CommentService
): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant.id;
      const { priority, ...task } = req.body;

      const queue: QueueEntity = req[QUEUE_KEY];

      logger.debug(`Creating task in queue ${queue.namespace}:${queue.name}...`, {
        context: 'TaskRouter',
        tenantId: tenantId.toString(),
        user: `${user.name} (ID: ${user.id})`,
      });

      const entity = await TaskEntity.create(user, repository, queue, {
        tenantId,
        priority: priority ? TaskPriority[priority] : null,
        ...task,
      });

      const result = mapTask(apiId, entity);
      res.send(result);

      eventService.send(taskCreated(apiId, user, entity));
      commentService.createTopic(entity, result.urn);

      logger.info(`Created task (ID: ${entity.id}) in queue ${queue.namespace}:${queue.name}.`, {
        context: 'TaskRouter',
        tenantId: tenantId.toString(),
        user: `${user.name} (ID: ${user.id})`,
      });
    } catch (err) {
      next(err);
    }
  };
}

interface ClientRepresentation {
  id: string;
  clientId: string;
}

export const getRoleUsers =
  (logger: Logger, KEYCLOAK_ROOT_URL: string, rolesKey: 'assignerRoles' | 'workerRoles'): RequestHandler =>
  async (req, res, next) => {
    try {
      const user = req.user;
      const tenant = req.tenant;

      const realm = tenant?.realm;
      if (!realm) {
        throw new UnauthorizedUserError('get queue users', user);
      }

      const queue: QueueEntity = req[QUEUE_KEY];
      const roles: string[] = queue[rolesKey] || [];

      const max = 100;

      const users: Record<string, UserInformation> = {};
      for (let i = 0; i < roles.length; i++) {
        let role = roles[i];
        try {
          let client: string = null;

          // ADSP convention is that client roles are flattened to qualified names with the client as prefix.
          const roleElements = role.split(':');
          if (roleElements.length > 1) {
            role = roleElements[roleElements.length - 1];
            roleElements.splice(roleElements.length - 1);
            const clientId = roleElements.join(':');
            const { data: clients } = await axios.get<ClientRepresentation[]>(
              `${KEYCLOAK_ROOT_URL}/auth/admin/realms/${realm}/clients`,
              {
                headers: { Authorization: `Bearer ${user.token.bearer}` },
                params: { clientId },
              }
            );

            client = clients?.[0]?.id;
          }

          let first = 0;
          do {
            const { data: roleUsers = [] } = await axios.get<UserInformation[]>(
              `${KEYCLOAK_ROOT_URL}/auth/admin/realms/${realm}/${
                client ? `clients/${client}/` : ''
              }roles/${encodeURIComponent(role)}/users`,
              {
                headers: { Authorization: `Bearer ${user.token.bearer}` },
                params: { first, max },
              }
            );

            roleUsers.forEach((roleUser) => {
              users[roleUser.id] = roleUser;
            });

            if (roleUsers.length === max) {
              first += max + 1;
            } else {
              first = 0;
            }
          } while (first > 0);
        } catch (err) {
          if (axios.isAxiosError(err)) {
            if (err.response?.status === HttpStatusCodes.NOT_FOUND) {
              logger.warn(`Role '${role}' not found.`, {
                context: 'TaskRouter',
                tenantId: tenant.id.toString(),
                user: `${user.name} (ID: ${user.id})`,
              });
            } else if (err.response?.status === HttpStatusCodes.FORBIDDEN) {
              throw new UnauthorizedUserError('get role users', user);
            }
          } else {
            throw err;
          }
        }
      }

      res.send(
        Object.entries(users).map(([_k, user]) => ({
          id: user.id,
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username,
          email: user.email,
        }))
      );
    } catch (err) {
      next(err);
    }
  };

export function createQueueRouter({
  KEYCLOAK_ROOT_URL,
  apiId,
  logger,
  directory,
  tokenProvider,
  taskRepository: repository,
  eventService,
  commentService,
}: QueueRouterProps): Router {
  const router = Router();

  const validateNamespaceNameHandler = createValidationHandler(
    param('namespace').isString().isLength({ min: 1, max: 50 }),
    param('name').isString().isLength({ min: 1, max: 50 })
  );

  const validateNamespaceNameAndTaskIdHandler = createValidationHandler(
    param('namespace').isString().isLength({ min: 1, max: 50 }),
    param('name').isString().isLength({ min: 1, max: 50 }),
    param('id').isUUID()
  );

  router.get('/queues', getQueues);
  router.get('/queues/:namespace/:name', validateNamespaceNameHandler, getQueue, (req, res) => {
    res.send(mapQueue(req[QUEUE_KEY]));
  });

  router.get(
    '/queues/:namespace/:name/metrics',
    validateNamespaceNameHandler,
    createValidationHandler(
      query('notEnded').optional().isBoolean(),
      query('includeEventMetrics').optional().isBoolean()
    ),
    getQueue,
    getQueueMetrics(apiId, directory, tokenProvider, repository)
  );
  router.get(
    '/queues/:namespace/:name/tasks',
    validateNamespaceNameHandler,
    createValidationHandler(
      query('top').optional().isInt({ min: 1, max: 5000 }),
      query('after')
        .optional()
        .isString()
        .custom((val) => {
          return !isNaN(decodeAfter(val));
        })
    ),
    getQueue,
    getQueuedTasks(apiId, repository)
  );
  router.post(
    '/queues/:namespace/:name/tasks',
    validateNamespaceNameHandler,
    createValidationHandler(
      ...checkSchema(
        {
          name: { isString: true, isLength: { options: { min: 1, max: 50 } } },
          description: { optional: true, isString: true },
          recordId: { optional: true, isString: true },
          context: { optional: true, isObject: true },
        },
        ['body']
      )
    ),
    getQueue,
    createTask(apiId, logger, repository, eventService, commentService)
  );
  router.get(
    '/queues/:namespace/:name/tasks/:id',
    validateNamespaceNameAndTaskIdHandler,
    getTask(repository),
    verifyQueuedTask,
    (req: Request, res: Response) => res.send(mapTask(apiId, req[TASK_KEY]))
  );
  router.patch(
    '/queues/:namespace/:name/tasks/:id',
    validateNamespaceNameAndTaskIdHandler,
    createValidationHandler(
      ...checkSchema(
        {
          name: { optional: true, isLength: { options: { min: 1, max: 50 } } },
          description: { optional: true, isString: true },
          context: { optional: true, isObject: true },
          data: { optional: true, isObject: true },
        },
        ['body']
      )
    ),
    getTask(repository),
    verifyQueuedTask,
    updateTask(apiId, logger, eventService)
  );
  router.patch(
    '/queues/:namespace/:name/tasks/:id/data',
    validateNamespaceNameAndTaskIdHandler,
    createValidationHandler(
      body().isObject()
    ),
    getTask(repository),
    verifyQueuedTask,
    updateTaskData(apiId, logger, eventService)
  );
  router.post(
    '/queues/:namespace/:name/tasks/:id',
    validateNamespaceNameAndTaskIdHandler,
    createValidationHandler(
      ...checkSchema(
        {
          operation: { isString: true },
          priority: {
            optional: true,
            isString: true,
          },
          reason: {
            optional: true,
            isString: true,
          },
          assignTo: {
            optional: { options: { nullable: true, checkFalsy: false } },
            isObject: true,
          },
        },
        ['body']
      )
    ),
    getTask(repository),
    verifyQueuedTask,
    taskOperation(apiId, logger, eventService)
  );

  router.get(
    '/queues/:namespace/:name/assigners',
    validateNamespaceNameHandler,
    getQueue,
    getRoleUsers(logger, KEYCLOAK_ROOT_URL, 'assignerRoles')
  );
  router.get(
    '/queues/:namespace/:name/workers',
    validateNamespaceNameHandler,
    getQueue,
    getRoleUsers(logger, KEYCLOAK_ROOT_URL, 'workerRoles')
  );

  return router;
}
