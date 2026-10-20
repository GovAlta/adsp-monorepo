import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventLogPagination } from './eventLogPagination';

describe('EventLogPagination', () => {
  const onPage = jest.fn();
  const onPageSize = jest.fn();
  const props = { page: 1, pageSize: 10, shownCount: 10, total: 347, onPage, onPageSize };
  const pageSizeDropdown = (container: HTMLElement) =>
    container.querySelector('goa-dropdown[name="event-log-page-size"]');

  afterEach(() => {
    onPage.mockReset();
    onPageSize.mockReset();
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

  it('offers 10, 20 or 30 events per page with the current page size selected', () => {
    const { container } = render(<EventLogPagination {...props} pageSize={20} />);

    const dropdown = pageSizeDropdown(container);
    expect(dropdown).toHaveAttribute('value', '20');
    expect(
      Array.from(dropdown.querySelectorAll('goa-dropdown-item')).map((item) => item.getAttribute('value')),
    ).toEqual(['10', '20', '30']);
  });

  it('labels the page size dropdown as show per page', () => {
    const { getByText } = render(<EventLogPagination {...props} />);

    expect(getByText('Show')).toBeInTheDocument();
    expect(getByText('per page')).toBeInTheDocument();
  });

  it('changes the number of events per page to the size chosen', () => {
    const { container } = render(<EventLogPagination {...props} />);

    fireEvent(pageSizeDropdown(container), new CustomEvent('_change', { detail: { value: '30' } }));

    expect(onPageSize).toHaveBeenCalledWith(30);
  });

  it('counts the shown range and pages using the selected page size', () => {
    const { getByTestId, getByText } = render(<EventLogPagination {...props} page={2} pageSize={30} shownCount={30} />);

    expect(getByTestId('event-log-result-count')).toHaveTextContent('Showing 31–60 of 347 events');
    expect(getByText('of 12')).toBeInTheDocument();
  });

  it('does not offer a page size when every event fits on the smallest page', () => {
    const { container } = render(<EventLogPagination {...props} shownCount={10} total={10} />);

    expect(pageSizeDropdown(container)).not.toBeInTheDocument();
  });

  it('keeps offering a page size when every event fits on a larger selected page', () => {
    const { container, queryByTestId } = render(
      <EventLogPagination {...props} pageSize={30} shownCount={15} total={15} />,
    );

    expect(pageSizeDropdown(container)).toBeInTheDocument();
    expect(queryByTestId('event-log-pagination')).not.toBeInTheDocument();
  });
});
