import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { render, waitFor } from '@testing-library/react';

import { KeycloakApi } from '@store/config/models';

import AccessPage from './access';

describe('Access Page', () => {
  const mockKeycloak: KeycloakApi = {
    realm: 'mock-realm',
    clientId: '99',
    url: 'https://foo.bar',
  };

  const mockStore = configureStore([]);

  const users = [
    { id: '1', enabled: true, emailVerified: true },
    { id: '2', enabled: true, emailVerified: true },
    { id: '3', enabled: false, emailVerified: false },
  ];

  const roles = {
    '1': { id: '1', name: 'file-service-admin', userIds: ['1', '2', '3'] },
    '2': { id: '2', name: 'admin', userIds: ['1', '2'] },
    '3': { id: '3', name: 'create-realm', userIds: ['1', '3', '4', '5'] },
    '4': { id: '4', name: 'something important', userIds: ['1', '3', '4', '5', '7'] },
    '5': { id: '5', name: 'security', userIds: ['1'] },
    '6': { id: '6', name: 'networking', userIds: ['2'] },
  };

  it('binds the store user and role data', async () => {
    const store = mockStore({
      config: {
        keycloakApi: mockKeycloak,
        tenantApi: { host: 'foo' },
        serviceUrls: { tenantManagementWebApp: 'http://localhost' },
      },
      access: { users: {}, metrics: { users: 3, activeUsers: 2 }, roles },
      user: { jwt: { token: '' } },
      session: {
        realm: 'core',
        indicator: {
          show: false,
          message: 'loading',
        },
      },
    });

    render(
      <Provider store={store}>
        <AccessPage />
      </Provider>
    );

    await waitFor(() => {
      const userCount = document.getElementById('user-count').innerHTML;
      expect(userCount).toBe(`${users.length}`);
      const roleCount = document.getElementById('role-count').innerHTML;
      expect(roleCount).toBe(`${Object.values(roles).length}`);
      const activeUserCount = document.getElementById('active-user-count').innerHTML;
      expect(activeUserCount).toBe('2');

      const roleInfoRows = document.querySelectorAll('#role-information tbody tr');
      expect(roleInfoRows.length).toBe(5);
    });
  });

  it('uses the keycloak realm within the store config', async () => {
    const store = mockStore({
      config: {
        keycloakApi: mockKeycloak,
        tenantApi: { host: 'foo' },
        serviceUrls: { tenantManagementWebApp: 'http://localhost' },
      },
      access: { users: {}, metrics: { users: 3, activeUsers: 2 }, roles },
      user: { jwt: { token: '' } },
      session: {
        realm: 'core',
        indicator: {
          show: false,
          message: 'loading',
        },
      },
    });

    const { queryByText } = render(
      <Provider store={store}>
        <AccessPage />
      </Provider>
    );

    await waitFor(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state: any = store.getState();

      const link = queryByText('Keycloak admin portal');
      expect(link).not.toBeNull();
      expect(link.getAttribute('href')).toEqual(`${mockKeycloak.url}/admin/${state.session.realm}/console`);
    });
  });
});
