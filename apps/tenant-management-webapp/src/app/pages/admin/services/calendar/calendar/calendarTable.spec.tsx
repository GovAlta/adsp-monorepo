import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CalendarTableComponent } from './calendarTable';

const calendar = {
  name: 'shared',
  displayName: 'Core calendar',
  description: 'A calendar shared by all tenants',
  readRoles: [],
  updateRoles: [],
};

describe('calendar definition table', () => {
  it('only offers viewing a core calendar', () => {
    const { container } = render(
      <CalendarTableComponent calendars={{ shared: calendar }} onEdit={jest.fn()} onDelete={jest.fn()} />
    );

    expect(container.querySelectorAll('goa-icon-button')).toHaveLength(1);
    expect(container.querySelector('goa-icon-button[title="View"]')).not.toBeNull();
  });

  it('offers editing and deleting a tenant calendar', () => {
    const { container } = render(
      <CalendarTableComponent calendars={{ shared: calendar }} onEdit={jest.fn()} onDelete={jest.fn()} tenantMode />
    );

    expect(container.querySelector('goa-icon-button[title="Edit"]')).not.toBeNull();
    expect(container.querySelector('goa-icon-button[title="Delete"]')).not.toBeNull();
  });
});
