import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

import { Notifications } from './notifications';

jest.mock('./overview', () => ({
  NotificationsOverview: () => <div data-testid="overview-mock" />,
}));
jest.mock('./notificationType/notificationTypes', () => ({
  NotificationTypes: () => <div data-testid="notification-types-mock" />,
}));
jest.mock('./subscription/subscriptions', () => ({
  Subscriptions: () => <div data-testid="subscriptions-mock" />,
}));
jest.mock('./subscribers', () => ({
  Subscribers: () => <div data-testid="subscribers-mock" />,
}));

describe('Notifications page', () => {
  const mockStore = configureStore([]);

  const store = mockStore({
    config: {
      featureFlags: {},
      serviceUrls: { subscriberWebApp: 'https://subscriber.example.com', docServiceApiUrl: 'https://docs.example.com' },
    },
    tenant: { name: 'my-tenant' },
  });

  const renderNotifications = () =>
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Notifications />
        </MemoryRouter>
      </Provider>,
    );

  it('renders a tab for each notification section, labelling the recipient tab as Recipient registry', () => {
    const { getByTestId } = renderNotifications();

    expect(getByTestId('tab-btn-0')).toHaveTextContent('Overview');
    expect(getByTestId('tab-btn-1')).toHaveTextContent('Notification types');
    expect(getByTestId('tab-btn-2')).toHaveTextContent('Subscriptions');
    expect(getByTestId('tab-btn-3')).toHaveTextContent('Recipient registry');
  });

  it('shows the recipient registry when its tab is selected', () => {
    const { getByTestId, queryByTestId } = renderNotifications();

    fireEvent.click(getByTestId('tab-btn-3'));

    expect(getByTestId('notification-subscribers')).toContainElement(getByTestId('subscribers-mock'));
    expect(queryByTestId('overview-mock')).toBeFalsy();
  });
});
