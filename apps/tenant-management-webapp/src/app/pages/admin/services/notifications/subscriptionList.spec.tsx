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
    session: { realm: 'core' },
    tenant: {
      realmRoles: ['uma_auth'],
    },
    subscription: {
      subscriptionsHasNext: [{ id: 'status-application-status-change', hasNext: false, top: 40 }],
      subscriptions: [
        {
          subscriber: {
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
          subscriberId: '61b7c9755af1390a68dc3927',
          typeId: 'status-application-health-change',
          criteria: {
            correlationId: null,
            context: null,
          },
        },
        {
          subscriber: {
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
          subscriberId: '61b7c130f60c055164af8a70',
          typeId: 'status-application-status-change',
          criteria: {},
        },
        {
          subscriber: {
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
          subscriberId: '61b7c3bff60c055164af8a7b',
          typeId: 'status-application-status-change',
          criteria: {},
        },
      ],
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
