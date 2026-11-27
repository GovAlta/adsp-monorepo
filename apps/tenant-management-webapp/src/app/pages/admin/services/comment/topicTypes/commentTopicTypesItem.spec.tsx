import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CommentTopicTypesItem } from './commentTopicTypesItem';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const topicType = { id: 'type-1', name: 'Type one', securityClassification: 'protected a' };

const renderItem = (onDelete = jest.fn()) =>
  render(
    <MemoryRouter>
      <table>
        <tbody>
          <CommentTopicTypesItem commentTopicType={topicType as never} onDelete={onDelete} />
        </tbody>
      </table>
    </MemoryRouter>,
  );

describe('CommentTopicTypesItem', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('renders the topic type', () => {
    const { getByTestId } = renderItem();
    expect(getByTestId('comment-topic-types-name').textContent).toBe('Type one');
    expect(getByTestId('comment-topic-types-template-id').textContent).toBe('type-1');
  });

  it('navigates to the absolute edit path', () => {
    const { container } = renderItem();
    const edit = container.querySelector('[testid="comment-topic-types-edit"]');
    fireEvent(edit, new CustomEvent('_click'));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/services/comment/edit/type-1');
  });

  it('calls onDelete with the topic type', () => {
    const onDelete = jest.fn();
    const { container } = renderItem(onDelete);
    fireEvent(container.querySelector('[testid="comment-topic-types-delete"]'), new CustomEvent('_click'));
    expect(onDelete).toHaveBeenCalledWith(topicType);
  });
});
