import { standardV1JsonSchema, commonV1JsonSchema } from '@abgov/data-exchange-standard';
import { tryResolveRefs } from '@abgov/jsonforms-components';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import dashify from 'dashify';
import _ from 'lodash';
import { DateTime } from 'luxon';
import { resolveReviewColumns, ReviewColumnValue } from './reviewColumns';
import { AppState } from './store';
import {
  FeedbackMessage,
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
  createDateAfter?: string;
  createDateBefore?: string;
  tag?: string;
}

export interface FormSubmissionCriteria {
  dispositioned?: boolean;
  createDateAfter?: string;
  createDateBefore?: string;
  dataCriteria?: Record<string, unknown>;
  tag?: string;
}

interface FormCriteria {
  statusEquals?: string;
  createDateAfter?: string;
  createDateBefore?: string;
  dataCriteria?: Record<string, unknown>;
  tag?: string;
}

export type SortDirection = 'asc' | 'desc';

// Sort field is the column name understood by the form service; data value columns are sorted using
// the 'data.' prefix followed by the path of the value in the form data.
export interface ResultsSort {
  field: string;
  direction: SortDirection;
}

export const DATA_VALUE_SORT_PREFIX = 'data.';

export const getDefaultResultsSort = (): ResultsSort => ({ field: 'created', direction: 'desc' });

// Tagged resource search is served by the directory service, which doesn't sort on form values, so
// sort parameters are only sent on the form service search.
const toSortParams = (sort?: ResultsSort) => (sort?.field ? { sortBy: sort.field, sortDirection: sort.direction } : {});

export const toDateRangeStart = (value: string): string => new Date(`${value}T00:00:00.000Z`).toISOString();
export const toDateRangeEnd = (value: string): string => new Date(`${value}T23:59:59.999Z`).toISOString();

export const getDefaultDefinitionCriteria = (): DefinitionCriteria => ({
  createDateAfter: toDateRangeStart(DateTime.utc().minus({ weeks: 2 }).toISODate()),
});

export const getDefaultFormCriteria = (): FormCriteria => ({
  statusEquals: 'submitted',
  createDateAfter: toDateRangeStart(DateTime.utc().minus({ weeks: 2 }).toISODate()),
});

export const getDefaultSubmissionCriteria = (): FormSubmissionCriteria => ({
  dispositioned: false,
  createDateAfter: toDateRangeStart(DateTime.utc().minus({ weeks: 2 }).toISODate()),
});

const hasFilterValue = (value: unknown): boolean => value !== undefined && value !== null && value !== '';

// Counts every criteria field that carries a value; data value criteria are counted individually.
export const countActiveFilters = (criteria: { dataCriteria?: Record<string, unknown> } = {}): number => {
  const { dataCriteria, ...fields } = criteria;
  return [...Object.values(fields), ...Object.values(dataCriteria || {})].filter(hasFilterValue).length;
};

// Tag based searches resolve results via the directory service, which doesn't include a total in the page.
// Carry the total across pages of the same search, but clear it when a new search comes back without one,
// so the total of a previous search isn't reported against the current results.
export const resolveResultTotal = (
  current: number | null,
  page: { after?: string; total?: number },
): number | null => {
  if (page.total !== undefined) {
    return page.total;
  }

  return page.after ? current : null;
};

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
  results: {
    definitions: string[];
    forms: string[];
    submissions: string[];
  };
  resultTotals: {
    definitions: number | null;
    forms: number | null;
    submissions: number | null;
  };
  definitionCriteria: DefinitionCriteria;
  formCriteria: FormCriteria;
  submissionCriteria: FormSubmissionCriteria;
  formSort: ResultsSort;
  submissionSort: ResultsSort;
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
  forms: {},
  submissions: {},
  pdfs: {},
  results: {
    definitions: [],
    forms: [],
    submissions: [],
  },
  resultTotals: {
    definitions: 0,
    forms: 0,
    submissions: 0,
  },
  definitionCriteria: getDefaultDefinitionCriteria(),
  formCriteria: getDefaultFormCriteria(),
  submissionCriteria: getDefaultSubmissionCriteria(),
  formSort: getDefaultResultsSort(),
  submissionSort: getDefaultResultsSort(),
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
  async (
    { tag, after, criteria }: { tag?: string; after?: string; criteria?: DefinitionCriteria }, // clean-code-ignore: 2.3
    { dispatch, getState, rejectWithValue },
  ) => {
    const state = getState() as AppState;
    const { directory } = state.config;

    try {
      let result: PagedResults<FormDefinition>;
      if (tag) {
        const { results, page } = await dispatch(
          getTaggedResources({ value: dashify(tag), after, includeRepresents: true, type: 'configuration' }),
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
          params: {
            top: 50,
            after,
            createDateAfter: criteria?.createDateAfter,
            createDateBefore: criteria?.createDateBefore,
          },
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
  },
);

export const findForms = createAsyncThunk(
  'form/find-forms',
  async (
    {
      definitionId,
      after,
      criteria,
      sort,
    }: { definitionId: string; after?: string; criteria?: FormCriteria; sort?: ResultsSort },
    { dispatch, getState, rejectWithValue },
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
          }),
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
            ...toSortParams(sort),
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
  },
);

export const findSubmissions = createAsyncThunk(
  'form/find-submissions',
  async (
    {
      definitionId,
      after,
      criteria,
      sort,
    }: { definitionId: string; after?: string; criteria?: FormSubmissionCriteria; sort?: ResultsSort },
    { dispatch, getState, rejectWithValue },
  ) => {
    const state = getState() as AppState;
    const { directory } = state.config;

    try {
      let result: PagedResults<FormSubmission>;
      if (criteria?.tag) {
        const { results, page } = await dispatch(
          getTaggedResources({ value: dashify(criteria.tag), after, includeRepresents: true, type: 'submission' }),
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
            ...toSortParams(sort),
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
  },
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
        },
      );
      if (data.dataSchema) {
        // Try to resolve refs since Json forms doesn't handle remote refs.
        const [resolved, error] = await tryResolveRefs(data.dataSchema, standardV1JsonSchema, commonV1JsonSchema);
        if (!error) {
          data.dataSchema = resolved;
        }
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
  },
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
          urns.split(';').map((urn) => dispatch(loadFileMetadata(urn as string))),
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
  },
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
        },
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
  },
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
        case 'failed':
          return rejectWithValue({
            id: jobId,
            level: 'error',
            message: 'Export failed to complete. Try the export again.',
            in: 'form/get-export-job-status',
          } as FeedbackMessage);
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
  },
);

interface ExportColumn {
  key: string;
  header: string;
}

const formExportColumns: ExportColumn[] = [
  { key: 'id', header: 'ID' },
  { key: 'status', header: 'Status' },
  { key: 'created', header: 'Created on' },
  { key: 'submitted', header: 'Submitted on' },
];

const submissionExportColumns: ExportColumn[] = [
  { key: 'id', header: 'ID' },
  { key: 'formId', header: 'Form ID' },
  { key: 'created', header: 'Created on' },
  { key: 'updated', header: 'Updated on' },
  { key: 'disposition.status', header: 'Disposition status' },
  { key: 'disposition.reason', header: 'Disposition reason' },
];

// Limit export to base columns plus Review Configuration columns, so output matches the lists.
function getExportFormatOptions( // clean-code-ignore: 2.3
  format: 'json' | 'csv',
  baseColumns: ExportColumn[],
  dataPath: string,
  dataValues: ReviewColumnValue[],
) {
  const columns = [
    ...baseColumns,
    ...dataValues.map(({ name, path }) => ({ key: `${dataPath}.${path}`, header: name })),
  ];

  return format === 'csv' ? { columns } : { fields: columns.map(({ key }) => key) };
}

function reviewColumnsForDefinition(form: FormState, definitionId: string): ReviewColumnValue[] {
  const definition = form.definitions[definitionId];
  return resolveReviewColumns(definition?.dataSchema, definition?.reviewConfiguration);
}

export const exportForms = createAsyncThunk(
  'form/export-forms',
  async (
    { definitionId, criteria, format }: { definitionId: string; criteria: FormCriteria; format: 'json' | 'csv' },
    { dispatch, getState, rejectWithValue },
  ) => {
    try {
      const { config, form } = getState() as AppState;
      const exportServiceUrl = config.directory[EXPORT_SERVICE_ID];
      const token = await getAccessToken();

      const { data } = await axios.post<Job>(
        new URL('/export/v1/jobs', exportServiceUrl).href,
        {
          resourceId: 'urn:ads:platform:form-service:v1:/forms',
          format,
          formatOptions: getExportFormatOptions(
            format,
            formExportColumns,
            'data',
            reviewColumnsForDefinition(form, definitionId),
          ),
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
        },
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
  },
);

export const exportSubmissions = createAsyncThunk(
  'form/export-submissions',
  async (
    {
      definitionId,
      criteria,
      format,
    }: { definitionId: string; criteria: FormSubmissionCriteria; format: 'json' | 'csv' },
    { dispatch, getState, rejectWithValue },
  ) => {
    try {
      const { config, form } = getState() as AppState;
      const exportServiceUrl = config.directory[EXPORT_SERVICE_ID];
      const token = await getAccessToken();

      const { data } = await axios.post<Job>(
        new URL('/export/v1/jobs', exportServiceUrl).href,
        {
          resourceId: 'urn:ads:platform:form-service:v1:/submissions',
          format,
          formatOptions: getExportFormatOptions(
            format,
            submissionExportColumns,
            'formData',
            reviewColumnsForDefinition(form, definitionId),
          ),
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
        },
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
  },
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
  },
);

export const updateFormDisposition = createAsyncThunk(
  'form/update-form-disposition',
  async (
    { submissionUrn, status, reason }: { submissionUrn: string; status: string; reason: string },
    { getState, rejectWithValue },
  ) => {
    try {
      const { config } = getState() as AppState;
      const formServiceUrl = config.directory[FORM_SERVICE_ID];
      const accessToken = await getAccessToken();

      const { data } = await axios.post<FormSubmission>(
        new URL(`/form/v1${submissionUrn}`, formServiceUrl).href,
        { dispositionStatus: status, dispositionReason: reason },
        { headers: { Authorization: `Bearer ${accessToken}` } },
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
);

export const addSubmissionNote = createAsyncThunk(
  'form/add-submission-note',
  async (
    { formId, submissionId, content }: { formId: string; submissionId: string; content: string },
    { getState, rejectWithValue },
  ) => {
    try {
      const { config } = getState() as AppState;
      const formServiceUrl = config.directory[FORM_SERVICE_ID];
      const accessToken = await getAccessToken();

      const { data } = await axios.post<FormSubmission>(
        new URL(`/form/v1/forms/${formId}/submissions/${submissionId}/notes`, formServiceUrl).href,
        { content },
        { headers: { Authorization: `Bearer ${accessToken}` } },
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
);

export const deleteSubmissionNote = createAsyncThunk(
  'form/delete-submission-note',
  async (
    { formId, submissionId, noteId }: { formId: string; submissionId: string; noteId: string },
    { getState, rejectWithValue },
  ) => {
    try {
      const { config } = getState() as AppState;
      const formServiceUrl = config.directory[FORM_SERVICE_ID];
      const accessToken = await getAccessToken();

      const { data } = await axios.delete<FormSubmission>(
        new URL(`/form/v1/forms/${formId}/submissions/${submissionId}/notes/${noteId}`, formServiceUrl).href,
        { headers: { Authorization: `Bearer ${accessToken}` } },
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
        { headers: { Authorization: `Bearer ${accessToken}` } },
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
  },
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
    setFormSort: (state, { payload }: { payload: ResultsSort }) => {
      state.formSort = payload;
    },
    setSubmissionSort: (state, { payload }: { payload: ResultsSort }) => {
      state.submissionSort = payload;
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
          state.resultTotals.forms = 0;
          state.resultTotals.submissions = 0;
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
          state.definitions as Record<string, FormDefinition>,
        );
        const results = [
          ...(payload.page.after ? state.results.definitions : []),
          ...payload.results.map((result) => result.id),
        ];
        state.results.definitions = results;
        state.resultTotals.definitions = resolveResultTotal(state.resultTotals.definitions, payload.page);
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
          state.forms as Record<string, Form>,
        );
        const results = [
          ...(payload.page.after ? state.results.forms : []),
          ...payload.results.map((result) => result.id),
        ];
        state.results.forms = results;
        state.resultTotals.forms = resolveResultTotal(state.resultTotals.forms, payload.page);
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
          state.submissions as Record<string, FormSubmission>,
        );
        const results = [
          ...(payload.page.after ? state.results.submissions : []),
          ...payload.results.map((result) => result.id),
        ];
        state.results.submissions = results;
        state.resultTotals.submissions = resolveResultTotal(state.resultTotals.submissions, payload.page);
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
      .addCase(getExportJobStatus.rejected, (state) => {
        state.busy.exporting = false;
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
      .addCase(addSubmissionNote.pending, (state) => {
        state.busy.executing = true;
      })
      .addCase(addSubmissionNote.rejected, (state) => {
        state.busy.executing = false;
      })
      .addCase(addSubmissionNote.fulfilled, (state, { payload }) => {
        state.busy.executing = false;
        state.submissions[payload.id] = payload;
      })
      .addCase(deleteSubmissionNote.pending, (state) => {
        state.busy.executing = true;
      })
      .addCase(deleteSubmissionNote.rejected, (state) => {
        state.busy.executing = false;
      })
      .addCase(deleteSubmissionNote.fulfilled, (state, { payload }) => {
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
  },
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
  },
);

export const selectedDataValuesSelector = createSelector(
  (state: AppState) => state.form.definitions,
  (state: AppState) => state.form.selectedDefinition,
  (definitions, selected) => {
    const definition = selected ? definitions[selected] : undefined;
    return resolveReviewColumns(definition?.dataSchema, definition?.reviewConfiguration);
  },
);

export const formResultTotalsSelector = createSelector(
  (state: AppState) => state.form.resultTotals,
  (resultTotals) => resultTotals,
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
  },
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
  },
);

export const formSelector = createSelector(
  (state: AppState) => state.form.forms,
  (state: AppState) => state.form.selectedForm,
  (state: AppState) => state.form.results.forms,
  (forms, selected, results) => {
    const selectedIndex = results.indexOf(selected);
    const next = selectedIndex >= 0 ? results[selectedIndex + 1] : undefined;
    return { form: forms[selected], next };
  },
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
      }, {}),
);

export const submissionSelector = createSelector(
  (state: AppState) => state.form.submissions,
  (state: AppState) => state.form.selectedSubmission,
  (state: AppState) => state.form.results.submissions,
  (submissions, selected, results) => {
    const selectedIndex = results.indexOf(selected);
    const next = selectedIndex >= 0 ? results[selectedIndex + 1] : undefined;
    return { submission: submissions[selected], next };
  },
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
  },
);

export const formBusySelector = (state: AppState) => state.form.busy;

export const submissionCriteriaSelector = (state: AppState) => state.form.submissionCriteria;

export const submissionFilterCountSelector = createSelector(submissionCriteriaSelector, countActiveFilters);

export const formSortSelector = (state: AppState) => state.form.formSort;

export const submissionSortSelector = (state: AppState) => state.form.submissionSort;

export const formCriteriaSelector = (state: AppState) => state.form.formCriteria;

export const formFilterCountSelector = createSelector(formCriteriaSelector, countActiveFilters);

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
    !!user.roles?.find((role) => definition?.assessorRoles?.includes(role)),
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
  }),
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
  }),
);

export const pdfSelector = createSelector(
  (state: AppState) => state.file.metadata,
  (state: AppState) => state.form.pdfs,
  (_: AppState, urn: string) => urn,
  (metadata, pdfs, urn) => {
    const pdf = pdfs[urn];
    return pdf ? metadata[pdf] : null;
  },
);
