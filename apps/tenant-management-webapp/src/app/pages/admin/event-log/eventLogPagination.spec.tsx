import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventLogPagination } from './eventLogPagination';

describe('EventLogPagination', () => {
  const onPage = jest.fn();
  const props = { page: 1, pageSize: 10, shownCount: 10, total: 347, onPage };

  afterEach(() => {
    onPage.mockReset();
  });

  it('shows the range being displayed and the total number of matching events', () => {
    const { getByTestId } = render(<EventLogPagination {...props} page={6} />);

    expect(getByTestId('event-log-result-count')).toHaveTextContent('Showing 51–60 of 347 events');
  });

  it('ends the range at the last event on a partial final page', () => {
    const { getByTestId } = render(<EventLogPagination {...props} page={35} shownCount={7} />);

    expect(getByTestId('event-log-result-count')).toHaveTextContent('Showing 341–347 of 347 events');
  });

  it('shows the result count but no page controls when every event fits on one page', () => {
    const { getByTestId, queryByTestId } = render(<EventLogPagination {...props} shownCount={4} total={4} />);

    expect(getByTestId('event-log-result-count')).toHaveTextContent('Showing 1–4 of 4 events');
    expect(queryByTestId('event-log-pagination')).not.toBeInTheDocument();
  });

  it('renders nothing when no events match', () => {
    const { container } = render(<EventLogPagination {...props} shownCount={0} total={0} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the current page out of the number of pages of matching events', () => {
    const { getByTestId, getByText } = render(<EventLogPagination {...props} page={6} />);

    expect(getByTestId('event-log-pagination-page')).toHaveValue('6');
    expect(getByText('of 35')).toBeInTheDocument();
  });

  it('loads the page chosen in the pagination', () => {
    const { getByTestId } = render(<EventLogPagination {...props} page={6} />);

    fireEvent.change(getByTestId('event-log-pagination-page'), { target: { value: '35' } });

    expect(onPage).toHaveBeenCalledWith(35);
  });
});
