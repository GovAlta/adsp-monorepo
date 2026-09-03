import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SUBSCRIBER_INIT } from '@store/subscription/models';
import { Subscribers } from '.';
import { CREATE_SUBSCRIBER, UPDATE_SUBSCRIBER } from '@store/subscription/actions';

describe('Notification - Subscribers Tab', () => {
  const mockStore = configureStore([]);
  const subscribers = {
    '61bd151b6d95d24f4cf632cf': {
      id: '61bd151b6d95d24f4cf632cf',
      addressAs: 'user-a',
      channels: [
        {
          channel: 'email',
          address: 'jonathan.weyermann@gov.ab.ca',
          verified: false,
        },
        {
          channel: 'sms',
          address: '1234561234',
          verified: false,
        },
      ],
    },
    '61bd151b6d95d24f4cf632cc': {
      id: '61bd151b6d95d24f4cf632cc',
      addressAs: 'user-b',
      channels: [
        {
          channel: 'email',
          address: 'weyermannx@gmail.com',
          verified: false,
        },
      ],
    },
    '61bd151b6d95d24f4cf632c1': {
      id: '61bd151b6d95d24f4cf632c1',
      addressAs: 'user-c',
      channels: [
        {
          channel: 'slack',
          address: 'slack-only@gmail.com',
          verified: false,
        },
      ],
    },
  };

  const store = mockStore({
    subscription: {
      ...SUBSCRIBER_INIT,
      subscribers,
      subscriberSearch: {
        results: ['61bd151b6d95d24f4cf632cf', '61bd151b6d95d24f4cf632cc', '61bd151b6d95d24f4cf632c1'],
        next: null,
      },
    },
    tenant: {
      adminEmail: 'agent.smith@matrix.com',
    },
    notifications: {
      notifications: [],
    },
    session: {
      resourceAccess: { 'urn:ads:platform:notification-service': { roles: ['subscription-admin'] } },
      indicator: {
        show: false,
      },
    },
  });

  it('renders', () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <Subscribers />
      </Provider>,
    );

    const tabTitle = queryByTestId('subscribers-list-title');
    expect(tabTitle).toBeTruthy();
  });

  it('edits the subscriber', async () => {
    const { baseElement } = render(
      <Provider store={store}>
        <Subscribers />
      </Provider>,
    );
    const editBtn = baseElement.querySelector(
      "goa-icon-button[testId='edit-subscription-item-61bd151b6d95d24f4cf632cf']",
    );
    await waitFor(() => {
      fireEvent.click(editBtn);
    });

    // fields
    const name = baseElement.querySelector("goa-input[testId='form-name']");
    const email = baseElement.querySelector("goa-input[testId='form-email']");

    expect(name).not.toBeNull();
    expect(email).not.toBeNull();
    const saveBtn = baseElement.querySelector("goa-button[testId='form-save']");

    // fill
    fireEvent(
      name,
      new CustomEvent('_change', {
        detail: { value: 'Bob Smith' },
      }),
    );
    fireEvent(
      email,
      new CustomEvent('_change', {
        detail: { value: 'bob.smith@gmail.com' },
      }),
    );

    fireEvent(saveBtn, new CustomEvent('_click'));
    const actions = store.getActions();

    const saveAction = actions.find((action) => action.type === UPDATE_SUBSCRIBER);
    expect(saveAction).toBeTruthy();
  });

  it('adds a subscriber with a name and email', async () => {
    const { baseElement } = render(
      <Provider store={store}>
        <Subscribers />
      </Provider>,
    );

    const addBtn = baseElement.querySelector("goa-button[testId='add-subscriber']");
    fireEvent(addBtn, new CustomEvent('_click'));

    const name = baseElement.querySelector("goa-input[testId='form-name']");
    const email = baseElement.querySelector("goa-input[testId='form-email']");
    const saveBtn = baseElement.querySelector("goa-button[testId='form-save']");

    fireEvent(name, new CustomEvent('_change', { detail: { value: 'General mailbox' } }));
    fireEvent(email, new CustomEvent('_change', { detail: { value: 'general.mailbox@gov.ab.ca' } }));
    fireEvent(saveBtn, new CustomEvent('_click'));

    await waitFor(() => {
      const createAction = store.getActions().find((action) => action.type === CREATE_SUBSCRIBER);
      expect(createAction).toEqual({
        type: CREATE_SUBSCRIBER,
        payload: {
          subscriber: {
            addressAs: 'General mailbox',
            channels: [{ channel: 'email', address: 'general.mailbox@gov.ab.ca', verified: false }],
          },
        },
      });
    });
  });

  it('requires a name and valid email when adding a subscriber', () => {
    const { baseElement } = render(
      <Provider store={store}>
        <Subscribers />
      </Provider>,
    );

    const createActionCount = store.getActions().filter((action) => action.type === CREATE_SUBSCRIBER).length;
    fireEvent(baseElement.querySelector("goa-button[testId='add-subscriber']"), new CustomEvent('_click'));
    fireEvent(baseElement.querySelector("goa-button[testId='form-save']"), new CustomEvent('_click'));

    expect(store.getActions().filter((action) => action.type === CREATE_SUBSCRIBER)).toHaveLength(createActionCount);
  });
});
