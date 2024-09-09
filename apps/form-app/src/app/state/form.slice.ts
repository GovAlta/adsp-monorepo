import { standardV1JsonSchema, commonV1JsonSchema } from '@abgov/data-exchange-standard';
import { RegisterData, tryResolveRefs } from '@abgov/jsonforms-components';
import { JsonFormsCore, JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import * as _ from 'lodash';
import { debounce } from 'lodash';
import { AppState } from './store';
import { hashData } from './util';
import { getAccessToken } from './user.slice';
import { loadTopic, selectTopic } from './comment.slice';
import { loadFileMetadata } from './file.slice';

export const FORM_FEATURE_KEY = 'form';

export interface FormDefinition {
  id: string;
  name: string;
  dataSchema: JsonSchema;
  uiSchema: UISchemaElement;
  applicantRoles: string[];
  clerkRoles: string[];
  registerData?: RegisterData;
  anonymousApply: boolean;
  generatesPdf?: boolean;
}

export interface Form {
  definition: { id: string };
  id: string;
  urn: string;
  status: 'draft' | 'locked' | 'submitted' | 'archived';
  created: Date;
  submitted?: Date;
  submission?: {
    id: string;
    urn: string;
  };
}

interface FormDataResponse {
  id: string;
  data: Record<string, unknown>;
  files: Record<string, string>;
}

type SerializedForm = Omit<Form, 'created' | 'submitted'> & { created: string; submitted?: string };
export type ValidationError = JsonFormsCore['errors'][number];

export interface FormState {
  definitions: Record<string, FormDefinition>;
  selected: string;
  userForm: string;
  form: SerializedForm;
  data: Record<string, unknown>;
  files: Record<string, string>;
  errors: ValidationError[];
  saved: string;
  busy: {
    loading: boolean;
    creating: boolean;
    saving: boolean;
    submitting: boolean;
  };
}

const FORM_SERVICE_ID = 'urn:ads:platform:form-service';
const CONFIGURATION_SERVICE_ID = 'urn:ads:platform:configuration-service:v2';
const CACHE_SERVICE_ID = 'urn:ads:platform:cache-service';

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

      const { data } = await axios.get<FormDefinition>(
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
                params: { tenant: tenantId, orLatest: true },
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
        // Return null instead of showing an error in the notification banner.
        return err.response.status === 403
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

export const findUserForm = createAsyncThunk(
  'form/find-user-form',
  async (definitionId: string, { getState, rejectWithValue }) => {
    try {
      const { config, user } = getState() as AppState;
      const formServiceUrl = config.directory[FORM_SERVICE_ID];

      // If there is no user context, then there is no existing form to find.
      if (!user.user) {
        return { form: null, data: null, files: null, digest: null };
      }

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

      const [form] = results;
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

const SUPPORT_TOPIC_TYPE_ID = 'form-questions';

export const loadForm = createAsyncThunk(
  'form/load-form',
  async (formId: string, { getState, dispatch, rejectWithValue }) => {
    try {
      const { config } = getState() as AppState;
      const formServiceUrl = config.directory[FORM_SERVICE_ID];

      let token = await getAccessToken();
      const { data: form } = await axios.get<SerializedForm>(new URL(`/form/v1/forms/${formId}`, formServiceUrl).href, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
          const propertyId = Object.keys(data.files).find((key) => data.files[key] === fileUrn);
          //Need to map the propertyId/controlId to the actual file meta data
          //otherwise the file upload control wont display properly.
          if (propertyId) {
            dispatch(loadFileMetadata({ propertyId, urn: fileUrn }));
          }
        }
      }

      dispatch(loadTopic({ resourceId: form.urn, typeId: SUPPORT_TOPIC_TYPE_ID })).then(() =>
        dispatch(selectTopic({ resourceId: form.urn }))
      );

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
      const { data } = await axios.post<SerializedForm>(
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

      const { data } = await axios.post<SerializedForm>(`/api/gateway/v1/forms`, {
        token,
        tenant: user.tenant.name,
        definitionId: form.selected,
        data: form.data,
        files: form.files,
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
  userForm: null,
  form: null,
  data: {},
  files: {},
  errors: [],
  saved: null,
  busy: {
    loading: false,
    creating: false,
    saving: false,
    submitting: false,
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
      .addCase(loadDefinition.fulfilled, (state, { payload, meta }) => {
        state.busy.loading = false;
        state.definitions[meta.arg] = payload;

        //Check form definition id case sensitivity, and use the definition id in the payload object,
        //instead of using the value in querystring because if the case is not the same
        //grabbing the object using the form definition id in the querystring as the key wont work.
        if (payload && payload.id?.toLowerCase() === state.selected?.toLowerCase()) {
          state.selected = payload.id;
        }
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
  (definitions, selected) => ({
    definition: selected ? definitions[selected] : null,
    initialized: definitions[selected] !== undefined,
  })
);

export const formSelector = createSelector(
  definitionSelector,
  (state: AppState) => state.form.form,
  ({ definition }, form) =>
    definition && definition?.id === form?.definition.id
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
  ({ definition }, user) => !!(user && definition?.applicantRoles.find((r) => user.roles.includes(r)))
);

export const isClerkSelector = createSelector(
  definitionSelector,
  (state: AppState) => state.user.user,
  ({ definition }, user) => !!(user && definition?.clerkRoles.find((r) => user.roles.includes(r)))
);

export const busySelector = (state: AppState) => state.form.busy;

export const showSubmitSelector = createSelector(definitionSelector, ({ definition }) => {
  // Stepper variant of the categorization includes a Submit button on the review step, so don't show submit outside form.
  return definition?.uiSchema?.type !== 'Categorization' || definition?.uiSchema?.options?.variant !== 'stepper';
});

export const canSubmitSelector = createSelector(
  (state: AppState) => state.form.errors,
  (state: AppState) => state.form.busy.saving,
  (state: AppState) => state.form.busy.submitting,
  (errors, saving, submitting) => !errors?.length && !saving && !submitting
);
