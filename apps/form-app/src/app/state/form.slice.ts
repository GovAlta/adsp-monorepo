import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { debounce } from 'lodash';
import { AppState } from './store';
import { getAccessToken } from './user.slice';
import { hashData } from './util';

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
  submitted?: Date;
}

interface FormDataResponse {
  id: string;
  data: Record<string, unknown>;
  files: Record<string, string>;
}

type SerializedForm = Omit<Form, 'created' | 'submitted'> & { created: string; submitted?: string };

interface FormState {
  definitions: Record<string, FormDefinition>;
  selected: string;
  userForm: string;
  form: SerializedForm;
  data: Record<string, unknown>;
  files: Record<string, string>;
  saved: string;
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
        files = null,
        digest = null;
      if (form) {
        token = await getAccessToken();
        const { data: formData } = await axios.get<FormDataResponse>(
          new URL(`/form/v1/forms/${form.id}/data`, formServiceUrl).href,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        data = formData.data;
        files = formData.files;
        digest = await hashData({ data, files });
      }

      return { form, data, files, digest };
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
    const { data } = await axios.get<FormDataResponse>(new URL(`/form/v1/forms/${formId}/data`, formServiceUrl).href, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return { ...data, form, digest: await hashData(data) };
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
      dispatch(formActions.setSaving(true));
      dispatch(saveForm(form.form.id));
    }

    return { data, files };
  }
);

export const saveForm = createAsyncThunk(
  'form/save-form',
  debounce(
    async (formId: string, { getState, dispatch, rejectWithValue }) => {
      try {
        const { config, form } = getState() as AppState;
        const formServiceUrl = config.directory[FORM_SERVICE_ID];

        const update = { data: form.data, files: form.files };
        const digest = await hashData({ id: formId, ...update });

        if (digest === form.saved) {
          dispatch(formActions.setSaving(false));
          return digest;
        } else {
          const token = await getAccessToken();
          const { data } = await axios.put<FormDataResponse>(
            new URL(`/form/v1/forms/${formId}/data`, formServiceUrl).href,
            update,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          dispatch(formActions.setSaving(false));
          return await hashData(data);
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          // A 400 error likely means the data doesn't pass schema validation.
          // No need to generate a feedback notification since the form itself should show such validation errors.
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
  userForm: null,
  form: null,
  data: {},
  files: {},
  saved: null,
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
  reducers: {
    setSaving: (state, { payload }: { payload: boolean }) => {
      state.busy.saving = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(selectedDefinition.fulfilled, (state, { meta }) => {
        state.selected = meta.arg;
        // Clear the form if the form definition is changing.
        if (state.form && state.form.definitionId !== meta.arg) {
          state.userForm = null;
          state.form = null;
          state.data = null;
          state.files = null;
          state.saved = null;
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
        state.saved = null;
      })
      .addCase(createForm.rejected, (state) => {
        state.busy.creating = false;
      })
      .addCase(loadForm.pending, (state) => {
        state.busy.loading = true;
      })
      .addCase(loadForm.fulfilled, (state, { payload }) => {
        state.busy.loading = false;
        state.form = payload.form;
        state.data = payload.data;
        state.files = payload.files;
        state.saved = payload.digest;
      })
      .addCase(loadForm.rejected, (state) => {
        state.busy.loading = false;
      })
      .addCase(findUserForm.pending, (state) => {
        state.busy.loading = true;
        state.userForm = null;
      })
      .addCase(findUserForm.fulfilled, (state, { payload }) => {
        state.busy.loading = false;
        // This isn't very clear, but empty string is indicating no result found.
        state.userForm = payload.form?.id || '';
        state.form = payload.form;
        state.data = payload.data;
        state.files = payload.files;
        state.saved = payload.digest;
      })
      .addCase(findUserForm.rejected, (state) => {
        state.busy.loading = false;
      })
      .addCase(updateForm.pending, (state, { meta }) => {
        state.data = meta.arg.data;
        state.files = meta.arg.files;
      })
      .addCase(saveForm.fulfilled, (state, { payload }) => {
        state.saved = payload;
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

const formActions = formSlice.actions;

export const definitionSelector = createSelector(
  (state: AppState) => state.form.definitions,
  (state: AppState) => state.form.selected,
  (definitions, selected) => (selected ? definitions[selected] : null)
);

export const formSelector = createSelector(
  definitionSelector,
  (state: AppState) => state.form.form,
  (definition, form) =>
    definition && definition?.id === form?.definitionId
      ? { ...form, created: new Date(form.created), submitted: form.submitted ? new Date(form.submitted) : null }
      : null
);

export const userFormSelector = createSelector(
  formSelector,
  (state: AppState) => state.form.userForm,
  (form, formId) => ({ form: formId && formId === form?.id ? form : null, initialized: formId !== null })
);

export const dataSelector = (state: AppState) => state.form.data;
export const filesSelector = (state: AppState) => state.form.files;

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