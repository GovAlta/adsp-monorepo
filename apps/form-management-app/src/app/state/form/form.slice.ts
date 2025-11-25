import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { AppState } from '../store';
import { FormDefinition, FORM_SERVICE_ID } from '../types';
import { getAccessToken } from '../user/user.slice';

export const FORM_FEATURE_KEY = 'form';

export interface FormState {
  definitions: FormDefinition[];
  loading: boolean;
}

export const initialFormState: FormState = {
  definitions: [],
  loading: false,
};

export const getFormDefinitions = createAsyncThunk('form/get-definitions', async (_, { getState, rejectWithValue }) => {
  try {
    const { config } = getState() as AppState;
    const formServiceUrl = config.directory[FORM_SERVICE_ID];
    const accessToken = await getAccessToken();

    const { data } = await axios.get<{ results: FormDefinition[] }>(
      new URL('/form/v1/definitions', formServiceUrl).href,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    return data.results;
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

const formSlice = createSlice({
  name: FORM_FEATURE_KEY,
  initialState: initialFormState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getFormDefinitions.pending, (state) => {
        state.loading = true;
      })
      .addCase(getFormDefinitions.fulfilled, (state, { payload }) => {
        state.definitions = payload;
        state.loading = false;
      })
      .addCase(getFormDefinitions.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const formReducer = formSlice.reducer;
