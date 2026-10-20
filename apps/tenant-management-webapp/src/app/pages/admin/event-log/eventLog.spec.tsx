import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventLog } from './eventLog';
import { defaultEventLogCriteria } from './util';
import type { EventSearchCriteria } from '@store/event/models';

jest.mock('@lib/dynamicPlaceHolder', () => ({
  dynamicGeneratePayload: jest.fn(),
}));

jest.mock('./eventSearchForm', () => ({
  EventSearchForm: ({
    onSearch,

    leftAction,
  }: {
    onSearch?: (criteria: EventSearchCriteria) => void;

    leftAction?: React.ReactNode;
  }) => (
    <div>
      {leftAction}
      <button
        data-testid="event-log-filter-search"
        onClick={() => onSearch?.({ namespace: 'form-service', name: 'form-created' })}
      >
        Search
      </button>
      {[
        { id: 'namespace', namespace: 'form-service', name: '' },
        { id: 'name', namespace: '', name: 'form-created' },
        { id: 'unfiltered', namespace: '', name: '' },
      ].map(({ id, namespace, name }) => (
        <button key={id} data-testid={`search-${id}`} onClick={() => onSearch?.({ namespace, name })}>
          Search {id}
        </button>
      ))}
      <button
        data-testid="remove-date-range"
        onClick={() => onSearch?.({ namespace: '', name: '', timestampMin: '', timestampMax: '' })}
      >
        Remove date range
      </button>
      <button
        data-testid="event-log-filter-reset"
        onClick={() => onSearch?.(jest.requireActual('./util').defaultEventLogCriteria())}
      >
        Reset
      </button>
    </div>
  ),
}));

jest.mock('./eventLogEntries', () => ({
  EventLogEntries: ({ onSearch }) => (
    <button data-testid="search-related" onClick={() => onSearch({ correlationId: 'corr-related' })}>
      Related events
    </button>
  ),
}));

describe('EventLog', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-19T18:30:45.123Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockStore = configureStore([]);

  const createStore = (nextEntries: string | null = null) =>
    mockStore({
      event: {
        entries: [
          {
            timestamp: '2026-01-01T00:00:00.000Z',
            namespace: 'form-service',
            name: 'form-created',
            correlationId: 'corr-1',
            details: {},
          },
        ],
        nextEntries,
        isLoading: { definitions: false, log: false },
        definitions: {},
      },
      config: {
        serviceUrls: {
          valueServiceApiUrl: 'http://value-service',
        },
      },
      session: {
        credentials: { token: 'token' },
        resourceAccess: {
          'urn:ads:platform:value-service': { roles: ['value-reader'] },
        },
      },
    });

  it('loads the initial event log for Last 7 days', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <EventLog />
      </Provider>,
    );

    const fetchActions = store
      .getActions()
      .filter((action) => action.type === 'eventLog/FETCH_EVENT_LOG_ENTRIES_ACTION');
    expect(fetchActions).toHaveLength(1);
    expect(fetchActions[0].searchCriteria).toEqual(defaultEventLogCriteria());
  });

  it.each([
    ['event-log-filter-search', false],
    ['search-namespace', false],
    ['search-name', false],
    ['search-unfiltered', true],
  ])('sets CSV download availability for %s and disables it after reset', (searchButton, disabled) => {
    const store = createStore();
    const { getByTestId, container } = render(
      <Provider store={store}>
        <EventLog />
      </Provider>,
    );

    const csvButton = container.querySelector('goa-button[testid="export-event-log-csv"]');
    expect(csvButton).toHaveAttribute('disabled');

    fireEvent.click(getByTestId(searchButton));
    if (disabled) {
      expect(csvButton).toHaveAttribute('disabled');
    } else {
      expect(csvButton).not.toHaveAttribute('disabled');
    }

    fireEvent.click(getByTestId('event-log-filter-reset'));
    expect(csvButton).toHaveAttribute('disabled');
  });

  it('keeps the applied date constraint when searching related events', () => {
    const store = createStore();
    const { getByTestId } = render(
      <Provider store={store}>
        <EventLog />
      </Provider>,
    );

    fireEvent.click(getByTestId('search-related'));

    const searches = store.getActions().filter((action) => action.type === 'eventLog/FETCH_EVENT_LOG_ENTRIES_ACTION');
    expect(searches[searches.length - 1].searchCriteria).toEqual({
      correlationId: 'corr-related',
      timestampMin: defaultEventLogCriteria().timestampMin,
      timestampMax: defaultEventLogCriteria().timestampMax,
    });
  });

  it('executes a fresh Last 7 days search when filters are reset', () => {
    const store = createStore();
    const { getByTestId } = render(
      <Provider store={store}>
        <EventLog />
      </Provider>,
    );
    jest.setSystemTime(new Date('2026-10-20T20:00:00Z'));

    fireEvent.click(getByTestId('event-log-filter-reset'));

    const searches = store.getActions().filter((action) => action.type === 'eventLog/FETCH_EVENT_LOG_ENTRIES_ACTION');
    expect(searches).toHaveLength(2);
    expect(searches[1].searchCriteria).toEqual(defaultEventLogCriteria());
  });

  it('keeps the applied time boundaries when loading the next page', () => {
    const store = createStore('next-page');
    const { container } = render(
      <Provider store={store}>
        <EventLog />
      </Provider>,
    );
    const initialSearch = store
      .getActions()
      .find((action) => action.type === 'eventLog/FETCH_EVENT_LOG_ENTRIES_ACTION');
    jest.setSystemTime(new Date('2026-10-20T20:00:00Z'));

    fireEvent(container.querySelector('goa-button[type="text"]'), new CustomEvent('_click'));

    const searches = store.getActions().filter((action) => action.type === 'eventLog/FETCH_EVENT_LOG_ENTRIES_ACTION');
    expect(searches[1]).toEqual(
      expect.objectContaining({ after: 'next-page', searchCriteria: initialSearch.searchCriteria }),
    );
  });

  it('does not reapply Last 7 days when the date constraint is explicitly cleared', () => {
    const store = createStore();
    const { getByTestId } = render(
      <Provider store={store}>
        <EventLog />
      </Provider>,
    );

    fireEvent.click(getByTestId('remove-date-range'));

    const searches = store.getActions().filter((action) => action.type === 'eventLog/FETCH_EVENT_LOG_ENTRIES_ACTION');
    expect(searches[1].searchCriteria).toEqual({ namespace: '', name: '', timestampMin: '', timestampMax: '' });
  });
});
