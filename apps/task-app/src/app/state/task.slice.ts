import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { AppState } from './store';

export const TASK_FEATURE_KEY = 'task';
const TASK_SERVICE_ID = 'urn:ads:platform:task-service';
const PUSH_SERVICE_ID = 'urn:ads:platform:push-service';
const UPDATE_STREAM_ID = 'task-updates';

export interface QueueDefinition {
  namespace: string;
  name: string;
  description: string;
  assignerRoles: string[];
  workerRoles: string[];
}

export interface Task {
  id: string;
  queue: { namespace: string; name: string };
  name: string;
  description: string;
  priority: string;
  status: 'Pending' | 'In Progress' | 'Stopped' | 'Cancelled' | 'Completed';
  createdOn: string;
  startedOn: string;
  endedOn: string;
  assignment: {
    assignedTo: {
      id: string;
      name: string;
    };
  };
}

export interface Person {
  id: string;
  name: string;
  email: string;
}

enum TaskPriority {
  Urgent = 2,
  High = 1,
  Normal = 0,
}

export type TaskFilter = 'active' | 'pending' | 'assigned';

export interface TaskMetric {
  name: string;
  value: number;
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
  errors: { id: string; level: 'warn' | 'error'; message: string }[];
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
  async ({ namespace, name }: { namespace: string; name: string }, { dispatch, getState }) => {
    const state = getState() as AppState;
    const { user } = state.user;
    const { directory } = state.config;

    const { data } = await axios.get<QueueDefinition>(
      `${directory[TASK_SERVICE_ID]}/task/v1/queues/${namespace}/${name}`,
      {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      }
    );

    dispatch(loadQueueTasks({ namespace: data.namespace, name: data.name }));
    dispatch(loadQueuePeople({ namespace: data.namespace, name: data.name }));
    dispatch(connectStream({ namespace: data.namespace, name: data.name }));

    return data;
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
    const { user } = state.user;
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
      extraHeaders: { Authorization: `Bearer ${user.accessToken}` },
    });

    socket.on('connect', () => {
      dispatch(taskActions.streamConnectionChanged(true));
    });

    socket.on('disconnected', () => {
      dispatch(taskActions.streamConnectionChanged(false));
    });

    socket.on('task-service:task-created', ({ payload }: TaskEvent) => {
      if (payload.task.queue?.namespace === namespace && payload.task.queue?.name === name) {
        dispatch(taskActions.setTask(payload.task));
      }
    });

    socket.on('task-service:task-assigned', ({ payload }: TaskEvent) => {
      if (payload.task.queue?.namespace === namespace && payload.task.queue?.name === name) {
        dispatch(taskActions.setTask(payload.task));
      }
    });

    socket.on('task-service:task-priority-set', ({ payload }: TaskEvent) => {
      if (payload.task.queue?.namespace === namespace && payload.task.queue?.name === name) {
        dispatch(taskActions.setTask(payload.task));
      }
    });

    socket.on('task-service:task-started', ({ payload }: TaskEvent) => {
      if (payload.task.queue?.namespace === namespace && payload.task.queue?.name === name) {
        dispatch(taskActions.setTask(payload.task));
      }
    });

    socket.on('task-service:task-completed', ({ payload }: TaskEvent) => {
      if (payload.task.queue?.namespace === namespace && payload.task.queue?.name === name) {
        dispatch(taskActions.setTask(payload.task));
      }
    });

    socket.on('task-service:task-cancelled', ({ payload }: TaskEvent) => {
      if (payload.task.queue?.namespace === namespace && payload.task.queue?.name === name) {
        dispatch(taskActions.setTask(payload.task));
      }
    });
  }
);

export const loadQueueTasks = createAsyncThunk(
  'task/load-queue-tasks',
  async ({ namespace, name, after }: { namespace: string; name: string; after?: string }, { getState }) => {
    const state = getState() as AppState;
    const { user } = state.user;
    const { directory } = state.config;

    const { data } = await axios.get<TaskResults>(
      `${directory[TASK_SERVICE_ID]}/task/v1/queues/${namespace}/${name}/tasks`,
      {
        headers: { Authorization: `Bearer ${user.accessToken}` },
        params: {
          top: 100,
          after,
        },
      }
    );

    return data;
  }
);

export const loadQueuePeople = createAsyncThunk(
  'task/load-queue-people',
  async ({ namespace, name }: { namespace: string; name: string }, { getState }) => {
    const state = getState() as AppState;
    const { user } = state.user;
    const { directory } = state.config;

    let assigners: Person[] = [];
    let workers: Person[] = [];
    try {
      const { data: assignersResult } = await axios.get<Person[]>(
        `${directory[TASK_SERVICE_ID]}/task/v1/queues/${namespace}/${name}/assigners`,
        {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        }
      );
      assigners = assignersResult;

      const { data: workersResult } = await axios.get<Person[]>(
        `${directory[TASK_SERVICE_ID]}/task/v1/queues/${namespace}/${name}/workers`,
        {
          headers: { Authorization: `Bearer ${user.accessToken}` },
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
        isAssigner: !!assigners.find((a) => a.id === user.id),
        isWorker: !!workers.find((w) => w.id === user.id),
      },
    };
  }
);

export const setTaskPriority = createAsyncThunk(
  'task/set-task-priority',
  async ({ taskId, priority }: { taskId: string; priority: string }, { dispatch, getState }) => {
    const state = getState() as AppState;
    const { user } = state.user;
    const { directory } = state.config;
    const { queue }: TaskState = state[TASK_FEATURE_KEY];

    const { data } = await axios.post<Task>(
      `${directory[TASK_SERVICE_ID]}/task/v1/queues/${queue.namespace}/${queue.name}/tasks/${taskId}`,
      {
        operation: 'set-priority',
        priority,
      },
      {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      }
    );

    dispatch(taskActions.setTaskToPrioritize(null));

    return data;
  }
);

export const assignTask = createAsyncThunk(
  'task/assign-task',
  async ({ taskId, assignTo }: { taskId: string; assignTo?: Person }, { dispatch, getState }) => {
    const state = getState() as AppState;
    const { user } = state.user;
    const { directory } = state.config;
    const { queue }: TaskState = state[TASK_FEATURE_KEY];

    const { data } = await axios.post<Task>(
      `${directory[TASK_SERVICE_ID]}/task/v1/queues/${queue.namespace}/${queue.name}/tasks/${taskId}`,
      {
        operation: 'assign',
        assignTo,
      },
      {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      }
    );

    dispatch(taskActions.setTaskToAssign(null));

    return data;
  }
);

export const startTask = createAsyncThunk('task/start-task', async ({ taskId }: { taskId: string }, { getState }) => {
  const state = getState() as AppState;
  const { user } = state.user;
  const { directory } = state.config;
  const { queue }: TaskState = state[TASK_FEATURE_KEY];

  const { data } = await axios.post<Task>(
    `${directory[TASK_SERVICE_ID]}/task/v1/queues/${queue.namespace}/${queue.name}/tasks/${taskId}`,
    {
      operation: 'start',
    },
    {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    }
  );

  return data;
});

export const completeTask = createAsyncThunk(
  'task/complete-task',
  async ({ taskId }: { taskId: string }, { getState }) => {
    const state = getState() as AppState;
    const { user } = state.user;
    const { directory } = state.config;
    const { queue }: TaskState = state[TASK_FEATURE_KEY];

    const { data } = await axios.post<Task>(
      `${directory[TASK_SERVICE_ID]}/task/v1/queues/${queue.namespace}/${queue.name}/tasks/${taskId}`,
      {
        operation: 'complete',
      },
      {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      }
    );

    return data;
  }
);

export const cancelTask = createAsyncThunk(
  'task/cancel-task',
  async ({ taskId, reason }: { taskId: string; reason: string }, { getState }) => {
    const state = getState() as AppState;
    const { user } = state.user;
    const { directory } = state.config;
    const { queue }: TaskState = state[TASK_FEATURE_KEY];

    const { data } = await axios.post<Task>(
      `${directory[TASK_SERVICE_ID]}/task/v1/queues/${queue.namespace}/${queue.name}/tasks/${taskId}`,
      {
        operation: 'cancel',
        reason: reason || undefined,
      },
      {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      }
    );

    return data;
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
  errors: [],
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
    setOpenTask: (state, { payload }: PayloadAction<string>) => {
      state.opened = payload;
    },
    setTaskToAssign: (state, { payload }: PayloadAction<Task>) => {
      state.modal.taskToAssign = payload;
    },
    setTaskToPrioritize: (state, { payload }: PayloadAction<Task>) => {
      state.modal.taskToPrioritize = payload;
    },
    dismissError: (state) => {
      state.errors.shift();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeQueue.pending, (state) => {
        state.busy.initializing = true;
      })
      .addCase(initializeQueue.fulfilled, (state, { payload }) => {
        state.busy.initializing = false;
        state.queue = payload;
      })
      .addCase(initializeQueue.rejected, (state, { error }) => {
        state.busy.initializing = false;
        state.errors.push({ id: uuidv4(), level: 'error', message: `Error encountered initializing queue: ${error.message}` });
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
      .addCase(loadQueuePeople.rejected, (state, { error }) => {
        state.busy.initializing = false;
        state.errors.push({
          id: uuidv4(),
          level: 'error',
          message: `Error encountered getting queue people: ${error.message}`,
        });
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
      .addCase(loadQueueTasks.rejected, (state, { error }) => {
        state.busy.initializing = false;
        state.errors.push({
          id: uuidv4(),
          level: 'error',
          message: `Error encountered getting queue tasks: ${error.message}`,
        });
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
      .addCase(assignTask.rejected, (state, { error }) => {
        state.busy.executing = false;
        state.errors.push({
          id: uuidv4(),
          level: 'error',
          message: `Error encountered assigning task: ${error.message}`,
        });
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
      .addCase(setTaskPriority.rejected, (state, { error }) => {
        state.busy.executing = false;
        state.errors.push({
          id: uuidv4(),
          level: 'error',
          message: `Error encountered setting task priority: ${error.message}`,
        });
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
      .addCase(startTask.rejected, (state, { error }) => {
        state.busy.executing = false;
        state.errors.push({
          id: uuidv4(),
          level: 'error',
          message: `Error encountered starting task: ${error.message}`,
        });
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
      .addCase(completeTask.rejected, (state, { error }) => {
        state.busy.executing = false;
        state.errors.push({
          id: uuidv4(),
          level: 'error',
          message: `Error encountered completing task: ${error.message}`,
        });
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
      .addCase(cancelTask.rejected, (state, { error }) => {
        state.busy.executing = false;
        state.errors.push({
          id: uuidv4(),
          level: 'error',
          message: `Error encountered cancelling task: ${error.message}`,
        });
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
  (state: AppState) => state.user.user?.id,
  (state: AppState) => state.task.results,
  (state: AppState) => state.task.tasks,
  (userId: string, results: string[], tasks: Record<string, Task>) => {
    const taskResults = results.map((r) => tasks[r]);
    const statusCounts = {
      Pending: 0,
      'In Progress': 0,
      Stopped: 0,
      Completed: 0,
      Cancelled: 0,
    };
    taskResults.forEach((t) => (statusCounts[t.status] = (statusCounts[t.status] || 0) + 1));

    const myTasks = taskResults.filter((t) => t.assignment?.assignedTo?.id === userId).length;

    const metrics: TaskMetric[] = [
      {
        name: 'Pending',
        value: statusCounts.Pending,
        unit: statusCounts.Pending > 1 ? 'tasks' : 'task',
      },
      {
        name: 'In Progress',
        value: statusCounts['In Progress'],
        unit: statusCounts['In Progress'] > 1 ? 'tasks' : 'task',
      },
      {
        name: 'Assigned to me',
        value: myTasks,
        unit: myTasks > 1 ? 'tasks' : 'task',
      },
    ];

    return metrics;
  }
);

export const errorSelector = createSelector(
  (state: AppState) => state.task,
  (task) => task.errors[0]
);
