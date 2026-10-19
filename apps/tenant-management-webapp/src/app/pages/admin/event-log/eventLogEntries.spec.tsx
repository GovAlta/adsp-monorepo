import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventLogEntries } from './eventLogEntries';

describe('EventLogEntries', () => {
  const mockStore = configureStore([]);
  const entry = {
    timestamp: new Date('2026-10-19T19:56:49.000Z'),
    namespace: 'access-service',
    name: 'LOGIN',
    correlationId: 'corr-1',
    details: {},
  };

  const renderEntries = (entries: (typeof entry)[] | null, loading: boolean) =>
    render(
      <Provider store={mockStore({ event: { entries }, session: { indicator: { show: loading } } })}>
        <EventLogEntries onSearch={jest.fn()} />
      </Provider>,
    );

  it('keeps the current page in place under a loading overlay while the next page loads', () => {
    const { getByTestId, getByText } = renderEntries([entry], true);

    expect(getByText('LOGIN')).toBeInTheDocument();
    expect(getByTestId('event-log-loading-overlay')).toBeInTheDocument();
  });

  it('does not overlay the table when nothing is loading', () => {
    const { queryByTestId } = renderEntries([entry], false);

    expect(queryByTestId('event-log-loading-overlay')).not.toBeInTheDocument();
  });

  it('does not overlay an empty table while the first page loads', () => {
    const { queryByTestId } = renderEntries(null, true);

    expect(queryByTestId('event-log-loading-overlay')).not.toBeInTheDocument();
  });
});
