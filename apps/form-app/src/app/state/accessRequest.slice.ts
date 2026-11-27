import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { AppState } from './store';
import { getAccessToken, UserState } from './user.slice';

export const ACCESS_REQUEST_FEATURE_KEY = 'accessRequest';

const FORM_SERVICE_ID = 'urn:ads:platform:form-service';

// The questions a user answers to request access to a form they can't open.
export interface AccessRequestForm {
  definitionId: string;
  name: string;
  dataSchema?: JsonSchema;
  uiSchema?: UISchemaElement;
}

export type AccessRequestStatus = 'pending' | 'approved' | 'denied';

export interface AccessRequest {
  id: string;
  status: AccessRequestStatus;
  submittedAt: string;
}

export interface AccessRequestState {
  // By form definition ID; null when the form doesn't accept access requests from the user.
  forms: Record<string, AccessRequestForm | null>;
  // The user's latest request, by form definition ID.
  requests: Record<string, AccessRequest | null>;
  busy: {
    loading: boolean;
    submitting: boolean;
  };
  submitError: string | null;
}

const initialAccessRequestState: AccessRequestState = {
  forms: {},
  requests: {},
  busy: {
    loading: false,
    submitting: false,
  },
  submitError: null,
};

const accessRequestsUrl = (state: AppState, definitionId: string, path = '') =>
  new URL(
    `/form/v1/definitions/${encodeURIComponent(definitionId)}/access-requests${path}`,
    state.config.directory[FORM_SERVICE_ID],
  ).href;

const isStatus = (err: unknown, ...statuses: number[]) =>
  axios.isAxiosError(err) && statuses.includes(err.response?.status);

async function findOwnRequest(state: AppState, definitionId: string, token: string): Promise<AccessRequest | null> {
  const email = state.user.user?.email;
  if (!email) {
    return null;
  }

  try {
    const { data } = await axios.get<AccessRequest>(
      accessRequestsUrl(state, definitionId, `/${encodeURIComponent(email)}`),
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return data;
  } catch (err) {
    if (isStatus(err, 404)) {
      return null;
    }
    throw err;
  }
}

// Keycloak accounts without given and family names still have a display name to split.
export function toApplicantName(user: UserState['user']): { firstName: string; lastName: string } {
  const [first = '', ...rest] = (user?.name || '').trim().split(/\s+/);
  return {
    firstName: user?.firstName || first,
    lastName: user?.lastName || rest.join(' '),
  };
}

export const loadAccessRequest = createAsyncThunk(
  'access-request/load',
  async (definitionId: string, { getState, rejectWithValue }) => {
    const state = getState() as AppState;
    try {
      const token = await getAccessToken();
      const { data: form } = await axios.get<AccessRequestForm>(
        new URL(
          `/form/v1/definitions/${encodeURIComponent(definitionId)}/registration`,
          state.config.directory[FORM_SERVICE_ID],
        ).href,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const request = await findOwnRequest(state, definitionId, token);
      return { form, request };
    } catch (err) {
      // 403: the user can't request access; 404: the form doesn't exist or doesn't accept access requests.
      if (isStatus(err, 403, 404)) {
        return { form: null, request: null };
      }
      if (axios.isAxiosError(err)) {
        return rejectWithValue({
          status: err.response?.status,
          message: err.response?.data?.errorMessage || err.message,
        });
      }
      throw err;
    }
  },
);

// Errors are returned rather than rejected: the page shows them next to the answers, instead of the app's banner.
export const submitAccessRequest = createAsyncThunk(
  'access-request/submit',
  async (
    { definitionId, data }: { definitionId: string; data: Record<string, unknown> },
    { getState },
  ): Promise<{ request?: AccessRequest; error?: string }> => {
    const state = getState() as AppState;
    const token = await getAccessToken();
    try {
      const { data: request } = await axios.post<AccessRequest>(
        accessRequestsUrl(state, definitionId),
        { ...toApplicantName(state.user.user), email: state.user.user?.email, data },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return { request };
    } catch (err) {
      // A pending request already exists, for example one submitted from another tab.
      if (isStatus(err, 409)) {
        const request = await findOwnRequest(state, definitionId, token).catch(() => null);
        if (request) {
          return { request };
        }
      }
      return {
        error: (axios.isAxiosError(err) && err.response?.data?.errorMessage) || (err as Error).message,
      };
    }
  },
  {
    condition: (_, { getState }) => !(getState() as AppState).accessRequest.busy.submitting,
  },
);

const accessRequestSlice = createSlice({
  name: ACCESS_REQUEST_FEATURE_KEY,
  initialState: initialAccessRequestState,
  reducers: {
    clearSubmitError: (state) => {
      state.submitError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAccessRequest.pending, (state) => {
        state.busy.loading = true;
      })
      .addCase(loadAccessRequest.fulfilled, (state, { payload, meta }) => {
        state.busy.loading = false;
        state.forms[meta.arg] = payload.form;
        state.requests[meta.arg] = payload.request;
      })
      .addCase(loadAccessRequest.rejected, (state, { meta }) => {
        state.busy.loading = false;
        state.forms[meta.arg] = null;
      })
      .addCase(submitAccessRequest.pending, (state) => {
        state.busy.submitting = true;
        state.submitError = null;
      })
      .addCase(submitAccessRequest.fulfilled, (state, { payload, meta }) => {
        state.busy.submitting = false;
        if (payload.request) {
          state.requests[meta.arg.definitionId] = payload.request;
        } else {
          state.submitError = payload.error;
        }
      })
      .addCase(submitAccessRequest.rejected, (state, { error }) => {
        state.busy.submitting = false;
        state.submitError = error.message;
      });
  },
});

export const accessRequestReducer = accessRequestSlice.reducer;
export const accessRequestActions = accessRequestSlice.actions;

export const accessRequestSelector = createSelector(
  (state: AppState) => state.accessRequest,
  (_: AppState, definitionId: string) => definitionId,
  ({ forms, requests, busy, submitError }, definitionId) => ({
    initialized: forms[definitionId] !== undefined,
    form: forms[definitionId] || null,
    request: requests[definitionId] || null,
    submitting: busy.submitting,
    submitError,
  }),
);
