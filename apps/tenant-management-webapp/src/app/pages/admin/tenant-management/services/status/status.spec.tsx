import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { fireEvent, render, waitFor, screen } from '@testing-library/react';

import ServiceStatusPage from './status';
import { BrowserRouter as Router } from 'react-router-dom';
import { ToggleApplicationAction, TOGGLE_APPLICATION_ACTION } from '@store/status/actions';
import { RootState } from '@store/index';

describe('ServiceStatus Page', () => {
  const mockStore = configureStore([]);

  const renderPage = (store) =>
    render(
      <Provider store={store}>
        <Router>
          <ServiceStatusPage />
        </Router>
      </Provider>
    );

  it('renders the main page', async () => {
    const store = mockStore({
      tenant: {},
      serviceStatus: {
        applications: [
          {
            id: '99',
            tenantId: '11',
            name: 'facebook',
            enabled: true,
            timeIntervalMin: 2,
            endpoints: [
              { url: 'https://facebook.com/api', status: 'online' },
              { url: 'https://facebook.com', status: 'online' },
            ],
          },
          {
            id: '33',
            tenantId: '11',
            name: 'twitter',
            enabled: true,
            timeIntervalMin: 2,
            endpoints: [
              { url: 'https://twitter.com/api', status: 'offline' },
              { url: 'https://twitter.com', status: 'online' },
            ],
          },
          {
            id: '11',
            tenantId: '11',
            name: 'alberta.ca',
            enabled: true,
            timeIntervalMin: 2,
            endpoints: [
              { url: 'https://alberta.ca/api', status: 'pending' },
              { url: 'https://alberta.ca', status: 'offline' },
            ],
          },
        ],
      },
    });

    renderPage(store);

    waitFor(async () => {
      const addApplicationButton = await screen.findAllByTestId('add-application');
      expect(addApplicationButton.length).toBeTruthy();

      const applications = await screen.findAllByTestId('application');
      expect(applications.length).toBe(3);

      const endpoints = await screen.findAllByTestId('endpoint');
      expect(endpoints.length).toBe(6);

      const online = document.querySelectorAll("[data-testid='endpoint'].online");
      expect(online.length).toBe(3);

      const offline = document.querySelectorAll("[data-testid='endpoint'].offline");
      expect(offline.length).toBe(2);

      const pending = document.querySelectorAll("[data-testid='endpoint'].pending");
      expect(pending.length).toBe(1);

      const editLink = document.querySelector<HTMLInputElement>(
        '[data-testid="application"] [data-testid="context-menu--edit"]'
      );
      expect(editLink).toBeTruthy();

      const toggleLink = document.querySelector<HTMLInputElement>(
        '[data-testid="application"] [data-testid="context-menu--toggle"]'
      );
      expect(toggleLink).toBeTruthy();

      const deleteLink = document.querySelector<HTMLInputElement>(
        '[data-testid="application"] [data-testid="context-menu--delete"]'
      );
      expect(deleteLink).toBeTruthy();
    });
  });

  it('toggles an application status', async () => {
    const store = mockStore({
      tenant: {},
      serviceStatus: {
        applications: [
          {
            id: '11',
            tenantId: '11',
            name: 'alberta.ca',
            enabled: false,
            timeIntervalMin: 2,
            endpoints: [],
          },
        ],
      },
    });

    renderPage(store);

    waitFor(async () => {
      const toggleLink = await screen.findByTestId('context-menu--toggle');
      fireEvent.click(toggleLink);

      const actions = store.getActions();
      const toggleAction: ToggleApplicationAction = actions.find((action) => action.type === TOGGLE_APPLICATION_ACTION);

      const state = store.getState() as RootState;
      const { applicationId, enabled, tenantId } = toggleAction.payload;
      expect(applicationId).toEqual('11');
      expect(tenantId).toEqual('11');
      expect(enabled).toEqual(!state.serviceStatus.applications[0].enabled);
    });
  });
});
