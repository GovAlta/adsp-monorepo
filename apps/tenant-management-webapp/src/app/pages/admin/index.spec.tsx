import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import TenantManagement from './index';
import { HeaderCtx } from '@lib/headerContext';

const mockStore = configureStore([]);

const storeWith = (featureFlags: Record<string, boolean>) =>
  mockStore({
    config: { serviceUrls: {}, featureFlags, keycloakApi: {} },
    tenant: { name: 'test-tenant' },
    session: {
      authenticated: true,
      realm: 'test',
      resourceAccess: { 'urn:ads:platform:tenant-service': { roles: ['tenant-admin'] } },
    },
  });

const renderAt = (path: string, featureFlags: Record<string, boolean>) =>
  render(
    <Provider store={storeWith(featureFlags)}>
      <HeaderCtx.Provider value={{ setTitle: jest.fn() }}>
        <MemoryRouter initialEntries={[path]}>
          <TenantManagement />
        </MemoryRouter>
      </HeaderCtx.Provider>
    </Provider>,
  );

describe('TenantManagement routing', () => {
  it('routes to the secret service overview when the flag is on', () => {
    const { getByTestId } = renderAt('/services/secret', { Secret: true });

    expect(getByTestId('secret-title')).toHaveTextContent('Secret service');
  });

  it('does not register the secret route when the flag is off', () => {
    const { queryByTestId } = renderAt('/services/secret', { Secret: false });

    expect(queryByTestId('secret-title')).toBeNull();
  });
});
