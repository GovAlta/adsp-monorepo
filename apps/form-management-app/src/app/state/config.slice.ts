import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { environment as envStatic } from '../../environments/environment';
import { AppState } from './store';
import { getAccessToken } from './user/user.slice';
import { FeedbackMessage } from './types';

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

    console.log('Loaded environment configuration', environment);
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
  }

  return { directory, environment };
});

const CONFIGURATION_SERVICE_ID = 'urn:ads:platform:configuration-service';
export const loadExtensions = createAsyncThunk(
  'config/load-extensions',
  async (tenantId: string, { getState, rejectWithValue }) => {
    try {
      const { config } = getState() as AppState;
      const configurationServiceUrl = config.directory[CONFIGURATION_SERVICE_ID];

      const accessToken = await getAccessToken();
      const { data } = await axios.get<{ configuration: { extensions: Extension[] } }>(
        new URL('/configuration/v2/configuration/platform/task-service/active', configurationServiceUrl).href,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { tenantId, orLatest: true },
        }
      );

      if (!config.environment['extensions']?.[tenantId] && data.configuration?.extensions?.length) {
        return rejectWithValue({
          id: uuidv4(),
          level: 'error',
          message: 'There are task extensions, but extensions are not enabled for the tenant.',
        } as FeedbackMessage);
      } else {
        return (
          data.configuration?.extensions ||
          [
            // {
            //   src: '{URL to extension script bundle}',
            //   integrity: 'sha384-{digest value}',
            // },
          ]
        );
      }
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
    builder
      .addCase(initializeConfig.fulfilled, (state, { payload }) => {
        state.environment = payload.environment;
        state.directory = payload.directory;
        state.initialized = true;
      })
      .addCase(loadExtensions.fulfilled, (state, { payload, meta }) => {
        state.extensions[meta.arg] = payload;
      });
  },
});

export const configReducer = configSlice.reducer;

export const configInitializedSelector = createSelector(
  (state: AppState) => state.config,
  (config) => config.initialized
);

export const extensionsSelector = createSelector(
  (state: AppState) => state.user.tenant?.id,
  (state: AppState) => state.config.extensions,
  (tenantId, extensions) =>
    (tenantId && extensions[tenantId]?.map((extension) => ({ ...extension, src: new URL(extension.src) }))) || []
);
