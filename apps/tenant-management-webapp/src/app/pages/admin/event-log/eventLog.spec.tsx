import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventLog } from './eventLog';

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
        data-testid="event-log-search"
        onClick={() => onSearch?.({ namespace: 'form-service', name: 'form-created' })}
      >
        Search
      </button>
      <button data-testid="event-log-reset" onClick={() => onCancel?.()}>
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

  const createStore = () =>
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

  it('loads the initial event log without a time range', () => {
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
    expect(fetchActions[0].searchCriteria).toBeUndefined();
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

    fireEvent.click(getByTestId('event-log-search'));
    expect(csvButton).not.toHaveAttribute('disabled');

    fireEvent.click(getByTestId('event-log-reset'));
    expect(csvButton).toHaveAttribute('disabled');
  });
});
