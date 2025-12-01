import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { AppState } from '../store';
import { RegisterConfigData } from '@abgov/jsonforms-components';

export interface ConfigurationDefinitionState {
  registerData: RegisterConfigData[];
  dataList: string[];
  anonymousRead: string[];
  nonAnonymous: string[];

  loadingRegisterData: boolean;
  errorRegisterData: string | null;
}

export const CONFIGURATION_FEATURE_KEY = 'configuration';

export const fetchRegisterData = createAsyncThunk<
  {
    registerData: RegisterConfigData[];
    dataList: string[];
    anonymousRead: string[];
    nonAnonymous: string[];
  },
  void,
  { state: AppState }
>('configuration/fetchRegisterData', async (_, { getState, rejectWithValue }) => {
  try {
    const registerData: RegisterConfigData[] = [];
    const dataList: string[] = [];
    const anonymousRead: string[] = [];
    const nonAnonymous: string[] = [];

    return {
      registerData,
      dataList,
      anonymousRead,
      nonAnonymous,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.warn(`Error fetching register data: ${err}`);
    return rejectWithValue(err?.message || 'Unknown error');
  }
});

const initialConfigurationState: ConfigurationDefinitionState = {
  registerData: [],
  dataList: [],
  anonymousRead: [],
  nonAnonymous: [],

  loadingRegisterData: false,
  errorRegisterData: null,
};

export const configurationSlice = createSlice({
  name: CONFIGURATION_FEATURE_KEY,
  initialState: initialConfigurationState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRegisterData.pending, (state) => {
        state.loadingRegisterData = true;
        state.errorRegisterData = null;
      })
      .addCase(fetchRegisterData.fulfilled, (state, { payload }) => {
        const { registerData, dataList, anonymousRead, nonAnonymous } = payload;

        state.registerData = registerData;
        state.dataList = dataList;
        state.anonymousRead = anonymousRead;
        state.nonAnonymous = nonAnonymous;

        state.loadingRegisterData = false;
      })
      .addCase(fetchRegisterData.rejected, (state, action) => {
        state.loadingRegisterData = false;
        state.errorRegisterData = (action.payload as string) || action.error.message || 'Unknown error';
      });
  },
});

export const configurationReducer = configurationSlice.reducer;

export default configurationSlice.reducer;
