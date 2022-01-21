import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SUBSCRIBER_INIT } from '@store/subscription/models';
import { Subscribers } from '.';
import { UPDATE_SUBSCRIBER } from '@store/subscription/actions';

describe('Notification - Subscribers Tab', () => {
  const mockStore = configureStore([]);
  const search = {
    subscribers: {
      data: [
        {
          id: '61bd151b6d95d24f4cf632cf',
          addressAs: 'user-a',
          channels: [
            {
              channel: 'email',
              address: 'jonathan.weyermann@gov.ab.ca',
              verified: false,
            },
          ],
        },
        {
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
      ],
    },
  };

  const store = mockStore({
    subscription: {
      ...SUBSCRIBER_INIT,
      search,
    },
    tenant: {
      adminEmail: 'agent.smith@matrix.com',
    },
    notifications: {
      notifications: [],
    },
  });

  it('renders', () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <Subscribers />
      </Provider>
    );

    const tabTitle = queryByTestId('subscribers-list-title');
    expect(tabTitle).toBeTruthy();
  });

  it('edits the subscriber', async () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <Subscribers />
      </Provider>
    );
    const editBtn = queryByTestId('edit-subscription-item-61bd151b6d95d24f4cf632cf');
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
