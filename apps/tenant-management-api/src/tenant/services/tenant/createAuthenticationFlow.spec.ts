import axios from 'axios';
import { createAuthenticationFlow, FLOW_ALIAS } from './createAuthenticationFlow';
import * as keycloak from '../../../keycloak';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';

jest.mock('axios');
jest.mock('../../../keycloak');
const axiosMock = axios as jest.Mocked<typeof axios>;
const keycloakMock = keycloak as jest.Mocked<typeof keycloak>;

describe('createAuthenticationFlow', () => {
  it('can create authentication flow', async () => {
    const realm = 'my-realm';
    const keycloakClientMock = {
      accessToken: '123',
      authenticationManagement: {
        createFlow: jest.fn(),
      },
    };
    keycloakMock.createkcAdminClient.mockResolvedValue(keycloakClientMock as unknown as KeycloakAdminClient);
    axiosMock.get.mockResolvedValueOnce({ data: [{ id: 'execution-123' }] });
    await createAuthenticationFlow(realm);
    expect(keycloakClientMock.authenticationManagement.createFlow).toHaveBeenCalledWith(
      expect.objectContaining({ realm, alias: FLOW_ALIAS, topLevel: true, builtIn: false })
    );
    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.put).toHaveBeenCalledTimes(1);
  });
});
