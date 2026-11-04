import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { environment as staticEnvironment } from '../../../environments/environment';

export const PLANNER_SERVICE_ID = 'urn:ads:platform:project-planner-service';

export interface PlannerEnvironment {
  production: boolean;
  directory?: { url: string };
  access?: { url: string; realm: string; client_id: string };
  // Planner service URL for environments whose directory has no planner entry.
  serviceUrl?: string;
}

export interface ConfigState {
  initialized: boolean;
  environment: Partial<PlannerEnvironment>;
  serviceUrls: { projectPlannerServiceApiUrl?: string };
}

async function loadEnvironment(): Promise<PlannerEnvironment> {
  try {
    const { data } = await axios.get<PlannerEnvironment>('/config/config.json');
    if (data && typeof data === 'object') {
      return data;
    }
  } catch {
    // No runtime config, e.g. local development.
  }
  return staticEnvironment;
}

async function findServiceUrl(environment: PlannerEnvironment): Promise<string | undefined> {
  if (environment.serviceUrl) {
    return environment.serviceUrl;
  }
  if (!environment.directory?.url) {
    return undefined;
  }
  try {
    const { data } = await axios.get<{ urn: string; url: string }[]>(
      `${environment.directory.url}/directory/v2/namespaces/platform/entries`,
    );
    return data.find((entry) => entry.urn === PLANNER_SERVICE_ID)?.url;
  } catch {
    return undefined;
  }
}

export const initializeConfig = createAsyncThunk('config/initialize', async () => {
  const environment = await loadEnvironment();
  return { environment, serviceUrls: { projectPlannerServiceApiUrl: await findServiceUrl(environment) } };
});

const initialState: ConfigState = { initialized: false, environment: {}, serviceUrls: {} };

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(initializeConfig.fulfilled, (state, { payload }) => {
      state.environment = payload.environment;
      state.serviceUrls = payload.serviceUrls;
      state.initialized = true;
    });
  },
});

export const configReducer = configSlice.reducer;
