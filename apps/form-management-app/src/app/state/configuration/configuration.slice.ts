import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { AppState } from '../store';
import axios from 'axios';
import { RegisterConfigData } from '@abgov/jsonforms-components';
import { CONFIGURATION_SERVICE_ID } from '../types';
import { getAccessToken } from '../user';

export type SchemaType = unknown;
export type Service = string;

export interface ConfigurationDefinitionState {
  tenantConfigDefinitions: RegisterConfigData[] | null;
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
    const { config, configuration, user } = getState() as AppState;
    const nonAnonymous: string[] = [];
    const configurationService = config.directory[CONFIGURATION_SERVICE_ID];
    const token = await getAccessToken();

    const tenantConfigs = Object.entries(configuration.tenantConfigDefinitions || []);
    const registerConfigs =
      tenantConfigs
        // eslint-disable-next-line
        .filter(([name, config]) => {
          // eslint-disable-next-line
          const _c = config as any;
          return (
            _c?.configurationSchema?.type === 'array' &&
            (_c?.configurationSchema?.items?.type === 'string' || _c?.configurationSchema?.items?.type === 'object')
          );
        })
        // eslint-disable-next-line
        .map(([name, config]) => name) || [];
    const dataListObject = tenantConfigs
    // eslint-disable-next-line
      .filter(([name, config]) => {
        // eslint-disable-next-line
        const _c = config as any;
        return (
          _c?.configurationSchema?.type === 'array' &&
          (_c?.configurationSchema?.items?.type === 'string' || _c?.configurationSchema?.items?.type === 'object')
        );
      });

    const registerData: RegisterConfigData[] = [];
    const dataList = dataListObject.map(([name]) => name.replace(':', '/')) || [];

    const anonymousRead =
      dataListObject
        .filter(([name, config]) => {
          // eslint-disable-next-line
          const _c = config as any;

          return _c.anonymousRead !== true;
        })
        .map(([name, config]) => name.replace(':', '/')) || [];
    for (const registerConfig of registerConfigs) {
      try {
        const [namespace, service] = registerConfig.split(':');
        const url = `${configurationService}/configuration/v2/configuration/${namespace}/${service}/active`;
        const {data} = await axios.get(url, {
          params: { orLatest: true, tenant: user.tenant.id },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data?.configuration && data?.configuration) {
          registerData.push({
            urn: `urn:ads:platform:configuration:v2:/configuration/${namespace}/${service}`,
            data: data?.configuration,
          });
        }
      } catch (error) {
        console.warn(`Error in fetching the register data from service: ${registerConfig}`);
      }
    }

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


export const getConfigurationDefinitions = createAsyncThunk<
  {
    tenant: RegisterConfigData[];
  },
  void,
  { state: AppState }
>('configuration/getConfigurationDefinitions', async (_, { getState, rejectWithValue }) => {
  try {
    const { config } = getState() as AppState;
    let tenant: RegisterConfigData[] = [];

    const configurationService = config.directory[CONFIGURATION_SERVICE_ID];
    const token = await getAccessToken();
  
    const {data} = await axios.get(`${configurationService}/configuration/v2/configuration/platform/configuration-service`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      tenant: data?.latest?.configuration
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.warn(`Error fetching register data: ${err}`);
    return rejectWithValue(err?.message || 'Unknown error');
  }
});

const initialConfigurationState: ConfigurationDefinitionState = {
  tenantConfigDefinitions: null,
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
      })
      .addCase(getConfigurationDefinitions.pending, (state) => {
        state.loadingRegisterData = true;
        state.errorRegisterData = null;
      })
      .addCase(getConfigurationDefinitions.fulfilled, (state, { payload }) => {
        const { tenant } = payload;

        state.tenantConfigDefinitions = tenant;
        state.loadingRegisterData = false;
      })
      .addCase(getConfigurationDefinitions.rejected, (state, action) => {
        state.loadingRegisterData = false;
        state.errorRegisterData = (action.payload as string) || action.error.message || 'Unknown error';
      });
  },
});

export const configurationReducer = configurationSlice.reducer;

export default configurationSlice.reducer;
