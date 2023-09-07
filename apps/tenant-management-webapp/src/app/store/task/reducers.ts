import { FETCH_TASK_QUEUES_SUCCESS_ACTION, TaskActionTypes, DELETE_TASK_QUEUE_SUCCESS_ACTION } from './action';

import { TaskState } from './model';

export const defaultState: TaskState = {
  queues: {},
};

export default function (state: TaskState = defaultState, action: TaskActionTypes): TaskState {
  switch (action.type) {
    case FETCH_TASK_QUEUES_SUCCESS_ACTION:
      return {
        ...state,
        queues: action.payload,
      };

    case DELETE_TASK_QUEUE_SUCCESS_ACTION:
      return {
        ...state,
        queues: {
          ...action.payload,
        },
      };

    default:
      return state;
  }
}
