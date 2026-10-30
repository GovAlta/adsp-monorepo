import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InternalAdspConversation, type AdspConversationMessage } from './internal-adsp-conversation';
import type { ReactNode } from 'react';

jest.mock('@abgov/react-components', () => ({
  GoabButton: ({
    children,
    onClick,
    disabled,
  }: {
    children: ReactNode;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  GoabCallout: ({ children, heading, testId }: { children: ReactNode; heading?: string; testId?: string }) => (
    <section data-testid={testId}>
      {heading && <h2>{heading}</h2>}
      <div>{children}</div>
    </section>
  ),
  GoabIconButton: ({
    title,
    onClick,
  }: {
    title?: string;
    onClick?: () => void;
  }) => (
    <button type="button" aria-label={title} onClick={onClick}>
      icon
    </button>
  ),
}));

const messages: AdspConversationMessage[] = [
  {
    id: 2,
    direction: 'received',
    sender: 'Reviewer',
    timestamp: '2026-01-02T10:01:00.000Z',
    content: 'Second message',
  },
  {
    id: 1,
    direction: 'sent',
    sender: 'Applicant',
    timestamp: '2026-01-02T10:00:00.000Z',
    content: 'First message',
  },
];

describe('InternalAdspConversation', () => {
  test('renders messages in chronological order', () => {
    render(<InternalAdspConversation topic="topic-a" messages={messages} />);

    const first = screen.getByText('First message');
    const second = screen.getByText('Second message');

    expect(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('shows empty state when no messages', () => {
    render(<InternalAdspConversation topic="topic-a" messages={[]} emptyText="No conversation yet" />);

    expect(screen.getByText('No conversation yet')).toBeInTheDocument();
  });

  test('shows loading and error states', () => {
    const { rerender } = render(<InternalAdspConversation topic="topic-a" messages={[]} loading={true} />);
    expect(screen.getByText('Loading messages...')).toBeInTheDocument();

    rerender(<InternalAdspConversation topic="topic-a" messages={[]} error="Unable to load" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load');
  });

  test('supports controlled draft via onDraftChange', () => {
    const onDraftChange = jest.fn();

    render(<InternalAdspConversation topic="topic-a" messages={[]} draft="Controlled" onDraftChange={onDraftChange} />);

    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Updated' } });
    expect(onDraftChange).toHaveBeenCalledWith('Updated');
  });

  test('sends with includeNotifications mapped to requiresAttention', async () => {
    const onSend = jest.fn();

    render(
      <InternalAdspConversation
        topic="topic-a"
        typeId="form-questions"
        messages={[]}
        includeNotifications={true}
        onSend={onSend}
      />,
    );

    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Hello there' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    });

    expect(onSend).toHaveBeenCalledWith({
      topic: 'topic-a',
      typeId: 'form-questions',
      includeNotifications: true,
      requiresAttention: true,
      content: 'Hello there',
    });
    await waitFor(() => expect(screen.getByLabelText('Message')).toHaveValue(''));
  });

  test('does not send for empty or whitespace drafts', async () => {
    const onSend = jest.fn();
    render(<InternalAdspConversation topic="topic-a" messages={[]} onSend={onSend} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: '   ' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    });

    expect(onSend).not.toHaveBeenCalled();
  });

  test('shows notification when send fails', async () => {
    const onSend = jest.fn().mockRejectedValue(new Error('Send failed.'));
    render(<InternalAdspConversation topic="topic-a" messages={[]} onSend={onSend} />);

    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Hello there' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    });

    expect(screen.getByTestId('adsp-conversation-send-error')).toBeInTheDocument();
    expect(screen.getByText('Unable to send message')).toBeInTheDocument();
    expect(screen.getByText('Send failed.')).toBeInTheDocument();
  });

  test('disables send when canSend is false', () => {
    render(<InternalAdspConversation topic="topic-a" messages={[]} canSend={false} />);

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    expect(screen.getByLabelText('Message')).toBeDisabled();
  });

  test('does not render actions when delete is unavailable', () => {
    render(
      <InternalAdspConversation
        topic="topic-a"
        messages={[{ ...messages[0], canDelete: false }]}
        onDelete={jest.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Delete message 2' })).not.toBeInTheDocument();
  });

  test('triggers delete action directly', () => {
    const onDelete = jest.fn();

    render(
      <InternalAdspConversation topic="topic-a" messages={[{ ...messages[0], canDelete: true }]} onDelete={onDelete} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete message 2' }));

    expect(onDelete).toHaveBeenCalledWith(2);
  });

  test('renders delete action outside the message bubble container', () => {
    render(
      <InternalAdspConversation topic="topic-a" messages={[{ ...messages[0], canDelete: true }]} onDelete={jest.fn()} />,
    );

    const deleteButton = screen.getByRole('button', { name: 'Delete message 2' });
    const message = deleteButton.closest('.adsp-conversation__message');
    const messageBody = message?.querySelector('.adsp-conversation__message-body');

    expect(message).toBeTruthy();
    expect(messageBody).toBeTruthy();
    expect(messageBody).not.toContainElement(deleteButton);
  });

  test('does not render delete confirmation dialog', () => {
    render(
      <InternalAdspConversation
        topic="topic-a"
        messages={[{ ...messages[0], canDelete: true }]}
        onDelete={jest.fn()}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('applies explicit height style on root', () => {
    render(<InternalAdspConversation topic="topic-a" messages={[]} height="300px" testId="conversation" />);

    expect(screen.getByTestId('conversation')).toHaveStyle({ height: '300px' });
  });

  test('applies component theme override variables', () => {
    render(
      <InternalAdspConversation
        topic="topic-a"
        messages={[]}
        themeOverrides={{ sentBackground: '#0055aa' }}
        testId="conversation"
      />,
    );

    const variable = screen
      .getByTestId('conversation')
      .style.getPropertyValue('--adsp-components-conversation-sent-background');

    expect(variable).toBe('#0055aa');
  });

  test('shows default max message length beside the label', () => {
    render(<InternalAdspConversation topic="topic-a" messages={[]} />);

    expect(screen.getByText('Max 400 characters.')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toHaveAttribute('maxLength', '400');
  });

  test('supports custom max message length', () => {
    render(<InternalAdspConversation topic="topic-a" messages={[]} maxMessageLength={500} />);

    expect(screen.getByText('Max 500 characters.')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toHaveAttribute('maxLength', '500');
  });
});
