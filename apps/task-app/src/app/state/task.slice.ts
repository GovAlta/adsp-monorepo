import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { AppState } from './store';
import { Person, PUSH_SERVICE_ID, QueueDefinition, Task, TASK_SERVICE_ID } from './types';
import { getAccessToken } from './user.slice';
import { loadQueueMetrics, QueueMetrics } from './queue.slice';
import { loadTopic } from './comment.slice';
import { hasRole } from './util';

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
  isAssigner: boolean;
  isWorker: boolean;
}

type SerializedTask = Omit<Task, 'createdOn' | 'startedOn' | 'endedOn'> & {
  createdOn: string;
  startedOn: string;
  endedOn: string;
};

export interface TaskState {
  user: TaskUser;
  queue: QueueDefinition;
  live: boolean;
  people: Record<string, Person>;
  assigners: string[];
  workers: string[];
  tasks: Record<string, SerializedTask>;
  results: string[];
  filter: TaskFilter;
  next: string;
  selected: string;
  opened: string;
  busy: {
    initializing: boolean;
    initializingUser: boolean;
    loading: boolean;
    executing: boolean;
  };
  modal: {
    taskToAssign: SerializedTask;
    taskToPrioritize: SerializedTask;
  };
}

interface TaskResults {
  results: SerializedTask[];
  page: {
    after?: string;
    next?: string;
    size: number;
  };
}

export const initializeQueue = createAsyncThunk(
  'task/initialize-queue',
  async ({ namespace, name }: { namespace: string; name: string }, { dispatch, getState, rejectWithValue }) => {
    const { config, queue, task } = getState() as AppState;
    const { directory } = config;

    try {
      let definition = queue.queues[`${namespace}:${name}`];
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

      // If the target queue is changing, then load additional information.
      if (task.queue?.namespace !== definition.namespace || task.queue?.name !== definition.name) {
        dispatch(loadQueuePeople(definition));
        dispatch(loadQueueTasks({ namespace, name }));
        dispatch(connectStream({ namespace, name }));
      }

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
    task: SerializedTask;
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

    socket.on('disconnect', () => {
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
    socket.on('task-service:task-data-updated', onTaskUpdate);
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
        isAssigner: hasRole(assignerRoles, user),
        isWorker: hasRole(workerRoles, user),
      },
    };
  }
);

export const openTask = createAsyncThunk(
  'task/open-task',
  async ({ namespace, name, taskId }: { namespace: string; name: string; taskId?: string }, { getState, dispatch }) => {
    const { task } = getState() as AppState;
    if (task.opened !== taskId && taskId) {
      dispatch(loadTask({ namespace, name, taskId }));
    }
    return taskId;
  }
);

export const loadTask = createAsyncThunk(
  'task/load-task',
  async (
    { namespace, name, taskId }: { namespace: string; name: string; taskId: string },
    { getState, dispatch, rejectWithValue }
  ) => {
    const state = getState() as AppState;
    const { directory } = state.config;

    try {
      const accessToken = await getAccessToken();
      const { data: task } = await axios.get<SerializedTask>(
        `${directory[TASK_SERVICE_ID]}/task/v1/queues/${namespace}/${name}/tasks/${taskId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      dispatch(loadTopic({ resourceId: task.urn }));
      // If the task is associated with some record (in different domain model), load any topic related to that.
      // This should generally be a more meaningful context for comments; e.g. intake submission, case file, support ticket, etc.
      if (task.recordId) {
        dispatch(loadTopic({ resourceId: task.recordId }));
      }

      return task;
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

export const setTaskPriority = createAsyncThunk(
  'task/set-task-priority',
  async ({ taskId, priority }: { taskId: string; priority: string }, { dispatch, getState, rejectWithValue }) => {
    const state = getState() as AppState;
    const { directory } = state.config;
    const { queue }: TaskState = state[TASK_FEATURE_KEY];

    try {
      const accessToken = await getAccessToken();
      const { data } = await axios.post<SerializedTask>(
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
      const { data } = await axios.post<SerializedTask>(
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
      const { data } = await axios.post<SerializedTask>(
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

export const updateTaskData = createAsyncThunk(
  'task/update-task-data',
  async (
    { taskId, data }: { taskId: string; data: Record<string, unknown> },
    { dispatch, getState, rejectWithValue }
  ) => {
    const state = getState() as AppState;
    const { directory } = state.config;
    const { queue }: TaskState = state[TASK_FEATURE_KEY];

    try {
      if (state.task.tasks[taskId].status === 'Pending') {
        await dispatch(startTask({ taskId }));
      }

      const accessToken = await getAccessToken();
      const { data: result } = await axios.patch<SerializedTask>(
        `${directory[TASK_SERVICE_ID]}/task/v1/queues/${queue.namespace}/${queue.name}/tasks/${taskId}/data`,
        data,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      return result;
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
      const { data } = await axios.post<SerializedTask>(
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
      const { data } = await axios.post<SerializedTask>(
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
    initializingUser: true,
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
    setTask: (state, { payload }: PayloadAction<SerializedTask>) => {
      state.tasks[payload.id] = payload;
      if (!state.results.includes(payload.id)) {
        state.results = [...state.results, payload.id];
      }
    },
    setFilter: (state, { payload }: PayloadAction<TaskFilter>) => {
      state.filter = payload;
    },
    setTaskToAssign: (state, { payload }: PayloadAction<string>) => {
      state.modal.taskToAssign = payload ? state.tasks[payload] : null;
    },
    setTaskToPrioritize: (state, { payload }: PayloadAction<string>) => {
      state.modal.taskToPrioritize = payload ? state.tasks[payload] : null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeQueue.pending, (state, { meta }) => {
        state.busy.initializing = true;
        if (meta.arg.namespace !== state.queue?.namespace || meta.arg.name !== state.queue.name) {
          state.queue = initialTaskState.queue;
          state.user = initialTaskState.user;
          state.results = initialTaskState.results;
        }
      })
      .addCase(initializeQueue.fulfilled, (state, { payload }) => {
        state.busy.initializing = false;
        state.queue = payload;
      })
      .addCase(initializeQueue.rejected, (state) => {
        state.results = null;
        state.busy.initializing = false;
      })
      .addCase(loadQueuePeople.pending, (state) => {
        state.busy.initializingUser = true;
      })
      .addCase(loadQueuePeople.fulfilled, (state, { payload }) => {
        state.busy.initializingUser = false;
        state.people = [...payload.assigners, ...payload.workers].reduce(
          (people, person) => ({ ...people, [person.id]: person }),
          {}
        );
        state.assigners = payload.assigners.map((p) => p.id);
        state.workers = payload.workers.map((p) => p.id);
        state.user = payload.user;
      })
      .addCase(loadQueuePeople.rejected, (state) => {
        state.busy.initializingUser = false;
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
        state.busy.loading = false;
      })
      .addCase(openTask.fulfilled, (state, { payload }) => {
        state.opened = payload;
      })
      .addCase(loadTask.pending, (state) => {
        state.busy.loading = true;
      })
      .addCase(loadTask.fulfilled, (state, { payload }) => {
        state.busy.loading = false;
        state.tasks[payload.id] = payload;
      })
      .addCase(loadTask.rejected, (state) => {
        state.busy.loading = false;
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
      .addCase(updateTaskData.pending, (state) => {
        state.busy.executing = true;
      })
      .addCase(updateTaskData.fulfilled, (state, { payload }) => {
        state.busy.executing = false;
        state.tasks = {
          ...state.tasks,
          [payload.id]: payload,
        };
      })
      .addCase(updateTaskData.rejected, (state) => {
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

// Date is not serializable value for the redux state, so make it part of selector projection.
function deserializeTask(serialized: SerializedTask): Task {
  return serialized
    ? {
        ...serialized,
        createdOn: new Date(serialized.createdOn),
        startedOn: serialized.startedOn ? new Date(serialized.startedOn) : undefined,
        endedOn: serialized.endedOn ? new Date(serialized.endedOn) : undefined,
      }
    : null;
}

export const filterSelector = (state: AppState) => state.task.filter;

export const liveSelector = (state: AppState) => state.task.live;

export const tasksSelector = createSelector(
  (state: AppState) => state.user.user.id,
  (state: AppState) => state.task.results,
  (state: AppState) => state.task.tasks,
  filterSelector,
  (state: AppState) => state.task.queue,
  (_: AppState, namespace: string) => namespace,
  (_: AppState, __: string, name: string) => name,
  (userId, results, tasks, filter, queue, namespace, name) => {
    if (queue?.namespace !== namespace || queue?.name !== name || !results) {
      return null;
    }

    return results
      .map((r) => deserializeTask(tasks[r]))
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
          result = a.createdOn.getTime() - b.createdOn.getTime();
        }
        return result;
      });
  }
);

export const busySelector = (state: AppState) => state.task.busy;

export const modalSelector = createSelector(
  (state: AppState) => state.task.modal,
  ({ taskToAssign, taskToPrioritize }) => ({
    taskToAssign: deserializeTask(taskToAssign),
    taskToPrioritize: deserializeTask(taskToPrioritize),
  })
);

export const openTaskSelector = createSelector(
  (state: AppState) => state.task.opened,
  (state: AppState) => state.task.tasks,
  (opened, tasks) => (opened ? deserializeTask(tasks[opened]) : null)
);

export const queueWorkersSelector = createSelector(
  (state: AppState) => state.task.workers,
  (state: AppState) => state.task.people,
  (workers, people) => workers.map((worker) => people[worker])
);

export const queueUserSelector = (state: AppState) => state.task.user;

export const metricsSelector = createSelector(
  (state: AppState) => state.queue.metrics,
  (state: AppState) => state.task.queue,
  (state: AppState) => state.user.user?.id,
  (metrics: Record<string, QueueMetrics>, queue: QueueDefinition, userId: string) => {
    return queue ? metrics[`${queue.namespace}:${queue.name}`] : null;
  }
);
