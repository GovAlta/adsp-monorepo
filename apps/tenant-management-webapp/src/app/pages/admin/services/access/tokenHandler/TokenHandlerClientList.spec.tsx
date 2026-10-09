import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { render, screen } from '@testing-library/react';

import { TokenHandlerClientList } from './TokenHandlerClientList';

describe('TokenHandlerClientList', () => {
  const mockStore = configureStore([]);

  const renderList = (clients: Record<string, unknown> | null) =>
    render(
      <Provider store={mockStore({ tokenHandler: { clients, registrations: {}, busyClients: {} } })}>
        <TokenHandlerClientList onSelect={jest.fn()} />
      </Provider>,
    );

  it('describes the token handler and what a client is', () => {
    renderList({});

    const description = screen.getByTestId('token-handler-description');
    expect(description.textContent).toContain('keeps their tokens in a server-side session');
    expect(description.textContent).toContain('session cookie');
    expect(description.textContent).toContain('A client is an application that uses the token handler');
    expect(description.textContent).toContain('registered in access service');
    expect(description.textContent).toContain('targets');
  });

  it('links to the documentation', () => {
    renderList({});

    const link = screen.getByText('Read the documentation').closest('a');
    expect(link.getAttribute('href')).toBe('https://govalta.github.io/adsp-monorepo/services/token-handler.html');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('shows the description before the clients have loaded and when there are none', () => {
    const { unmount } = renderList(null);
    expect(screen.getByTestId('token-handler-description')).toBeTruthy();
    unmount();

    renderList({});
    expect(screen.getByTestId('token-handler-description')).toBeTruthy();
    expect(screen.getByText(/No clients configured/)).toBeTruthy();
  });

  it('lists the clients', () => {
    renderList({ 'my-app': { id: 'my-app', name: 'My app', targets: { a: { id: 'a', upstream: 'urn:x' } } } });

    expect(screen.getByTestId('client-row-my-app').textContent).toContain('My app');
  });
});
