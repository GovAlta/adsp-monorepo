import { AdspId } from '@core-services/app-common';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import axios, { AxiosProgressEvent } from 'axios';
import { AppState } from '../store';
import { getAccessToken } from '../user/user.slice';
import { CONFIGURATION_SERVICE_ID } from '../types';

export const TASK_FEATURE_KEY = 'task';

export interface FileMetadata {
  urn: string;
  taskname: string;
  mimeType?: string;
  recordId?: string;
}

export interface FileWithMetadata extends File {
  urn: string;
  taskname?: string;
}

const TASK_SERVICE_ID = 'urn:ads:platform:task-service';


export const fetchTaskQueues = createAsyncThunk<
  Record<string, TaskDefinition>,       
  void,
  { state: AppState }
>(
  'task/fetch-task-queues',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { config } = getState();
      const configurationService =
        config.directory[CONFIGURATION_SERVICE_ID];

      const token = await getAccessToken();

      const url = `${configurationService}/configuration/v2/configuration/platform/task-service`;

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return data?.latest?.configuration.queues;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue({
          status: err.response?.status,
          message:
            err.response?.data?.errorMessage || err.message,
        });
      }
      throw err;
    }
  }
);

export interface FileItem {
  id?: string;
  taskname?: string;
  size?: number;
  taskURN?: string;
  urn: string;
  typeName?: string;
  recordId?: string;
  created?: string;
  lastAccessed?: string;
  propertyId?: string;
}

interface TaskDefinition {
  id: string;
  name: string;
  namespace: string;
  context?: string;
  assignerRoles?: string[];
  workerRoles?: string[];
}

interface TaskState {
  queues: Record<string, TaskDefinition>;
  busy: boolean
}

const initialTaskState: TaskState = {
  queues: {},
  busy: false
};

export const taskSlice = createSlice({
  name: TASK_FEATURE_KEY,
  initialState: initialTaskState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTaskQueues.pending, (state, { meta }) => {
        
        state.busy = true;
      })
      .addCase(fetchTaskQueues.fulfilled, (state, { meta, payload }) => {
       
        state.queues = payload;
        state.busy = false;
       
      })
      .addCase(fetchTaskQueues.rejected, (state, { meta }) => {
      
        state.busy = false;
      })
  },
});

const taskActions = taskSlice.actions;
export const taskReducer = taskSlice.reducer;

