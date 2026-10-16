import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventLogPagination, getPageItems } from './eventLogPagination';

describe('getPageItems', () => {
  it('lists every page when there are only a few', () => {
    const items = getPageItems(2, 5);

    expect(items).toEqual([1, 2, 3, 4, 5]);
  });

  it.each([
    [1, [1, 2, 3, 4, 5, 'ellipsis', 35]],
    [4, [1, 2, 3, 4, 5, 'ellipsis', 35]],
    [18, [1, 'ellipsis', 17, 18, 19, 'ellipsis', 35]],
    [32, [1, 'ellipsis', 31, 32, 33, 34, 35]],
    [35, [1, 'ellipsis', 31, 32, 33, 34, 35]],
  ])('collapses distant pages into ellipses when on page %d of 35', (page, expected) => {
    const items = getPageItems(page, 35);

    expect(items).toEqual(expected);
  });

  it('never returns more than seven items however many pages there are', () => {
    const items = getPageItems(5000, 10000);

    expect(items).toHaveLength(7);
  });
});

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

  it('marks the current page', () => {
    const { getByTestId } = render(<EventLogPagination {...props} page={3} />);

    expect(getByTestId('event-log-page-3')).toHaveAttribute('aria-current', 'page');
  });

  it('does not mark other pages as current', () => {
    const { getByTestId } = render(<EventLogPagination {...props} page={3} />);

    expect(getByTestId('event-log-page-2')).not.toHaveAttribute('aria-current');
  });

  it.each([
    ['event-log-page-first', 1],
    ['event-log-page-previous', 17],
    ['event-log-page-19', 19],
    ['event-log-page-next', 19],
    ['event-log-page-last', 35],
  ])('navigates with %s to page %d', (testId, expectedPage) => {
    const { getByTestId } = render(<EventLogPagination {...props} page={18} />);

    fireEvent.click(getByTestId(testId));

    expect(onPage).toHaveBeenCalledWith(expectedPage);
  });

  it('does not reload the page already being displayed', () => {
    const { getByTestId } = render(<EventLogPagination {...props} page={3} />);

    fireEvent.click(getByTestId('event-log-page-3'));

    expect(onPage).not.toHaveBeenCalled();
  });

  it.each(['event-log-page-first', 'event-log-page-previous'])('disables %s on the first page', (testId) => {
    const { getByTestId } = render(<EventLogPagination {...props} page={1} />);

    expect(getByTestId(testId)).toBeDisabled();
  });

  it.each(['event-log-page-next', 'event-log-page-last'])('disables %s on the last page', (testId) => {
    const { getByTestId } = render(<EventLogPagination {...props} page={35} shownCount={7} />);

    expect(getByTestId(testId)).toBeDisabled();
  });

  it.each(['event-log-page-first', 'event-log-page-2', 'event-log-page-next'])(
    'disables %s while a page is loading',
    (testId) => {
      const { getByTestId } = render(<EventLogPagination {...props} page={3} disabled />);

      expect(getByTestId(testId)).toBeDisabled();
    },
  );
});
