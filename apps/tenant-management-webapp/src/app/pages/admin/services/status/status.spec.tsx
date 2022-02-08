import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { fireEvent, render, waitFor, screen } from '@testing-library/react';

import ServiceStatusPage from './status';
import { BrowserRouter as Router } from 'react-router-dom';
import { RootState } from '@store/index';
import { SetApplicationStatusAction, SET_APPLICATION_STATUS_ACTION } from '@store/status/actions';

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
      tenant: { name: 'Child Services' },
      config: {
        serviceUrls: {
          serviceStatusAppUrl: 'http://www.somefakesite.com',
        },
      },
      serviceStatus: {
        metrics: {},
        applications: [
          {
            _id: '99',
            tenantId: '11',
            name: 'facebook',
            status: 'operational',
            endpoint: { url: 'https://facebook.com/api', status: 'online', statusEntries: [] },
          },
          {
            _id: '33',
            tenantId: '11',
            name: 'twitter',
            status: 'operational',
            endpoint: { url: 'https://facebook.com/api', status: 'online', statusEntries: [] },
          },
          {
            _id: '11',
            tenantId: '11',
            name: 'alberta.ca',
            status: 'operational',
            endpoint: { url: 'https://facebook.com/api', status: 'online', statusEntries: [] },
          },
        ],
      },
      subscription: {
        subscriber: {
          id: '1234',
          urn: '123:456:789',
        },
        subscription: {
          id: '1234',
          urn: '123:456:789',
          channels: null,
        },
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
      tenant: { name: 'Child Services' },
      config: {
        serviceUrls: {
          serviceStatusAppUrl: 'http://www.somefakesite.com',
        },
      },
      serviceStatus: {
        metrics: {},
        applications: [
          {
            _id: '11',
            tenantId: '11',
            name: 'alberta.ca',
            status: 'disabled',
            endpoint: {},
          },
        ],
      },
      subscription: {
        subscriber: {
          id: '1234',
          urn: '123:456:789',
        },
        subscription: {
          id: '1234',
          urn: '123:456:789',
          channels: null,
        },
      },
    });

    renderPage(store);

    waitFor(async () => {
      const toggleLink = await screen.findByTestId('context-menu--toggle');
      fireEvent.click(toggleLink);

      const actions = store.getActions();
      const toggleAction: SetApplicationStatusAction = actions.find(
        (action) => action.type === SET_APPLICATION_STATUS_ACTION
      );

      const state = store.getState() as RootState;
      const { applicationId, status, tenantId } = toggleAction.payload;
      expect(applicationId).toEqual('11');
      expect(tenantId).toEqual('11');
      expect(status).toEqual(!state.serviceStatus.applications[0].status);
    });
  });
});
