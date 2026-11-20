import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { NotificationBanner } from './notificationBanner';
import { MessageType, NotificationItem } from '@store/notifications/models';

const mockStore = configureStore([]);

function renderBanner(notification: NotificationItem) {
  const store = mockStore({
    notifications: { notifications: [notification], services: {} },
    tenant: { name: 'Autotest' },
  });
  return render(
    <Provider store={store}>
      <NotificationBanner />
    </Provider>,
  );
}

const failure: NotificationItem = {
  id: '1',
  type: MessageType.error,
  message: "We couldn't reach the calendar-service. Try again in a minute.",
  details: {
    service: 'calendar-service',
    request: 'GET https://calendar-service.adsp.alberta.ca/calendar/v1/calendars',
    result: 'No response: Network Error (ERR_NETWORK)',
    page: '/admin/services/status',
    time: '2026-11-20T15:51:14.000Z',
  },
};

describe('NotificationBanner', () => {
  it('shows the message as text, not HTML', () => {
    renderBanner({ id: '1', type: MessageType.error, message: '<b>Calendar name must be unique</b>' });

    expect(screen.getByText('<b>Calendar name must be unique</b>')).toBeInTheDocument();
  });

  it('shows details for support with the tenant name', () => {
    renderBanner(failure);

    expect(screen.getByText('Details for support')).toBeInTheDocument();
    expect(screen.getByTestId('support-details-text')).toHaveTextContent('Service: calendar-service');
    expect(screen.getByTestId('support-details-text')).toHaveTextContent('Tenant: Autotest');
  });

  it('links to a support email prefilled with the message and details', () => {
    renderBanner(failure);

    const href = screen.getByRole('link', { name: 'Email these details to support', hidden: true }).getAttribute('href');

    expect(href).toMatch(/^mailto:adsp@gov\.ab\.ca\?subject=/);
    expect(decodeURIComponent(href)).toContain("We couldn't reach the calendar-service.");
    expect(decodeURIComponent(href)).toContain('Result: No response: Network Error (ERR_NETWORK)');
  });

  it('has no support details when there is nothing to report', () => {
    renderBanner({ id: '1', type: MessageType.error, message: 'Calendar display name is required.' });

    expect(screen.queryByText('Details for support')).not.toBeInTheDocument();
  });
});
