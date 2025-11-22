import { standardV1JsonSchema, commonV1JsonSchema } from '@abgov/data-exchange-standard';
import { createDefaultAjv, RegisterData, tryResolveRefs } from '@abgov/jsonforms-components';
import { JsonFormsCore, JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import * as _ from 'lodash';
import { DateTime } from 'luxon';
import { AppState } from './store';
import { getAccessToken } from './user.slice';

export const FORM_FEATURE_KEY = 'form';

export interface FormDefinition {
  id: string;
  name: string;
  dataSchema: JsonSchema;
  uiSchema: UISchemaElement;
  applicantRoles: string[];
  clerkRoles: string[];
  oneFormPerApplicant: boolean;
  registerData?: RegisterData;
  anonymousApply: boolean;
  generatesPdf?: boolean;
  scheduledIntakes: boolean;
  intake?: {
    start: string;
    end?: string;
    isAllDay: boolean;
    isUpcoming: boolean;
  };
}

export type ValidationError = JsonFormsCore['errors'][number];

export interface FormState {
  definitions: Record<string, FormDefinition>;
  selected: string | null;
  currentDefinition: FormDefinition | null; // <-- new

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

const CONFIGURATION_SERVICE_ID = 'urn:ads:platform:configuration-service:v2';
const ajv = createDefaultAjv(standardV1JsonSchema, commonV1JsonSchema);

export const loadDefinition = createAsyncThunk(
  'form/load-definition',
  async (definitionId: string, { getState, rejectWithValue }) => {
    try {
      console.log("we try")
      const { config, user } = getState() as AppState;

        console.log(JSON.stringify(config))
  
      const configurationService = config.directory[CONFIGURATION_SERVICE_ID];

        console.log(JSON.stringify(configurationService)  +" <configurationService")
      const token = await getAccessToken();
       console.log(JSON.stringify(token)  +" <token")
      const headers: Record<string, string> = {};
      if (user.user) {
        const token = await getAccessToken();
        headers.Authorization = `Bearer ${token}`;
      }

       const { data } = await axios.get<FormDefinition>(
        new URL(`configuration/v2/configuration/form-service/${definitionId}/latest`, configurationService).href,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.dataSchema) {
        // Try to resolve refs since Json forms doesn't handle remote refs.
        const [resolved, error] = await tryResolveRefs(data.dataSchema, standardV1JsonSchema, commonV1JsonSchema);
        if (!error) {
          data.dataSchema = resolved;
        }
      }

      if (typeof data.oneFormPerApplicant !== 'boolean') {
        data.oneFormPerApplicant = true;
      }


      return data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        // 403 indicates the user isn't logged in and the form doesn't allow anonymous applicants.
        // 404 indicates the form doesn't existing.
        // Return null instead of showing an error in the notification banner.
        return err.response.status === 403 || err.response.status === 404
          ? null
          : rejectWithValue({
              status: err.response?.status,
              message: err.response?.data?.errorMessage || err.message,
            });
      } else {
        throw err;
      }
    }
  }
);


const initialFormState: FormState = {
  definitions: {},
  selected: null,
  currentDefinition: null, // <-- new
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

export const formSlice = createSlice({
  name: FORM_FEATURE_KEY,
  initialState: initialFormState,
  reducers: {
    setSaving: (state, { payload }: { payload: boolean }) => {
      state.busy.saving = payload;
    },

  },
  extraReducers: (builder) => {
    builder
      .addCase(loadDefinition.pending, (state) => {
        state.busy.loading = true;
      })
      .addCase(loadDefinition.fulfilled, (state, { payload, meta }) => {
        state.busy.loading = false;
        if (payload) {
          state.definitions[meta.arg] = payload;
          state.currentDefinition = payload; // <-- save the current definition
          state.selected = meta.arg;         // <-- mark it as selected
        }
      })
      .addCase(loadDefinition.rejected, (state) => {
        state.busy.loading = false;
      });
}
});

export const formReducer = formSlice.reducer;
export const formActions = formSlice.actions;

export const currentDefinitionSelector = (state: AppState) => state.form.currentDefinition;


