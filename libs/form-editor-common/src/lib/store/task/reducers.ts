import { FETCH_TASK_QUEUES_SUCCESS_ACTION, TaskActionTypes } from './action';

import { TaskState } from './model';

export const defaultState: TaskState = {
  queues: null,
};

export default function (state: TaskState = defaultState, action: TaskActionTypes): TaskState {
  switch (action.type) {
    case FETCH_TASK_QUEUES_SUCCESS_ACTION:
      return {
        ...state,
        queues: action.payload,
      };

    default:
      return state;
  }
}
