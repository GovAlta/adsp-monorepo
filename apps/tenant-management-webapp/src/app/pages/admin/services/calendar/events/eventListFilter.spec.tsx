import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventListFilter } from './eventListFilter';

describe('EventListFilter', () => {
  const mockStore = configureStore([]);
  const store = mockStore({
    calendarService: {
      eventSearchCriteria: {
        calendarName: 'form-intake',
        startDate: '2026-07-24T00:00:00.000Z',
        endDate: '2026-07-27T00:00:00.000Z',
      },
    },
  });

  it('renders the start and end date filters', () => {
    const { baseElement } = render(
      <Provider store={store}>
        <EventListFilter calenderName="form-intake" />
      </Provider>
    );

    expect(baseElement.querySelector('[name="calendar-event-filter-start-date"]')).not.toBeNull();
    expect(baseElement.querySelector('[name="calendar-event-filter-end-date"]')).not.toBeNull();
  });

  it('does not show the date range error for a valid range', () => {
    const { queryByText } = render(
      <Provider store={store}>
        <EventListFilter calenderName="form-intake" />
      </Provider>
    );

    expect(queryByText('Start date must be before end date.')).toBeNull();
  });
});
