import { standardV1JsonSchema, commonV1JsonSchema } from '@abgov/data-exchange-standard';
import { createDefaultAjv, tryResolveRefs } from '@abgov/jsonforms-components';
import { JsonFormsCore, JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import * as _ from 'lodash';
import { AppState } from '../store';
import { getAccessToken } from '../user/user.slice';
import { FORM_SERVICE_ID } from '../types';
import { FormDefinition } from '../types';
export const FORM_FEATURE_KEY = 'form';

export type ValidationError = JsonFormsCore['errors'][number];

export interface FormState {
  definitions: FormDefinition[];
  selected: string | null;
  loading: boolean;
  currentDefinition: FormDefinition | null;
  editor: {
    selectedId: string;
    loading: boolean;
    saving: boolean;
    original: FormDefinition;
    modified: Omit<FormDefinition, 'dataSchema' | 'uiSchema'>;
    dataSchema: JsonSchema;
    uiSchema: UISchemaElement;
    dataSchemaDraft: string;
    uiSchemaDraft: string;
    resolvedDataSchema: JsonSchema;
    dataSchemaError?: string;
    uiSchemaError?: string;
  };
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



export const CONFIGURATION_SERVICE_ID = 'urn:ads:platform:configuration-service:v2';
const ajv = createDefaultAjv(standardV1JsonSchema, commonV1JsonSchema);

const hasProperties = (schema: JsonSchema): boolean => {
  return (
    (typeof schema === 'object' && Object.keys(schema).length === 0) ||
    ('properties' in schema && (('type' in schema && schema.type === 'object') || !('type' in schema)))
  );
};

export const uneditedDataSchemaDraft = createAsyncThunk<string, string>(
  'form/uneditedDataSchemaDraft',
  async (draft) => {
    return draft;
  }
);
export const updateDataParsed = createAsyncThunk<JsonSchema, JsonSchema>(
  'form/updateDataParsed',
  async (draft) => {
    return draft;
  }
);

export const setDraftDataSchema = createAsyncThunk(
  'form/set-draft',
  async (definition: string, { dispatch, rejectWithValue }) => {
    try {
      await dispatch(uneditedDataSchemaDraft(definition)).unwrap();
      const parsedSchema = JSON.parse(definition);
      await dispatch(updateDataParsed(parsedSchema)).unwrap();
      ajv.validateSchema(parsedSchema, true);

      if (Object.keys(parsedSchema).length > 0 && !hasProperties(parsedSchema)) {
        throw new Error('Data schema must have "properties"');
      }
      const [resolvedSchema, error] = await tryResolveRefs(parsedSchema, standardV1JsonSchema, commonV1JsonSchema);

      if (error) {
        return rejectWithValue({
          status: error,
          message: error,
        });
      } else {
        return resolvedSchema;
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status !== 400) {
          return rejectWithValue({
            status: err.response?.status,
            message: err.response?.data?.errorMessage || err.message,
          });
        }
      } 
      return rejectWithValue({
        status: 500,
        message: err instanceof Error ? err.message : String(err),
      }); 
    }
  }
);

export const uneditedUiSchemaDraft = createAsyncThunk<string, string>('form/uneditedUiSchemaDraft', async (draft) => {
  return draft;
});
export const updateUiParsed = createAsyncThunk<UISchemaElement, UISchemaElement>(
  'form/updateUiParsed',
  async (draft) => {
    return draft;
  }
);

export const setDraftUiSchema = createAsyncThunk(
  'form/set-draft-ui',
  async (definition: string, { dispatch, rejectWithValue }) => {
    try {
      await dispatch(uneditedUiSchemaDraft(definition)).unwrap();
      const parsedSchema = JSON.parse(definition);
      await dispatch(updateUiParsed(parsedSchema)).unwrap();

      ajv.validateSchema(parsedSchema, true);

      if (Object.keys(parsedSchema).length > 0 && !hasProperties(parsedSchema)) {
        throw new Error('Data schema must have "properties"');
      }

      const [resolvedSchema, error] = await tryResolveRefs(parsedSchema, standardV1JsonSchema, commonV1JsonSchema);

      if (error) {
        return rejectWithValue({
          status: error,
          message: error,
        });
      } else {
        return resolvedSchema;
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status !== 400) {
          return rejectWithValue({
            status: err.response?.status,
            message: err.response?.data?.errorMessage || err.message,
          });
        }
      }
      return rejectWithValue({
        status: 500,
        message: err instanceof Error ? err.message : String(err),
      });
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
        new URL(`v2/configuration/form-service/${definition.id}`, configurationService).href,
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

export const openEditorForDefinition = createAsyncThunk<
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
          new URL(`v2/configuration/form-service/${id}`, configurationService).href,
         
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
  editor: {
    selectedId: null,
    loading: false,
    saving: false,
    original: null,
    modified: null,
    dataSchemaDraft: '',
    uiSchemaDraft: '',
    dataSchema: {},
    uiSchema: {} as UISchemaElement,
    resolvedDataSchema: {},
    dataSchemaError: "",
    uiSchemaError: ""
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
        .addCase(setDraftDataSchema.fulfilled, (state, { payload }) => {
        state.editor.resolvedDataSchema = payload;
      })
      .addCase(uneditedDataSchemaDraft.fulfilled, (state, { payload }) => {
        state.editor.dataSchemaDraft = payload;
      })
      .addCase(setDraftDataSchema.rejected, (state, { payload }) => {
        state.editor.dataSchemaError = payload as string;
      })
      .addCase(setDraftUiSchema.rejected, (state, { payload }) => {
        state.editor.uiSchemaError = payload as string;
      })
      .addCase(updateDataParsed.fulfilled, (state, { payload }) => {
        state.editor.dataSchema = payload;
      })
      .addCase(uneditedUiSchemaDraft.fulfilled, (state, { payload }) => {
        state.editor.uiSchemaDraft = payload;
      })
      .addCase(updateUiParsed.fulfilled, (state, { payload }) => {
        state.editor.uiSchema = payload;
      })
      .addCase(updateDefinition.fulfilled, (state, { payload }) => {
        if (payload) {
          const { dataSchema, uiSchema, ...definition } = payload.latest.configuration;
          state.currentDefinition = payload.latest.configuration;
          state.editor.selectedId = payload.latest.configuration.id;
          state.editor.original = payload.latest.configuration;
          state.editor.modified = definition;
          state.editor.dataSchemaDraft = JSON.stringify(dataSchema, null, 2);
          state.editor.uiSchemaDraft = JSON.stringify(uiSchema, null, 2);
        }

        state.editor.loading = false;
        state.editor.saving = false;

       // state.editor.resolvedDataSchema = initialFormState.editor.resolvedDataSchema;
      })
      .addCase(openEditorForDefinition.fulfilled, (state, action) => {
        const { dataSchema, uiSchema, ...definition } = action.payload.definition;

        state.currentDefinition = action.payload.definition;
        state.editor.selectedId = action.payload.definition.id;
        state.editor.loading = false;
        state.editor.saving = false;
        state.editor.original = action.payload.definition;
        state.editor.modified = definition;
        state.editor.dataSchema = dataSchema;
        state.editor.uiSchema = uiSchema;
        state.editor.dataSchemaDraft = JSON.stringify(dataSchema, null, 2);
        state.editor.uiSchemaDraft = JSON.stringify(uiSchema, null, 2);
        state.editor.resolvedDataSchema = initialFormState.editor.resolvedDataSchema;
      });
  },
});








export const formReducer = formSlice.reducer;

