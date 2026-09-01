import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CommentsViewer } from './CommentsViewer';

jest.mock('@abgov/react-components', () => ({
  GoabButton: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  GoabButtonGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  GoabCircularProgress: ({ visible }: { visible: boolean }) => (
    <div data-testid="circular-progress" data-visible={visible} />
  ),
  GoabFormItem: ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label>{label}</label>
      {children}
    </div>
  ),
  GoabIconButton: ({ title, onClick }: { title: string; onClick?: () => void }) => (
    <button type="button" title={title} onClick={onClick} aria-label={title}>
      {title}
    </button>
  ),
  GoabModal: ({ heading, open, children }: { heading: string; open: boolean; children: React.ReactNode }) =>
    open ? (
      <div role="dialog" aria-label={heading}>
        <h4>{heading}</h4>
        {children}
      </div>
    ) : null,
  GoabTextArea: ({
    value,
    disabled,
    onChange,
  }: {
    value: string;
    disabled?: boolean;
    onChange: (detail: { value: string }) => void;
  }) => (
    <textarea
      data-testid="comment-textarea"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange({ value: event.target.value })}
    />
  ),
}));

const createComment = (overrides = {}) => ({
  id: 1,
  byCurrentUser: false,
  createdBy: { id: 'user-1', name: 'Jane Smith' },
  createdOn: new Date(2026, 7, 20, 9, 0, 0),
  content: 'This looks good to me.',
  ...overrides,
});

const createProps = (overrides = {}) => ({
  canComment: true,
  canLoadMore: false,
  comments: [],
  draft: { content: '' },
  loading: false,
  commenting: false,
  onLoadMore: jest.fn(),
  onUpdateDraft: jest.fn(),
  onAddComment: jest.fn(),
  onDeleteComment: jest.fn(),
  ...overrides,
});

describe('CommentsViewer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 7, 21, 10, 0, 0));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  test('renders the default heading when heading is not provided', () => {
    // Arrange
    const props = createProps();

    // Act
    render(<CommentsViewer {...props} />);

    // Assert
    expect(screen.getByText('Comments')).toBeInTheDocument();
  });

  test('renders a custom heading when provided', () => {
    // Arrange
    const props = createProps({ heading: 'Task comments' });

    // Act
    render(<CommentsViewer {...props} />);

    // Assert
    expect(screen.getByText('Task comments')).toBeInTheDocument();
  });

  test('renders the content of each comment', () => {
    // Arrange
    const props = createProps({ comments: [createComment()] });

    // Act
    render(<CommentsViewer {...props} />);

    // Assert
    expect(screen.getByText('This looks good to me.')).toBeInTheDocument();
  });

  test('renders the commenter name when createdBy.name is set', () => {
    // Arrange
    const props = createProps({ comments: [createComment({ createdBy: { id: 'user-1', name: 'Jane Smith' } })] });

    // Act
    render(<CommentsViewer {...props} />);

    // Assert
    expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
  });

  test('renders the anonymousName when createdBy.name is empty', () => {
    // Arrange
    const props = createProps({
      anonymousName: 'Task worker',
      comments: [createComment({ createdBy: { id: 'user-1', name: '' } })],
    });

    // Act
    render(<CommentsViewer {...props} />);

    // Assert
    expect(screen.getByText(/Task worker/)).toBeInTheDocument();
  });

  test('formats the timestamp without a year for a comment created in the current year', () => {
    // Arrange
    const props = createProps({ comments: [createComment({ createdOn: new Date(2026, 7, 20, 9, 0, 0) })] });

    // Act
    render(<CommentsViewer {...props} />);

    // Assert
    expect(screen.getByText('Thursday, 9:00 am')).toBeInTheDocument();
  });

  test('formats the timestamp with a year for a comment created in a past year', () => {
    // Arrange
    const props = createProps({ comments: [createComment({ createdOn: new Date(2024, 2, 1, 9, 0, 0) })] });

    // Act
    render(<CommentsViewer {...props} />);

    // Assert
    expect(screen.getByText('March 1 2024, 9:00 am')).toBeInTheDocument();
  });

  test('names today rather than giving it a weekday', () => {
    // Arrange
    const props = createProps({ comments: [createComment({ createdOn: new Date(2026, 7, 21, 9, 30, 0) })] });

    // Act
    render(<CommentsViewer {...props} />);

    // Assert
    expect(screen.getByText('Today, 9:30 am')).toBeInTheDocument();
  });

  test('formats the timestamp with a date for the same week number of a past year', () => {
    // Arrange
    // Week numbers repeat, so this date falls in the same week of the year as the system time.
    const props = createProps({ comments: [createComment({ createdOn: new Date(2025, 7, 21, 9, 0, 0) })] });

    // Act
    render(<CommentsViewer {...props} />);

    // Assert
    expect(screen.getByText('August 21 2025, 9:00 am')).toBeInTheDocument();
  });

  test('renders a delete button when userId matches the comment creator', () => {
    // Arrange
    const props = createProps({
      userId: 'user-1',
      comments: [createComment({ createdBy: { id: 'user-1', name: 'Jane Smith' } })],
    });

    // Act
    render(<CommentsViewer {...props} />);

    // Assert
    expect(screen.getByTitle('delete message')).toBeInTheDocument();
  });

  test('does not render a delete button when userId does not match the comment creator', () => {
    // Arrange
    const props = createProps({
      userId: 'user-2',
      comments: [createComment({ createdBy: { id: 'user-1', name: 'Jane Smith' } })],
    });

    // Act
    render(<CommentsViewer {...props} />);

    // Assert
    expect(screen.queryByTitle('delete message')).not.toBeInTheDocument();
  });

  test('opens the delete confirmation modal when the delete button is clicked', () => {
    // Arrange
    const props = createProps({
      userId: 'user-1',
      comments: [createComment({ id: 7, createdBy: { id: 'user-1', name: 'Jane Smith' } })],
    });
    render(<CommentsViewer {...props} />);

    // Act
    fireEvent.click(screen.getByTitle('delete message'));

    // Assert
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('closes the delete confirmation modal without deleting when Cancel is clicked', () => {
    // Arrange
    const props = createProps({
      userId: 'user-1',
      comments: [createComment({ id: 7, createdBy: { id: 'user-1', name: 'Jane Smith' } })],
    });
    render(<CommentsViewer {...props} />);
    fireEvent.click(screen.getByTitle('delete message'));

    // Act
    fireEvent.click(screen.getByText('Cancel'));

    // Assert
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('does not call onDeleteComment when Cancel is clicked', () => {
    // Arrange
    const props = createProps({
      userId: 'user-1',
      comments: [createComment({ id: 7, createdBy: { id: 'user-1', name: 'Jane Smith' } })],
    });
    render(<CommentsViewer {...props} />);
    fireEvent.click(screen.getByTitle('delete message'));

    // Act
    fireEvent.click(screen.getByText('Cancel'));

    // Assert
    expect(props.onDeleteComment).not.toHaveBeenCalled();
  });

  test('calls onDeleteComment with the topicId and comment id when Delete is confirmed', async () => {
    // Arrange
    const props = createProps({
      topicId: 42,
      userId: 'user-1',
      comments: [createComment({ id: 7, createdBy: { id: 'user-1', name: 'Jane Smith' } })],
    });
    render(<CommentsViewer {...props} />);
    fireEvent.click(screen.getByTitle('delete message'));

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    // Assert
    await waitFor(() => expect(props.onDeleteComment).toHaveBeenCalledWith(42, 7));
  });

  test('closes the delete confirmation modal after Delete is confirmed', async () => {
    // Arrange
    const props = createProps({
      topicId: 42,
      userId: 'user-1',
      comments: [createComment({ id: 7, createdBy: { id: 'user-1', name: 'Jane Smith' } })],
    });
    render(<CommentsViewer {...props} />);
    fireEvent.click(screen.getByTitle('delete message'));

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    // Assert
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  test('shows the circular progress as visible when loading is true', () => {
    // Arrange
    const props = createProps({ loading: true });

    // Act
    render(<CommentsViewer {...props} />);

    // Assert
    expect(screen.getByTestId('circular-progress')).toHaveAttribute('data-visible', 'true');
  });

  test('renders the Load more button when canLoadMore is true and not loading', () => {
    // Arrange
    const props = createProps({ canLoadMore: true, loading: false });

    // Act
    render(<CommentsViewer {...props} />);

    // Assert
    expect(screen.getByText('Load more')).toBeInTheDocument();
  });

  test('does not render the Load more button while loading', () => {
    // Arrange
    const props = createProps({ canLoadMore: true, loading: true });

    // Act
    render(<CommentsViewer {...props} />);

    // Assert
    expect(screen.queryByText('Load more')).not.toBeInTheDocument();
  });

  test('does not render the Load more button when canLoadMore is false', () => {
    // Arrange
    const props = createProps({ canLoadMore: false, loading: false });

    // Act
    render(<CommentsViewer {...props} />);

    // Assert
    expect(screen.queryByText('Load more')).not.toBeInTheDocument();
  });

  test('calls onLoadMore when the Load more button is clicked', () => {
    // Arrange
    const props = createProps({ canLoadMore: true, loading: false });
    render(<CommentsViewer {...props} />);

    // Act
    fireEvent.click(screen.getByText('Load more'));

    // Assert
    expect(props.onLoadMore).toHaveBeenCalled();
  });

  test('disables the comment textarea when canComment is false', () => {
    // Arrange
    const props = createProps({ canComment: false });

    // Act
    render(<CommentsViewer {...props} />);

    // Assert
    expect(screen.getByTestId('comment-textarea')).toBeDisabled();
  });

  test('calls onUpdateDraft with the new content when the textarea changes', () => {
    // Arrange
    const props = createProps({ draft: { title: 'Summary', content: '' } });
    render(<CommentsViewer {...props} />);

    // Act
    fireEvent.change(screen.getByTestId('comment-textarea'), { target: { value: 'A new comment' } });

    // Assert
    expect(props.onUpdateDraft).toHaveBeenCalledWith({ title: 'Summary', content: 'A new comment' });
  });

  test('disables the Clear button when the draft has no content', () => {
    // Arrange
    const props = createProps({ draft: { content: '' } });

    // Act
    render(<CommentsViewer {...props} />);

    // Assert
    expect(screen.getByText('Clear')).toBeDisabled();
  });

  test('calls onUpdateDraft with null content when Clear is clicked', () => {
    // Arrange
    const props = createProps({ draft: { title: 'Summary', content: 'Draft text' } });
    render(<CommentsViewer {...props} />);

    // Act
    fireEvent.click(screen.getByText('Clear'));

    // Assert
    expect(props.onUpdateDraft).toHaveBeenCalledWith({ title: 'Summary', content: null });
  });

  test('disables the add comment button when the draft has no content', () => {
    // Arrange
    const props = createProps({ draft: { content: '' }, addCommentLabel: 'Post comment' });

    // Act
    render(<CommentsViewer {...props} />);

    // Assert
    expect(screen.getByRole('button', { name: 'Post comment' })).toBeDisabled();
  });

  test('disables the add comment button while commenting is in progress', () => {
    // Arrange
    const props = createProps({
      draft: { content: 'Draft text' },
      commenting: true,
      addCommentLabel: 'Post comment',
    });

    // Act
    render(<CommentsViewer {...props} />);

    // Assert
    expect(screen.getByRole('button', { name: 'Post comment' })).toBeDisabled();
  });

  test('calls onAddComment with the draft when the add comment button is clicked', () => {
    // Arrange
    const draft = { title: 'Summary', content: 'Draft text' };
    const props = createProps({ draft, addCommentLabel: 'Post comment' });
    render(<CommentsViewer {...props} />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Post comment' }));

    // Assert
    expect(props.onAddComment).toHaveBeenCalledWith(draft);
  });
  test('marks a comment from the current user so the messaging layout can position it', () => {
    const props = createProps({ comments: [createComment({ byCurrentUser: true })] });
    const { container } = render(<CommentsViewer {...props} messaging={true} />);

    expect(container.querySelector('.comment')).toHaveAttribute('data-user-comment', 'true');
  });

  test('marks a comment from the other participant so the messaging layout can position it', () => {
    const props = createProps({ comments: [createComment({ byCurrentUser: false })] });
    const { container } = render(<CommentsViewer {...props} messaging={true} />);

    expect(container.querySelector('.comment')).toHaveAttribute('data-user-comment', 'false');
  });

  test('gives sent and received messages distinct backgrounds in the messaging layout', () => {
    const props = createProps({
      comments: [createComment({ id: 1, byCurrentUser: false }), createComment({ id: 2, byCurrentUser: true })],
    });
    const { container } = render(<CommentsViewer {...props} messaging={true} />);

    const [received, sent] = Array.from(container.querySelectorAll('.comment .message'));

    expect(getComputedStyle(received).background).not.toBe(getComputedStyle(sent).background);
  });
  test('leaves sent and received messages styled alike without the messaging layout', () => {
    const props = createProps({
      comments: [createComment({ id: 1, byCurrentUser: false }), createComment({ id: 2, byCurrentUser: true })],
    });
    const { container } = render(<CommentsViewer {...props} />);

    const [received, sent] = Array.from(container.querySelectorAll('.comment .message'));

    expect(getComputedStyle(received).background).toBe(getComputedStyle(sent).background);
  });
  test('uses light text on the dark sent bubble in the messaging layout', () => {
    const props = createProps({
      comments: [createComment({ id: 1, byCurrentUser: false }), createComment({ id: 2, byCurrentUser: true })],
    });
    const { container } = render(<CommentsViewer {...props} messaging={true} />);

    const [received, sent] = Array.from(container.querySelectorAll('.comment .message p'));

    expect(getComputedStyle(received).color).not.toBe(getComputedStyle(sent).color);
  });

  test('sits each bubble on its own side, sized to its own content', () => {
    const props = createProps({
      comments: [createComment({ id: 1, byCurrentUser: false }), createComment({ id: 2, byCurrentUser: true })],
    });
    const { container } = render(<CommentsViewer {...props} messaging={true} />);

    const [received, sent] = Array.from(container.querySelectorAll('.comment .message'));

    // Each bubble is placed in its own grid cell, so it sizes independently of the byline.
    expect(getComputedStyle(received).justifySelf).toBe('start');
    expect(getComputedStyle(sent).justifySelf).toBe('end');
  });
  test('carries one byline for a run of messages from the same person', () => {
    const props = createProps({
      comments: [
        createComment({ id: 1, createdBy: { id: 'a', name: 'Abhishek' } }),
        createComment({ id: 2, createdBy: { id: 'a', name: 'Abhishek' } }),
        createComment({ id: 3, createdBy: { id: 'b', name: 'Sreesh' } }),
      ],
    });
    const { container } = render(<CommentsViewer {...props} messaging={true} />);

    expect(container.querySelectorAll('.message')).toHaveLength(3);
    expect(container.querySelectorAll('.byline')).toHaveLength(2);
    expect(container.querySelectorAll('.comment')[1]).toHaveAttribute('data-continues', 'true');
  });

  test('gives every comment its own byline without the messaging layout', () => {
    const props = createProps({
      comments: [
        createComment({ id: 1, createdBy: { id: 'a', name: 'Abhishek' } }),
        createComment({ id: 2, createdBy: { id: 'a', name: 'Abhishek' } }),
      ],
    });
    const { container } = render(<CommentsViewer {...props} />);

    expect(container.querySelectorAll('.byline')).toHaveLength(2);
  });

  test('keeps a delete control on a grouped message', () => {
    const props = createProps({
      comments: [
        createComment({ id: 1, createdBy: { id: 'a', name: 'Abhishek' } }),
        createComment({ id: 2, createdBy: { id: 'a', name: 'Abhishek' } }),
      ],
      userId: 'a',
    });
    const { getAllByTitle } = render(<CommentsViewer {...props} messaging={true} />);

    // The control sits outside the byline, so grouping must not take it away.
    expect(getAllByTitle('delete message')).toHaveLength(2);
  });
  test('reserves no heading space when the caller passes a blank heading', () => {
    const props = createProps();
    const { container } = render(<CommentsViewer {...props} heading=" " messaging={true} />);

    expect(container.querySelector('h3')).toBeNull();
  });
  test('caps a bubble well short of the full width', () => {
    const props = createProps({ comments: [createComment({ content: 'a'.repeat(400) })] });
    const { container } = render(<CommentsViewer {...props} messaging={true} />);

    // Without a cap a long message fills the pane and loses the sense of which side it came from.
    expect(getComputedStyle(container.querySelector('.message')).maxWidth).toBe('80%');
  });
});
