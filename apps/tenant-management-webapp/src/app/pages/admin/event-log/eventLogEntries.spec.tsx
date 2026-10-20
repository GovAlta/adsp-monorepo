import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventLogEntries } from './eventLogEntries';

jest.mock('@components/Indicator', () => ({ PageIndicator: () => <div>Loading events</div> }));
jest.mock('@components/ContextMenu', () => ({
  GoAContextMenu: ({ children }) => <div>{children}</div>,
  GoAContextMenuIcon: () => null,
}));

describe('EventLogEntries', () => {
  const renderEntries = (entries = [], loading = false, show = false) => {
    const store = configureStore([])({
      event: { entries, isLoading: { log: loading } },
      session: { indicator: { show } },
    });
    return render(
      <Provider store={store}>
        <EventLogEntries onSearch={jest.fn()} />
      </Provider>,
    );
  };

  it('prominently displays No Events Found when a search returns no events', () => {
    const { getByRole } = renderEntries();

    expect(getByRole('status')).toHaveTextContent('No Events Found');
    expect(getByRole('status').tagName).toBe('H2');
  });

  it.each([
    [true, false],
    [false, true],
  ])('hides the empty message while loading (%s, %s)', (loading, show) => {
    const { queryByText } = renderEntries([], loading, show);

    expect(queryByText('No Events Found')).not.toBeInTheDocument();
  });

  it('hides the empty message before results arrive', () => {
    const { queryByText } = renderEntries(null);

    expect(queryByText('No Events Found')).not.toBeInTheDocument();
  });
});
