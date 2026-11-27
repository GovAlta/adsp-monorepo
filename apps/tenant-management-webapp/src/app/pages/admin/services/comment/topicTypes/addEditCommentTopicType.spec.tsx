import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { AddEditCommentTopicType } from './addEditCommentTopicType';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const store = configureStore()({
  comment: { topicTypes: { existing: { id: 'existing', name: 'existing' } }, core: {} },
  session: { indicator: { show: false } },
});

const renderModal = (isEdit: boolean, onSave = jest.fn(), onClose = jest.fn()) =>
  render(
    <Provider store={store}>
      <MemoryRouter>
        <AddEditCommentTopicType
          open={true}
          isEdit={isEdit}
          initialValue={{ id: 'new-type', name: 'new-type' } as never}
          onSave={onSave}
          onClose={onClose}
        />
      </MemoryRouter>
    </Provider>,
  );

describe('AddEditCommentTopicType', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('saves a new topic type and navigates to its absolute edit path', () => {
    const onSave = jest.fn();
    const onClose = jest.fn();
    const { container } = renderModal(false, onSave, onClose);
    fireEvent(container.querySelector('[testid="comment-save"]'), new CustomEvent('_click'));
    expect(onSave).toHaveBeenCalledWith({ id: 'new-type', name: 'new-type' });
    expect(onClose).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/admin/services/comment/edit/new-type');
  });

  it('closes without navigating when editing', () => {
    const onClose = jest.fn();
    const { container } = renderModal(true, jest.fn(), onClose);
    fireEvent(container.querySelector('[testid="comment-save"]'), new CustomEvent('_click'));
    expect(onClose).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
