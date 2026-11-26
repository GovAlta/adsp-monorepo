import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EventServiceMain } from './EventServiceMain';

describe('EventServiceMain', () => {
  it('renders the event service sample list', () => {
    render(
      <MemoryRouter>
        <EventServiceMain tenantName="my-tenant" />
      </MemoryRouter>,
    );
    expect(screen.getByText(/samples for the Event service/)).toBeTruthy();
    expect(screen.getByText(/Event service item\s+1/)).toBeTruthy();
  });
});
