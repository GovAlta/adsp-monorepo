import { DomainEvent, EventService, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, New, NotFoundError } from '@core-services/core-common';
import axios from 'axios';
import { RequestHandler, Router } from 'express';
import { Logger } from 'winston';
import { taskAssigned, taskCancelled, taskCompleted, taskCreated, taskPrioritySet, taskStarted } from '../events';
import { QueueEntity } from '../model/queue';
import { TaskEntity } from '../model/task';
import { TaskRepository } from '../repository';
import { Queue, Task, TaskPriority, TaskServiceConfiguration } from '../types';
import { getTask, mapTask, TASK_KEY } from './task';
import {
  TaskOperations,
  OPERATION_START,
  OPERATION_COMPLETE,
  OPERATION_CANCEL,
  OPERATION_SET_PRIORITY,
  OPERATION_ASSIGN,
  UserInformation,
} from './types';

interface QueueRouterProps {
  logger: Logger;
  taskRepository: TaskRepository;
  eventService: EventService;
  KEYCLOAK_ROOT_URL: string;
}

const QUEUE_KEY = 'queue';

function mapQueue(entity: QueueEntity): Omit<Queue, 'tenantId'> {
  return {
    namespace: entity.namespace,
    name: entity.name,
    context: entity.context,
    assignerRoles: entity.assignerRoles,
    workerRoles: entity.workerRoles,
  };
}

const verifyQueuedTask: RequestHandler = (req, res, next) => {
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

export const getQueuedTasks = (repository: TaskRepository): RequestHandler => async (req, res, next) => {
  try {
    const user = req.user;
    const { top: topValue, after } = req.query;
    const top = topValue ? parseInt(topValue as string) : 10;

    const queue: QueueEntity = req[QUEUE_KEY];
    const tasks = await queue.getTasks(user, repository, top, after as string);

    res.send({
      page: tasks.page,
      results: tasks.results.map(mapTask),
    });
  } catch (err) {
    next(err);
  }
};

export const createTask = (repository: TaskRepository, eventService: EventService): RequestHandler => async (
  req,
  res,
  next
) => {
  try {
    const user = req.user;
    const tenantId = req.user.tenantId;
    const task: New<Task> = req.body;

    const queue: QueueEntity = req[QUEUE_KEY];
    const entity = await TaskEntity.create(user, repository, queue, { tenantId, ...task });
    res.send(mapTask(entity));

    eventService.send(taskCreated(user, entity));
  } catch (err) {
    next(err);
  }
};

export const taskOperation = (eventService: EventService): RequestHandler => async (req, res, next) => {
  try {
    const user = req.user;
    const request: TaskOperations = req.body;
    const task: TaskEntity = req[TASK_KEY];

    let result: TaskEntity = null;
    let event: DomainEvent = null;

    switch (request.operation) {
      case OPERATION_START:
        result = await task.start(user);
        event = taskStarted(user, task);
        break;
      case OPERATION_COMPLETE:
        result = await task.complete(user);
        event = taskCompleted(user, task);
        break;
      case OPERATION_CANCEL:
        result = await task.cancel(user);
        event = taskCancelled(user, task);
        break;
      case OPERATION_SET_PRIORITY: {
        const from = task.priority;
        result = await task.setPriority(user, TaskPriority[request.priority]);
        event = taskPrioritySet(user, task, from);
        break;
      }
      case OPERATION_ASSIGN: {
        const from = task.assignment;
        result = await task.assign(user, request.assignTo);
        event = taskAssigned(user, task, from);
        break;
      }
      default:
        throw new InvalidOperationError(`Requested task operation not recognized.`);
    }

    res.send(mapTask(result));

    eventService.send(event);
  } catch (err) {
    next(err);
  }
};

export const getRoleUsers = (KEYCLOAK_ROOT_URL: string, rolesKey: string): RequestHandler => async (req, res, next) => {
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
      do {
        const { data: roleUsers = [] } = await axios.get<UserInformation[]>(
          `${KEYCLOAK_ROOT_URL}/auth/admin/realms/${realm}/roles/${role}/users?first=${first}&max=${max}`,
          {
            headers: { Authorization: `Bearer ${user.token.bearer}` },
          }
        );

        roleUsers.forEach((roleUser) => {
          user[roleUser.id] = roleUser;
        });

        if (roleUsers.length === max) {
          first += 101;
        } else {
          first = 0;
        }
      } while (first > 0);
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
  logger: _logger,
  taskRepository: repository,
  eventService,
}: QueueRouterProps): Router {
  const router = Router();

  router.get('/queues', getQueues);
  router.get('/queues/:namespace/:name', getQueue, (req, res) => {
    res.send(mapQueue(req[QUEUE_KEY]));
  });

  router.get('/queues/:namespace/:name/tasks', getQueue, getQueuedTasks(repository));
  router.post('/queues/:namespace/:name/tasks', getQueue, createTask(repository, eventService));
  router.get('/queues/:namespace/:name/tasks/:id', getTask(repository), verifyQueuedTask, (req, res) =>
    res.send(mapTask(req[TASK_KEY]))
  );
  router.post('/queues/:namespace/:name/tasks/:id', getTask(repository), verifyQueuedTask, taskOperation(eventService));

  router.get('/queues/:namespace/:name/assigners', getQueue, getRoleUsers(KEYCLOAK_ROOT_URL, 'assignerRoles'));
  router.get('/queues/:namespace/:name/workers', getQueue, getRoleUsers(KEYCLOAK_ROOT_URL, 'workerRoles'));

  return router;
}
