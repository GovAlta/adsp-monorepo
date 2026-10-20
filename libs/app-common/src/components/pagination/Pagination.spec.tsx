import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Pagination } from './Pagination';

const buttonOf = (baseElement: HTMLElement, testId: string) =>
  baseElement.querySelector(`goa-button[testid='${testId}']`);

describe('Pagination', () => {
  const onChange = jest.fn();
  const props = { itemCount: 347, pageNumber: 6, onChange };

  afterEach(() => {
    onChange.mockReset();
  });

  it('shows the current page out of the page count', () => {
    const { getByTestId, getByText } = render(<Pagination {...props} />);

    expect(getByTestId('pagination-page')).toHaveValue('6');
    expect(getByText('of 35')).toBeInTheDocument();
  });

  it('counts pages using the page size', () => {
    const { getByText } = render(<Pagination {...props} perPageCount={50} />);

    expect(getByText('of 7')).toBeInTheDocument();
  });

  it('offers every page in the page select', () => {
    const { getByTestId } = render(<Pagination {...props} />);

    expect(getByTestId('pagination-page').querySelectorAll('option')).toHaveLength(35);
  });

  it('moves to the page chosen in the page select', () => {
    const { getByTestId } = render(<Pagination {...props} />);

    fireEvent.change(getByTestId('pagination-page'), { target: { value: '35' } });

    expect(onChange).toHaveBeenCalledWith({ page: 35 });
  });

  it.each([
    ['pagination-previous', 5],
    ['pagination-next', 7],
  ])('moves with %s to page %d', (testId, page) => {
    const { baseElement } = render(<Pagination {...props} />);

    fireEvent(buttonOf(baseElement, testId), new CustomEvent('_click'));

    expect(onChange).toHaveBeenCalledWith({ page });
  });

  it('cannot move back from the first page', () => {
    const { baseElement } = render(<Pagination {...props} pageNumber={1} />);

    expect(buttonOf(baseElement, 'pagination-previous')).toHaveAttribute('disabled');
  });

  it('cannot move past the last page', () => {
    const { baseElement } = render(<Pagination {...props} pageNumber={35} />);

    expect(buttonOf(baseElement, 'pagination-next')).toHaveAttribute('disabled');
  });

  it('shows only previous and next in the links only variant', () => {
    const { baseElement, queryByTestId } = render(<Pagination {...props} variant="links-only" />);

    expect(queryByTestId('pagination-page')).not.toBeInTheDocument();
    expect(buttonOf(baseElement, 'pagination-next')).toBeInTheDocument();
  });

  it('prefixes its controls with the supplied test ID', () => {
    const { getByTestId } = render(<Pagination {...props} testId="event-log-pagination" />);

    expect(getByTestId('event-log-pagination-page')).toBeInTheDocument();
  });
});
