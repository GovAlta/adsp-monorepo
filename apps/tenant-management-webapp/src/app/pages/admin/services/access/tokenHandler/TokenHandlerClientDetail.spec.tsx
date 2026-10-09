import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { render, screen } from '@testing-library/react';

import { TokenHandlerClientDetail } from './TokenHandlerClientDetail';

describe('TokenHandlerClientDetail', () => {
  const mockStore = configureStore([]);

  const createState = (targets: Record<string, unknown> = {}) => ({
    tokenHandler: {
      clients: { 'my-client': { id: 'my-client', name: 'My client', targets } },
      registrations: { 'my-client': 'keycloak-client' },
      registrationErrors: {},
      keycloakUuids: {},
      busyClients: {},
    },
    config: {
      keycloakApi: { url: 'https://access.example.ca' },
      serviceUrls: { tokenHandlerApiUrl: 'https://token-handler.example.ca' },
    },
    session: { realm: 'realm', indicator: { show: false } },
    tenant: { name: 'My Tenant' },
  });

  const renderDetail = (state = createState()) =>
    render(
      <Provider store={mockStore(state)}>
        <TokenHandlerClientDetail clientId="my-client" onBack={jest.fn()} />
      </Provider>,
    );

  it('describes targets and the CSRF header that requests to them need', () => {
    renderDetail();

    const text = screen.getByTestId('targets-description').textContent;
    expect(text).toContain('Targets are the services and APIs that the application can call through the token handler');
    expect(text).toContain('adds the user\'s access token');
    expect(text).toContain('Requests other than GET need the X-XSRF-TOKEN header, set to the value of the XSRF-TOKEN cookie.');
  });

  it('describes targets when there are none', () => {
    renderDetail();

    expect(screen.getByTestId('targets-description')).toBeTruthy();
    expect(screen.getByText(/No targets configured/)).toBeTruthy();
  });

  it('describes targets when there are some', () => {
    renderDetail(createState({ 'form-api': { id: 'form-api', upstream: 'urn:ads:platform:form-service:v1' } }));

    expect(screen.getByTestId('targets-description')).toBeTruthy();
    expect(screen.queryByText(/No targets configured/)).toBeNull();
  });

  it('keeps the CSRF header out of the proxy requirements', () => {
    renderDetail();

    expect(screen.getByTestId('token-handler-proxy-info').textContent).not.toContain('XSRF');
  });
});
