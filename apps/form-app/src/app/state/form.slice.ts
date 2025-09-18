import { standardV1JsonSchema, commonV1JsonSchema } from '@abgov/data-exchange-standard';
import { createDefaultAjv, RegisterData, tryResolveRefs } from '@abgov/jsonforms-components';
import { JsonFormsCore, JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import * as _ from 'lodash';
import { debounce } from 'lodash';
import { DateTime } from 'luxon';
import { AppState } from './store';
import { hashData } from './util';
import { getAccessToken } from './user.slice';
import { connectStream, loadTopic, selectTopic } from './comment.slice';
import { loadFileMetadata } from './file.slice';
import { PagedResults } from './types';

export const FORM_FEATURE_KEY = 'form';

interface SerializableFormDefinition {
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

interface SerializableForm {
  definition: { id: string; name: string; description: string };
  id: string;
  urn: string;
  status: 'draft' | 'locked' | 'submitted' | 'archived';
  created: string;
  submitted?: string;
  submission?: {
    id: string;
    urn: string;
  };
  jobId?: string;
}

interface FormDataResponse {
  id: string;
  data: Record<string, unknown>;
  files: Record<string, string>;
}

export enum FormStatus {
  draft = 'Draft',
  submitted = 'Submitted',
  archived = 'Archived',
}

export type ValidationError = JsonFormsCore['errors'][number];

export interface FormState {
  definitions: Record<string, SerializableFormDefinition>;
  selected: string;
  forms: Record<string, SerializableForm>;
  results: string[];
  next: string;
  form: SerializableForm;
  data: Record<string, unknown>;
  files: Record<string, string>;
  config: Record<string, string>;
  errors: ValidationError[];
  saved: string;
  busy: {
    loading: boolean;
    creating: boolean;
    saving: boolean;
    submitting: boolean;
  };
  initialized: {
    forms: boolean;
  };
}

const FORM_SERVICE_ID = 'urn:ads:platform:form-service';
const CONFIGURATION_SERVICE_ID = 'urn:ads:platform:configuration-service:v2';
const CACHE_SERVICE_ID = 'urn:ads:platform:cache-service';
const ajv = createDefaultAjv(standardV1JsonSchema, commonV1JsonSchema);

export const selectedDefinition = createAsyncThunk(
  'form/select-definition',
  (definitionId: string, { getState, dispatch }) => {
    const { form } = getState() as AppState;

    if (definitionId && !form.definitions[definitionId]) {
      dispatch(loadDefinition(definitionId));
    }
  }
);

function pickRegisters(obj, property) {
  let registers = [];
  Object.keys(obj).forEach(function (key) {
    if (key === 'register' && property in obj[key]) {
      if (!registers.includes(obj[key]?.[property])) {
        registers.push(obj[key]?.[property]);
      }
    } else if (_.isObject(obj[key])) {
      registers = [...registers, ...pickRegisters(obj[key], property)];
    } else if (_.isArray(obj[key])) {
      const nextRegisters = obj[key].map(function (arrayObj) {
        return pickRegisters(arrayObj, property);
      });
      registers = [...registers, ...nextRegisters];
    }
  });
  return registers;
}

const extraRegisterUrns = (uiSchema) => {
  if (uiSchema) {
    return pickRegisters(uiSchema, 'urn');
  }

  return null;
};

export const loadDefinition = createAsyncThunk(
  'form/load-definition',
  async (definitionId: string, { getState, rejectWithValue }) => {
    try {
      const { config, user } = getState() as AppState;
      const formServiceUrl = config.directory[FORM_SERVICE_ID];
      const cacheServiceUrl = config.directory[CACHE_SERVICE_ID];

      const tenantId = user.tenant.id;
      const headers: Record<string, string> = {};
      if (user.user) {
        const token = await getAccessToken();
        headers.Authorization = `Bearer ${token}`;
      }

      const { data } = await axios.get<SerializableFormDefinition>(
        new URL(`/form/v1/definitions/${definitionId}`, formServiceUrl).href,
        {
          headers,
          params: { tenantId: tenantId.toString() },
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

      const registerUrns = extraRegisterUrns(data?.uiSchema);
      const registerData = [];
      if (registerUrns) {
        await Promise.all(
          registerUrns.map(async (urn) => {
            const service = urn.split('/').slice(-2);
            const baseCacheServiceUrl = new URL(
              `/cache/v1/cache/${CONFIGURATION_SERVICE_ID}/configuration/${service[0]}/${service[1]}`,
              cacheServiceUrl
            ).href;

            try {
              const { data } = await axios.get(`${baseCacheServiceUrl}/active`, {
                params: { tenantId, orLatest: true },
              });
              if (!_.isEmpty(data?.configuration) && _.isArray(data?.configuration)) {
                registerData.push({
                  urn,
                  data: data?.configuration,
                });
              }
            } catch (error) {
              console.warn(`Error fetching ${urn} active: ${error.message}`);
            }
          })
        );
      }

      if (!_.isEmpty(data)) {
        data.registerData = registerData;
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

export const findUserForms = createAsyncThunk(
  'form/find-user-forms',
  async ({ definitionId, after }: { definitionId?: string; after?: string }, { getState, rejectWithValue }) => {
    try {
      const { config, user } = getState() as AppState;
      const formServiceUrl = config.directory[FORM_SERVICE_ID];

      // If there is no user context, then there is no existing form to find.
      if (!user.user) {
        return { results: [], page: {} } as PagedResults<SerializableForm>;
      }

      const token = await getAccessToken();
      const { data } = await axios.get<PagedResults<SerializableForm>>(new URL(`/form/v1/forms`, formServiceUrl).href, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          top: 10,
          after,
          criteria: JSON.stringify({
            createdByIdEquals: user.user.id,
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

const SUPPORT_TOPIC_TYPE_ID = 'form-questions';
const SUPPORT_TOPIC_STREAM_ID = 'form-questions-updates';

export const loadForm = createAsyncThunk(
  'form/load-form',
  async (formId: string, { getState, dispatch, rejectWithValue }) => {
    try {
      const { config, form: loadedForm } = getState() as AppState;
      const formServiceUrl = config.directory[FORM_SERVICE_ID];

      let token = await getAccessToken();
      const { data: form } = await axios.get<SerializableForm>(
        new URL(`/form/v1/forms/${formId}`, formServiceUrl).href,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      token = await getAccessToken();
      const { data } = await axios.get<FormDataResponse>(
        new URL(`/form/v1/forms/${formId}/data`, formServiceUrl).href,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.files && Object.values(data.files).length > 0) {
        const formFiles = Object.values(data.files);
        for (const fileUrn of formFiles) {
          const propertyId = Object.keys(data.files)
            .find((key) => data.files[key] === fileUrn)
            .split('.')?.[0]; //Need to map the propertyId/controlId to the actual file meta data
          //otherwise the file upload control wont display properly.
          if (propertyId) {
            dispatch(loadFileMetadata({ propertyId, urn: fileUrn }));
          }
        }
      }

      const result = await dispatch(loadTopic({ resourceId: form.urn, typeId: SUPPORT_TOPIC_TYPE_ID })).unwrap();
      if (result) {
        dispatch(selectTopic({ resourceId: form.urn }));
        dispatch(
          connectStream({
            stream: SUPPORT_TOPIC_STREAM_ID,
            typeId: SUPPORT_TOPIC_TYPE_ID,
            topicId: result.id,
          })
        );
      }

      // Need to run a ajv validate here when we load the form to initialize data
      // that are using the default keyword in the data schema.
      if (loadedForm?.definitions?.[form.definition.id]) {
        const currentDefinition = loadedForm.definitions[form.definition.id];
        ajv.validate(currentDefinition.dataSchema, data.data);
      }
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
  }
);

export const createForm = createAsyncThunk(
  'form/create-form',
  async (definitionId: string, { getState, rejectWithValue }) => {
    try {
      const { config, user } = getState() as AppState;
      const formServiceUrl = config.directory[FORM_SERVICE_ID];

      const token = await getAccessToken();
      const { data } = await axios.post<SerializableForm>(
        new URL(`/form/v1/forms`, formServiceUrl).href,
        {
          definitionId,
          applicant: {
            userId: user.user.id,
            addressAs: user.user.name,
            channels: [{ channel: 'email', address: user.user.email }],
          },
        },
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
    {
      data,
      files,
      errors,
    }: { data?: Record<string, unknown>; files?: Record<string, string>; errors?: ValidationError[] },
    { getState, dispatch }
  ) => {
    const { form, user } = getState() as AppState;

    // Dispatch saving the draft if there is a logged in user with a draft form.
    if (user.user && form.form?.id) {
      dispatch(formActions.setSaving(true));
      dispatch(saveForm(form.form.id));
    }

    return { data, files, errors };
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
    800,
    { leading: false, trailing: true }
  )
);

export const submitForm = createAsyncThunk(
  'form/submit-form',
  async (formId: string, { getState, rejectWithValue }) => {
    try {
      const { config, user } = getState() as AppState;
      const formServiceUrl = config.directory[FORM_SERVICE_ID];

      const roles = user?.user?.roles ?? [];
      const dryRun = roles.includes('urn:ads:platform:form-service:form-tester');
      const token = await getAccessToken();
      const { data } = await axios.post<SerializableForm>(
        new URL(`/form/v1/forms/${formId}`, formServiceUrl).href,
        { operation: 'submit', dryRun },
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

export const submitAnonymousForm = createAsyncThunk(
  'form/submit-anonymous-form',
  async (_: void, { getState, rejectWithValue }) => {
    try {
      const { config, user, form } = getState() as AppState;

      let token: string;
      const grecaptcha = window['grecaptcha'];
      if (grecaptcha?.execute) {
        token = await grecaptcha.execute(config.environment.recaptchaKey, { action: 'submit_form' });
      }

      const roles = user?.user?.roles ?? [];
      const dryRun = roles.includes('urn:ads:platform:form-service:form-tester');

      const { data } = await axios.post<SerializableForm>(`/api/gateway/v1/forms`, {
        token,
        tenant: user.tenant.name,
        definitionId: form.selected,
        data: form.data,
        files: form.files,
        dryRun: dryRun,
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

const initialFormState: FormState = {
  definitions: {},
  selected: null,
  forms: {},
  results: [],
  next: null,
  form: null,
  data: {},
  files: {},
  config: {},
  errors: [],
  saved: null,
  busy: {
    loading: false,
    creating: false,
    saving: false,
    submitting: false,
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
    updateFormFiles: (state, action: { payload: Record<string, string> }) => {
      state.files = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(selectedDefinition.fulfilled, (state, { meta }) => {
        state.selected = meta.arg;
        // Clear the form if the form definition is changing.
        if (state.form && state.form.definition.id !== meta.arg) {
          state.next = null;
          state.form = null;
          state.data = {};
          state.files = {};
          state.saved = null;
        }
      })
      .addCase(loadDefinition.pending, (state) => {
        state.busy.loading = true;
      })
      .addCase(loadDefinition.fulfilled, (state, { payload, meta }) => {
        state.busy.loading = false;
        state.definitions[meta.arg] = payload;
      })
      .addCase(loadDefinition.rejected, (state) => {
        state.busy.loading = false;
      })
      .addCase(createForm.pending, (state) => {
        state.busy.creating = true;
      })
      .addCase(createForm.fulfilled, (state, { payload }) => {
        state.busy.creating = false;
        state.forms[payload.id] = payload;
        state.results.push(payload.id);
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
        state.forms[payload.form.id] = payload.form;
        state.form = payload.form;
        state.data = payload.data || {};
        state.files = payload.files || {};
        state.saved = payload.digest;
      })
      .addCase(loadForm.rejected, (state) => {
        state.busy.loading = false;
      })
      .addCase(findUserForms.pending, (state) => {
        state.busy.loading = true;
      })
      .addCase(findUserForms.fulfilled, (state, { payload }) => {
        state.busy.loading = false;
        state.forms = payload.results.reduce((forms, result) => ({ ...forms, [result.id]: result }), state.forms);
        state.results = [...(payload.page.after ? state.results : []), ...payload.results.map((result) => result.id)];
        state.next = payload.page.next;
        state.initialized.forms = true;
      })
      .addCase(findUserForms.rejected, (state) => {
        state.busy.loading = false;
      })
      .addCase(updateForm.pending, (state, { meta }) => {
        state.data = meta.arg.data;
        state.files = meta.arg.files;
        state.errors = meta.arg.errors || [];
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
      })
      .addCase(submitAnonymousForm.pending, (state) => {
        state.busy.submitting = true;
      })
      .addCase(submitAnonymousForm.fulfilled, (state, { payload }) => {
        state.busy.submitting = false;
        state.form = payload;
      })
      .addCase(submitAnonymousForm.rejected, (state) => {
        state.busy.submitting = false;
      });
  },
});

export const formReducer = formSlice.reducer;
export const formActions = formSlice.actions;

export const definitionSelector = createSelector(
  (state: AppState) => state.form.definitions,
  (state: AppState) => state.form.selected,
  (definitions, selected) => {
    const definition = selected && definitions[selected];
    return {
      definition: definition && {
        ...definition,
        intake: definition.intake && {
          ...definition.intake,
          start: definition.intake.start && DateTime.fromISO(definition.intake.start),
          end: definition.intake.end && DateTime.fromISO(definition.intake.end),
        },
      },
      initialized: definition !== undefined,
    };
  }
);

export const formsSelector = createSelector(
  (state: AppState) => state.form.forms,
  (state: AppState) => state.form.results,
  (state: AppState) => state.form.next,
  (forms, results, next) => ({
    forms: results
      .map((result) => {
        const form = forms[result];
        const status = FormStatus[form.status];
        return {
          ...forms[result],
          status,
          created: form.created && DateTime.fromISO(form.created),
          // Submitted can be set for draft forms if it was returned to draft.
          submitted: status !== FormStatus.draft ? form.submitted && DateTime.fromISO(form.submitted) : undefined,
        };
      })
      .filter((result) => !!result)
      .sort((a, b) => b.created.diff(a.created).as('seconds')),
    next,
  })
);

export const definitionFormsSelector = createSelector(
  formsSelector,
  (_, definitionId: string) => definitionId,
  ({ forms, next }, definitionId) => ({
    forms: forms.filter((form) => !definitionId || form.definition?.id === definitionId),
    next,
  })
);

export const formSelector = createSelector(
  definitionSelector,
  (state: AppState) => state.form.form,
  // Include optional formId parameter to avoid flash of incorrect form when switching between forms.
  (_: AppState, formId?: string) => formId,
  ({ definition }, form, formId) =>
    definition && form && definition?.id === form?.definition.id && (!formId || form.id === formId)
      ? {
          ...form,
          status: FormStatus[form.status],
          created: form.created && DateTime.fromISO(form.created),
          submitted:
            FormStatus[form.status] !== FormStatus.draft
              ? form.submitted && DateTime.fromISO(form.submitted)
              : undefined,
        }
      : null
);

export const defaultUserFormSelector = createSelector(
  formsSelector,
  (state: AppState) => state.form.initialized.forms,
  ({ forms }, initialized) => {
    let form: ReturnType<typeof formsSelector>['forms'][0];
    if (forms.length === 1) {
      // If user only has one form, then that's the default form.
      form = forms[0];
    } else if (forms.length > 1) {
      // If user only has one draft form, then that's the default form.
      const draftForms = forms.filter(({ status }) => status === 'draft');
      if (draftForms.length === 1) {
        form = draftForms[0];
      }
    }
    return {
      form,
      initialized,
      // If there are multiple forms but none is the default, then it's ambiguous.
      ambiguous: forms.length > 0 && !form,
    };
  }
);

export const dataSelector = (state: AppState) => state.form.data;
export const filesSelector = (state: AppState) => state.form.files;
export const configSelector = (state: AppState) => state.form.config;

export const isApplicantSelector = createSelector(
  definitionSelector,
  (state: AppState) => state.user.user,
  ({ definition }, user) => !!(user && definition?.applicantRoles.find((r) => user.roles.includes(r)))
);

export const isClerkSelector = createSelector(
  definitionSelector,
  (state: AppState) => state.user.user,
  ({ definition }, user) => !!(user && definition?.clerkRoles.find((r) => user.roles.includes(r)))
);

export const busySelector = (state: AppState) => state.form.busy;

export const canCreateDraftSelector = createSelector(
  isApplicantSelector,
  definitionSelector,
  defaultUserFormSelector,
  (isApplicant, { definition }, { form }) => isApplicant && (definition?.oneFormPerApplicant === false || !form)
);

export const showSubmitSelector = createSelector(definitionSelector, ({ definition }) => {
  // Stepper variant of the categorization includes a Submit button on the review step, so don't show submit outside form.
  // Pages variant of the categorization includes a save or submit button after each step, so don't show submit outside form.

  return (
    definition?.uiSchema?.type !== 'Categorization' &&
    definition?.uiSchema?.options?.variant !== 'stepper' &&
    definition?.uiSchema?.options?.variant !== 'pages'
  );
});

export const canSubmitSelector = createSelector(
  (state: AppState) => state.form.errors,
  (state: AppState) => state.form.busy.saving,
  (state: AppState) => state.form.busy.submitting,
  (errors, saving, submitting) => !errors?.length && !saving && !submitting
);

export type FormDefinition = ReturnType<typeof definitionSelector>['definition'];
export type Form = ReturnType<typeof formSelector>;
