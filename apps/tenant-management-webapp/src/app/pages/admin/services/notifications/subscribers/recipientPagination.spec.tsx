import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RecipientPagination } from './recipientPagination';

describe('RecipientPagination', () => {
  const props = {
    pageIndex: 0,
    pageSize: 10,
    shownCount: 10,
    total: 34,
    hasNext: true,
    onPage: jest.fn(),
  };

  beforeEach(() => props.onPage.mockReset());

  it('says how many recipients are showing out of the total', () => {
    const { getByTestId } = render(<RecipientPagination {...props} />);
    expect(getByTestId('recipient-result-count')).toHaveTextContent('Showing 1–10 of 34 recipients');
  });

  it('counts from the start of the page being shown', () => {
    const { getByTestId } = render(<RecipientPagination {...props} pageIndex={2} shownCount={4} />);
    expect(getByTestId('recipient-result-count')).toHaveTextContent('Showing 21–24 of 34 recipients');
  });

  it('says so when there is nothing to show', () => {
    const { getByTestId } = render(<RecipientPagination {...props} shownCount={0} total={0} hasNext={false} />);
    expect(getByTestId('recipient-result-count')).toHaveTextContent('No recipients to show');
  });

  it('shows the page currently being viewed, counting from one', () => {
    const { getByTestId } = render(<RecipientPagination {...props} pageIndex={2} />);
    expect(getByTestId('recipient-page-number')).toHaveTextContent('3');
    expect(getByTestId('recipient-page-number')).toHaveAttribute('aria-label', 'Page 3');
  });

  it('moves to the next and previous page', () => {
    const { baseElement } = render(<RecipientPagination {...props} pageIndex={1} />);

    fireEvent(baseElement.querySelector("goa-icon-button[testId='recipient-page-next']"), new CustomEvent('_click'));
    expect(props.onPage).toHaveBeenCalledWith(2);

    fireEvent(
      baseElement.querySelector("goa-icon-button[testId='recipient-page-previous']"),
      new CustomEvent('_click'),
    );
    expect(props.onPage).toHaveBeenCalledWith(0);
  });

  it('cannot move back from the first page', () => {
    const { baseElement } = render(<RecipientPagination {...props} pageIndex={0} />);
    expect(baseElement.querySelector("goa-icon-button[testId='recipient-page-previous']")).toHaveAttribute('disabled');
  });

  it('cannot move past the last page', () => {
    const { baseElement } = render(<RecipientPagination {...props} hasNext={false} />);
    expect(baseElement.querySelector("goa-icon-button[testId='recipient-page-next']")).toHaveAttribute('disabled');
  });
});
