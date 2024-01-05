import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { AppState } from './store';
import { Person, PUSH_SERVICE_ID, QueueDefinition, Task, TASK_SERVICE_ID } from './types';
import { getAccessToken } from './user.slice';
import { loadQueueMetrics, QueueMetrics } from './queue.slice';
import { loadTopic } from './comment.slice';

export const TASK_FEATURE_KEY = 'task';
const UPDATE_STREAM_ID = 'task-updates';

enum TaskPriority {
  Urgent = 2,
  High = 1,
  Normal = 0,
}

export type TaskFilter = 'active' | 'pending' | 'assigned';

export interface TaskMetric {
  name: string;
  value?: number | string;
  unit?: string;
}

export interface TaskUser extends Person {
  id: string;
  isAssigner: boolean;
  isWorker: boolean;
}

export interface TaskState {
  user: TaskUser;
  queue: QueueDefinition;
  live: boolean;
  people: Record<string, Person>;
  assigners: string[];
  workers: string[];
  tasks: Record<string, Task>;
  results: string[];
  filter: TaskFilter;
  next: string;
  selected: string;
  opened: string;
  busy: {
    initializing: boolean;
    loading: boolean;
    executing: boolean;
  };
  modal: {
    taskToAssign: Task;
    taskToPrioritize: Task;
  };
}

interface TaskResults {
  results: Task[];
  page: {
    after?: string;
    next?: string;
    size: number;
  };
}

export const initializeQueue = createAsyncThunk(
  'task/initialize-definition',
  async ({ namespace, name }: { namespace: string; name: string }, { dispatch, getState, rejectWithValue }) => {
    const state = getState() as AppState;
    const { directory } = state.config;

    try {
      let definition = state.queue.queues[`${namespace}:${name}`];
      if (!definition) {
        const accessToken = await getAccessToken();
        const { data } = await axios.get<QueueDefinition>(
          `${directory[TASK_SERVICE_ID]}/task/v1/queues/${namespace}/${name}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        definition = data;
      }

      dispatch(loadQueueMetrics({ namespace, name }));
      dispatch(loadQueueTasks({ namespace, name }));
      dispatch(loadQueuePeople(definition));
      dispatch(connectStream({ namespace, name }));

      return definition;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue({
          status: err.response?.status,
          message: err.response?.data?.errorMessage || err.message,
        });
      } else {
        throw err;
      }
    }
  }
);

interface TaskEvent {
  timestamp: string;
  payload: {
    task: Task;
  };
}

let socket: Socket;
export const connectStream = createAsyncThunk(
  'task/connectStream',
  async ({ namespace, name }: { namespace: string; name: string }, { dispatch, getState }) => {
    const state = getState() as AppState;
    const { directory } = state.config;

    // Create the connection if no previous connection or it is disconnected.
    if (socket && socket.connected) {
      socket.disconnect();
    }

    socket = io(`${directory[PUSH_SERVICE_ID]}/`, {
      query: {
        stream: UPDATE_STREAM_ID,
      },
      withCredentials: true,
      auth: async (cb) => {
        try {
          const token = await getAccessToken();
          cb({ token });
        } catch (err) {
          // Token retrieval failed and connection (using auth result) will also fail after.
          cb(null);
        }
      },
    });

    socket.on('connect', () => {
      dispatch(taskActions.streamConnectionChanged(true));
    });

    socket.on('disconnected', () => {
      dispatch(taskActions.streamConnectionChanged(false));
    });

    const onTaskUpdate = ({ payload }: TaskEvent) => {
      if (payload.task.queue?.namespace === namespace && payload.task.queue?.name === name) {
        // Add or update the task and reload queue metrics.
        dispatch(taskActions.setTask(payload.task));
        dispatch(loadQueueMetrics({ namespace, name }));
      }
    };
    socket.on('task-service:task-created', onTaskUpdate);
    socket.on('task-service:task-assigned', onTaskUpdate);
    socket.on('task-service:task-priority-set', onTaskUpdate);
    socket.on('task-service:task-started', onTaskUpdate);
    socket.on('task-service:task-completed', onTaskUpdate);
    socket.on('task-service:task-cancelled', onTaskUpdate);
  }
);

export const loadQueueTasks = createAsyncThunk(
  'task/load-queue-tasks',
  async (
    { namespace, name, after }: { namespace: string; name: string; after?: string },
    { getState, rejectWithValue }
  ) => {
    const state = getState() as AppState;
    const { directory } = state.config;

    try {
      const accessToken = await getAccessToken();
      const { data } = await axios.get<TaskResults>(
        `${directory[TASK_SERVICE_ID]}/task/v1/queues/${namespace}/${name}/tasks`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            top: 100,
            after,
          },
        }
      );

      return data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue({
          status: err.response?.status,
          message: err.response?.data?.errorMessage || err.message,
        });
      } else {
        throw err;
      }
    }
  }
);

export const loadQueuePeople = createAsyncThunk(
  'task/load-queue-people',
  async ({ namespace, name, assignerRoles, workerRoles }: QueueDefinition, { getState }) => {
    const state = getState() as AppState;
    const { user } = state.user;
    const { directory } = state.config;

    let assigners: Person[] = [];
    let workers: Person[] = [];
    try {
      let accessToken = await getAccessToken();
      const { data: assignersResult } = await axios.get<Person[]>(
        `${directory[TASK_SERVICE_ID]}/task/v1/queues/${namespace}/${name}/assigners`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      assigners = assignersResult;

      accessToken = await getAccessToken();
      const { data: workersResult } = await axios.get<Person[]>(
        `${directory[TASK_SERVICE_ID]}/task/v1/queues/${namespace}/${name}/workers`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      workers = workersResult;
    } catch (err) {
      // Failed to load queue people due to permissions.
      if (!axios.isAxiosError(err) || (err.response?.status !== 401 && err.response?.status !== 403)) {
        throw err;
      }
    }

    return {
      assigners,
      workers,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAssigner: !!assignerRoles.find((r) => user.roles.includes(r)),
        isWorker: !!workerRoles.find((r) => user.roles.includes(r)),
      },
    };
  }
);

export const openTask = createAsyncThunk(
  'task/open-task',
  async ({ taskId }: { taskId?: string }, { getState, dispatch }) => {
    const { task } = getState() as AppState;
    if (task.opened !== taskId && taskId) {
      const toOpen = task.tasks[taskId];
      dispatch(loadTopic({ resourceId: toOpen.urn }));
    }
    return taskId;
  }
);

export const setTaskPriority = createAsyncThunk(
  'task/set-task-priority',
  async ({ taskId, priority }: { taskId: string; priority: string }, { dispatch, getState, rejectWithValue }) => {
    const state = getState() as AppState;
    const { directory } = state.config;
    const { queue }: TaskState = state[TASK_FEATURE_KEY];

    try {
      const accessToken = await getAccessToken();
      const { data } = await axios.post<Task>(
        `${directory[TASK_SERVICE_ID]}/task/v1/queues/${queue.namespace}/${queue.name}/tasks/${taskId}`,
        {
          operation: 'set-priority',
          priority,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      dispatch(taskActions.setTaskToPrioritize(null));

      return data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue({
          status: err.response?.status,
          message: err.response?.data?.errorMessage || err.message,
        });
      } else {
        throw err;
      }
    }
  }
);

export const assignTask = createAsyncThunk(
  'task/assign-task',
  async ({ taskId, assignTo }: { taskId: string; assignTo?: Person }, { dispatch, getState, rejectWithValue }) => {
    const state = getState() as AppState;
    const { directory } = state.config;
    const { queue }: TaskState = state[TASK_FEATURE_KEY];

    try {
      const accessToken = await getAccessToken();
      const { data } = await axios.post<Task>(
        `${directory[TASK_SERVICE_ID]}/task/v1/queues/${queue.namespace}/${queue.name}/tasks/${taskId}`,
        {
          operation: 'assign',
          assignTo,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      dispatch(taskActions.setTaskToAssign(null));

      return data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue({
          status: err.response?.status,
          message: err.response?.data?.errorMessage || err.message,
        });
      } else {
        throw err;
      }
    }
  }
);

export const startTask = createAsyncThunk(
  'task/start-task',
  async ({ taskId }: { taskId: string }, { getState, rejectWithValue }) => {
    const state = getState() as AppState;
    const { directory } = state.config;
    const { queue }: TaskState = state[TASK_FEATURE_KEY];

    try {
      const accessToken = await getAccessToken();
      const { data } = await axios.post<Task>(
        `${directory[TASK_SERVICE_ID]}/task/v1/queues/${queue.namespace}/${queue.name}/tasks/${taskId}`,
        {
          operation: 'start',
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      return data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue({
          status: err.response?.status,
          message: err.response?.data?.errorMessage || err.message,
        });
      } else {
        throw err;
      }
    }
  }
);

export const completeTask = createAsyncThunk(
  'task/complete-task',
  async ({ taskId }: { taskId: string }, { getState, rejectWithValue }) => {
    const state = getState() as AppState;
    const { directory } = state.config;
    const { queue }: TaskState = state[TASK_FEATURE_KEY];

    try {
      const accessToken = await getAccessToken();
      const { data } = await axios.post<Task>(
        `${directory[TASK_SERVICE_ID]}/task/v1/queues/${queue.namespace}/${queue.name}/tasks/${taskId}`,
        {
          operation: 'complete',
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      return data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue({
          status: err.response?.status,
          message: err.response?.data?.errorMessage || err.message,
        });
      } else {
        throw err;
      }
    }
  }
);

export const cancelTask = createAsyncThunk(
  'task/cancel-task',
  async ({ taskId, reason }: { taskId: string; reason: string }, { getState, rejectWithValue }) => {
    const state = getState() as AppState;
    const { directory } = state.config;
    const { queue }: TaskState = state[TASK_FEATURE_KEY];

    try {
      const accessToken = await getAccessToken();
      const { data } = await axios.post<Task>(
        `${directory[TASK_SERVICE_ID]}/task/v1/queues/${queue.namespace}/${queue.name}/tasks/${taskId}`,
        {
          operation: 'cancel',
          reason: reason || undefined,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      return data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue({
          status: err.response?.status,
          message: err.response?.data?.errorMessage || err.message,
        });
      } else {
        throw err;
      }
    }
  }
);

export const initialTaskState: TaskState = {
  user: {
    id: null,
    name: null,
    email: null,
    isAssigner: false,
    isWorker: false,
  },
  queue: null,
  live: false,
  people: {},
  assigners: [],
  workers: [],
  tasks: {},
  results: [],
  filter: 'active',
  next: null,
  selected: null,
  opened: null,
  busy: {
    initializing: true,
    loading: false,
    executing: false,
  },
  modal: {
    taskToAssign: null,
    taskToPrioritize: null,
  },
};

export const taskSlice = createSlice({
  name: TASK_FEATURE_KEY,
  initialState: initialTaskState,
  reducers: {
    streamConnectionChanged: (state, { payload }: PayloadAction<boolean>) => {
      state.live = payload;
    },
    setTask: (state, { payload }: PayloadAction<Task>) => {
      state.tasks[payload.id] = payload;
      if (!state.results.includes(payload.id)) {
        state.results = [...state.results, payload.id];
      }
    },
    setFilter: (state, { payload }: PayloadAction<TaskFilter>) => {
      state.filter = payload;
    },
    setTaskToAssign: (state, { payload }: PayloadAction<Task>) => {
      state.modal.taskToAssign = payload;
    },
    setTaskToPrioritize: (state, { payload }: PayloadAction<Task>) => {
      state.modal.taskToPrioritize = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeQueue.pending, (state) => {
        state.busy.initializing = true;
        state.queue = null;
        state.results = [];
      })
      .addCase(initializeQueue.fulfilled, (state, { payload }) => {
        state.busy.initializing = false;
        state.queue = payload;
      })
      .addCase(initializeQueue.rejected, (state) => {
        state.busy.initializing = false;
      })
      .addCase(loadQueuePeople.pending, (state) => {
        state.busy.initializing = true;
      })
      .addCase(loadQueuePeople.fulfilled, (state, { payload }) => {
        state.busy.initializing = false;
        state.people = [...payload.assigners, ...payload.workers].reduce(
          (people, person) => ({ ...people, [person.id]: person }),
          {}
        );
        state.assigners = payload.assigners.map((p) => p.id);
        state.workers = payload.workers.map((p) => p.id);
        state.user = payload.user;
      })
      .addCase(loadQueuePeople.rejected, (state) => {
        state.busy.initializing = false;
      })
      .addCase(loadQueueTasks.pending, (state) => {
        state.busy.loading = true;
      })
      .addCase(loadQueueTasks.fulfilled, (state, { payload }) => {
        state.busy.loading = false;
        state.tasks = payload.results.reduce(
          (results, task) => ({
            ...results,
            [task.id]: task,
          }),
          state.tasks
        );
        state.results = (payload.page.after ? state.results : []).concat(payload.results.map((r) => r.id));
        state.next = payload.page.next;
      })
      .addCase(loadQueueTasks.rejected, (state) => {
        state.busy.initializing = false;
      })
      .addCase(openTask.fulfilled, (state, { payload }) => {
        state.opened = payload;
      })
      .addCase(assignTask.pending, (state) => {
        state.busy.executing = true;
      })
      .addCase(assignTask.fulfilled, (state, { payload }) => {
        state.busy.executing = false;
        state.tasks = {
          ...state.tasks,
          [payload.id]: payload,
        };
      })
      .addCase(assignTask.rejected, (state) => {
        state.busy.executing = false;
      })
      .addCase(setTaskPriority.pending, (state) => {
        state.busy.executing = true;
      })
      .addCase(setTaskPriority.fulfilled, (state, { payload }) => {
        state.busy.executing = false;
        state.tasks = {
          ...state.tasks,
          [payload.id]: payload,
        };
      })
      .addCase(setTaskPriority.rejected, (state) => {
        state.busy.executing = false;
      })
      .addCase(startTask.pending, (state) => {
        state.busy.executing = true;
      })
      .addCase(startTask.fulfilled, (state, { payload }) => {
        state.busy.executing = false;
        state.tasks = {
          ...state.tasks,
          [payload.id]: payload,
        };
      })
      .addCase(startTask.rejected, (state) => {
        state.busy.executing = false;
      })
      .addCase(completeTask.pending, (state) => {
        state.busy.executing = true;
      })
      .addCase(completeTask.fulfilled, (state, { payload }) => {
        state.busy.executing = false;
        state.tasks = {
          ...state.tasks,
          [payload.id]: payload,
        };
      })
      .addCase(completeTask.rejected, (state) => {
        state.busy.executing = false;
      })
      .addCase(cancelTask.pending, (state) => {
        state.busy.executing = true;
      })
      .addCase(cancelTask.fulfilled, (state, { payload }) => {
        state.busy.executing = false;
        state.tasks = {
          ...state.tasks,
          [payload.id]: payload,
        };
      })
      .addCase(cancelTask.rejected, (state) => {
        state.busy.executing = false;
      });
  },
});

export const taskReducer = taskSlice.reducer;

export const taskActions = taskSlice.actions;

export const getTaskState = (rootState: AppState): TaskState => rootState.task;

export const filterSelector = createSelector(getTaskState, (state) => state.filter);

export const liveSelector = createSelector(getTaskState, (state) => state.live);

export const tasksSelector = createSelector(
  (state: AppState) => state.user.user.id,
  (state: AppState) => state.task.results,
  (state: AppState) => state.task.tasks,
  filterSelector,
  (userId: string, results: string[], tasks: Record<string, Task>, filter: string) =>
    results
      .map((r) => tasks[r])
      .filter((r) => {
        switch (filter) {
          case 'pending':
            return r?.status === 'Pending';
          case 'assigned':
            return !r?.endedOn && r?.assignment?.assignedTo?.id === userId;
          case 'active':
            return !r?.endedOn;
          default:
            return !!r;
        }
      })
      .sort((a, b) => {
        let result = TaskPriority[b.priority] - TaskPriority[a.priority];
        if (!result) {
          result = new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime();
        }
        return result;
      })
);

export const busySelector = createSelector(getTaskState, (state) => state.busy);

export const modalSelector = createSelector(getTaskState, (state) => state.modal);

export const openTaskSelector = createSelector(getTaskState, (state) => state.opened && state.tasks[state.opened]);

export const queueWorkersSelector = createSelector(getTaskState, (state) =>
  state.workers.map((worker) => state.people[worker])
);

export const queueUserSelector = createSelector(getTaskState, (state) => state.user);

export const metricsSelector = createSelector(
  (state: AppState) => state.queue.metrics,
  (state: AppState) => state.task.queue,
  (state: AppState) => state.user.user?.id,
  (metrics: Record<string, QueueMetrics>, queue: QueueDefinition, userId: string) => {
    return queue ? metrics[`${queue.namespace}:${queue.name}`] : null;
  }
);
