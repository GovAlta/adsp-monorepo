import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DeleteConfirmationsView } from './deleteConfirmationsView';
import { FeedbackSite } from '@store/feedback/models';
import '@testing-library/jest-dom';
interface siteDeleteProps {
  site: FeedbackSite;
  onCancel?: () => void;
  deleteSite?: () => void;
}
const mockStore = configureStore([]);

const store = mockStore({
  indicator: { show: false },
});
describe('DeleteConfirmationsView', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  const defaultProps = {
    onCancel: mockOnClose,
    deleteSite: mockOnConfirm,
    site: { url: 'https://test.com', allowAnonymous: true },
  };
  const open = true;

  it('should render the dialog with the correct site name', () => {
    const { baseElement } = render(
      <Provider store={store}>
        <DeleteConfirmationsView {...defaultProps} />
      </Provider>
    );
    const modal = baseElement.querySelector('goa-modal');
    expect(modal).toBeInTheDocument();
    const { getByText } = within(screen.getByTestId('deleteMsg'));
    const customTextMatcher = (content, element) => {
      const hasText = (node) => node.textContent === 'Are you sure you wish to delete https://test.com?';
      const elementHasText = hasText(element);
      const childrenDontHaveText = Array.from(element.children).every((child) => !hasText(child));
      return elementHasText && childrenDontHaveText;
    };

    expect(getByText(customTextMatcher)).toBeInTheDocument();
  });

  it('should call onClose when the cancel button is clicked', () => {
    render(
      <Provider store={store}>
        <DeleteConfirmationsView {...defaultProps} />
      </Provider>
    );
    fireEvent(screen.getByText('Cancel'), new CustomEvent('_click'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onConfirm when the delete button is clicked', () => {
    render(
      <Provider store={store}>
        <DeleteConfirmationsView {...defaultProps} />
      </Provider>
    );
    fireEvent(screen.getByText('Delete'), new CustomEvent('_click'));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });
});
