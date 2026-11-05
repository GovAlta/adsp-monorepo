import { Dispatch } from '@reduxjs/toolkit';
import { getKeycloakClient } from '../session/keycloak';
import { sessionExpired } from '../session/slice';

// Named and placed to match the tenant admin app, so the moved planner code keeps its imports.
export const getAccessToken =
  () =>
  async (dispatch: Dispatch): Promise<string | undefined> => {
    const client = getKeycloakClient();
    try {
      await client?.updateToken(60);
      return client?.token;
    } catch {
      dispatch(sessionExpired());
      return undefined;
    }
  };
