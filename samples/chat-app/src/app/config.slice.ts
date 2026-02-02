import { createAsyncThunk, createReducer } from '@reduxjs/toolkit';
import { environment } from '../environments/environment';

export const CONFIG_FEATURE_KEY = 'config';

export interface ConfigState {
  clientId: string | null;
  realm: string | null;
  namespace: string | null;
  accessServiceUrl: string | null;
  directoryServiceUrl: string | null;
  fileServiceUrl: string | null;
  pushServiceUrl: string | null;
  loadingStatus: 'not loaded' | 'loading' | 'loaded' | 'error';
  error: string | null;
}

export const initialStartState: ConfigState = {
  clientId: null,
  realm: null,
  namespace: null,
  accessServiceUrl: null,
  directoryServiceUrl: null,
  fileServiceUrl: null,
  pushServiceUrl: null,
  loadingStatus: 'not loaded',
  error: null,
};

export const getConfiguration = createAsyncThunk(
  'config/getConfiguration',
  async () => {
    const config: {
      clientId: string;
      namespace: string | null;
      realm: string;
      accessServiceUrl: string;
      directoryServiceUrl: string;
    } = {
      clientId: environment.access.client_id,
      namespace: null,
      realm: environment.access.realm,
      accessServiceUrl: environment.access.url,
      directoryServiceUrl: environment.directory.url,
    };
    try {
      const response = await fetch('/config/config.json');
      const { access, directory } = await response.json();

      config.accessServiceUrl = access.url;
      config.clientId = access.client_id;
      config.realm = access.realm;
      config.directoryServiceUrl = directory.url;
    } catch (err) {
      // Fallback to environment if config.json retrieval fails.
    }

    // This is the tenant name and we're relying on an ADSP ID convention in the client ID.
    config.namespace = config.clientId.split(':')[2];

    const directoryResponse = await fetch(
      `${config.directoryServiceUrl}/directory/v2/namespaces/platform/entries`
    );
    const entries = await directoryResponse.json();

    return {
      ...config,
      fileServiceUrl: entries.find(
        (entry: { urn: string; url: string }) => entry.urn === 'urn:ads:platform:file-service'
      )?.url,
      pushServiceUrl: entries.find(
        (entry: { urn: string; url: string }) => entry.urn === 'urn:ads:platform:push-service'
      )?.url,
    };
  }
);

export const configReducer = createReducer(initialStartState, (builder) => {
  builder
    .addCase(getConfiguration.pending, (state: ConfigState) => {
      state.loadingStatus = 'loading';
    })
    .addCase(getConfiguration.fulfilled, (state, action) => {
      state.loadingStatus = 'loaded';
      state.clientId = action.payload.clientId;
      state.namespace = action.payload.namespace;
      state.realm = action.payload.realm;
      state.accessServiceUrl = action.payload.accessServiceUrl;
      state.directoryServiceUrl = action.payload.directoryServiceUrl;
      state.pushServiceUrl = action.payload.pushServiceUrl;
      state.fileServiceUrl = action.payload.fileServiceUrl;
    })
    .addCase(getConfiguration.rejected, (state: ConfigState, action) => {
      state.loadingStatus = 'error';
      state.error = action.error.message ?? 'Unknown error';
    });
});
