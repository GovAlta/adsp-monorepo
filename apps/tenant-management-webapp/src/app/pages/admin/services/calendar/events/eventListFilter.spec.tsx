import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventListFilter } from './eventListFilter';
import { UPDATE_EVENT_CALENDAR_AND_FETCH_ACTION } from '@store/calendar/actions';

describe('EventListFilter', () => {
  const mockStore = configureStore([]);
  const dateRangeError = 'Start date must be before end date.';
  const startDateName = 'calendar-event-filter-start-date';
  const endDateName = 'calendar-event-filter-end-date';

  const criteria = {
    calendarName: 'form-intake',
    startDate: '2026-07-24T00:00:00.000Z',
    endDate: '2026-07-27T00:00:00.000Z',
  };

  let store: ReturnType<typeof mockStore>;

  const renderFilter = () =>
    render(
      <Provider store={store}>
        <EventListFilter calenderName="form-intake" />
      </Provider>,
    );

  const changeDate = (container: HTMLElement, name: string, value: string) => {
    fireEvent(
      container.querySelector(`goa-input[name="${name}"]`) as Element,
      new CustomEvent('_change', { detail: { name, value } }),
    );
  };

  beforeEach(() => {
    store = mockStore({ calendarService: { eventSearchCriteria: criteria } });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the start and end date filters', () => {
    const { baseElement } = renderFilter();

    expect(baseElement.querySelector(`[name="${startDateName}"]`)).not.toBeNull();
    expect(baseElement.querySelector(`[name="${endDateName}"]`)).not.toBeNull();
  });

  it('does not show the date range error for a valid range', () => {
    const { queryByText } = renderFilter();

    expect(queryByText(dateRangeError)).toBeNull();
  });

  it('fetches events with the new end date when the end date changes to a later date', () => {
    const { container } = renderFilter();

    changeDate(container, endDateName, '2026-07-30');

    expect(store.getActions()).toEqual([
      {
        type: UPDATE_EVENT_CALENDAR_AND_FETCH_ACTION,
        payload: { ...criteria, endDate: '2026-07-30T00:00:00.000Z' },
      },
    ]);
  });

  it('fetches events with the new start date when the start date changes to an earlier date', () => {
    const { container } = renderFilter();

    changeDate(container, startDateName, '2026-07-20');

    expect(store.getActions()).toEqual([
      {
        type: UPDATE_EVENT_CALENDAR_AND_FETCH_ACTION,
        payload: { ...criteria, startDate: '2026-07-20T00:00:00.000Z' },
      },
    ]);
  });

  it('does not fetch events when the end date is cleared', () => {
    const { container } = renderFilter();

    changeDate(container, endDateName, '');

    expect(store.getActions()).toEqual([]);
  });

  it('does not fetch events when the start date is cleared', () => {
    const { container } = renderFilter();

    changeDate(container, startDateName, '');

    expect(store.getActions()).toEqual([]);
  });

  it('does not throw when the end date value is not a valid date', () => {
    const { container } = renderFilter();

    expect(() => changeDate(container, endDateName, 'not-a-date')).not.toThrow();
  });

  it('shows the date range error when the end date is before the start date', () => {
    const { container, queryByText } = renderFilter();

    changeDate(container, endDateName, '2026-07-20');

    expect(queryByText(dateRangeError)).not.toBeNull();
  });

  it('does not fetch events when the end date is before the start date', () => {
    const { container } = renderFilter();

    changeDate(container, endDateName, '2026-07-20');

    expect(store.getActions()).toEqual([]);
  });

  it('shows the date range error when the start date is after the end date', () => {
    const { container, queryByText } = renderFilter();

    changeDate(container, startDateName, '2026-07-30');

    expect(queryByText(dateRangeError)).not.toBeNull();
  });

  it('does not fetch events when the start date is after the end date', () => {
    const { container } = renderFilter();

    changeDate(container, startDateName, '2026-07-30');

    expect(store.getActions()).toEqual([]);
  });

  it('hides the date range error once a valid end date is entered', () => {
    const { container, queryByText } = renderFilter();
    changeDate(container, endDateName, '2026-07-20');

    changeDate(container, endDateName, '2026-07-30');

    expect(queryByText(dateRangeError)).toBeNull();
  });
});
