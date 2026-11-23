import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { render, fireEvent } from '@testing-library/react';
import { TenantIdp } from './TenantIDP';
import { FETCH_USER_ID_BY_EMAIL } from '@store/tenant/actions';

describe('User IdP tab in the access service', () => {
  const mockStore = configureStore([]);

  const createStore = (loadingStates = []) =>
    mockStore({
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
        loadingStates,
      },
    });

  it('Can create the tenant idp component', async () => {
    const store = createStore();

    const { baseElement } = render(
      <Provider store={store}>
        <TenantIdp />
      </Provider>,
    );

    const emailInput = await baseElement.querySelector("goa-input[testId='user-search-email-input']");
    const emailSearchBtn = await baseElement.querySelector("goa-button[testId='user-search-email-btn']");

    expect(emailInput).toBeTruthy();
    expect(emailSearchBtn).toBeTruthy();
  });

  it('Search user by email', async () => {
    const store = createStore();

    const { baseElement } = render(
      <Provider store={store}>
        <TenantIdp />
      </Provider>,
    );
    const emailInput = await baseElement.querySelector("goa-input[testId='user-search-email-input']");
    const emailSearchBtn = baseElement.querySelector("goa-button[testId='user-search-email-btn']");
    await fireEvent(emailInput, new CustomEvent('_change', { detail: { value: 'mock-test@gov.ab.ca' } }));
    await fireEvent.click(emailSearchBtn);
  });

  it('Shows an error when the user lookup fails', async () => {
    const store = createStore([{ name: FETCH_USER_ID_BY_EMAIL, state: 'error', data: {} }]);

    const { baseElement, findByTestId } = render(
      <Provider store={store}>
        <TenantIdp />
      </Provider>,
    );
    const emailInput = baseElement.querySelector("goa-input[testId='user-search-email-input']");
    const emailSearchBtn = baseElement.querySelector("goa-button[testId='user-search-email-btn']");
    fireEvent(emailInput, new CustomEvent('_change', { detail: { name: 'user-email', value: 'mock-test@gov.ab.ca' } }));
    fireEvent(emailSearchBtn, new CustomEvent('_click'));

    const error = await findByTestId('user-search-error');
    expect(error.textContent).toContain('Unable to look up user mock-test@gov.ab.ca');
    expect(baseElement.textContent).not.toContain('Cannot find user');
  });
});
