import {
  FETCH_TASK_QUEUES_SUCCESS_ACTION,
  TaskActionTypes,
  DELETE_TASK_QUEUE_SUCCESS_ACTION,
  GET_TASKS_SUCCESS_ACTION,
  GET_TASKS_ACTION,
  UPDATE_TASK_QUEUE_SUCCESS_ACTION,
  FETCH_QUEUE_TASKS_SUCCESS_ACTION,
  UPDATE_QUEUE_TASK_SUCCESS_ACTION,
  SET_QUEUE_TASK_SUCCESS_ACTION,
  CREATE_TASKS_SUCCESS_ACTION
} from './action';

import { TaskState } from './model';

export const defaultState: TaskState = {
  queues: null,
  tasks: null,
  nextEntries: null,
};

export default function (state: TaskState = defaultState, action: TaskActionTypes): TaskState {
  switch (action.type) {
    case FETCH_TASK_QUEUES_SUCCESS_ACTION:
      return {
        ...state,
        queues: action.payload,
      };
    case FETCH_QUEUE_TASKS_SUCCESS_ACTION:
      return {
        ...state,
        tasks: action.payload,
      };

    case SET_QUEUE_TASK_SUCCESS_ACTION:
      return {
        ...state,
        tasks: action.payload,
      };
    case GET_TASKS_SUCCESS_ACTION: {
      return {
        ...state,
        tasks:
          action.after && action.after !== ''
            ? [...state.tasks, ...action.payload]
            : action.payload
            ? action.payload
            : state.tasks,
        nextEntries: action.next,
      };
    }
    case CREATE_TASKS_SUCCESS_ACTION: {
      return {
        ...state,
        tasks:
          state.nextEntries ? state.tasks : [...state.tasks, action.payload]
      };
    }
    case GET_TASKS_ACTION:
      return {
        ...state,
      };

    case UPDATE_TASK_QUEUE_SUCCESS_ACTION:
      return {
        ...state,
        queues: action.payload,
      };
    case UPDATE_QUEUE_TASK_SUCCESS_ACTION: {
       const index = state.tasks.findIndex((task) => task.id === action.payload?.id )
       const updatedTasks = [...state.tasks]
       updatedTasks[index] = action.payload
      return {
        ...state,
        tasks: updatedTasks,
      };
     }
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
