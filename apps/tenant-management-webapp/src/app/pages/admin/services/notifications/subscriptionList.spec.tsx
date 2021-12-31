import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { UPDATE_SUBSCRIBER } from '@store/subscription/actions';

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

  it('edits the subscriber', async () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <Subscriptions />
      </Provider>
    );
    const editBtn = queryByTestId('edit-subscription-item-61b7c9755af1390a68dc3927');
    await waitFor(() => {
      fireEvent.click(editBtn);
    });

    // fields
    const name = queryByTestId('form-name');
    const email = queryByTestId('form-email');

    expect(name).not.toBeNull();
    expect(email).not.toBeNull();
    const saveBtn = queryByTestId('form-save');

    // fill
    fireEvent.change(name, { target: { value: 'Bob Smith' } });
    fireEvent.change(email, { target: { value: 'bob.smith@gmail.com' } });
    fireEvent.click(saveBtn);

    const actions = store.getActions();

    const saveAction = actions.find((action) => action.type === UPDATE_SUBSCRIBER);
    expect(saveAction).toBeTruthy();
  });
});
