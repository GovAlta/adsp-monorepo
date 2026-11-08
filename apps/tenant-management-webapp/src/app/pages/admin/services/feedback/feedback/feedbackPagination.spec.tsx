import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeedbackPagination } from './feedbackPagination';

const buttonOf = (baseElement: HTMLElement, testId: string) =>
  baseElement.querySelector(`goa-button[testid='${testId}']`);

describe('FeedbackPagination', () => {
  const onPage = jest.fn();
  const onPageSize = jest.fn();
  // 55 responses at 20 per page is three pages: 1–20, 21–40 and 41–55.
  const props = { page: 1, pageSize: 20, shownCount: 20, total: 55, onPage, onPageSize };
  const pageSizeDropdown = (container: HTMLElement) =>
    container.querySelector('goa-dropdown[name="feedback-page-size"]');

  afterEach(() => {
    onPage.mockReset();
    onPageSize.mockReset();
  });

  describe('first page', () => {
    it('shows the first range, the current page and the page count', () => {
      const { getByTestId, getByText } = render(<FeedbackPagination {...props} />);

      expect(getByTestId('feedback-result-count')).toHaveTextContent('Showing 1–20 of 55 responses');
      expect(getByTestId('feedback-pagination-page')).toHaveValue('1');
      expect(getByText('of 3')).toBeInTheDocument();
    });

    it('disables previous and enables next', () => {
      const { baseElement } = render(<FeedbackPagination {...props} />);

      expect(buttonOf(baseElement, 'feedback-pagination-previous')).toHaveAttribute('disabled');
      expect(buttonOf(baseElement, 'feedback-pagination-next')).not.toHaveAttribute('disabled');
    });

    it('loads the next page', () => {
      const { baseElement } = render(<FeedbackPagination {...props} />);

      fireEvent(buttonOf(baseElement, 'feedback-pagination-next'), new CustomEvent('_click'));

      expect(onPage).toHaveBeenCalledWith(2);
    });
  });

  describe('intermediate page', () => {
    it('shows the middle range with previous and next both enabled', () => {
      const { baseElement, getByTestId } = render(<FeedbackPagination {...props} page={2} />);

      expect(getByTestId('feedback-result-count')).toHaveTextContent('Showing 21–40 of 55 responses');
      expect(buttonOf(baseElement, 'feedback-pagination-previous')).not.toHaveAttribute('disabled');
      expect(buttonOf(baseElement, 'feedback-pagination-next')).not.toHaveAttribute('disabled');
    });

    it('loads the previous page', () => {
      const { baseElement } = render(<FeedbackPagination {...props} page={2} />);

      fireEvent(buttonOf(baseElement, 'feedback-pagination-previous'), new CustomEvent('_click'));

      expect(onPage).toHaveBeenCalledWith(1);
    });
  });

  describe('last page', () => {
    it('ends the range at the last response and disables next', () => {
      const { baseElement, getByTestId } = render(<FeedbackPagination {...props} page={3} shownCount={15} />);

      expect(getByTestId('feedback-result-count')).toHaveTextContent('Showing 41–55 of 55 responses');
      expect(buttonOf(baseElement, 'feedback-pagination-previous')).not.toHaveAttribute('disabled');
      expect(buttonOf(baseElement, 'feedback-pagination-next')).toHaveAttribute('disabled');
    });
  });

  describe('single page', () => {
    it('shows page 1 of 1 with both controls disabled', () => {
      const { baseElement, getByTestId, getByText } = render(
        <FeedbackPagination {...props} shownCount={1} total={1} />,
      );

      expect(getByTestId('feedback-result-count')).toHaveTextContent('Showing 1–1 of 1 response');
      expect(getByText('of 1')).toBeInTheDocument();
      expect(buttonOf(baseElement, 'feedback-pagination-previous')).toHaveAttribute('disabled');
      expect(buttonOf(baseElement, 'feedback-pagination-next')).toHaveAttribute('disabled');
    });
  });

  describe('page size selector', () => {
    it('is hidden when every response fits on the smallest page', () => {
      const { container, getByTestId } = render(<FeedbackPagination {...props} shownCount={10} total={10} />);

      expect(pageSizeDropdown(container)).not.toBeInTheDocument();
      expect(getByTestId('feedback-result-count')).toHaveTextContent('Showing 1–10 of 10 responses');
    });

    it('is shown once the responses no longer fit on the smallest page', () => {
      const { container } = render(<FeedbackPagination {...props} shownCount={11} total={11} />);

      expect(pageSizeDropdown(container)).toBeInTheDocument();
    });
  });

  describe('empty page', () => {
    it('renders nothing when no feedback matches', () => {
      const { container } = render(<FeedbackPagination {...props} shownCount={0} total={0} />);

      expect(container).toBeEmptyDOMElement();
    });
  });

  it('loads the page chosen in the page select', () => {
    const { getByTestId } = render(<FeedbackPagination {...props} />);

    fireEvent.change(getByTestId('feedback-pagination-page'), { target: { value: '3' } });

    expect(onPage).toHaveBeenCalledWith(3);
  });

  it('offers 10, 20, 50 or 100 responses per page with the current size selected', () => {
    const { container } = render(<FeedbackPagination {...props} pageSize={50} shownCount={50} />);

    const dropdown = pageSizeDropdown(container);
    expect(dropdown).toHaveAttribute('value', '50');
    expect(
      Array.from(dropdown.querySelectorAll('goa-dropdown-item')).map((item) => item.getAttribute('value')),
    ).toEqual(['10', '20', '50', '100']);
  });

  it('counts pages using the selected page size', () => {
    const { getByText } = render(<FeedbackPagination {...props} pageSize={10} shownCount={10} />);

    expect(getByText('of 6')).toBeInTheDocument();
  });

  it('reports the chosen page size as a number', () => {
    const { container } = render(<FeedbackPagination {...props} />);

    fireEvent(
      pageSizeDropdown(container),
      new CustomEvent('_change', { detail: { name: 'feedback-page-size', value: '100' } }),
    );

    expect(onPageSize).toHaveBeenCalledWith(100);
  });
});
