import { TaskDefinition } from './model';

export const FETCH_TASK_QUEUES_ACTION = 'queue/FETCH_TASK_QUEUE_ACTION';
export const FETCH_TASK_QUEUES_SUCCESS_ACTION = 'queue/FETCH_TASK_QUEUE_SUCCESS_ACTION';



export interface FetchTaskQueuesAction {
  type: typeof FETCH_TASK_QUEUES_ACTION;
}
export interface FetchTaskQueuesSuccessAction {
  type: typeof FETCH_TASK_QUEUES_SUCCESS_ACTION;
  payload: Record<string, TaskDefinition>;
}

export type TaskActionTypes =
  | FetchTaskQueuesAction
  | FetchTaskQueuesSuccessAction

export const getTaskQueues = (): FetchTaskQueuesAction => ({
  type: FETCH_TASK_QUEUES_ACTION,
});

export const getTaskQueuesSuccess = (results: Record<string, TaskDefinition>): FetchTaskQueuesSuccessAction => ({
  type: FETCH_TASK_QUEUES_SUCCESS_ACTION,
  payload: results,
});


