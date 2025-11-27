import { JsonFormsCore, } from '@jsonforms/core';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import * as _ from 'lodash';
import { AppState } from '../store';
import { getAccessToken } from '../user/user.slice';
import { FORM_SERVICE_ID, CONFIGURATION_SERVICE_ID, FormDefinition } from '../types'
export const FORM_FEATURE_KEY = 'form';

export type ValidationError = JsonFormsCore['errors'][number];

export interface FormState {
  definitions: FormDefinition[];
  selected: string | null;
  loading: boolean;
  currentDefinition: FormDefinition | null;
  busy: {
    loading: boolean;
    creating: boolean;
    saving: boolean;
    submitting: boolean;
    deleting: boolean;
  };
  initialized: {
    forms: boolean;
  };
}

export const updateDefinition = createAsyncThunk(
  'form/update-definition',
  async (definition: FormDefinition, { getState, rejectWithValue }) => {
    try {
      const { config } = getState() as AppState;
      const configurationService = config.directory[CONFIGURATION_SERVICE_ID];
      const token = await getAccessToken();
      const { data } = await axios.patch<{ latest: { configuration: FormDefinition } }>(
        new URL(`configuration/v2/configuration/form-service/${definition.id}`, configurationService).href,
        { operation: 'REPLACE', configuration: definition },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return await data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status !== 400) {
          return rejectWithValue({
            status: err.response?.status,
            message: err.response?.data?.errorMessage || err.message,
          });
        }
      } else {
        throw err;
      }
    }
  }
);

export const getFormConfiguration = createAsyncThunk<
  { definition: FormDefinition; isNew?: boolean },
  { id: string; newDefinition?: FormDefinition },
  { rejectValue: { status?: number; message: string } }
>('form/open-editor-for-definition', async ({ id, newDefinition }, { getState, rejectWithValue }) => {
  try {
    if (!id) {
      throw new Error('Cannot open editor without form definition ID.');
    }

    const state = getState() as AppState;
    const { config } = getState() as AppState;
    const definitions = state.form.definitions;
    let definition = definitions[id] || newDefinition;

    if (!definition) {
      const configurationService = config.directory[CONFIGURATION_SERVICE_ID];
      const token = await getAccessToken();

      if (configurationService && token) {
        const { data } = await axios.get<{ latest: { configuration: FormDefinition } }>(
          new URL(`configuration/v2/configuration/form-service/${id}`, configurationService).href,

          { headers: { Authorization: `Bearer ${token}` } }
        );

        definition = data.latest.configuration;
      }

      if (!definition) {
        throw new Error(`Definition with ID ${id} not found.`);
      }
    }

    return { definition, isNew: !!newDefinition };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue({
        status: err.response?.status,
        message: err.response?.data?.errorMessage || err.message,
      });
    }

    return rejectWithValue({
      status: 500,
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

export const getFormDefinitions = createAsyncThunk('form/get-definitions', async (_, { getState, rejectWithValue }) => {
  try {
    const { config } = getState() as AppState;
    const formServiceUrl = config.directory[FORM_SERVICE_ID];
    const accessToken = await getAccessToken();

    const { data } = await axios.get<{ results: FormDefinition[] }>(
      new URL('/form/v1/definitions', formServiceUrl).href,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    return data.results;
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

const initialFormState: FormState = {
  definitions: [],
  selected: null,
  loading: false,
  currentDefinition: null,
  busy: {
    loading: false,
    creating: false,
    saving: false,
    submitting: false,
    deleting: false,
  },
  initialized: {
    forms: false,
  },
};

const formSlice = createSlice({
  name: FORM_FEATURE_KEY,
  initialState: initialFormState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getFormDefinitions.pending, (state) => {
        state.loading = true;
      })
      .addCase(getFormDefinitions.fulfilled, (state, { payload }) => {
        state.definitions = payload;
        state.loading = false;
      })
      .addCase(getFormDefinitions.rejected, (state) => {
        state.loading = false;
      })
      .addCase(updateDefinition.fulfilled, (state, { payload }) => {
        if (payload) {
          state.currentDefinition = payload.latest.configuration;
        }
      })
      .addCase(getFormConfiguration.fulfilled, (state, action) => {
        const { dataSchema, uiSchema, ...definition } = action.payload.definition;

        state.currentDefinition = action.payload.definition;
      });
  },
});

export const formReducer = formSlice.reducer;
