import { TaskDefinition, Indicator } from './model';

export const FETCH_TASK_QUEUES_ACTION = 'queue/FETCH_TASK_QUEUE_ACTION';
export const FETCH_TASK_QUEUES_SUCCESS_ACTION = 'queue/FETCH_TASK_QUEUE_SUCCESS_ACTION';

export const DELETE_TASK_QUEUE_ACTION = 'task/DELETE_TASK_QUEUE_ACTION';
export const DELETE_TASK_QUEUE_SUCCESS_ACTION = 'task/DELETE_TASK_QUEUE_SUCCESS_ACTION';

export const UPDATE_TASK_QUEUE_ACTION = 'queue/UPDATE_TASK_QUEUE_ACTION';
export const UPDATE_TASK_QUEUE_SUCCESS_ACTION = 'queue/UPDATE_TASK_QUEUE_SUCCESS_ACTION';

export const GET_TASKS_ACTION = 'task/GET_TASKS_ACTION';
export const GET_TASKS_SUCCESS_ACTION = 'task/GET_TASKS_SUCCESS_ACTION';

export const UPDATE_INDICATOR = 'queue/indicator';

export interface FetchTaskQueuesAction {
  type: typeof FETCH_TASK_QUEUES_ACTION;
}
export interface FetchTaskQueuesSuccessAction {
  type: typeof FETCH_TASK_QUEUES_SUCCESS_ACTION;
  payload: Record<string, TaskDefinition>;
}

export interface DeleteTaskDefinitionAction {
  type: typeof DELETE_TASK_QUEUE_ACTION;
  queue: TaskDefinition;
}

export interface DeleteTaskDefinitionSuccessAction {
  type: typeof DELETE_TASK_QUEUE_SUCCESS_ACTION;
  payload: Record<string, TaskDefinition>;
}

export interface GetsTasksSuccessAction {
  type: typeof GET_TASKS_SUCCESS_ACTION;
  payload: Record<string, object>;
}
export interface GetsTasksAction {
  type: typeof GET_TASKS_ACTION;
  queue: TaskDefinition;
}

export interface UpdateTaskQueueAction {
  type: typeof UPDATE_TASK_QUEUE_ACTION;
  payload: TaskDefinition;
}
export interface UpdateTaskQueueSuccessAction {
  type: typeof UPDATE_TASK_QUEUE_SUCCESS_ACTION;
  payload: Record<string, TaskDefinition>;
}

export interface UpdateIndicatorAction {
  type: typeof UPDATE_INDICATOR;
  payload: Indicator;
}

export type TaskActionTypes =
  | FetchTaskQueuesAction
  | FetchTaskQueuesSuccessAction
  | UpdateTaskQueueAction
  | UpdateTaskQueueSuccessAction
  | DeleteTaskDefinitionAction
  | DeleteTaskDefinitionSuccessAction
  | UpdateIndicatorAction
  | GetsTasksSuccessAction
  | GetsTasksAction;

export const getTaskQueues = (): FetchTaskQueuesAction => ({
  type: FETCH_TASK_QUEUES_ACTION,
});

export const getTaskQueuesSuccess = (results: Record<string, TaskDefinition>): FetchTaskQueuesSuccessAction => ({
  type: FETCH_TASK_QUEUES_SUCCESS_ACTION,
  payload: results,
});

export const UpdateTaskQueue = (payload: TaskDefinition): UpdateTaskQueueAction => ({
  type: UPDATE_TASK_QUEUE_ACTION,
  payload,
});

export const UpdateTaskQueueSuccess = (queue: Record<string, TaskDefinition>): UpdateTaskQueueSuccessAction => ({
  type: UPDATE_TASK_QUEUE_SUCCESS_ACTION,
  payload: queue,
});

export const UpdateIndicator = (indicator: Indicator): UpdateIndicatorAction => ({
  type: UPDATE_INDICATOR,
  payload: indicator,
});

export const getTasks = (payload: TaskDefinition): GetsTasksAction => ({
  type: GET_TASKS_ACTION,
  queue: payload,
});

export const getTasksSuccess = (results: Record<string, object>): GetsTasksSuccessAction => ({
  type: GET_TASKS_SUCCESS_ACTION,
  payload: results,
});

export const deleteTaskQueue = (queue: TaskDefinition): DeleteTaskDefinitionAction => ({
  type: DELETE_TASK_QUEUE_ACTION,
  queue,
});

export const deleteTaskQueueSuccess = (
  definitions: Record<string, TaskDefinition>
): DeleteTaskDefinitionSuccessAction => ({
  type: DELETE_TASK_QUEUE_SUCCESS_ACTION,
  payload: definitions,
});
