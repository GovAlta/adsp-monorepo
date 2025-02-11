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

    const { baseElement } = render(
      <Provider store={store}>
        <TenantIdp />
      </Provider>
    );

    const emailInput = await baseElement.querySelector("goa-input[testId='user-search-email-input']");
    const emailSearchBtn = await baseElement.querySelector("goa-button[testId='user-search-email-btn']");

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

    const { queryByTestId, baseElement } = render(
      <Provider store={store}>
        <TenantIdp />
      </Provider>
    );
    const emailInput = await baseElement.querySelector("goa-input[testId='user-search-email-input']");
    const emailSearchBtn = baseElement.querySelector("goa-button[testId='user-search-email-btn']");
    await fireEvent(emailInput, new CustomEvent('_change', { detail: { value: 'mock-test@gov.ab.ca' } }));
    await fireEvent.click(emailSearchBtn);
  });
});
