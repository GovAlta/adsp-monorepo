import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import axios from 'axios';
import { AppState } from './store';
import { Person, FormSubmission, FORM_SERVICE_ID } from './types';
import { getAccessToken } from './user.slice';

export const FORM_FEATURE_KEY = 'form';

export type FormFilter = 'active' | 'pending' | 'assigned';

export interface FormMetric {
  name: string;
  value?: number | string;
  unit?: string;
}

export interface FormUser extends Person {
  isAssigner: boolean;
  isWorker: boolean;
}

type SerializedForm = Omit<Form, 'created' | 'submitted'> & { created: string; submitted?: string };

export const initialFormState: FormState = {
  busy: {
    initializing: false,
    loadedForm: false,
    loadedDefinition: false,
    executing: false,
  },
  forms: {},
  definitions: {},
  selected: null,
};

export interface Form {
  definition: { id: string };
  id: string;
  urn: string;
  status: 'draft' | 'locked' | 'submitted' | 'archived';
  created: Date;
  submitted?: Date;
}

export interface FormState {
  busy: {
    initializing: boolean;
    loadedForm: boolean;
    loadedDefinition: boolean;
    executing: boolean;
  };
  forms: Record<string, FormSubmission>;
  definitions: Record<string, FormDefinition>;
  selected: string;
}

interface DispositionState {
  id: string;
  name: string;
  description: string;
}
export interface FormDefinition {
  id: string;
  name: string;
  dataSchema: JsonSchema;
  uiSchema: UISchemaElement;
  applicantRoles: string[];
  clerkRoles: string[];
  dispositionStates: DispositionState[];
}

export const updateFormDisposition = createAsyncThunk(
  'form/update-form-disposition',
  async (
    {
      formId,
      submissionId,
      dispositionStatus,
      dispositionReason,
    }: { formId: string; submissionId: string; dispositionStatus: string; dispositionReason: string },
    { getState, rejectWithValue }
  ) => {
    const state = getState() as AppState;
    const { directory } = state.config;

    try {
      const accessToken = await getAccessToken();
      if (formId && submissionId) {
        const formServiceUrl = `${directory[FORM_SERVICE_ID]}/form/v1/forms/${formId}/submissions/${submissionId}`;
        const { data } = await axios.post<FormSubmission>(
          formServiceUrl,
          { dispositionStatus: dispositionStatus, dispositionReason: dispositionReason },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        return data;
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

export const selectForm = createAsyncThunk(
  'form/select-form',
  ({ formId, submissionId }: { formId: string; submissionId: string }, { getState, dispatch }) => {
    const { form } = getState() as AppState;

    if (formId && !form.forms[formId]) {
      dispatch(loadForm({ formId, submissionId }));
    }
  }
);

export const loadForm = createAsyncThunk(
  'form/get-form',
  async (
    { formId, submissionId }: { formId: string; submissionId: string },
    { getState, rejectWithValue, dispatch }
  ) => {
    const state = getState() as AppState;
    const { directory } = state.config;

    try {
      const accessToken = await getAccessToken();
      const { data } = await axios.get<FormSubmission>(
        `${directory[FORM_SERVICE_ID]}/form/v1/forms/${formId}/submissions/${submissionId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      dispatch(loadDefinition(data.formDefinitionId));
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

export const loadDefinition = createAsyncThunk(
  'form/load-definition',
  async (definitionId: string, { getState, rejectWithValue }) => {
    try {
      const { config } = getState() as AppState;
      const formServiceUrl = config.directory[FORM_SERVICE_ID];
      const token = await getAccessToken();

      const { data } = await axios.get<FormDefinition>(
        new URL(`/form/v1/definitions/${definitionId}`, formServiceUrl).href,
        {
          headers: { Authorization: `Bearer ${token}` },
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

export const formSlice = createSlice({
  name: FORM_FEATURE_KEY,
  initialState: initialFormState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(selectForm.fulfilled, (state, { meta }) => {
        state.selected = meta.arg.formId;
      })
      .addCase(selectForm.pending, (state, { meta }) => {
        state.busy.initializing = true;
      })
      .addCase(loadForm.pending, (state, { meta }) => {
        state.busy.initializing = true;
        state.busy.loadedForm = false;
      })
      .addCase(loadForm.fulfilled, (state, { payload }) => {
        state.busy.initializing = false;
        state.busy.loadedForm = true;
        state.forms[payload.formId] = payload;
      })
      .addCase(loadForm.rejected, (state) => {
        state.busy.initializing = false;
        state.busy.loadedForm = true;
      })
      .addCase(loadDefinition.pending, (state, { meta }) => {
        state.busy.initializing = true;
        state.busy.loadedDefinition = false;
      })
      .addCase(loadDefinition.fulfilled, (state, { payload }) => {
        state.busy.initializing = false;
        state.busy.loadedDefinition = true;
        state.definitions[payload.id] = payload;
      })
      .addCase(loadDefinition.rejected, (state) => {
        state.busy.loadedDefinition = true;
        state.busy.initializing = false;
      })
      .addCase(updateFormDisposition.pending, (state, { payload }) => {
        state.busy.executing = true;
      })
      .addCase(updateFormDisposition.rejected, (state, { payload }) => {
        state.busy.executing = true;
      })
      .addCase(updateFormDisposition.fulfilled, (state, { payload }) => {
        state.busy.executing = false;
        state.forms[payload.formId] = payload;
      });
  },
});

export const formReducer = formSlice.reducer;

export const formActions = formSlice.actions;

export const formSelector = createSelector(
  (state: AppState) => state.form,
  (form) => {
    return form;
  }
);

export const formDefinitionSelector = createSelector(
  (state: AppState) => state.form,
  (_: AppState, definitionId: string) => definitionId,
  (form, definitionId) => {
    return form.definitions[definitionId];
  }
)

export const formLoadingSelector = createSelector(
  (state: AppState) => state.form.busy,
  (busy) => {
    const isBusy = busy.initializing && (!busy.loadedDefinition || !busy.loadedForm);
    return isBusy;
  }
);
