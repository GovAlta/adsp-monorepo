import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { Events } from '@store/subscription/models';
import { Subscriptions } from './subscriptions';
import { CREATE_TYPE_SUBSCRIPTION, FIND_SUBSCRIBERS } from '@store/subscription/actions';

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
      loadingStates: [
        {
          name: Events.search,
          state: 'completed',
        },
      ],
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
      subscriptionCreation: { state: 'idle' },
      subscriberSearch: {
        results: ['61b7c9755af1390a68dc3927', '61b7c130f60c055164af8a70', '61b7c3bff60c055164af8a7b'],
      },
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
      </Provider>,
    );

    const subscriptionTable = queryByTestId('subscription-table-0');
    const addressAs = queryByTestId('subscription-header-address-as-0');

    expect(subscriptionTable).toBeTruthy();
    expect(addressAs).toBeTruthy();
  });

  it('creates a subscription for an existing subscriber', async () => {
    const { baseElement } = render(
      <Provider store={store}>
        <Subscriptions />
      </Provider>,
    );

    fireEvent(baseElement.querySelector("goa-button[testId='add-subscription']"), new CustomEvent('_click'));
    await waitFor(() =>
      expect(store.getActions()).toContainEqual({
        type: FIND_SUBSCRIBERS,
        payload: { reset: true, top: 5000 },
      }),
    );

    fireEvent(
      baseElement.querySelector("goa-dropdown[testId='subscription-type']"),
      new CustomEvent('_change', { detail: { value: 'status-application-health-change' } }),
    );
    fireEvent(
      baseElement.querySelector("goa-dropdown[testId='existing-subscriber']"),
      new CustomEvent('_change', { detail: { value: '61b7c9755af1390a68dc3927' } }),
    );
    fireEvent(baseElement.querySelector("goa-button[testId='subscription-submit']"), new CustomEvent('_click'));

    expect(store.getActions()).toContainEqual({
      type: CREATE_TYPE_SUBSCRIPTION,
      payload: {
        typeId: 'status-application-health-change',
        subscriber: expect.objectContaining({ id: '61b7c9755af1390a68dc3927' }),
      },
    });
  });

  it('creates a subscription with a new subscriber and contact channels', async () => {
    const { baseElement } = render(
      <Provider store={store}>
        <Subscriptions />
      </Provider>,
    );

    fireEvent(baseElement.querySelector("goa-button[testId='add-subscription']"), new CustomEvent('_click'));
    fireEvent(
      baseElement.querySelector("goa-dropdown[testId='subscription-type']"),
      new CustomEvent('_change', { detail: { value: 'status-application-status-change' } }),
    );
    fireEvent(
      baseElement.querySelector("goa-radio-group[testId='subscriber-mode']"),
      new CustomEvent('_change', { detail: { value: 'new' } }),
    );

    await waitFor(() => expect(baseElement.querySelector("goa-input[testId='new-subscriber-name']")).toBeTruthy());
    fireEvent(
      baseElement.querySelector("goa-input[testId='new-subscriber-name']"),
      new CustomEvent('_change', { detail: { value: 'General mailbox' } }),
    );
    fireEvent(
      baseElement.querySelector("goa-input[testId='new-subscriber-email']"),
      new CustomEvent('_change', { detail: { value: 'general.mailbox@gov.ab.ca' } }),
    );
    fireEvent(
      baseElement.querySelector("goa-input[testId='new-subscriber-phone']"),
      new CustomEvent('_change', { detail: { value: '7801234567' } }),
    );
    fireEvent(baseElement.querySelector("goa-button[testId='subscription-submit']"), new CustomEvent('_click'));

    expect(store.getActions()).toContainEqual({
      type: CREATE_TYPE_SUBSCRIPTION,
      payload: {
        typeId: 'status-application-status-change',
        subscriber: {
          addressAs: 'General mailbox',
          channels: [
            { channel: 'email', address: 'general.mailbox@gov.ab.ca', verified: false },
            { channel: 'sms', address: '7801234567', verified: false },
          ],
        },
      },
    });
  });

  it('requires a contact channel for a new subscriber', async () => {
    const createActionCount = store.getActions().filter(({ type }) => type === CREATE_TYPE_SUBSCRIPTION).length;
    const { baseElement } = render(
      <Provider store={store}>
        <Subscriptions />
      </Provider>,
    );

    fireEvent(baseElement.querySelector("goa-button[testId='add-subscription']"), new CustomEvent('_click'));
    fireEvent(
      baseElement.querySelector("goa-dropdown[testId='subscription-type']"),
      new CustomEvent('_change', { detail: { value: 'status-application-status-change' } }),
    );
    fireEvent(
      baseElement.querySelector("goa-radio-group[testId='subscriber-mode']"),
      new CustomEvent('_change', { detail: { value: 'new' } }),
    );
    await waitFor(() => expect(baseElement.querySelector("goa-input[testId='new-subscriber-name']")).toBeTruthy());
    fireEvent(
      baseElement.querySelector("goa-input[testId='new-subscriber-name']"),
      new CustomEvent('_change', { detail: { value: 'No contact' } }),
    );
    fireEvent(baseElement.querySelector("goa-button[testId='subscription-submit']"), new CustomEvent('_click'));

    expect(store.getActions().filter(({ type }) => type === CREATE_TYPE_SUBSCRIPTION)).toHaveLength(createActionCount);
  });
});
