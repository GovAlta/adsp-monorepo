import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventLog } from './eventLog';

jest.mock('@lib/dynamicPlaceHolder', () => ({
  dynamicGeneratePayload: jest.fn(),
}));

jest.mock('./eventSearchForm', () => ({
  EventSearchForm: ({
    onSearch,
    onCancel,
    leftAction,
  }: {
    onSearch?: (criteria: { namespace: string; name: string }) => void;
    onCancel?: () => void;
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
      <button data-testid="event-log-filter-reset" onClick={() => onCancel?.()}>
        Reset
      </button>
    </div>
  ),
}));

jest.mock('./eventLogEntries', () => ({
  EventLogEntries: () => <div data-testid="event-log-entries" />,
}));

describe('EventLog', () => {
  const mockStore = configureStore([]);
  const fetchPageType = 'eventLog/FETCH_EVENT_LOG_PAGE_ACTION';

  const createStore = (logPage: { page: number; total: number } | null = { page: 1, total: 1 }) =>
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

  it('loads the first page of the event log with its total and without a lower time bound', () => {
    const store = createStore();

    renderEventLog(store);

    expect(fetchPageActions(store)).toEqual([
      expect.objectContaining({
        page: 1,
        includeTotal: true,
        searchCriteria: { timestampMax: expect.any(String) },
      }),
    ]);
  });

  it('returns to the first page with the new filters when a search is executed', () => {
    const store = createStore({ page: 3, total: 347 });
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

  it('returns to the first page without filters when the filters are reset', () => {
    const store = createStore({ page: 3, total: 347 });
    const { getByTestId } = renderEventLog(store);
    fireEvent.click(getByTestId('event-log-filter-search'));

    fireEvent.click(getByTestId('event-log-filter-reset'));

    expect(fetchPageActions(store).pop()).toEqual(
      expect.objectContaining({ page: 1, includeTotal: true, searchCriteria: { timestampMax: expect.any(String) } }),
    );
  });

  it('keeps the applied filters and pinned upper bound when moving to another page', () => {
    const store = createStore({ page: 1, total: 347 });
    const { getByTestId } = renderEventLog(store);
    fireEvent.click(getByTestId('event-log-filter-search'));
    const searchCriteria = fetchPageActions(store).pop().searchCriteria;

    fireEvent.change(getByTestId('event-log-pagination-page'), { target: { value: '2' } });

    expect(fetchPageActions(store).pop()).toEqual(
      expect.objectContaining({ page: 2, includeTotal: false, searchCriteria }),
    );
  });

  it('shows pagination controls when the results span more than one page', () => {
    const { getByTestId } = renderEventLog(createStore({ page: 1, total: 347 }));

    expect(getByTestId('event-log-pagination')).toBeInTheDocument();
  });

  it('hides pagination controls when every result fits on one page', () => {
    const { queryByTestId } = renderEventLog(createStore({ page: 1, total: 1 }));

    expect(queryByTestId('event-log-pagination')).not.toBeInTheDocument();
  });

  it('no longer offers a Load more control', () => {
    const { queryByText } = renderEventLog(createStore({ page: 1, total: 347 }));

    expect(queryByText('Load more')).not.toBeInTheDocument();
  });

  it('disables CSV download after reset', () => {
    const store = createStore();
    const { getByTestId, container } = render(
      <Provider store={store}>
        <EventLog />
      </Provider>,
    );

    const csvButton = container.querySelector('goa-button[testid="export-event-log-csv"]');
    expect(csvButton).toHaveAttribute('disabled');

    fireEvent.click(getByTestId('event-log-filter-search'));
    expect(csvButton).not.toHaveAttribute('disabled');

    fireEvent.click(getByTestId('event-log-filter-reset'));
    expect(csvButton).toHaveAttribute('disabled');
  });
});
