import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { getAccessToken } from '../user/user.slice';
import { AppState } from '../store';
export const KEYCLOAK_FEATURE_KEY = 'keycloak';

export interface KeycloakState {
  keycloakRoles?: ServiceRoleConfig;
  realmRoles: any[];
  loadingKeycloakRoles: boolean;
  loadingRealmRoles: boolean;
}

export interface KeycloakClientRole {
  name: string;
  description: string;
  isComposite?: boolean;
}

export interface ConfigServiceRole {
  roles?: ServiceRoles;

}

export type ServiceRoles = ServiceRole[];

export type ServiceRoleConfig = Record<string, ConfigServiceRole>;

export interface ServiceRole {
  role: string;
  description: string;
  inTenantAdmin?: boolean;
}

function KeycloakRoleToServiceRole(kcRoles: KeycloakClientRole[]): ServiceRole[] {
  return kcRoles.map((role) => {
    return {
      role: role.name,
      description: role.description,
    };
  });
}

export const fetchKeycloakServiceRoles = createAsyncThunk(
  'keycloak/fetchKeycloakServiceRoles',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const { config, user } = getState() as AppState;

      const token = await getAccessToken();
    
      const keycloakurl = `${config?.environment?.access?.url}`;

      const defaultRealmClients = ['broker', 'realm-management', 'account'];
      const keycloakIdMap: Record<string, string> = {};

      const { data } = await axios.get(`${keycloakurl}/auth/admin/realms/${user.tenant.realm}/clients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

       

      const keycloakRoles: Record<string, { roles: any }> = {};
      const keycloakRoleIds: string[] = [];
      const keycloakRoleNames: string[] = [];

      data
        .filter((c) => {
          return !defaultRealmClients.includes(c.clientId);
        })
        .forEach((c) => {
          keycloakRoleNames.push(c.clientId);
          keycloakRoleIds.push(c.id);
          keycloakIdMap[c.clientId] = c.id;
        });

      


       console.time('transform roles x');


      const rolePromises = keycloakRoleIds.map((id) => {
        const url = `${keycloakurl}/auth/admin/realms/${user.tenant.realm}/clients/${id}/roles`;
      
        return axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
      });
        console.timeEnd('transform roles x');

      const roleResponses = await Promise.all(rolePromises);

      console.time('transform roles');
      console.log("Current time (ms):" + Date.now())

      roleResponses.forEach(async (response, index) => {
      
        keycloakRoles[keycloakRoleNames[index]] = {
          roles: KeycloakRoleToServiceRole(response.data),
        };
      });

      // for (let i = 0; i < roleResponses.length; i++) {
      //   await new Promise(requestAnimationFrame);

      //   keycloakRoles[keycloakRoleNames[i]] = {
      //     roles: KeycloakRoleToServiceRole(roleResponses[i].data),
      //   };
      // }

      console.timeEnd('transform roles');
      console.log("Current time 2 (ms):" + Date.now())


      return {
          keycloak: keycloakRoles,
          keycloakIdMap,
        };
    } catch (err) {
      if (axios.isAxiosError(err)) {
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
  }
);

export const fetchRoles = createAsyncThunk(
  'keycloak/fetch-roles',
  async (_, { getState, dispatch, rejectWithValue }) => {

    try {
      const { config, user } = getState() as AppState;

    
  
      const token = await getAccessToken();
      const keycloakurl = `${config?.environment?.access?.url}`;


   
      const { data } = await axios.get(
        `${keycloakurl}/auth/admin/realms/${user.tenant.realm}/roles`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

         console.log("Current time 4 (ms):" + Date.now())


      return data

      
    } catch (err) {
    if (axios.isAxiosError(err)) {
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
  }
);



const initialKeycloakState: KeycloakState = {
  keycloakRoles: {},
  realmRoles: [],
  loadingRealmRoles: false,
  loadingKeycloakRoles: false,
};

const accessSlice = createSlice({
  name: KEYCLOAK_FEATURE_KEY,
  initialState: initialKeycloakState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchKeycloakServiceRoles.fulfilled, (state, { payload }) => {
      state.keycloakRoles = payload?.keycloak;
      state.loadingKeycloakRoles = false;

       console.log("Current time 3 (ms):" + Date.now())

    })
    .addCase(fetchRoles.fulfilled, (state, { payload }) => {
      state.realmRoles = payload;
        state.loadingRealmRoles = false;

               console.log("Current time 5 (ms):" + Date.now())
    })
    .addCase(fetchKeycloakServiceRoles.pending, (state, { payload }) => {
      state.loadingKeycloakRoles = true;
    })
    .addCase(fetchKeycloakServiceRoles.rejected, (state, { payload }) => {
      state.loadingKeycloakRoles = false;
    })
    .addCase(fetchRoles.pending, (state, { payload }) => {
      state.loadingRealmRoles = true;
    })
    .addCase(fetchRoles.rejected, (state, { payload }) => {
      state.loadingRealmRoles = false;
    })
  },
});

export const keycloakReducer = accessSlice.reducer;
export const keycloakActions = accessSlice.actions;
