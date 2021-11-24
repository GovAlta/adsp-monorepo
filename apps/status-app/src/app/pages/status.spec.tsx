import React from 'react';
import { Provider } from 'react-redux';
import { getDefaultMiddleware } from '@reduxjs/toolkit';
import { render, waitFor, cleanup } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import ServiceStatuses from './status';
import axios from 'axios';
import moment from 'moment';
import { ApplicationInit, NoticeInit } from '@store/status/models';
import { SessionInit } from '@store/session/models';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

jest.mock('react-router-dom', () => ({
  useLocation: jest.fn().mockReturnValue({
    pathname: '/0014430f-abb9-4b57-915c-de9f3c889696',
    search: '',
    hash: '',
    state: null,
    key: '5nvxpbdafa',
  }),
}));

const mockStore = configureStore(getDefaultMiddleware());

describe('Service statuses', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      config: {
        serviceUrls: {
          serviceStatusApiUrl: 'http://localhost:3338',
        },
        platformTenantRealm: '0014430f-abb9-4b57-915c-de9f3c889696',
        envLoaded: true,
      },
      application: ApplicationInit,
      session: SessionInit,
      notices: NoticeInit,
    });

    axiosMock.get.mockResolvedValueOnce({ data: {} });
  });

  afterEach(() => {
    axiosMock.get.mockReset();
    cleanup();
  });

  it('displays a message saying no services are available if there are none', async () => {
    const { getByText } = render(
      <Provider store={store}>
        <ServiceStatuses />
      </Provider>
    );
    await waitFor(() => expect(getByText('Cannot find a provider at this url')).toBeTruthy());
  });
});

describe('Service statuses (2 of them)', () => {
  let store;

  const data = [
    {
      id: '60ef54d5a3bdbd4d6c117381',
      name: 'Status service',
      description: 'This service allows for easy monitoring of application downtime.',
      lastUpdated: new Date(1626378840127).toISOString(),
      status: 'operational',
      notices: [],
    },
    {
      id: '60ef569d68ce787398e578f6',
      name: 'Tenant service',
      description: 'Allows the provisioning of distinct services in their own namespace.',
      lastUpdated: new Date(1626380220228).toISOString(),
      status: 'operational',
      notices: [],
    },
  ];

  beforeAll(() => {
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date(Date.UTC(2021, 6, 16)));
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    store = mockStore({
      config: {
        serviceUrls: {
          serviceStatusApiUrl: 'http://localhost:3338',
        },
        platformTenantRealm: '0014430f-abb9-4b57-915c-de9f3c889696',
        envLoaded: true,
      },
      application: {
        applications: data,
      },
      session: SessionInit,
      notice: NoticeInit,
    });
    axiosMock.get.mockResolvedValueOnce({ data: data });
  });

  afterEach(() => {
    axiosMock.get.mockReset();
    cleanup();
  });

  it('has service status names', async () => {
    const { getByText } = render(
      <Provider store={store}>
        <ServiceStatuses />
      </Provider>
    );
    await waitFor(() => expect(getByText('Status service')).toBeTruthy());
    await waitFor(() => expect(getByText('Tenant service')).toBeTruthy());
  });

  it('has service status descriptions', async () => {
    const { getByText } = render(
      <Provider store={store}>
        <ServiceStatuses />
      </Provider>
    );

    await waitFor(() =>
      expect(getByText('This service allows for easy monitoring of application downtime.')).toBeTruthy()
    );
    await waitFor(() =>
      expect(getByText('Allows the provisioning of distinct services in their own namespace.')).toBeTruthy()
    );
  });

  it('has service time of last service', async () => {
    const { getByText } = render(
      <Provider store={store}>
        <ServiceStatuses />
      </Provider>
    );

    await waitFor(() => expect(getByText(moment(data[0].lastUpdated).calendar())).toBeTruthy());
    await waitFor(() => expect(getByText(moment(data[1].lastUpdated).calendar())).toBeTruthy());
  });
});
