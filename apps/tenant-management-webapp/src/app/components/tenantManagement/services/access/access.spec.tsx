import React from 'react';
import { Provider } from 'react-redux';
import { stubConfig } from '../../../../utils/useConfig';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor } from '../../../../store/store';
import configureStore from 'redux-mock-store';
import { render, waitFor } from '@testing-library/react';

import { configActions } from '../../../../store/actions';
import {
  CONFIG_SET_KEYCLOAK,
  Keycloak,
  KeyCloakAction,
} from '../../../../store/actions/config';

import AccessPage from './access';

describe('Access Page', () => {
  const keycloakBaseUrl = 'https://somedomain.mock';
  const mockKeycloak: Keycloak = {
    realm: 'mock-realm',
    clientId: '99',
    url: 'https://foo.bar',
  };

  const mockStore = configureStore([]);

  beforeAll(() => {
    stubConfig({
      keycloakUrl: keycloakBaseUrl,
    });
  });

  it('uses the keycloak realm within the store config', async () => {
    const store = mockStore({
      config: {
        keycloak: mockKeycloak,
      },
    });

    const { queryByTitle } = render(
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <AccessPage />
        </PersistGate>
      </Provider>
    );

    await waitFor(() => {
      const link = queryByTitle('Keycloak Admin');
      expect(link).not.toBeNull();
      expect(link.getAttribute('href')).toEqual(
        `${keycloakBaseUrl}/auth/admin/${mockKeycloak.realm}/console`
      );
    });
  });

  it('updates the keycloak realm config', async () => {
    const store = mockStore({
      config: {
        keycloak: {
          realm: 'some init realm',
        },
      },
    });

    store.dispatch(configActions.setKeycloak(mockKeycloak));

    const actions: KeyCloakAction[] = store.getActions();
    expect(actions).toEqual([
      {
        type: CONFIG_SET_KEYCLOAK,
        payload: mockKeycloak,
      } as KeyCloakAction,
    ]);
  });
});
