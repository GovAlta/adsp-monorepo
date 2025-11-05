import { standardV1JsonSchema, commonV1JsonSchema } from '@abgov/data-exchange-standard';
import { tryResolveRefs } from '@abgov/jsonforms-components';
import { JsonSchema } from '@jsonforms/core';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import dashify from 'dashify';
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
  CONFIGURATION_SERVICE_ID,
} from './types';
import { getAccessToken } from './user.slice';
import { AdspId } from '../../lib/adspId';
import { downloadFile, FileMetadata, findFile, loadFileMetadata } from './file.slice';
import { getResourcesTags, getTaggedResources } from './directory.slice';

export const FORM_FEATURE_KEY = 'form';

interface DefinitionCriteria {
  tag?: string;
}

interface FormSubmissionCriteria {
  dispositioned?: boolean;
  createdAfter?: string;
  createdBefore?: string;
  dataCriteria?: Record<string, unknown>;
  tag?: string;
}

interface FormCriteria {
  statusEquals?: string;
  createdAfter?: string;
  createdBefore?: string;
  dataCriteria?: Record<string, unknown>;
  tag?: string;
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
  definitionCriteria: DefinitionCriteria;
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
  definitionCriteria: {},
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

export const loadDefinitions = createAsyncThunk(
  'form/load-definitions',
  async ({ tag, after }: { tag?: string; after?: string }, { dispatch, getState, rejectWithValue }) => {
    const state = getState() as AppState;
    const { directory } = state.config;

    try {
      let result: PagedResults<FormDefinition>;
      if (tag) {
        const { results, page } = await dispatch(
          getTaggedResources({ value: dashify(tag), after, includeRepresents: true, type: 'configuration' })
        ).unwrap();

        const definitions = [];
        for (const { urn, _embedded } of results) {
          // Note: Not all configuration resources are form definitions.
          // Check the URN to confirm it's a form service namespace value.
          const [_, definitionId] = urn.match(/form-service\/([a-zA-Z0-9-_ ]{1,50})$/);
          if (definitionId && _embedded?.represents?.['latest']?.configuration) {
            definitions.push({ ..._embedded?.represents['latest'].configuration, urn });
          }
        }

        result = {
          page,
          results: definitions,
        };
      } else {
        const accessToken = await getAccessToken();
        const requestUrl = new URL('/form/v1/definitions', directory[FORM_SERVICE_ID]);
        const { data } = await axios.get<PagedResults<FormDefinition>>(requestUrl.href, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { top: 50, after },
        });

        result = {
          ...data,
        };
      }

      if (result.results?.length > 0) {
        result.results = result.results.map((result) => ({
          ...result,
          // oneFormPerApplicant defaults to true if undefined / null.
          oneFormPerApplicant: typeof result.oneFormPerApplicant !== 'boolean' || result.oneFormPerApplicant,
          urn: `${CONFIGURATION_SERVICE_ID}:v2:/configuration/form-service/${result.id}`,
        }));

        await dispatch(getResourcesTags(result.results.map(({ urn }) => urn)));
      }

      return result;
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
    { dispatch, getState, rejectWithValue }
  ) => {
    const state = getState() as AppState;
    const { directory } = state.config;

    try {
      let result: PagedResults<Form>;
      if (criteria?.tag) {
        const { results, page } = await dispatch(
          getTaggedResources({
            value: dashify(criteria.tag),
            after,
            includeRepresents: true,
            type: 'form',
            params: { includeData: true },
          })
        ).unwrap();

        result = {
          results: results.map((result) => result._embedded?.represents as Form).filter((result) => !!result),
          page,
        };
      } else {
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

        result = data;
      }

      if (result.results?.length > 0) {
        await dispatch(getResourcesTags(result.results.map(({ urn }) => urn)));
      }

      return {
        ...result,
        results: result.results.map(({ status, ...result }) => ({ ...result, status: FormStatus[status] })),
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
    { dispatch, getState, rejectWithValue }
  ) => {
    const state = getState() as AppState;
    const { directory } = state.config;

    try {
      let result: PagedResults<FormSubmission>;
      if (criteria?.tag) {
        const { results, page } = await dispatch(
          getTaggedResources({ value: dashify(criteria.tag), after, includeRepresents: true, type: 'submission' })
        ).unwrap();

        result = {
          results: results.map((result) => result._embedded?.represents as FormSubmission).filter((result) => !!result),
          page,
        };
      } else {
        const accessToken = await getAccessToken();
        const requestUrl = new URL('/form/v1/submissions', directory[FORM_SERVICE_ID]);
        const { data } = await axios.get<PagedResults<FormSubmission>>(requestUrl.href, {
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

        result = data;
      }

      if (result.results?.length > 0) {
        await dispatch(getResourcesTags(result.results.map(({ urn }) => urn)));
      }

      return result;
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

export const selectDefinition = createAsyncThunk('form/select-definition', (definitionId: string, { dispatch }) => {
  if (definitionId) {
    dispatch(loadDefinition(definitionId));
  }
});

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

      return {
        ...data,
        urn: `${CONFIGURATION_SERVICE_ID}:v2:/configuration/form-service/${data.id}`,
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
        const dataFiles: Record<string, string> = {};

        for (const fileKey of Object.keys(data.files)) {
          Object.entries(data.data).forEach(([path, value]) => {
            const rootKeyPath = fileKey.slice(0, fileKey.lastIndexOf('.'));
            if (path === rootKeyPath) {
              dataFiles[path] = value as string;
              // the return of the files from endpoint is AdspId object, we need to change it to urn string.
              data.files[fileKey] = value as string;
            }
          });
        }

        const fileLoadPromises = Object.values(dataFiles).flatMap((urns) =>
          urns.split(';').map((urn) => dispatch(loadFileMetadata(urn as string)))
        );
        await Promise.all(fileLoadPromises);
      }
      const formSubmissionUrn = `urn:ads:platform:form-service:v1:/forms/${data.id}${
        data.submission ? `/submissions/${data.submission ? data.submission.id : ''}` : ''
      }`;

      dispatch(findFormPdf(formSubmissionUrn));

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
      const formSubmissionUrn = `urn:ads:platform:form-service:v1:/forms/${data.formId}${
        data.id ? `/submissions/${data.id}` : ''
      }`;

      dispatch(findFormPdf(formSubmissionUrn));

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

export const updateFormDisposition = createAsyncThunk(
  'form/update-form-disposition',
  async (
    { submissionUrn, status, reason }: { submissionUrn: string; status: string; reason: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const { config } = getState() as AppState;
      const formServiceUrl = config.directory[FORM_SERVICE_ID];
      const accessToken = await getAccessToken();

      const { data } = await axios.post<FormSubmission>(
        new URL(`/form/v1${submissionUrn}`, formServiceUrl).href,
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

export const runFormOperation = createAsyncThunk(
  'form/run-form-operation',
  async ({ urn, operation }: { urn: AdspId; operation: 'to-draft' | 'archive' }, { getState, rejectWithValue }) => {
    try {
      const { config } = getState() as AppState;
      const formServiceUrl = config.directory[FORM_SERVICE_ID];
      const accessToken = await getAccessToken();

      const { data } = await axios.post<Form>(
        new URL(`/form/v1${urn.resource}`, formServiceUrl).href,
        { operation },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

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

const formSlice = createSlice({
  name: FORM_FEATURE_KEY,
  initialState: initialFormState,
  reducers: {
    setDefinitionCriteria: (state, { payload }: { payload: DefinitionCriteria }) => {
      state.definitionCriteria = payload;
    },
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
          state.definitions as Record<string, FormDefinition>
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
        state.forms = payload.results.reduce(
          (results, form) => ({ ...results, [form.id]: form }),
          state.forms as Record<string, Form>
        );
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
          state.submissions as Record<string, FormSubmission>
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
        state.busy.findPdf = false;
      })
      .addCase(findFormPdf.fulfilled, (state, { payload, meta }) => {
        state.pdfs[meta.arg] = payload?.urn;
        state.busy.findPdf = false;
      })
      .addCase(updateFormDisposition.pending, (state) => {
        state.busy.executing = true;
      })
      .addCase(updateFormDisposition.rejected, (state) => {
        state.busy.executing = false;
      })
      .addCase(updateFormDisposition.fulfilled, (state, { payload }) => {
        state.busy.executing = false;
        state.submissions[payload.id] = payload;
      })
      .addCase(runFormOperation.pending, (state) => {
        state.busy.executing = true;
      })
      .addCase(runFormOperation.rejected, (state) => {
        state.busy.executing = false;
      })
      .addCase(runFormOperation.fulfilled, (state, { payload }) => {
        state.busy.executing = false;
        // Merge the form since operation request doesn't return data and files.
        state.forms[payload.id] = {
          ...(state.forms[payload.id] as Form),
          ...payload,
        };
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
  (definitions, selected) => {
    const definition = definitions[selected];

    return definition
      ? {
          ...definition,
          intake: definition.intake && {
            ...definition.intake,
            start: definition.intake.start && DateTime.fromISO(definition.intake.start),
            end: definition.intake.end && DateTime.fromISO(definition.intake.end),
          },
        }
      : undefined;
  }
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
  (state: AppState) => state.form.results.forms,
  (forms, selected, results) => {
    const selectedIndex = results.indexOf(selected);
    const next = selectedIndex >= 0 ? results[selectedIndex + 1] : undefined;
    return { form: forms[selected], next };
  }
);

export const formFilesSelector = createSelector(
  formSelector,
  (state: AppState) => state.file.metadata,
  ({ form }, metadata) =>
    Object.entries(form?.files || {})
      .filter(([key, urn]) => typeof urn === 'string')
      .reduce((files, [key, urn]) => {
        const root = key.slice(0, key.lastIndexOf('.'));
        const fileItems = urn
          ?.split(';')
          .map((u) => metadata[u])
          .filter((f) => f !== undefined);

        return {
          ...files,
          [root]: fileItems,
        };
      }, {})
);

export const submissionSelector = createSelector(
  (state: AppState) => state.form.submissions,
  (state: AppState) => state.form.selectedSubmission,
  (state: AppState) => state.form.results.submissions,
  (submissions, selected, results) => {
    const selectedIndex = results.indexOf(selected);
    const next = selectedIndex >= 0 ? results[selectedIndex + 1] : undefined;
    return { submission: submissions[selected], next };
  }
);

export const submissionFilesSelector = createSelector(
  (state: AppState) => state.file.metadata,
  submissionSelector,
  (metadata, { submission }) => {
    return Object.entries(submission?.formFiles || {})
      .filter(([key, urn]) => typeof urn === 'string')
      .reduce((files, [key, urn]) => {
        const root = key.slice(0, key.lastIndexOf('.'));
        const fileItems = urn
          ?.split(';')
          .map((u) => metadata[u])
          .filter((f) => f !== undefined);

        return {
          ...files,
          [root]: fileItems,
        };
      }, {});
  }
);

export const formBusySelector = (state: AppState) => state.form.busy;

export const submissionCriteriaSelector = (state: AppState) => state.form.submissionCriteria;

export const formCriteriaSelector = (state: AppState) => state.form.formCriteria;

export const definitionCriteriaSelector = (state: AppState) => state.form.definitionCriteria;

export const nextSelector = (state: AppState) => state.form.next;

export const dispositionDraftSelector = (state: AppState) => state.form.dispositionDraft;

export const canExportSelector = (state: AppState) =>
  state.user.user?.roles?.includes('urn:ads:platform:form-service:form-admin');
export const canGetIntakeCalendarSelector = canExportSelector;

export const canAccessPdfSelector = (state: AppState) =>
  state.user.user?.roles?.includes('urn:ads:platform:file-service:file-admin') ||
  state.user.user?.roles?.includes('urn:ads:platform:pdf-service:pdf-generator');

export const canArchiveSelector = canExportSelector;
export const canSetToDraftSelector = createSelector(
  definitionSelector,
  (state: AppState) => state.user.user,
  (definition, user) =>
    (definition && !definition.anonymousApply && user?.roles?.includes('urn:ads:platform:form-service:form-admin')) ||
    !!user.roles?.find((role) => definition?.assessorRoles?.includes(role))
);

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
