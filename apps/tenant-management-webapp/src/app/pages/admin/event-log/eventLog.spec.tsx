import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventLog } from './eventLog';
import { defaultEventLogCriteria } from './util';
import { exportEventLogEntries } from './exportEventLog';
import type { EventSearchCriteria } from '@store/event/models';

jest.mock('./exportEventLog', () => ({
  ...jest.requireActual('./exportEventLog'),
  exportEventLogEntries: jest.fn().mockResolvedValue(1),
}));

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
        data-testid="remove-date-range"
        onClick={() => onSearch?.({ namespace: '', name: '', timestampMin: '', timestampMax: '' })}
      >
        Remove date range
      </button>
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
        { id: 'correlation', correlationId: 'corr-1', timestampMin: '', timestampMax: '' },
        { id: 'context', context: { formId: 'application-form' }, timestampMin: '', timestampMax: '' },
        { id: 'applications', applications: 'tenant-management-webapp', timestampMin: '', timestampMax: '' },
        { id: 'url', url: '/forms', timestampMin: '', timestampMax: '' },
      ].map(({ id, ...criteria }) => (
        <button key={id} data-testid={`search-${id}`} onClick={() => onSearch?.(criteria)}>
          Search {id}
        </button>
      ))}
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
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  const mockStore = configureStore([]);
  const fetchPageType = 'eventLog/FETCH_EVENT_LOG_PAGE_ACTION';

  const createStore = (
    logPage: { page: number; pageSize: number; total: number } | null = { page: 1, pageSize: 10, total: 1 },
  ) =>
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
        nextEntries: null,
        logPage,
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

  const renderEventLog = (store = createStore()) =>
    render(
      <Provider store={store}>
        <EventLog />
      </Provider>,
    );

  const fetchPageActions = (store: ReturnType<typeof createStore>) =>
    store.getActions().filter((action) => action.type === fetchPageType);

  const changePageSize = (container: HTMLElement, value: string) =>
    fireEvent(
      container.querySelector('goa-dropdown[name="event-log-page-size"]'),
      new CustomEvent('_change', { detail: { value } }),
    );

  it('loads exactly one first page with the Last 7 days bounds and total', () => {
    const store = createStore();

    renderEventLog(store);

    expect(fetchPageActions(store)).toEqual([
      expect.objectContaining({
        page: 1,
        pageSize: 10,
        includeTotal: true,
        searchCriteria: defaultEventLogCriteria(),
      }),
    ]);
  });

  it('returns to the first page with the new filters when a search is executed', () => {
    const store = createStore({ page: 3, pageSize: 10, total: 347 });
    const { getByTestId } = renderEventLog(store);

    fireEvent.click(getByTestId('event-log-filter-search'));

    expect(fetchPageActions(store).pop()).toEqual(
      expect.objectContaining({
        page: 1,
        includeTotal: true,
        searchCriteria: expect.objectContaining({ namespace: 'form-service', name: 'form-created' }),
      }),
    );
  });

  it('returns to the first page with a fresh Last 7 days range when filters are reset', () => {
    const store = createStore({ page: 3, pageSize: 10, total: 347 });
    const { getByTestId } = renderEventLog(store);
    fireEvent.click(getByTestId('event-log-filter-search'));

    jest.setSystemTime(new Date('2026-10-20T20:00:00Z'));
    fireEvent.click(getByTestId('event-log-filter-reset'));

    expect(fetchPageActions(store).pop()).toEqual(
      expect.objectContaining({ page: 1, includeTotal: true, searchCriteria: defaultEventLogCriteria() }),
    );
  });

  it('keeps the applied filters and pinned upper bound when moving to another page', () => {
    const store = createStore({ page: 1, pageSize: 10, total: 347 });
    const { getByTestId } = renderEventLog(store);
    fireEvent.click(getByTestId('event-log-filter-search'));
    const searchCriteria = fetchPageActions(store).pop().searchCriteria;

    fireEvent.change(getByTestId('event-log-pagination-page'), { target: { value: '2' } });

    expect(fetchPageActions(store).pop()).toEqual(
      expect.objectContaining({ page: 2, includeTotal: false, searchCriteria }),
    );
  });

  it('shows pagination controls when the results span more than one page', () => {
    const { getByTestId } = renderEventLog(createStore({ page: 1, pageSize: 10, total: 347 }));

    expect(getByTestId('event-log-pagination')).toBeInTheDocument();
  });

  it('returns to the first page at the chosen size with the applied filters when the page size changes', () => {
    const store = createStore({ page: 3, pageSize: 10, total: 347 });
    const { container, getByTestId } = renderEventLog(store);
    fireEvent.click(getByTestId('event-log-filter-search'));
    const searchCriteria = fetchPageActions(store).pop().searchCriteria;

    changePageSize(container, '30');

    expect(fetchPageActions(store).pop()).toEqual(
      expect.objectContaining({ page: 1, pageSize: 30, includeTotal: false, searchCriteria }),
    );
  });

  it('keeps the chosen page size when moving to another page', () => {
    const store = createStore({ page: 1, pageSize: 10, total: 347 });
    const { container, getByTestId } = renderEventLog(store);
    changePageSize(container, '20');

    fireEvent.change(getByTestId('event-log-pagination-page'), { target: { value: '2' } });

    expect(fetchPageActions(store).pop()).toEqual(expect.objectContaining({ page: 2, pageSize: 20 }));
  });

  it('keeps the chosen page size when a new search is executed', () => {
    const store = createStore({ page: 1, pageSize: 10, total: 347 });
    const { container, getByTestId } = renderEventLog(store);
    changePageSize(container, '20');

    fireEvent.click(getByTestId('event-log-filter-search'));

    expect(fetchPageActions(store).pop()).toEqual(
      expect.objectContaining({ page: 1, pageSize: 20, includeTotal: true }),
    );
  });

  it('hides pagination controls when every result fits on one page', () => {
    const { queryByTestId } = renderEventLog(createStore({ page: 1, pageSize: 10, total: 1 }));

    expect(queryByTestId('event-log-pagination')).not.toBeInTheDocument();
  });

  it('no longer offers a Load more control', () => {
    const { queryByText } = renderEventLog(createStore({ page: 1, pageSize: 10, total: 347 }));

    expect(queryByText('Load more')).not.toBeInTheDocument();
  });

  it('enables CSV download for the default Last 7 days filter', () => {
    const { container } = renderEventLog();

    const csvButton = container.querySelector('goa-button[testid="export-event-log-csv"]');

    expect(csvButton).not.toHaveAttribute('disabled');
  });

  it.each([
    'event-log-filter-search',
    'search-namespace',
    'search-name',
    'search-correlation',
    'search-context',
    'search-applications',
    'search-url',
    'event-log-filter-reset',
  ])('enables CSV download with the applied filters from %s', (searchButton) => {
    const { getByTestId, container } = renderEventLog();
    fireEvent.click(getByTestId('remove-date-range'));

    fireEvent.click(getByTestId(searchButton));

    expect(container.querySelector('goa-button[testid="export-event-log-csv"]')).not.toHaveAttribute('disabled');
  });

  it('disables CSV download when all filters are removed despite the pinned pagination cutoff', () => {
    const { getByTestId, container } = renderEventLog();

    fireEvent.click(getByTestId('remove-date-range'));

    expect(container.querySelector('goa-button[testid="export-event-log-csv"]')).toHaveAttribute('disabled');
  });

  it('keeps CSV download disabled when there are no results', () => {
    const state = createStore().getState();
    const store = mockStore({ ...state, event: { ...state.event, entries: [] } });

    const { container } = renderEventLog(store);

    expect(container.querySelector('goa-button[testid="export-event-log-csv"]')).toHaveAttribute('disabled');
  });

  it.each([
    ['event-log-filter-reset', defaultEventLogCriteria],
    [
      'search-correlation',
      () => ({ correlationId: 'corr-1', timestampMin: '', timestampMax: '2026-10-19T18:30:45.123Z' }),
    ],
  ])('exports the applied criteria with a fallback filename after %s', async (searchButton, criteria) => {
    const { getByTestId, container } = renderEventLog();
    fireEvent.click(getByTestId(searchButton));

    fireEvent(container.querySelector('goa-button[testid="export-event-log-csv"]'), new CustomEvent('_click'));

    await waitFor(() =>
      expect(exportEventLogEntries).toHaveBeenCalledWith(
        'http://value-service',
        'token',
        'event-log',
        criteria(),
        expect.any(AbortSignal),
      ),
    );
  });

  it('keeps the applied date constraint when searching related events', () => {
    const store = createStore();
    const { getByTestId } = renderEventLog(store);

    fireEvent.click(getByTestId('search-related'));

    expect(fetchPageActions(store).pop().searchCriteria).toEqual({
      correlationId: 'corr-related',
      timestampMin: defaultEventLogCriteria().timestampMin,
      timestampMax: defaultEventLogCriteria().timestampMax,
    });
  });

  it('clears the selected period while retaining the pagination upper bound', () => {
    const store = createStore();
    const { getByTestId } = renderEventLog(store);

    fireEvent.click(getByTestId('remove-date-range'));

    expect(fetchPageActions(store).pop().searchCriteria).toEqual({
      namespace: '',
      name: '',
      timestampMin: '',
      timestampMax: '2026-10-19T18:30:45.123Z',
    });
  });
});
