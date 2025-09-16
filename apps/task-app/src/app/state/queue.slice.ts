import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { QueueDefinition, TASK_SERVICE_ID, TaskPriority, TaskStatus } from './types';
import { AppState } from './store';
import { getAccessToken } from './user.slice';

export const QUEUE_FEATURE_KEY = 'queue';

export interface QueueMetrics {
  namespace: string;
  name: string;
  status: Record<TaskStatus, number>;
  priority: Record<TaskPriority, number>;
  assignedTo: Record<string, number>;
  queue?: { avg: string; min: string; max: string };
  completion?: { avg: string; min: string; max: string };
  rate?: { since: string; created: number; completed: number; cancelled: number };
}

interface QueueState {
  queues: Record<string, QueueDefinition>;
  metrics: Record<string, QueueMetrics>;
  results: string[];
  busy: {
    loading: boolean;
    metrics: Record<string, boolean>;
  };
}

export const loadQueues = createAsyncThunk('queue/load-queues', async (_, { dispatch, getState, rejectWithValue }) => {
  const state = getState() as AppState;
  const { directory } = state.config;

  try {
    const accessToken = await getAccessToken();
    const { data } = await axios.get<QueueDefinition[]>(`${directory[TASK_SERVICE_ID]}/task/v1/queues`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    for (const { namespace, name } of data) {
      dispatch(loadQueueMetrics({ namespace, name }));
    }

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
});

export const loadQueueMetrics = createAsyncThunk(
  'queue/load-queue-metrics',
  async ({ namespace, name }: { namespace: string; name: string }, { getState, rejectWithValue }) => {
    const state = getState() as AppState;
    const { directory } = state.config;

    try {
      const accessToken = await getAccessToken();
      const { data } = await axios.get<QueueMetrics>(
        `${directory[TASK_SERVICE_ID]}/task/v1/queues/${namespace}/${name}/metrics`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            notEnded: true,
            includeEventMetrics: true,
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

const initialQueueState: QueueState = {
  queues: {},
  metrics: {},
  results: [],
  busy: { loading: true, metrics: {} },
};

const queueSlice = createSlice({
  name: QUEUE_FEATURE_KEY,
  initialState: initialQueueState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadQueues.pending, (state) => {
        state.busy.loading = true;
      })
      .addCase(loadQueues.fulfilled, (state, { payload }) => {
        state.queues = payload.reduce(
          (queues, queue) => ({ ...queues, [`${queue.namespace}:${queue.name}`]: queue }),
          {}
        );
        state.results = payload.map((queue) => `${queue.namespace}:${queue.name}`);
        state.busy.loading = false;
      })
      .addCase(loadQueues.rejected, (state) => {
        state.busy.loading = false;
      })
      .addCase(loadQueueMetrics.pending, (state, { meta }) => {
        state.busy.metrics[`${meta.arg.namespace}:${meta.arg.name}`] = true;
      })
      .addCase(loadQueueMetrics.fulfilled, (state, { payload, meta }) => {
        state.metrics[`${payload.namespace}:${payload.name}`] = payload;
        state.busy.metrics[`${meta.arg.namespace}:${meta.arg.name}`] = false;
      })
      .addCase(loadQueueMetrics.rejected, (state, { meta }) => {
        state.busy.metrics[`${meta.arg.namespace}:${meta.arg.name}`] = false;
      });
  },
});

export const queueReducers = queueSlice.reducer;

export const queuesSelector = createSelector(
  (state: AppState) => state.queue.queues,
  (state: AppState) => state.queue.results,
  (queues, results) =>
    results
      .map((result) => queues[result])
      .filter((value) => !!value)
      .sort((a, b) => {
        return a.namespace < b.namespace || a.name < b.name ? -1 : 1;
      })
);

export const queueMetricsSelector = createSelector(
  (state: AppState) => state.queue,
  (queue) => queue.metrics
);

export const metricsLoadingSelector = createSelector(
  (state: AppState) => state.queue.busy,
  (busy) => busy.metrics
);
