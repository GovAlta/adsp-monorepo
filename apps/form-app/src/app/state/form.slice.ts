import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { debounce } from 'lodash';
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
}

export interface Form {
  definitionId: string;
  id: string;
  status: 'draft' | 'locked' | 'submitted' | 'archived';
  created: Date;
}

type SerializedForm = Omit<Form, 'created'> & { created: string };

interface FormState {
  definitions: Record<string, FormDefinition>;
  selected: string;
  initializedForm: boolean;
  form: SerializedForm;
  data: Record<string, unknown>;
  files: Record<string, string>;
  busy: {
    loading: boolean;
    creating: boolean;
    saving: boolean;
    submitting: boolean;
  };
}

const FORM_SERVICE_ID = 'urn:ads:platform:form-service';

export const selectedDefinition = createAsyncThunk(
  'form/select-definition',
  (definitionId: string, { getState, dispatch }) => {
    const { form } = getState() as AppState;

    if (definitionId && !form.definitions[definitionId]) {
      dispatch(loadDefinition(definitionId));
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

export const findUserForm = createAsyncThunk(
  'form/find-user-form',
  async (definitionId: string, { getState, rejectWithValue }) => {
    try {
      const { config, user } = getState() as AppState;
      const formServiceUrl = config.directory[FORM_SERVICE_ID];

      let token = await getAccessToken();
      const {
        data: { results },
      } = await axios.get<{ results: SerializedForm[] }>(new URL(`/form/v1/forms`, formServiceUrl).href, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          criteria: JSON.stringify({
            createdByIdEquals: user.user.id,
            definitionIdEquals: definitionId,
          }),
        },
      });

      const form = results[0];
      let data = null,
        files = null;
      if (form) {
        token = await getAccessToken();
        const { data: formData } = await axios.get<{ data: Record<string, unknown>; files: Record<string, string> }>(
          new URL(`/form/v1/forms/${form.id}/data`, formServiceUrl).href,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        data = formData.data;
        files = formData.files;
      }

      return { form, data, files };
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

export const loadForm = createAsyncThunk('form/load-form', async (formId: string, { getState, rejectWithValue }) => {
  try {
    const { config } = getState() as AppState;
    const formServiceUrl = config.directory[FORM_SERVICE_ID];

    let token = await getAccessToken();
    const { data: form } = await axios.get<SerializedForm>(new URL(`/form/v1/forms/${formId}`, formServiceUrl).href, {
      headers: { Authorization: `Bearer ${token}` },
    });

    token = await getAccessToken();
    const { data } = await axios.get<{ data: Record<string, unknown>; files: Record<string, string> }>(
      new URL(`/form/v1/forms/${formId}/data`, formServiceUrl).href,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return { ...data, form };
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

export const createForm = createAsyncThunk(
  'form/create-form',
  async (definitionId: string, { getState, rejectWithValue }) => {
    try {
      const { config, user } = getState() as AppState;
      const formServiceUrl = config.directory[FORM_SERVICE_ID];

      const token = await getAccessToken();
      const { data } = await axios.post<SerializedForm>(
        new URL(`/form/v1/forms`, formServiceUrl).href,
        { definitionId, applicant: { userId: user.user.id } },
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

export const updateForm = createAsyncThunk(
  'form/update-form',
  async (
    { data, files }: { data?: Record<string, unknown>; files?: Record<string, string> },
    { getState, dispatch }
  ) => {
    const { form } = getState() as AppState;

    if (form.form) {
      dispatch(saveForm(form.form.id));
    }

    return { data, files };
  }
);

export const saveForm = createAsyncThunk(
  'form/save-form',
  debounce(
    async (formId: string, { getState, rejectWithValue }) => {
      try {
        const { config, form } = getState() as AppState;
        const formServiceUrl = config.directory[FORM_SERVICE_ID];

        const token = await getAccessToken();
        const { data } = await axios.put<{ data: Record<string, unknown>; files: Record<string, string> }>(
          new URL(`/form/v1/forms/${formId}/data`, formServiceUrl).href,
          { data: form.data, files: form.files },
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
    },
    2000,
    { leading: false, trailing: true }
  )
);

export const submitForm = createAsyncThunk(
  'form/submit-form',
  async (formId: string, { getState, rejectWithValue }) => {
    try {
      const { config } = getState() as AppState;
      const formServiceUrl = config.directory[FORM_SERVICE_ID];

      const token = await getAccessToken();
      const { data } = await axios.post<SerializedForm>(
        new URL(`/form/v1/forms/${formId}`, formServiceUrl).href,
        { operation: 'submit' },
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

const initialFormState: FormState = {
  definitions: {},
  selected: null,
  initializedForm: false,
  form: null,
  data: {},
  files: {},
  busy: {
    loading: false,
    creating: false,
    saving: false,
    submitting: false,
  },
};

const formSlice = createSlice({
  name: FORM_FEATURE_KEY,
  initialState: initialFormState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(selectedDefinition.fulfilled, (state, { meta }) => {
        state.selected = meta.arg;
        // Clear the form if the form definition is changing.
        if (state.form && state.form.definitionId !== meta.arg) {
          state.initializedForm = false;
          state.form = null;
          state.data = null;
          state.files = null;
        }
      })
      .addCase(loadDefinition.pending, (state) => {
        state.busy.loading = true;
      })
      .addCase(loadDefinition.fulfilled, (state, { payload }) => {
        state.busy.loading = false;
        state.definitions[payload.id] = payload;
      })
      .addCase(loadDefinition.rejected, (state) => {
        state.busy.loading = false;
      })
      .addCase(createForm.pending, (state) => {
        state.busy.creating = true;
      })
      .addCase(createForm.fulfilled, (state, { payload }) => {
        state.busy.creating = false;
        state.form = payload;
        state.data = {};
        state.files = {};
      })
      .addCase(createForm.rejected, (state) => {
        state.busy.creating = false;
      })
      .addCase(loadForm.pending, (state) => {
        state.busy.loading = true;
      })
      .addCase(loadForm.fulfilled, (state, { payload }) => {
        state.busy.loading = false;
        state.initializedForm = true;
        state.form = payload.form;
        state.data = payload.data;
        state.files = payload.files;
      })
      .addCase(loadForm.rejected, (state) => {
        state.busy.loading = false;
      })
      .addCase(findUserForm.pending, (state) => {
        state.busy.loading = true;
      })
      .addCase(findUserForm.fulfilled, (state, { payload }) => {
        state.busy.loading = false;
        state.initializedForm = true;
        state.form = payload.form;
        state.data = payload.data;
        state.files = payload.files;
      })
      .addCase(findUserForm.rejected, (state) => {
        state.busy.loading = false;
      })
      .addCase(updateForm.pending, (state, { meta }) => {
        state.data = meta.arg.data;
        state.files = meta.arg.files;
      })
      .addCase(saveForm.pending, (state) => {
        state.busy.saving = true;
      })
      .addCase(saveForm.fulfilled, (state) => {
        state.busy.saving = false;
      })
      .addCase(saveForm.rejected, (state) => {
        state.busy.saving = false;
      })
      .addCase(submitForm.pending, (state) => {
        state.busy.submitting = true;
      })
      .addCase(submitForm.fulfilled, (state, { payload }) => {
        state.busy.submitting = false;
        state.form = payload;
      })
      .addCase(submitForm.rejected, (state) => {
        state.busy.submitting = false;
      });
  },
});

export const formReducer = formSlice.reducer;

export const definitionSelector = createSelector(
  (state: AppState) => state.form.definitions,
  (state: AppState) => state.form.selected,
  (definitions, selected) => (selected ? definitions[selected] : null)
);

export const formSelector = createSelector(
  (state: AppState) => state.form.initializedForm,
  (state: AppState) => state.form.form,
  (initialized, form) => ({
    initialized,
    form: initialized && form ? { ...form, created: new Date(form.created) } : null,
  })
);

export const dataSelector = (state: AppState) => state.form.data;

export const isApplicantSelector = createSelector(
  definitionSelector,
  (state: AppState) => state.user.user,
  (definition, user) => !!(user && definition?.applicantRoles.find((r) => user.roles.includes(r)))
);

export const isClerkSelector = createSelector(
  definitionSelector,
  (state: AppState) => state.user.user,
  (definition, user) => !!(user && definition?.clerkRoles.find((r) => user.roles.includes(r)))
);

export const busySelector = (state: AppState) => state.form.busy;
