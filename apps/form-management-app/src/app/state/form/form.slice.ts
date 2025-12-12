import { JsonFormsCore } from '@jsonforms/core';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import * as _ from 'lodash';
import { AppState } from '../store';
import { FormDefinition, CONFIGURATION_SERVICE_ID, FORM_SERVICE_ID } from '../types';
import { getAccessToken } from '../user/user.slice';
export const FORM_FEATURE_KEY = 'form';

export type ValidationError = JsonFormsCore['errors'][number];

export interface FormState {
  definitions: FormDefinition[];
  selected: string | null;
  loading: boolean;
  currentDefinition: FormDefinition | null;
  files: Record<string, string>;
  programs: string[];
  ministries: string[];
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
  next: string | null;
  page: number;
  cursors: Record<number, string | null>;
  criteria: {
    name: string;
    actsOfLegislation: string;
    registeredId: string;
    program: string;
    ministry: string;
  };
}

export const createDefinition = createAsyncThunk(
  'form/create-definition',
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

export const deleteDefinition = createAsyncThunk(
  'form/delete-definition',
  async (definitionId: string, { getState, rejectWithValue }) => {
    try {
      const { config } = getState() as AppState;
      const configurationService = config.directory[CONFIGURATION_SERVICE_ID];
      const token = await getAccessToken();
      await axios.delete(
        new URL(`configuration/v2/configuration/form-service/${definitionId}`, configurationService).href,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return definitionId;
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

export const getPrograms = createAsyncThunk('form/get-programs', async (_, { getState, rejectWithValue }) => {
  try {
    const { config } = getState() as AppState;
    const configurationService = config.directory[CONFIGURATION_SERVICE_ID];
    const accessToken = await getAccessToken();

    const { data } = await axios.get(`${configurationService}/configuration/v2/configuration/dcm/programs`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return data.latest.configuration;
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

export const getMinistries = createAsyncThunk('form/get-ministries', async (_, { getState, rejectWithValue }) => {
  try {
    const { config } = getState() as AppState;
    const configurationService = config.directory[CONFIGURATION_SERVICE_ID];
    const accessToken = await getAccessToken();

    const { data } = await axios.get(`${configurationService}/configuration/v2/configuration/dcm/ministry`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return data.latest.configuration;
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

export const getFormDefinitions = createAsyncThunk(
  'form/get-definitions',
  async (
    {
      top,
      after,
      name,
      actsOfLegislation,
      registeredId,
      program,
      ministry,
    }: {
      top?: number;
      after?: string;
      name?: string;
      actsOfLegislation?: string;
      registeredId?: string;
      program?: string;
      ministry?: string;
    } = {},
    { getState, rejectWithValue }
  ) => {
    try {
      const { config } = getState() as AppState;
      const configurationService = config.directory[CONFIGURATION_SERVICE_ID];
      const accessToken = await getAccessToken();

      const params = new URLSearchParams();
      if (top) params.append('top', top.toString());
      if (after) params.append('after', after);
      const criteria: Record<string, string> = {};
      if (name) criteria.name = name;
      if (actsOfLegislation) criteria.actsOfLegislation = actsOfLegislation;
      if (registeredId) criteria.registeredId = registeredId;
      if (program) criteria.program = program;
      if (ministry) criteria.ministry = ministry;

      if (Object.keys(criteria).length > 0) {
        params.append('criteria', JSON.stringify(criteria));
      }
      params.append('includeActive', 'true');

      const url = `${configurationService}/configuration/v2/configuration/form-service?${params.toString()}`;
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return {
        results:
          data.results?.map((r) => {
            const item = r.active || r.latest;
            return {
              ...item.configuration,
              revision: item.revision,
            };
          }) || [],
        page: data.page || { next: null },
      };
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

export const initialFormState: FormState = {
  definitions: [],
  selected: null,
  loading: false,
  files: {},
  currentDefinition: null,
  programs: [],
  ministries: [],
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
  next: null,
  page: 1,
  cursors: { 1: null },
  criteria: {
    name: '',
    actsOfLegislation: '',
    registeredId: '',
    program: '',
    ministry: '',
  },
};

const formSlice = createSlice({
  name: FORM_FEATURE_KEY,
  initialState: initialFormState,
  reducers: {
    updateFormFiles: (state, action: { payload: Record<string, string> }) => {
      state.files = action.payload;
    },
    setPage: (state, action: { payload: number }) => {
      state.page = action.payload;
    },
    setCriteria: (
      state,
      action: {
        payload: {
          name?: string;
          actsOfLegislation?: string;
          registeredId?: string;
          program?: string;
          ministry?: string;
        };
      }
    ) => {
      state.criteria = { ...state.criteria, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getFormDefinitions.pending, (state) => {
        state.loading = true;
      })
      .addCase(getFormDefinitions.fulfilled, (state, { payload }) => {
        state.definitions = payload.results;
        state.loading = false;
        state.next = payload.page.next;
        if (payload.page.next) {
          state.cursors[state.page + 1] = payload.page.next;
        }
      })
      .addCase(getFormDefinitions.rejected, (state) => {
        state.loading = false;
      })
      .addCase(createDefinition.pending, (state) => {
        state.busy.creating = true;
      })
      .addCase(createDefinition.fulfilled, (state, { payload }) => {
        if (payload && payload.latest && payload.latest.configuration) {
          // Don't add to existing array since we'll refetch the list
          state.currentDefinition = payload.latest.configuration;
        }
        state.busy.creating = false;
      })
      .addCase(createDefinition.rejected, (state) => {
        state.busy.creating = false;
      })
      .addCase(updateDefinition.pending, (state) => {
        state.busy.saving = true;
      })
      .addCase(updateDefinition.fulfilled, (state, { payload }) => {
        if (payload) {
          const index = state.definitions.findIndex((def) => def.id === payload.latest.configuration.id);
          if (index !== -1) {
            state.definitions[index] = payload.latest.configuration;
          }
          state.currentDefinition = payload.latest.configuration;
        }
        state.busy.saving = false;
      })
      .addCase(updateDefinition.rejected, (state) => {
        state.busy.saving = false;
      })
      .addCase(deleteDefinition.pending, (state) => {
        state.busy.deleting = true;
      })
      .addCase(deleteDefinition.fulfilled, (state, { payload }) => {
        state.definitions = state.definitions.filter((def) => def.id !== payload);
        state.busy.deleting = false;
      })
      .addCase(deleteDefinition.rejected, (state) => {
        state.busy.deleting = false;
      })
      .addCase(getFormConfiguration.fulfilled, (state, action) => {
        const { dataSchema: _dataSchema, uiSchema: _uiSchema, ..._definition } = action.payload.definition;

        state.currentDefinition = action.payload.definition;
      })
      .addCase(getPrograms.fulfilled, (state, { payload }) => {
        state.programs = payload;
      })
      .addCase(getMinistries.fulfilled, (state, { payload }) => {
        state.ministries = payload;
      });
  },
});

export const formActions = formSlice.actions;

export const formReducer = formSlice.reducer;
