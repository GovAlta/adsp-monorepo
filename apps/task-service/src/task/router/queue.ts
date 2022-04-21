import { AdspId, EventService, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { createValidationHandler, NotFoundError } from '@core-services/core-common';
import axios from 'axios';
import { Request, RequestHandler, Response, Router } from 'express';
import { checkSchema, param, query } from 'express-validator';
import * as HttpStatusCodes from 'http-status-codes';
import { Logger } from 'winston';
import { updateTask } from '.';
import { taskCreated } from '../events';
import { QueueEntity } from '../model/queue';
import { TaskEntity } from '../model/task';
import { TaskRepository } from '../repository';
import { Queue, TaskPriority, TaskServiceConfiguration } from '../types';
import { getTask, mapTask, taskOperation, TASK_KEY } from './task';
import { UserInformation } from './types';

interface QueueRouterProps {
  apiId: AdspId;
  logger: Logger;
  taskRepository: TaskRepository;
  eventService: EventService;
  KEYCLOAK_ROOT_URL: string;
}

const QUEUE_KEY = 'queue';

export function mapQueue(entity: QueueEntity): Omit<Queue, 'tenantId'> {
  return {
    namespace: entity.namespace,
    name: entity.name,
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

export const createTask =
  (apiId: AdspId, repository: TaskRepository, eventService: EventService): RequestHandler =>
  async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.user.tenantId;
      const { priority, ...task } = req.body;

      const queue: QueueEntity = req[QUEUE_KEY];
      const entity = await TaskEntity.create(user, repository, queue, {
        tenantId,
        priority: priority ? TaskPriority[priority] : null,
        ...task,
      });
      res.send(mapTask(apiId, entity));

      eventService.send(taskCreated(user, entity));
    } catch (err) {
      next(err);
    }
  };

export const getRoleUsers =
  (logger: Logger, KEYCLOAK_ROOT_URL: string, rolesKey: 'assignerRoles' | 'workerRoles'): RequestHandler =>
  async (req, res, next) => {
    try {
      const user = req.user;
      const realm = req.tenant?.realm;
      if (!realm) {
        throw new UnauthorizedUserError('get queue users', user);
      }

      const queue: QueueEntity = req[QUEUE_KEY];
      const roles: string[] = queue[rolesKey] || [];

      const max = 100;

      const users: Record<string, UserInformation> = {};
      for (let i = 0; i < roles.length; i++) {
        const role = roles[i];
        let first = 0;
        try {
          do {
            const { data: roleUsers = [] } = await axios.get<UserInformation[]>(
              `${KEYCLOAK_ROOT_URL}/auth/admin/realms/${realm}/roles/${role}/users?first=${first}&max=${max}`,
              {
                headers: { Authorization: `Bearer ${user.token.bearer}` },
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
              logger.warn(`Role '${role}' not found.`);
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
  taskRepository: repository,
  eventService,
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
    '/queues/:namespace/:name/tasks',
    validateNamespaceNameHandler,
    createValidationHandler(query('top').optional().isInt({ min: 1, max: 5000 }), query('after').optional().isString()),
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
    createTask(apiId, repository, eventService)
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
        },
        ['body']
      )
    ),
    getTask(repository),
    verifyQueuedTask,
    updateTask(apiId, eventService)
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
            optional: true,
            isObject: true,
          },
        },
        ['body']
      )
    ),
    getTask(repository),
    verifyQueuedTask,
    taskOperation(apiId, eventService)
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
