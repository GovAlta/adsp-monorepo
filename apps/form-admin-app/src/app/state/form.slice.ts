import { standardV1JsonSchema, commonV1JsonSchema } from '@abgov/data-exchange-standard';
import { tryResolveRefs } from '@abgov/jsonforms-components';
import { JsonSchema } from '@jsonforms/core';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import _ from 'lodash';
import { DateTime } from 'luxon';
import { AppState } from './store';
import {
  FormSubmission,
  FORM_SERVICE_ID,
  PagedResults,
  Form,
  FormDefinition,
  FormStatus,
  FormDisposition,
  EXPORT_SERVICE_ID,
} from './types';
import { getAccessToken } from './user.slice';
import { AdspId } from '../../lib/adspId';
import { downloadFile, FileMetadata, findFile, loadFileMetadata } from './file.slice';

export const FORM_FEATURE_KEY = 'form';

interface FormSubmissionCriteria {
  dispositioned?: boolean;
  createdAfter?: string;
  createdBefore?: string;
  dataCriteria?: Record<string, unknown>;
}

interface FormCriteria {
  statusEquals: string;
  createdAfter?: string;
  createdBefore?: string;
  dataCriteria?: Record<string, unknown>;
}

interface DataValue {
  name: string;
  path: string;
  selected?: boolean;
  type: string | string[];
}

interface Job {
  id: string;
  status: 'queued' | 'completed' | 'failed';
  result?: {
    urn: string;
    filename: string;
  };
}

interface ExportState {
  definitionId?: string;
  jobId?: string;
  result?: { urn: string; filename: string };
}

export interface FormState {
  busy: {
    initializing: boolean;
    loading: boolean;
    findPdf: boolean;
    executing: boolean;
    exporting: boolean;
  };
  forms: Record<string, Form>;
  submissions: Record<string, FormSubmission>;
  definitions: Record<string, FormDefinition>;
  pdfs: Record<string, string>;
  dataValues: Record<string, DataValue[]>;
  results: {
    definitions: string[];
    forms: string[];
    submissions: string[];
  };
  formCriteria: FormCriteria;
  submissionCriteria: FormSubmissionCriteria;
  next: {
    definitions: string;
    forms: string;
    submissions: string;
  };
  selectedDefinition: string;
  selectedForm: string;
  selectedSubmission: string;
  dispositionDraft: Omit<FormDisposition, 'id' | 'date'>;
  export: {
    forms: ExportState;
    submissions: ExportState;
  };
}

export const initialFormState: FormState = {
  busy: {
    initializing: false,
    loading: false,
    findPdf: false,
    executing: false,
    exporting: false,
  },
  definitions: {},
  dataValues: {},
  forms: {},
  submissions: {},
  pdfs: {},
  results: {
    definitions: [],
    forms: [],
    submissions: [],
  },
  formCriteria: { statusEquals: 'submitted' },
  submissionCriteria: { dispositioned: false },
  next: {
    definitions: null,
    forms: null,
    submissions: null,
  },
  selectedDefinition: null,
  selectedForm: null,
  selectedSubmission: null,
  dispositionDraft: { status: '', reason: '' },
  export: {
    forms: {},
    submissions: {},
  },
};

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
        params: { top: 20, after },
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

    if (definitionId && (!form.definitions[definitionId] || !form.dataValues[definitionId])) {
      dispatch(loadDefinition(definitionId));
    }
  }
);

export const selectForm = createAsyncThunk('form/select-form', (formId: string, { dispatch }) => {
  if (formId) {
    dispatch(loadForm(formId));
  }
});

export const selectSubmission = createAsyncThunk('form/select-submission', (submissionId: string, { dispatch }) => {
  if (submissionId) {
    dispatch(loadSubmission(submissionId));
  }
});

function getDataValues(schema: JsonSchema, path: string[]): DataValue[] {
  const dataValues = [];
  if (schema.type === 'object' && typeof schema.properties === 'object') {
    for (const [propertyName, value] of Object.entries(schema.properties)) {
      if (value) {
        dataValues.push(...getDataValues(value, [...path, propertyName]));
      }
    }
  } else {
    dataValues.push({ name: path[path.length - 1], path: path.join('.'), type: schema.type });
  }

  return dataValues;
}

export const loadDefinition = createAsyncThunk(
  'form/load-definition',
  async (definitionId: string, { dispatch, getState, rejectWithValue }) => {
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

        await dispatch(initializeDataValues({ definitionId, schema: data.dataSchema }));
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

function getDataValuePreferenceKey(tenantId: string, definitionId: string) {
  return [tenantId, definitionId].join(':');
}
function getDataValuePreferences(tenantId: string, definitionId: string) {
  const key = getDataValuePreferenceKey(tenantId, definitionId);
  const preferencesValue = localStorage.getItem(key);
  const preferences: { selected: string[] } = preferencesValue ? JSON.parse(preferencesValue) : {};
  return preferences.selected || [];
}

const savePreferences = _.debounce(function (tenantId: string, definitionId: string, selected: string[]) {
  const key = getDataValuePreferenceKey(tenantId, definitionId);
  localStorage.setItem(key, JSON.stringify({ selected }));
}, 2000);

export const initializeDataValues = createAsyncThunk(
  'form/initialize-data-values',
  async ({ definitionId, schema }: { definitionId: string; schema: JsonSchema }, { getState, rejectWithValue }) => {
    try {
      const { user } = getState() as AppState;

      const dataValues = getDataValues(schema, []);
      const selectedValues = getDataValuePreferences(user.tenant.id, definitionId);

      return dataValues.map(({ selected, ...dataValue }) => ({
        ...dataValue,
        selected: selected || selectedValues.includes(dataValue.path),
      }));
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

export const updateDataValue = createAsyncThunk(
  'form/update-data-value',
  async (
    { definitionId, path, selected }: { definitionId: string; path: string; selected: boolean },
    { getState, rejectWithValue }
  ) => {
    try {
      const { form, user } = getState() as AppState;

      const definitionDataValues = form.dataValues[definitionId].map((dataValue) => {
        if (dataValue.path === path) {
          return { ...dataValue, selected };
        } else {
          return dataValue;
        }
      });

      savePreferences(
        user.tenant.id,
        definitionId,
        definitionDataValues.filter(({ selected }) => selected).map(({ path }) => path)
      );

      return definitionDataValues;
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

export const loadForm = createAsyncThunk(
  'form/load-form',
  async (formId: string, { dispatch, getState, rejectWithValue }) => {
    try {
      const { config } = getState() as AppState;
      const formServiceUrl = config.directory[FORM_SERVICE_ID];
      const token = await getAccessToken();

      const { data } = await axios.get<Form>(new URL(`/form/v1/forms/${formId}`, formServiceUrl).href, {
        headers: { Authorization: `Bearer ${token}` },
        params: { includeData: true },
      });

      if (data.files) {
        for (const urn of Object.values(data.files)) {
          await dispatch(loadFileMetadata(urn));
        }
      }

      dispatch(findFormPdf(data.urn));

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
  }
);

export const loadSubmission = createAsyncThunk(
  'form/load-submission',
  async (submissionId: string, { dispatch, getState, rejectWithValue }) => {
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

      if (data.formFiles) {
        for (const urn of Object.values(data.formFiles)) {
          await dispatch(loadFileMetadata(urn));
        }
      }

      dispatch(findFormPdf(data.urn));

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

export const getExportJobStatus = createAsyncThunk(
  'form/get-export-job-status',
  async (jobId: string, { dispatch, getState, rejectWithValue }) => {
    try {
      const { config } = getState() as AppState;
      const exportServiceUrl = config.directory[EXPORT_SERVICE_ID];
      const token = await getAccessToken();

      const { data } = await axios.get<Job>(new URL(`/export/v1/jobs/${jobId}`, exportServiceUrl).href, {
        headers: { Authorization: `Bearer ${token}` },
      });

      switch (data.status) {
        case 'queued':
          setTimeout(() => dispatch(getExportJobStatus(jobId)), 2000);
          break;
        case 'completed':
          dispatch(downloadFile(data.result.urn));
          break;
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

export const exportForms = createAsyncThunk(
  'form/export-forms',
  async (
    { definitionId, criteria, format }: { definitionId: string; criteria: FormCriteria; format: 'json' | 'csv' },
    { dispatch, getState, rejectWithValue }
  ) => {
    try {
      const { config } = getState() as AppState;
      const exportServiceUrl = config.directory[EXPORT_SERVICE_ID];
      const token = await getAccessToken();

      const { data } = await axios.post<Job>(
        new URL('/export/v1/jobs', exportServiceUrl).href,
        {
          resourceId: 'urn:ads:platform:form-service:v1:/forms',
          format,
          fileType: 'form-export',
          params: {
            includeData: true,
            criteria: JSON.stringify({
              ...criteria,
              definitionIdEquals: definitionId,
            }),
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTimeout(() => dispatch(getExportJobStatus(data.id)), 2000);

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

export const exportSubmissions = createAsyncThunk(
  'form/export-submissions',
  async (
    {
      definitionId,
      criteria,
      format,
    }: { definitionId: string; criteria: FormSubmissionCriteria; format: 'json' | 'csv' },
    { dispatch, getState, rejectWithValue }
  ) => {
    try {
      const { config } = getState() as AppState;
      const exportServiceUrl = config.directory[EXPORT_SERVICE_ID];
      const token = await getAccessToken();

      const { data } = await axios.post<Job>(
        new URL('/export/v1/jobs', exportServiceUrl).href,
        {
          resourceId: 'urn:ads:platform:form-service:v1:/submissions',
          format,
          fileType: 'form-export',
          params: {
            criteria: JSON.stringify({
              ...criteria,
              definitionIdEquals: definitionId,
            }),
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTimeout(() => dispatch(getExportJobStatus(data.id)), 2000);

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

export const findFormPdf = createAsyncThunk(
  'form/find-form-pdf',
  async (urn: string, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState() as AppState;
      if (canAccessPdfSelector(state)) {
        const { payload } = await dispatch(findFile({ recordId: urn, type: 'generated-pdf' }));

        return payload as FileMetadata;
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
    setDispositionDraft: (state, { payload }: { payload: Omit<FormDisposition, 'id' | 'date'> }) => {
      state.dispositionDraft = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(selectDefinition.pending, (state, { meta }) => {
        // Clear the form if the form definition is changing.
        if (state.selectedDefinition !== meta.arg) {
          state.results.forms = [];
          state.results.submissions = [];
          state.next.forms = null;
          state.next.submissions = null;
          state.export = { forms: {}, submissions: {} };
        }
      })
      .addCase(selectDefinition.fulfilled, (state, { meta }) => {
        state.selectedDefinition = meta.arg;
      })
      .addCase(selectForm.fulfilled, (state, { meta }) => {
        state.selectedForm = meta.arg;
      })
      .addCase(selectSubmission.fulfilled, (state, { meta }) => {
        state.selectedSubmission = meta.arg;
        state.dispositionDraft = initialFormState.dispositionDraft;
      })
      .addCase(loadDefinitions.pending, (state) => {
        state.busy.loading = true;
      })
      .addCase(loadDefinitions.fulfilled, (state, { payload }) => {
        state.busy.loading = false;
        state.definitions = payload.results.reduce(
          (definitions, definition) => ({ ...definitions, [definition.id]: definition }),
          state.definitions
        );
        state.results.definitions = [
          ...(payload.page.after ? state.results.definitions : []),
          ...payload.results.map((result) => result.id),
        ];
        state.next.definitions = payload.page.next;
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
      .addCase(initializeDataValues.fulfilled, (state, { payload, meta }) => {
        state.dataValues[meta.arg.definitionId] = payload;
      })
      .addCase(updateDataValue.fulfilled, (state, { payload, meta }) => {
        state.dataValues[meta.arg.definitionId] = payload;
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
        state.results.forms = [
          ...(payload.page.after ? state.results.forms : []),
          ...payload.results.map((result) => result.id),
        ];
        state.next.forms = payload.page.next;
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
        state.results.submissions = [
          ...(payload.page.after ? state.results.submissions : []),
          ...payload.results.map((result) => result.id),
        ];
        state.next.submissions = payload.page.next;
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
        state.submissions[payload.id] = payload;
      })
      .addCase(exportForms.pending, (state, { meta }) => {
        state.busy.exporting = true;
        state.export.forms = { definitionId: meta.arg.definitionId };
      })
      .addCase(exportForms.fulfilled, (state, { payload, meta }) => {
        if (state.export.forms.definitionId === meta.arg.definitionId && !state.export.forms.jobId) {
          state.export.forms.jobId = payload.id;
        }
      })
      .addCase(exportForms.rejected, (state) => {
        state.busy.exporting = false;
      })
      .addCase(exportSubmissions.pending, (state, { meta }) => {
        state.busy.exporting = true;
        state.export.submissions = { definitionId: meta.arg.definitionId };
      })
      .addCase(exportSubmissions.fulfilled, (state, { payload, meta }) => {
        if (state.export.submissions.definitionId === meta.arg.definitionId && !state.export.submissions.jobId) {
          state.export.submissions.jobId = payload.id;
        }
      })
      .addCase(exportSubmissions.rejected, (state) => {
        state.busy.exporting = false;
      })
      .addCase(getExportJobStatus.fulfilled, (state, { payload }) => {
        if (payload.status === 'completed') {
          if (state.export.forms.jobId === payload.id) {
            state.export.forms.result = payload.result;
          } else if (state.export.submissions.jobId === payload.id) {
            state.export.submissions.result = payload.result;
          }
          state.busy.exporting = false;
        }
      })
      .addCase(findFormPdf.pending, (state) => {
        state.busy.findPdf = true;
      })
      .addCase(findFormPdf.rejected, (state) => {
        state.busy.findPdf = true;
      })
      .addCase(findFormPdf.fulfilled, (state, { payload, meta }) => {
        state.pdfs[meta.arg] = payload?.urn;
        state.busy.findPdf = false;
      });
  },
});

export const formReducer = formSlice.reducer;

export const formActions = formSlice.actions;

export const definitionsSelector = createSelector(
  (state: AppState) => state.form.definitions,
  (state: AppState) => state.form.results.definitions,
  (definitions, results) => {
    return results.map((result) => definitions[result]).filter((result) => !!result);
  }
);

export const definitionSelector = createSelector(
  (state: AppState) => state.form.definitions,
  (state: AppState) => state.form.selectedDefinition,
  (definitions, selected) => definitions[selected]
);

export const dataValuesSelector = createSelector(
  (state: AppState) => state.form.dataValues,
  (state: AppState) => state.form.selectedDefinition,
  (dataValues, selected) => dataValues[selected] || []
);

export const selectedDataValuesSelector = createSelector(dataValuesSelector, (values) =>
  values.filter(({ selected }) => !!selected)
);

export const formsSelector = createSelector(
  (state: AppState) => state.form.forms,
  (state: AppState) => state.form.results.forms,
  selectedDataValuesSelector,
  (forms, results, values) => {
    return results
      .map((result) => forms[result])
      .filter((result) => !!result)
      .map(({ created, submitted, ...result }) => ({
        ...result,
        created: DateTime.fromISO(created),
        submitted: submitted ? DateTime.fromISO(submitted) : null,
        values: values.reduce((values, value) => ({ ...values, [value.path]: _.get(result.data, value.path) }), {}),
      }));
  }
);

export const submissionsSelector = createSelector(
  (state: AppState) => state.form.submissions,
  (state: AppState) => state.form.results.submissions,
  selectedDataValuesSelector,
  (submissions, results, values) => {
    return results
      .map((result) => submissions[result])
      .filter((result) => !!result)
      .map(({ created, updated, ...result }) => ({
        ...result,
        created: DateTime.fromISO(created),
        updated: updated ? DateTime.fromISO(updated) : null,
        values: values.reduce((values, value) => ({ ...values, [value.path]: _.get(result.formData, value.path) }), {}),
      }));
  }
);

export const formSelector = createSelector(
  (state: AppState) => state.form.forms,
  (state: AppState) => state.form.selectedForm,
  (forms, selected) => forms[selected]
);

export const formFilesSelector = createSelector(
  formSelector,
  (state: AppState) => state.file.metadata,
  (form, metadata) =>
    Object.entries(form?.files || {}).reduce((files, [key, urn]) => ({ ...files, [key]: metadata[urn] }), {})
);

export const submissionSelector = createSelector(
  (state: AppState) => state.form.submissions,
  (state: AppState) => state.form.selectedSubmission,
  (submissions, selected) => submissions[selected]
);

export const submissionFilesSelector = createSelector(
  (state: AppState) => state.file.metadata,
  submissionSelector,
  (metadata, submission) =>
    Object.entries(submission?.formFiles || {}).reduce((files, [key, urn]) => ({ ...files, [key]: metadata[urn] }), {})
);

export const busySelector = (state: AppState) => state.form.busy;

export const submissionCriteriaSelector = (state: AppState) => state.form.submissionCriteria;

export const formCriteriaSelector = (state: AppState) => state.form.formCriteria;

export const nextSelector = (state: AppState) => state.form.next;

export const dispositionDraftSelector = (state: AppState) => state.form.dispositionDraft;

export const isFormAdminSelector = (state: AppState) =>
  state.user.user?.roles?.includes('urn:ads:platform:form-service:form-admin');

export const canAccessPdfSelector = (state: AppState) =>
  state.user.user?.roles?.includes('urn:ads:platform:file-service:file-admin') ||
  state.user.user?.roles?.includes('urn:ads:platform:pdf-service:pdf-generator');

export const formsExportSelector = createSelector(
  (state: AppState) => state.form.export.forms,
  (state: AppState) => state.file.files,
  (state: AppState) => state.form.busy.exporting,
  (state: AppState) => state.file.busy.download,
  (state, files, exporting, downloading) => ({
    filename: state.result?.filename,
    dataUri: state.result?.urn ? files[state.result.urn] : null,
    working: exporting || (state.result?.urn && downloading[state.result.urn]),
  })
);

export const submissionsExportSelector = createSelector(
  (state: AppState) => state.form.export.submissions,
  (state: AppState) => state.file.files,
  (state: AppState) => state.form.busy.exporting,
  (state: AppState) => state.file.busy.download,
  (state, files, exporting, downloading) => ({
    filename: state.result?.filename,
    dataUri: state.result?.urn ? files[state.result.urn] : null,
    working: exporting || (state.result?.urn && downloading[state.result.urn]),
  })
);

export const pdfSelector = createSelector(
  (state: AppState) => state.file.metadata,
  (state: AppState) => state.form.pdfs,
  (_: AppState, urn: string) => urn,
  (metadata, pdfs, urn) => {
    const pdf = pdfs[urn];
    return pdf ? metadata[pdf] : null;
  }
);
