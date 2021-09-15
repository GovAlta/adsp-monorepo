import { AdspId, DomainEvent, EventService, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError, Update } from '@core-services/core-common';
import { RequestHandler, Router } from 'express';
import { Logger } from 'winston';
import { taskAssigned, taskCancelled, taskCompleted, taskPrioritySet, taskStarted, taskUpdated } from '../events';
import { TaskEntity } from '../model/task';
import { TaskRepository } from '../repository';
import { TaskServiceRoles } from '../roles';
import { Task, TaskPriority, TaskServiceConfiguration } from '../types';
import {
  TaskOperations,
  OPERATION_START,
  OPERATION_COMPLETE,
  OPERATION_CANCEL,
  OPERATION_SET_PRIORITY,
  OPERATION_ASSIGN,
} from './types';

interface TaskRouterProps {
  logger: Logger;
  taskRepository: TaskRepository;
  eventService: EventService;
}

export const TASK_KEY = 'task';

export const mapTask = (entity: TaskEntity): unknown => ({
  id: entity.id,
  name: entity.name,
  description: entity.description,
  context: entity.context,
  definition: entity.definition ? { namespace: entity.definition.namespace, name: entity.definition.name } : null,
  queue: entity.queue ? { namespace: entity.queue.namespace, name: entity.queue.name } : null,
  status: entity.status,
  priority: TaskPriority[entity.priority],
  createdOn: entity.createdOn,
  startedOn: entity.startedOn,
  endedOn: entity.endedOn,
  assignment: entity.assignment,
});

export const getTasks = (repository: TaskRepository): RequestHandler => async (req, res, next) => {
  try {
    const user = req.user;
    if (!(user?.roles?.includes(TaskServiceRoles.Admin) || user?.roles?.includes(TaskServiceRoles.TaskReader))) {
      throw new UnauthorizedUserError('read tasks', user);
    }

    const { top: topValue, after, criteria: criteriaValue } = req.query;
    const top = topValue ? parseInt(topValue as string) : 10;
    const criteria = criteriaValue ? JSON.parse(criteriaValue as string) : {};
    if (!user.isCore) {
      criteria.tenantId = user.tenantId;
    }

    const [{ queues }] = await req.getConfiguration<TaskServiceConfiguration>();
    const tasks = await repository.getTasks(queues, top, after as string, criteria);
    res.send({
      page: tasks.page,
      results: tasks.results.map(mapTask),
    });
  } catch (err) {
    next(err);
  }
};

export const getTask = (repository: TaskRepository): RequestHandler => async (req, _res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { tenantId: tenantIdValue } = req.query;
    const tenantId = user?.isCore && tenantIdValue ? AdspId.parse(tenantIdValue as string) : user.tenantId;

    const [{ queues }] = await req.getConfiguration<TaskServiceConfiguration>();
    const entity = await repository.getTask(queues, tenantId, id);
    if (!entity) {
      throw new NotFoundError('task', id);
    } else if (!entity.queue?.canAccessTask(user)) {
      throw new UnauthorizedUserError('access task', user);
    }

    req[TASK_KEY] = entity;
    next();
  } catch (err) {
    next(err);
  }
};

export const updateTask = (eventService: EventService): RequestHandler => async (req, res, next) => {
  try {
    const user = req.user;
    const update: Update<Task> = req.body;
    const task: TaskEntity = req[TASK_KEY];

    const updated = await task.update(user, update);
    res.send(mapTask(updated));

    eventService.send(taskUpdated(user, updated, update));
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
        event = taskStarted(user, result);
        break;
      case OPERATION_COMPLETE:
        result = await task.complete(user);
        event = taskCompleted(user, result);
        break;
      case OPERATION_CANCEL:
        result = await task.cancel(user);
        event = taskCancelled(user, result, request.reason);
        break;
      case OPERATION_SET_PRIORITY: {
        const from = task.priority;
        result = await task.setPriority(user, TaskPriority[request.priority]);
        event = taskPrioritySet(user, result, from);
        break;
      }
      case OPERATION_ASSIGN: {
        const from = task.assignment;
        result = await task.assign(user, request.assignTo);
        event = taskAssigned(user, result, from);
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

export function createTaskRouter({
  logger: _logger,
  taskRepository: repository,
  eventService,
}: TaskRouterProps): Router {
  const router = Router();

  router.get('/tasks', getTasks(repository));
  router.get('/tasks/:id', getTask(repository), (req, res) => res.send(mapTask(req[TASK_KEY])));
  router.patch('/tasks/:id', getTask(repository), updateTask(eventService));
  router.post('/tasks/:id', getTask(repository), taskOperation(eventService));

  return router;
}
