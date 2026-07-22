import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { environment as envStatic } from '../../environments/environment';
import { AppState } from './store';

export const CONFIG_FEATURE_KEY = 'config';

type Environment = typeof envStatic;

interface Extension {
  src: string;
  integrity: string;
}
export interface ConfigState {
  initialized: boolean;
  environment: Partial<Environment>;
  directory: Record<string, string>;
  extensions: Record<string, Extension[]>;
}

export const initializeConfig = createAsyncThunk('config/initialize', async () => {
  let environment = envStatic;
  try {
    const { data: envConfig } = await axios.get<Environment>('/config/config.json');
    environment = envConfig;
  } catch (error) {
    // Use the static imported environment if config.json not available.
  }

  // Initialize state with environment and ADSP directory of services.
  const directoryUrl = environment?.directory?.['url'];

  let directory: Record<string, string> = {};
  if (directoryUrl) {
    const { data: platform } = await axios.get<{ urn: string; url: string }[]>(
      `${directoryUrl}/directory/v2/namespaces/platform/entries`
    );
    directory = platform.reduce((result, entry) => ({ ...result, [entry.urn]: entry.url }), directory);

    try {
      const { data: tenant } = await axios.get<{ urn: string; url: string }[]>(
        `${directoryUrl}/directory/v2/namespaces/platform/entries`
      );
      directory = tenant.reduce((result, entry) => ({ ...result, [entry.urn]: entry.url }), directory);
    } catch (err) {
      // Tenant directory may not exist if no entries have been added.
    }
  }

  return { directory, environment };
});

const initialConfigState: ConfigState = {
  initialized: false,
  environment: {},
  directory: {},
  extensions: {},
};

const configSlice = createSlice({
  name: CONFIG_FEATURE_KEY,
  initialState: initialConfigState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(initializeConfig.fulfilled, (state, { payload }) => {
      state.environment = structuredClone(payload.environment);
      state.directory = payload.directory;
      state.initialized = true;
    });
  },
});

export const configReducer = configSlice.reducer;

export const configInitializedSelector = createSelector(
  (state: AppState) => state.config,
  (config) => config.initialized
);

export const environmentSelector = (state: AppState) => state.config.environment;
export const directorySelector = (state: AppState) => state.config.directory;
