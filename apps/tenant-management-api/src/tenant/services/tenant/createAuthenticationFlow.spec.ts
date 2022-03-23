import axios from 'axios';
import { createAuthenticationFlow, FLOW_ALIAS } from './createAuthenticationFlow';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';

jest.mock('axios');
jest.mock('../../../keycloak');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('createAuthenticationFlow', () => {
  it('can create authentication flow', async () => {
    const realm = 'my-realm';
    const keycloakClientMock = {
      accessToken: '123',
      authenticationManagement: {
        createFlow: jest.fn(),
      },
    };
    axiosMock.get.mockResolvedValueOnce({ data: [{ id: 'execution-123' }] });
    await createAuthenticationFlow(keycloakClientMock as unknown as KeycloakAdminClient, realm);
    expect(keycloakClientMock.authenticationManagement.createFlow).toHaveBeenCalledWith(
      expect.objectContaining({ realm, alias: FLOW_ALIAS, topLevel: true, builtIn: false })
    );
    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.put).toHaveBeenCalledTimes(1);
  });
});
