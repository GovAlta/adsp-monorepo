import { standardV1JsonSchema, commonV1JsonSchema } from '@abgov/data-exchange-standard';
import { tryResolveRefs } from '@abgov/jsonforms-components';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { DateTime } from 'luxon';
import { AppState } from './store';
import { FormSubmission, FORM_SERVICE_ID, PagedResults, Form, FormDefinition, FormStatus } from './types';
import { getAccessToken } from './user.slice';
import { AdspId } from '../../lib/adspId';

export const FORM_FEATURE_KEY = 'form';

export const initialFormState: FormState = {
  busy: {
    initializing: false,
    loading: false,
    executing: false,
  },
  definitions: {},
  forms: {},
  submissions: {},
  results: [],
  formCriteria: { statusEquals: 'submitted' },
  submissionCriteria: { dispositioned: false },
  next: null,
  selectedDefinition: null,
  selectedForm: null,
  selectedSubmission: null,
};

interface FormSubmissionCriteria {
  dispositioned?: boolean;
  createdAfter?: string;
  createdBefore?: string;
}

interface FormCriteria {
  statusEquals: string;
  createdAfter?: string;
  createdBefore?: string;
}

export interface FormState {
  busy: {
    initializing: boolean;
    loading: boolean;
    executing: boolean;
  };
  forms: Record<string, Form>;
  submissions: Record<string, FormSubmission>;
  definitions: Record<string, FormDefinition>;
  results: string[];
  formCriteria: FormCriteria;
  submissionCriteria: FormSubmissionCriteria;
  next: string;
  selectedDefinition: string;
  selectedForm: string;
  selectedSubmission: string;
}

export const updateFormDisposition = createAsyncThunk(
  'form/update-form-disposition',
  async (
    { submissionUrn, status, reason }: { submissionUrn: AdspId; status: string; reason: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const { config } = getState() as AppState;
      const formServiceUrl = config.directory[FORM_SERVICE_ID];
      const accessToken = await getAccessToken();

      const { data } = await axios.post<FormSubmission>(
        new URL(`/form/v1${submissionUrn.resource}`, formServiceUrl).href,
        { dispositionStatus: status, dispositionReason: reason },
        { headers: { Authorization: `Bearer ${accessToken}` } }
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

export const loadDefinitions = createAsyncThunk(
  'form/load-definitions',
  async ({ after }: { after?: string }, { getState, rejectWithValue }) => {
    const state = getState() as AppState;
    const { directory } = state.config;

    try {
      const accessToken = await getAccessToken();
      const requestUrl = new URL('/form/v1/definitions', directory[FORM_SERVICE_ID]);
      const { data } = await axios.get<PagedResults<FormDefinition>>(requestUrl.href, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { top: 100, after },
      });

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

export const findForms = createAsyncThunk(
  'form/find-forms',
  async (
    { definitionId, after, criteria }: { definitionId: string; after?: string; criteria?: FormCriteria },
    { getState, rejectWithValue }
  ) => {
    const state = getState() as AppState;
    const { directory } = state.config;

    try {
      const accessToken = await getAccessToken();
      const requestUrl = new URL('/form/v1/forms', directory[FORM_SERVICE_ID]);
      const { data } = await axios.get<PagedResults<Form>>(requestUrl.href, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          top: 20,
          after,
          includeData: true,
          criteria: JSON.stringify({
            ...criteria,
            definitionIdEquals: definitionId,
          }),
        },
      });

      return {
        ...data,
        results: data.results.map(({ status, ...result }) => ({ ...result, status: FormStatus[status] })),
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

export const findSubmissions = createAsyncThunk(
  'form/find-submissions',
  async (
    { definitionId, after, criteria }: { definitionId: string; after?: string; criteria?: FormSubmissionCriteria },
    { getState, rejectWithValue }
  ) => {
    const state = getState() as AppState;
    const { directory } = state.config;

    try {
      const accessToken = await getAccessToken();
      const requestUrl = new URL('/form/v1/submissions', directory[FORM_SERVICE_ID]);
      const { data } = await axios.get<
        PagedResults<Omit<FormSubmission, 'created' | 'updated'> & { created: string; updated: string }>
      >(requestUrl.href, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          top: 20,
          after,
          criteria: JSON.stringify({
            ...criteria,
            definitionIdEquals: definitionId,
          }),
        },
      });

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

export const selectDefinition = createAsyncThunk(
  'form/select-definition',
  (definitionId: string, { getState, dispatch }) => {
    const { form } = getState() as AppState;

    if (definitionId && !form.definitions[definitionId]) {
      dispatch(loadDefinition(definitionId));
    }
  }
);

export const selectForm = createAsyncThunk('form/select-form', (formId: string, { getState, dispatch }) => {
  const { form } = getState() as AppState;

  if (formId && !form.forms[formId]?.data) {
    dispatch(loadForm(formId));
  }
});

export const selectSubmission = createAsyncThunk(
  'form/select-submission',
  (submissionId: string, { getState, dispatch }) => {
    const { form } = getState() as AppState;

    if (submissionId && !form.submissions[submissionId]) {
      dispatch(loadSubmission(submissionId));
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

      if (data.dataSchema) {
        // Try to resolve refs since Json forms doesn't handle remote refs.
        const [resolved, error] = await tryResolveRefs(data.dataSchema, standardV1JsonSchema, commonV1JsonSchema);
        if (!error) {
          data.dataSchema = resolved;
        }
      }

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

export const loadForm = createAsyncThunk('form/load-form', async (formId: string, { getState, rejectWithValue }) => {
  try {
    const { config } = getState() as AppState;
    const formServiceUrl = config.directory[FORM_SERVICE_ID];
    const token = await getAccessToken();

    const { data } = await axios.get<Form>(new URL(`/form/v1/forms/${formId}`, formServiceUrl).href, {
      headers: { Authorization: `Bearer ${token}` },
      params: { includeData: true },
    });

    return { ...data, status: FormStatus[data.status] };
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

export const loadSubmission = createAsyncThunk(
  'form/load-submission',
  async (submissionId: string, { getState, rejectWithValue }) => {
    try {
      const { config } = getState() as AppState;
      const formServiceUrl = config.directory[FORM_SERVICE_ID];
      const token = await getAccessToken();

      const { data } = await axios.get<FormSubmission>(
        new URL(`/form/v1/submissions/${submissionId}`, formServiceUrl).href,
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
  reducers: {
    setFormCriteria: (state, { payload }: { payload: FormCriteria }) => {
      state.formCriteria = payload;
    },
    setSubmissionCriteria: (state, { payload }: { payload: FormSubmissionCriteria }) => {
      state.submissionCriteria = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(selectDefinition.fulfilled, (state, { meta }) => {
        state.selectedDefinition = meta.arg;
        // Clear the form if the form definition is changing.
        if (state.selectedDefinition !== meta.arg) {
          state.results = [];
          state.next = null;
        }
      })
      .addCase(selectForm.fulfilled, (state, { meta }) => {
        state.selectedForm = meta.arg;
      })
      .addCase(selectSubmission.fulfilled, (state, { meta }) => {
        state.selectedSubmission = meta.arg;
      })
      .addCase(loadDefinitions.pending, (state) => {
        state.busy.loading = true;
      })
      .addCase(loadDefinitions.fulfilled, (state, { payload }) => {
        state.busy.loading = false;
        state.definitions = payload.results.reduce(
          (definitions, definition) => ({ ...definitions, [definition.id]: definition }),
          {}
        );
        state.next = payload.page.next;
      })
      .addCase(loadDefinitions.rejected, (state) => {
        state.busy.loading = false;
      })
      .addCase(loadDefinition.pending, (state) => {
        state.busy.initializing = true;
        state.busy.loading = true;
      })
      .addCase(loadDefinition.fulfilled, (state, { payload }) => {
        state.busy.initializing = false;
        state.busy.loading = false;
        state.definitions[payload.id] = payload;
      })
      .addCase(loadDefinition.rejected, (state) => {
        state.busy.initializing = false;
        state.busy.loading = false;
      })
      .addCase(loadForm.pending, (state) => {
        state.busy.loading = true;
      })
      .addCase(loadForm.fulfilled, (state, { payload }) => {
        state.busy.loading = false;
        state.forms[payload.id] = payload;
      })
      .addCase(loadForm.rejected, (state) => {
        state.busy.loading = false;
      })
      .addCase(loadSubmission.pending, (state) => {
        state.busy.loading = true;
      })
      .addCase(loadSubmission.fulfilled, (state, { payload }) => {
        state.busy.loading = false;
        state.submissions[payload.id] = payload;
      })
      .addCase(loadSubmission.rejected, (state) => {
        state.busy.loading = false;
      })
      .addCase(findForms.pending, (state) => {
        state.busy.loading = true;
      })
      .addCase(findForms.fulfilled, (state, { payload }) => {
        state.busy.loading = false;
        state.forms = payload.results.reduce((results, form) => ({ ...results, [form.id]: form }), state.forms);
        state.results = [...(payload.page.after ? state.results : []), ...payload.results.map((result) => result.id)];
        state.next = payload.page.next;
      })
      .addCase(findForms.rejected, (state) => {
        state.busy.loading = false;
      })
      .addCase(findSubmissions.pending, (state) => {
        state.busy.loading = true;
      })
      .addCase(findSubmissions.fulfilled, (state, { payload }) => {
        state.busy.loading = false;
        state.submissions = payload.results.reduce(
          (results, form) => ({ ...results, [form.id]: form }),
          state.submissions
        );
        state.results = [...(payload.page.after ? state.results : []), ...payload.results.map((result) => result.id)];
        state.next = payload.page.next;
      })
      .addCase(findSubmissions.rejected, (state) => {
        state.busy.loading = false;
      })
      .addCase(updateFormDisposition.pending, (state) => {
        state.busy.executing = true;
      })
      .addCase(updateFormDisposition.rejected, (state) => {
        state.busy.executing = true;
      })
      .addCase(updateFormDisposition.fulfilled, (state, { payload }) => {
        state.busy.executing = false;
        state.submissions[payload.formId] = payload;
      });
  },
});

export const formReducer = formSlice.reducer;

export const formActions = formSlice.actions;

export const definitionsSelector = createSelector(
  (state: AppState) => state.form.definitions,
  (definitions) => {
    return Object.values(definitions).reduce((results, definition) => {
      results.push(definition);
      return results;
    }, [] as FormDefinition[]);
  }
);

export const definitionSelector = createSelector(
  (state: AppState) => state.form.definitions,
  (state: AppState) => state.form.selectedDefinition,
  (definitions, selected) => definitions[selected]
);

export const formsSelector = createSelector(
  (state: AppState) => state.form.forms,
  (state: AppState) => state.form.results,
  (forms, results) => {
    return results
      .map((result) => forms[result])
      .filter((result) => !!result)
      .map(({ created, submitted, ...result }) => ({
        ...result,
        created: DateTime.fromISO(created),
        submitted: submitted ? DateTime.fromISO(submitted) : null,
      }));
  }
);

export const submissionsSelector = createSelector(
  (state: AppState) => state.form.submissions,
  (state: AppState) => state.form.results,
  (submissions, results) => {
    return results
      .map((result) => submissions[result])
      .filter((result) => !!result)
      .map(({ created, updated, ...result }) => ({
        ...result,
        created: DateTime.fromISO(created),
        updated: updated ? DateTime.fromISO(updated) : null,
      }));
  }
);

export const formSelector = createSelector(
  (state: AppState) => state.form.forms,
  (state: AppState) => state.form.selectedForm,
  (forms, selected) => forms[selected]
);

export const submissionSelector = createSelector(
  (state: AppState) => state.form.submissions,
  (state: AppState) => state.form.selectedSubmission,
  (submissions, selected) => submissions[selected]
);

export const busySelector = (state: AppState) => state.form.busy;

export const submissionCriteriaSelector = (state: AppState) => state.form.submissionCriteria;

export const formCriteriaSelector = (state: AppState) => state.form.formCriteria;

export const nextSelector = (state: AppState) => state.form.next;
