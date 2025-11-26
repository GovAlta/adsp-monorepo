import { createAsyncThunk, createSlice, createSelector } from '@reduxjs/toolkit';
import axios from 'axios';
import { DateTime } from 'luxon';
import { AppState } from '../store';
import { FormDefinition, FormSubmission, PagedResults, FORM_SERVICE_ID, CONFIGURATION_SERVICE_ID } from '../types';
import { getAccessToken } from '../user/user.slice';

export const FORM_FEATURE_KEY = 'form';

interface FormSubmissionCriteria {
  definitionId?: string;
  dispositionStates?: string[];
  createdAfter?: string;
  createdBefore?: string;
}

export interface FormState {
  definitions: Record<string, FormDefinition>;
  submissions: Record<string, FormSubmission>;
  results: {
    definitions: string[];
    submissions: string[];
  };
  selectedDefinition?: string;
  selectedSubmission?: string;
  next: {
    definitions?: string;
    submissions?: string;
  };
  submissionCriteria: FormSubmissionCriteria;
  loading: {
    definitions: boolean;
    submissions: boolean;
  };
}

export const initialFormState: FormState = {
  definitions: {},
  submissions: {},
  results: {
    definitions: [],
    submissions: [],
  },
  next: {},
  submissionCriteria: {},
  loading: {
    definitions: false,
    submissions: false,
  },
};

export const getFormDefinitions = createAsyncThunk(
  'form/get-definitions',
  async (params: { after?: string } = {}, { getState, rejectWithValue }) => {
    try {
      const { config } = getState() as AppState;
      const formServiceUrl = config.directory[FORM_SERVICE_ID];
      const accessToken = await getAccessToken();

      const { data } = await axios.get<PagedResults<FormDefinition>>(
        new URL('/form/v1/definitions', formServiceUrl).href,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { top: 50, after: params?.after },
        }
      );

      return {
        ...data,
        results:
          data.results?.map((result) => ({
            ...result,
            oneFormPerApplicant: typeof result.oneFormPerApplicant !== 'boolean' || result.oneFormPerApplicant,
            urn: `${CONFIGURATION_SERVICE_ID}:v2:/configuration/form-service/${result.id}`,
          })) || [],
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

export const getFormSubmissions = createAsyncThunk(
  'form/get-submissions',
  async (
    params: {
      definitionId: string;
      after?: string;
      criteria?: FormSubmissionCriteria;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const { config } = getState() as AppState;
      const formServiceUrl = config.directory[FORM_SERVICE_ID];
      const accessToken = await getAccessToken();

      const { data } = await axios.get<PagedResults<FormSubmission>>(
        new URL('/form/v1/submissions', formServiceUrl).href,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            top: 20,
            after: params.after,
            criteria: JSON.stringify({
              ...params.criteria,
              definitionIdEquals: params.definitionId,
            }),
          },
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

export const getFormSubmission = createAsyncThunk(
  'form/get-submission',
  async (submissionId: string, { getState, rejectWithValue }) => {
    try {
      const { config } = getState() as AppState;
      const formServiceUrl = config.directory[FORM_SERVICE_ID];
      const accessToken = await getAccessToken();

      const { data } = await axios.get<FormSubmission>(
        new URL(`/form/v1/submissions/${submissionId}`, formServiceUrl).href,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
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

export const selectDefinition = createAsyncThunk('form/select-definition', (definitionId: string, { dispatch }) => {
  dispatch(formActions.setSelectedDefinition(definitionId));
  dispatch(getFormSubmissions({ definitionId }));
  return definitionId;
});

export const selectSubmission = createAsyncThunk('form/select-submission', (submissionId: string, { dispatch }) => {
  dispatch(formActions.setSelectedSubmission(submissionId));
  dispatch(getFormSubmission(submissionId));
  return submissionId;
});

const formSlice = createSlice({
  name: FORM_FEATURE_KEY,
  initialState: initialFormState,
  reducers: {
    setSelectedDefinition: (state, { payload }: { payload: string }) => {
      if (state.selectedDefinition !== payload) {
        state.results.submissions = [];
        state.next.submissions = undefined;
      }
      state.selectedDefinition = payload;
    },
    setSelectedSubmission: (state, { payload }: { payload: string }) => {
      state.selectedSubmission = payload;
    },
    setSubmissionCriteria: (state, { payload }: { payload: FormSubmissionCriteria }) => {
      state.submissionCriteria = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getFormDefinitions.pending, (state) => {
        state.loading.definitions = true;
      })
      .addCase(getFormDefinitions.fulfilled, (state, { payload }) => {
        state.loading.definitions = false;
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
      .addCase(getFormDefinitions.rejected, (state) => {
        state.loading.definitions = false;
      })
      .addCase(getFormSubmissions.pending, (state) => {
        state.loading.submissions = true;
      })
      .addCase(getFormSubmissions.fulfilled, (state, { payload }) => {
        state.loading.submissions = false;
        state.submissions = payload.results.reduce(
          (submissions, submission) => ({ ...submissions, [submission.id]: submission }),
          state.submissions as Record<string, FormSubmission>
        );
        state.results.submissions = [
          ...(payload.page.after ? state.results.submissions : []),
          ...payload.results.map((result) => result.id),
        ];
        state.next.submissions = payload.page.next;
      })
      .addCase(getFormSubmissions.rejected, (state) => {
        state.loading.submissions = false;
      })
      .addCase(getFormSubmission.fulfilled, (state, { payload }) => {
        state.submissions[payload.id] = payload;
      })
      .addCase(selectDefinition.fulfilled, (state, { payload }) => {
        state.selectedDefinition = payload;
      })
      .addCase(selectSubmission.fulfilled, (state, { payload }) => {
        state.selectedSubmission = payload;
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

export const selectedDefinitionSelector = createSelector(
  (state: AppState) => state.form.definitions,
  (state: AppState) => state.form.selectedDefinition,
  (definitions, selectedId) => {
    return selectedId ? definitions[selectedId] : undefined;
  }
);

export const submissionsSelector = createSelector(
  (state: AppState) => state.form.submissions,
  (state: AppState) => state.form.results.submissions,
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

export const selectedSubmissionSelector = createSelector(
  (state: AppState) => state.form.submissions,
  (state: AppState) => state.form.selectedSubmission,
  (submissions, selectedId) => {
    return selectedId ? submissions[selectedId] : undefined;
  }
);

export const formLoadingSelector = (state: AppState) => state.form.loading;
export const submissionCriteriaSelector = (state: AppState) => state.form.submissionCriteria;
