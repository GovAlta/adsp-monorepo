import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { render, fireEvent } from '@testing-library/react';
import { TenantIdp } from './TenantIDP';
describe('User IdP tab in the access service', () => {
  const mockStore = configureStore([]);

  it('Can create the tenant idp component', async () => {
    const store = mockStore({
      config: {
        tenantApi: { host: 'foo' },
        serviceUrls: { tenantManagementWebApp: 'http://localhost' },
      },
      user: { jwt: { token: '' } },
      session: {
        realm: 'core',
        indicator: {
          show: false,
          message: 'loading',
        },
        loadingStates: [],
      },
    });

    const { queryByTestId } = render(
      <Provider store={store}>
        <TenantIdp />
      </Provider>
    );

    const emailInput = await queryByTestId('user-search-email-input');
    const emailSearchBtn = await queryByTestId('user-search-email-btn');

    expect(emailInput).toBeTruthy();
    expect(emailSearchBtn).toBeTruthy();
  });

  it('Search user by email', async () => {
    const store = mockStore({
      config: {
        tenantApi: { host: 'foo' },
        serviceUrls: { tenantManagementWebApp: 'http://localhost' },
      },
      user: { jwt: { token: '' } },
      session: {
        realm: 'core',
        indicator: {
          show: false,
          message: 'loading',
        },
        loadingStates: [],
      },
    });

    const { queryByTestId } = render(
      <Provider store={store}>
        <TenantIdp />
      </Provider>
    );
    const emailInput = await queryByTestId('user-search-email-input');
    const emailSearchBtn = await queryByTestId('user-search-email-btn');
    await fireEvent.change(emailInput, { target: { value: 'mock-test@gov.ab.ca' } });
    await fireEvent.click(emailSearchBtn);
  });
});
