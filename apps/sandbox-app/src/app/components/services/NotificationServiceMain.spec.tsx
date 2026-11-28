import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotificationServiceMain } from './NotificationServiceMain';

describe('NotificationServiceMain', () => {
  it('renders the notification service sample list', () => {
    render(
      <MemoryRouter>
        <NotificationServiceMain tenantName="my-tenant" />
      </MemoryRouter>,
    );
    expect(screen.getByText(/samples for the Notification service/)).toBeTruthy();
    expect(screen.getByText(/Notification service item\s+1/)).toBeTruthy();
  });
});
