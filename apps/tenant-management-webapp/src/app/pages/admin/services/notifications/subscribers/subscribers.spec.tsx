import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SUBSCRIBER_INIT } from '@store/subscription/models';
import { Subscribers } from '.'

describe('Notification - Subscribers Tab', () => {
  const mockStore = configureStore([]);
  const search = {
    subscribers: {
      data: [
        {
          id: '61bd151b6d95d24f4cf632cf',
          addressAs: 'user-a'
        },
        {
          id: '61bd151b6d95d24f4cf632cc',
          addressAs: 'user-b'
        }
      ]
    }
  }

  const store = mockStore({
    subscription: {
      ...SUBSCRIBER_INIT,
      search
    }
  });

  it('renders', () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <Subscribers />
      </Provider>
    );

    const tabTitle = queryByTestId('subcribers-list-title');
    expect(tabTitle).toBeTruthy();
  });
});