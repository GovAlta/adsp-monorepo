import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { AppState } from '../store';
import { RegisterConfigData } from '@abgov/jsonforms-components';
import { getAccessToken } from '../user/user.slice';
import { CONFIGURATION_SERVICE_ID } from '../types';
import { useSelector } from 'react-redux';

export interface ConfigurationDefinitionState {
  registerData: RegisterConfigData[];
  dataList: string[];
  anonymousRead: string[];
  nonAnonymous: string[];

  loadingRegisterData: boolean;
  errorRegisterData: string | null;
}

export const CONFIGURATION_FEATURE_KEY = "configuration";

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
    const { config, user, configuration } = getState() as AppState;
    const configBaseUrl = useSelector((state: AppState) => config.directory[CONFIGURATION_SERVICE_ID]);
    const tenantId = user.tenant.id;

    // const tenantConfigDefinition = configuration?.tenantConfigDefinitions?.configuration || {};

    // // FIX: access token must come from state, not an async function
    // const token = await getAccessToken();

    // const tenantConfigs = Object.entries(tenantConfigDefinition);

    // // Filter array-based definitions
    // const dataListObject = tenantConfigs.filter(([_, config]) => {
    //   const _c: any = config;
    //   return (
    //     _c?.configurationSchema?.type === "array" &&
    //     (_c?.configurationSchema?.items?.type === "string" ||
    //       _c?.configurationSchema?.items?.type === "object")
    //   );
    // });

    // const registerConfigs = dataListObject.map(([name]) => name);
    // const dataList = registerConfigs.map((name) => name.replace(":", "/"));

    // const anonymousRead = dataListObject
    //   .filter(([_, config]) => {
    //     const _c: any = config;
    //     return _c.anonymousRead !== true;
    //   })
    //   .map(([name]) => name.replace(":", "/"));

    // // nonAnonymous = everything not in anonymousRead
    // const nonAnonymous = dataList.filter(
    //   (item) => !anonymousRead.includes(item)
    // );

    // const registerData: RegisterConfigData[] = [];

    // // Fetch data for each register config
    // for (const registerConfig of registerConfigs) {
    //   try {
    //     const [namespace, service] = registerConfig.split(":");
    //     const url = `${configBaseUrl}/configuration/v2/configuration/${namespace}/${service}/active`;

    //     const { data } = await axios.get(url, {
    //       params: { orLatest: true, tenant: tenantId },
    //       headers: { Authorization: `Bearer ${token}` },
    //     });

    //     if (data?.configuration) {
    //       registerData.push({
    //         urn: `urn:ads:platform:configuration:v2:/configuration/${namespace}/${service}`,
    //         data: data.configuration,
    //       });
    //     }
    //   } catch (err) {
    //     console.warn(
    //       `Error fetching register data from service: ${registerConfig}`
    //     );
    //   }
    // }

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
  } catch (err: any) {
    console.warn(`Error fetching register data: ${err}`);
    return rejectWithValue(err?.message || "Unknown error");
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
        state.errorRegisterData =
          (action.payload as string) || action.error.message || "Unknown error";
      });
  },
});

export const configurationReducer = configurationSlice.reducer;

export default configurationSlice.reducer;
