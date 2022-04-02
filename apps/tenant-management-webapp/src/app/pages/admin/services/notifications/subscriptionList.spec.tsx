import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

import { Subscriptions } from './subscriptions';

describe('NotificationTypes Page', () => {
  const mockStore = configureStore([]);

  const store = mockStore({
    user: { jwt: { token: '' } },
    session: {
      realm: 'core',
      resourceAccess: { 'urn:ads:platform:notification-service': { roles: ['subscription-admin'] } },
      indicator: {
        show: false,
      },
    },
    tenant: {
      realmRoles: ['uma_auth'],
      adminEmail: 'agent.smith@matrix.com',
    },
    notifications: {
      notifications: [],
    },
    notification: {
      notificationTypes: {},
      core: {
        'status-application-health-change': {
          id: 'status-application-health-change',
          name: 'status-application-health-change',
        },
        'status-application-status-change': {
          id: 'status-application-status-change',
          name: 'status-application-status-change',
        },
      },
    },
    subscription: {
      subscriptionsHasNext: [{ id: 'status-application-status-change', hasNext: false, top: 40 }],
      subscribers: {
        '61b7c9755af1390a68dc3927': {
          id: '61b7c9755af1390a68dc3927',
          urn: 'urn:ads:platform:notification-service:v1:/subscribers/61b7c9755af1390a68dc3927',
          addressAs: 'jonathan.weyermann@gov.ab.ca',
          channels: [
            {
              channel: 'email',
              address: 'jonathan.weyermann@gov.ab.ca',
              verified: false,
            },
          ],
          userId: '0a1381e4-64b5-4c2c-9be6-9394d74c7c13',
        },
        '61b7c130f60c055164af8a70': {
          id: '61b7c130f60c055164af8a70',
          urn: 'urn:ads:platform:notification-service:v1:/subscribers/61b7c130f60c055164af8a70',
          addressAs: 'weyermannx@gmail.com',
          channels: [
            {
              channel: 'email',
              address: 'weyermannx@gmail.com',
              verified: false,
            },
          ],
          userId: 'weyermannx@gmail.com',
        },
        '61b7c3bff60c055164af8a7b': {
          id: '61b7c3bff60c055164af8a7b',
          urn: 'urn:ads:platform:notification-service:v1:/subscribers/61b7c3bff60c055164af8a7b',
          addressAs: 'roxanneweyermann@gmail.com',
          channels: [
            {
              channel: 'email',
              address: 'roxanneweyermann@gmail.com',
              verified: false,
            },
          ],
          userId: 'roxanneweyermann@gmail.com',
        },
      },
      subscriptions: {
        'status-application-health-change:61b7c9755af1390a68dc3927': {
          subscriberId: '61b7c9755af1390a68dc3927',
          typeId: 'status-application-health-change',
          criteria: {
            correlationId: null,
            context: null,
          },
        },
        'status-application-status-change:61b7c130f60c055164af8a70': {
          subscriberId: '61b7c130f60c055164af8a70',
          typeId: 'status-application-status-change',
          criteria: {},
        },
        'status-application-status-change:61b7c3bff60c055164af8a7b': {
          subscriberId: '61b7c3bff60c055164af8a7b',
          typeId: 'status-application-status-change',
          criteria: {},
        },
      },
      typeSubscriptionSearch: {
        'status-application-health-change': {
          results: ['61b7c9755af1390a68dc3927'],
        },
        'status-application-status-change': {
          results: ['61b7c130f60c055164af8a70', '61b7c3bff60c055164af8a7b'],
        },
      },
    },
  });

  it('renders subscription list', () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <Subscriptions />
      </Provider>
    );

    const subscriptionTable = queryByTestId('subscription-table-0');
    const addressAs = queryByTestId('subscription-header-address-as-0');

    expect(subscriptionTable).toBeTruthy();
    expect(addressAs).toBeTruthy();
  });
});
