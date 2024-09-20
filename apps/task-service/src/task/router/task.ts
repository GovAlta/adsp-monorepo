import { AdspId, DomainEvent, EventService, isAllowedUser, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import {
  createValidationHandler,
  InvalidOperationError,
  NotFoundError,
  Update,
  decodeAfter,
} from '@core-services/core-common';
import { Request, RequestHandler, Response, Router } from 'express';
import { checkSchema, param, query } from 'express-validator';
import { Logger } from 'winston';
import {
  taskAssigned,
  taskCancelled,
  taskCompleted,
  taskDeleted,
  taskPrioritySet,
  taskStarted,
  taskUpdated,
} from '../events';
import { TaskEntity } from '../model/task';
import { TaskRepository } from '../repository';
import { DirectoryServiceRoles, TaskServiceRoles } from '../roles';
import { Task, TaskPriority, TaskServiceConfiguration } from '../types';
import {
  TaskOperations,
  OPERATION_START,
  OPERATION_COMPLETE,
  OPERATION_CANCEL,
  OPERATION_SET_PRIORITY,
  OPERATION_ASSIGN,
} from './types';
import { mapTask } from '../mapper';

interface TaskRouterProps {
  apiId: AdspId;
  logger: Logger;
  taskRepository: TaskRepository;
  eventService: EventService;
}

export const TASK_KEY = 'task';

export const getTasks =
  (apiId: AdspId, repository: TaskRepository): RequestHandler =>
  async (req, res, next) => {
    try {
      const user = req.user;
      if (!(user?.roles?.includes(TaskServiceRoles.Admin) || user?.roles?.includes(TaskServiceRoles.TaskReader))) {
        throw new UnauthorizedUserError('read tasks', user);
      }

      const tenantId = req.tenant?.id;
      if (!tenantId) {
        throw new InvalidOperationError('Cannot retrieve task without tenant context.');
      }

      const { top: topValue, after, criteria: criteriaValue } = req.query;
      const top = topValue ? parseInt(topValue as string) : 10;
      const criteria = criteriaValue ? JSON.parse(criteriaValue as string) : {};

      const [{ queues }] = await req.getConfiguration<TaskServiceConfiguration>();
      const tasks = await repository.getTasks(queues, top, after as string, { ...criteria, tenantId });
      res.send({
        page: tasks.page,
        results: tasks.results.map((r) => mapTask(apiId, r)),
      });
    } catch (err) {
      next(err);
    }
  };

export const getTask =
  (repository: TaskRepository, ...roles: string[]): RequestHandler =>
  async (req, _res, next) => {
    try {
      const user = req.user;
      const { id } = req.params;
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        throw new InvalidOperationError('Cannot retrieve task without tenant context.');
      }

      const [{ queues }] = await req.getConfiguration<TaskServiceConfiguration>();
      const entity = await repository.getTask(queues, tenantId, id);
      if (!entity) {
        throw new NotFoundError('task', id);
      } else if (!entity.queue?.canAccessTask(user) && !isAllowedUser(user, entity.tenantId, roles, true)) {
        throw new UnauthorizedUserError('access task', user);
      }

      req[TASK_KEY] = entity;
      next();
    } catch (err) {
      next(err);
    }
  };

export function updateTask(apiId: AdspId, logger: Logger, eventService: EventService): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const update: Update<Task> = {
        name: req.body.name,
        description: req.body.description,
        context: req.body.context,
        data: req.body.data,
      };
      const task: TaskEntity = req[TASK_KEY];

      logger.debug(`Updating task (ID: ${task.id}) in queue ${task.queue?.namespace}:${task.queue?.name}...`, {
        context: 'TaskRouter',
        tenantId: task.tenantId.toString(),
        user: `${user.name} (ID: ${user.id})`,
      });

      const updated = await task.update(user, update);
      res.send(mapTask(apiId, updated));

      eventService.send(taskUpdated(apiId, user, updated, update));

      logger.info(`Updated task (ID: ${task.id}) in queue ${task.queue?.namespace}:${task.queue?.name}.`, {
        context: 'TaskRouter',
        tenantId: task.tenantId.toString(),
        user: `${user.name} (ID: ${user.id})`,
      });
    } catch (err) {
      next(err);
    }
  };
}

export function taskOperation(apiId: AdspId, logger: Logger, eventService: EventService): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const request: TaskOperations = req.body;
      const task: TaskEntity = req[TASK_KEY];

      let result: TaskEntity = null;
      let event: DomainEvent = null;

      logger.debug(
        `Performing operation ${request.operation} on task (ID: ${task.id}) in queue ${task.queue?.namespace}:${task.queue?.name}...`,
        {
          context: 'TaskRouter',
          tenantId: task.tenantId.toString(),
          user: `${user.name} (ID: ${user.id})`,
        }
      );

      switch (request.operation) {
        case OPERATION_START:
          result = await task.start(user);
          event = taskStarted(apiId, user, result);
          break;
        case OPERATION_COMPLETE:
          result = await task.complete(user);
          event = taskCompleted(apiId, user, result);
          break;
        case OPERATION_CANCEL:
          result = await task.cancel(user);
          event = taskCancelled(apiId, user, result, request.reason);
          break;
        case OPERATION_SET_PRIORITY: {
          const from = task.priority;
          result = await task.setPriority(user, TaskPriority[request.priority]);
          event = taskPrioritySet(apiId, user, result, from);
          break;
        }
        case OPERATION_ASSIGN: {
          const from = task.assignment;
          result = await task.assign(user, request.assignTo);
          event = taskAssigned(apiId, user, result, from);
          break;
        }
        default:
          throw new InvalidOperationError(`Requested task operation not recognized.`);
      }

      res.send(mapTask(apiId, result));

      eventService.send(event);

      logger.info(
        `Performed operation ${request.operation} on task (ID: ${task.id}) in queue ${task.queue?.namespace}:${task.queue?.name}.`,
        {
          context: 'TaskRouter',
          tenantId: task.tenantId.toString(),
          user: `${user.name} (ID: ${user.id})`,
        }
      );
    } catch (err) {
      next(err);
    }
  };
}

export function deleteTask(apiId: AdspId, logger: Logger, eventService: EventService): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const task: TaskEntity = req[TASK_KEY];

      logger.debug(`Deleting task (ID: ${task.id}) in queue ${task.queue?.namespace}:${task.queue?.name}...`, {
        context: 'TaskRouter',
        tenantId: task.tenantId.toString(),
        user: `${user.name} (ID: ${user.id})`,
      });

      const deleted = await task.delete(user);

      res.send({ deleted });
      if (deleted) {
        eventService.send(taskDeleted(apiId, user, task));
      }

      logger.info(
        `Deleted task (ID: ${task.id}) in queue ${task.queue?.namespace}:${task.queue?.name} with result ${deleted}.`,
        {
          context: 'TaskRouter',
          tenantId: task.tenantId.toString(),
          user: `${user.name} (ID: ${user.id})`,
        }
      );
    } catch (err) {
      next(err);
    }
  };
}

export function createTaskRouter({
  logger,
  apiId,
  taskRepository: repository,
  eventService,
}: TaskRouterProps): Router {
  const router = Router();

  const validateIdHandler = createValidationHandler(param('id').isUUID());

  router.get(
    '/tasks',
    createValidationHandler(
      query('top').optional().isInt({ min: 1, max: 5000 }),
      query('after')
        .optional()
        .isString()
        .custom((val) => {
          return !isNaN(decodeAfter(val));
        })
    ),
    getTasks(apiId, repository)
  );
  router.get(
    '/tasks/:id',
    validateIdHandler,
    getTask(repository, DirectoryServiceRoles.ResourceResolver),
    (req: Request, res: Response) => res.send(mapTask(apiId, req[TASK_KEY]))
  );
  router.patch(
    '/tasks/:id',
    validateIdHandler,
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
    updateTask(apiId, logger, eventService)
  );

  router.post('/tasks/:id', validateIdHandler, getTask(repository), taskOperation(apiId, logger, eventService));

  router.delete('/tasks/:id', validateIdHandler, getTask(repository), deleteTask(apiId, logger, eventService));

  return router;
}
