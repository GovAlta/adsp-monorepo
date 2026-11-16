import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentChat } from './AgentChat';
import { AgentMessage, ToolCall } from '../types/agent';

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => undefined,
}));

jest.mock('@abgov/react-components', () => ({
  GoabDetails: ({ heading, children }: { heading: string; children: React.ReactNode }) => (
    <details>
      <summary>{heading}</summary>
      {children}
    </details>
  ),
  GoabFormItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  GoabSkeleton: () => <div data-testid="skeleton" />,
  GoabTextArea: ({ value, onChange }: { value: string; onChange: (detail: { value: string }) => void }) => (
    <textarea value={value} onChange={(event) => onChange({ value: event.target.value })} />
  ),
  GoabIconButton: ({ title, onClick }: { title: string; onClick?: () => void }) => (
    <button type="button" title={title} onClick={onClick} aria-label={title}>
      {title}
    </button>
  ),
}));

function renderChat(message: AgentMessage, renderToolCall?: (toolCall: ToolCall) => React.ReactNode) {
  return render(
    <AgentChat
      threadId="thread-1"
      context={{}}
      messages={[message]}
      onSend={jest.fn()}
      renderToolCall={renderToolCall}
    />,
  );
}

describe('AgentChat', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('renders the default welcome message', () => {
    render(<AgentChat threadId="thread-1" context={{}} messages={[]} onSend={jest.fn()} />);

    expect(screen.getByText('How can I help you?')).toBeInTheDocument();
  });

  it('hides the welcome message when it is empty', () => {
    render(<AgentChat threadId="thread-1" context={{}} messages={[]} onSend={jest.fn()} welcomeMessage="" />);

    expect(screen.queryByText('How can I help you?')).not.toBeInTheDocument();
  });

  it('renders the agent reply after completed tool call results', () => {
    renderChat({
      id: 'agent-1',
      threadId: 'thread-1',
      from: 'agent',
      streaming: false,
      content: 'The form is ready in the editor.',
      toolCalls: [
        {
          toolCallId: 'call-1',
          toolName: 'increment-form-schema',
          args: { incrementIndex: 1 },
          result: { success: true },
        },
      ],
    });

    const toolHeading = screen.getByText('Called increment-form-schema tool');
    const reply = screen.getByText('The form is ready in the editor.');

    expect(toolHeading.compareDocumentPosition(reply) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders the agent reply after a custom tool call renderer', () => {
    renderChat(
      {
        id: 'agent-1',
        threadId: 'thread-1',
        from: 'agent',
        streaming: false,
        content: 'Saved the first category.',
        toolCalls: [
          {
            toolCallId: 'call-1',
            toolName: 'increment-form-schema',
            args: {},
            result: { success: true },
          },
        ],
      },
      (toolCall) => <div>Saved {String((toolCall.result as { success?: boolean }).success)}</div>,
    );

    const toolResult = screen.getByText('Saved true');
    const reply = screen.getByText('Saved the first category.');

    expect(toolResult.compareDocumentPosition(reply) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  describe('slash command hints', () => {
    const commands = [
      { name: 'go', usage: '/go <route>', description: 'Navigate the preview' },
      { name: 'routes', description: 'List routes' },
    ];

    function renderWithCommands(onSend = jest.fn()) {
      render(<AgentChat threadId="thread-1" context={{}} messages={[]} onSend={onSend} commands={commands} />);
      return { onSend, textarea: screen.getByRole('textbox') };
    }

    it('lists all commands when the user types a slash', () => {
      const { textarea } = renderWithCommands();
      fireEvent.change(textarea, { target: { value: '/' } });

      expect(screen.getByText('/go <route>')).toBeInTheDocument();
      expect(screen.getByText('/routes')).toBeInTheDocument();
    });

    it('filters commands by the typed prefix', () => {
      const { textarea } = renderWithCommands();
      fireEvent.change(textarea, { target: { value: '/ro' } });

      expect(screen.queryByText('/go <route>')).not.toBeInTheDocument();
      expect(screen.getByText('/routes')).toBeInTheDocument();
    });

    it('completes the command when a suggestion is clicked', () => {
      const { textarea } = renderWithCommands();
      fireEvent.change(textarea, { target: { value: '/' } });
      fireEvent.click(screen.getByText('/go <route>'));

      expect(textarea).toHaveValue('/go ');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('completes a partial command on Enter instead of sending it', () => {
      const { textarea, onSend } = renderWithCommands();
      fireEvent.change(textarea, { target: { value: '/ro' } });
      fireEvent.keyDown(textarea, { key: 'Enter' });

      expect(onSend).not.toHaveBeenCalled();
      expect(textarea).toHaveValue('/routes ');
    });

    it('sends a complete command on Enter', () => {
      const { textarea, onSend } = renderWithCommands();
      fireEvent.change(textarea, { target: { value: '/routes' } });
      fireEvent.keyDown(textarea, { key: 'Enter' });

      expect(onSend).toHaveBeenCalledWith('thread-1', {}, [{ type: 'text', text: '/routes' }]);
    });

    it('completes the command on Tab', () => {
      const { textarea, onSend } = renderWithCommands();
      fireEvent.change(textarea, { target: { value: '/ro' } });
      fireEvent.keyDown(textarea, { key: 'Tab' });

      expect(onSend).not.toHaveBeenCalled();
      expect(textarea).toHaveValue('/routes ');
    });

    it('leaves Shift+Enter alone while suggestions are shown', () => {
      const { textarea, onSend } = renderWithCommands();
      fireEvent.change(textarea, { target: { value: '/ro' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

      expect(onSend).not.toHaveBeenCalled();
      expect(textarea).toHaveValue('/ro');
    });

    it('shows no suggestions once arguments are being typed or for ordinary text', () => {
      const { textarea } = renderWithCommands();

      fireEvent.change(textarea, { target: { value: '/go /apply' } });
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

      fireEvent.change(textarea, { target: { value: 'hello' } });
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('local messages', () => {
    it('marks messages handled by the host app so they can be styled differently', () => {
      render(
        <AgentChat
          threadId="thread-1"
          context={{}}
          messages={[
            { id: 'u1', threadId: 'thread-1', from: 'user', content: [{ type: 'text', text: '/routes' }], local: true },
            {
              id: 'a1',
              threadId: 'thread-1',
              from: 'agent',
              content: 'Local reply',
              toolCalls: [],
              streaming: false,
              local: true,
            },
            { id: 'u2', threadId: 'thread-1', from: 'user', content: [{ type: 'text', text: 'Normal' }] },
          ]}
          onSend={jest.fn()}
        />,
      );

      expect(screen.getByText('/routes').closest('[data-from]')).toHaveAttribute('data-local', 'true');
      expect(screen.getByText('Local reply').closest('[data-from="agent"]')).toHaveAttribute('data-local', 'true');
      expect(screen.getByText('Normal').closest('[data-from]')).not.toHaveAttribute('data-local');
    });
  });

  describe('without commands', () => {
    it('sends a draft starting with a slash on Enter and never shows suggestions', () => {
      const onSend = jest.fn();
      render(<AgentChat threadId="thread-1" context={{}} messages={[]} onSend={onSend} />);
      const textarea = screen.getByRole('textbox');

      fireEvent.change(textarea, { target: { value: '/etc/hosts' } });
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

      fireEvent.keyDown(textarea, { key: 'Enter' });
      expect(onSend).toHaveBeenCalledWith('thread-1', {}, [{ type: 'text', text: '/etc/hosts' }]);
    });

    it('does not intercept a bare slash on Enter or Tab', () => {
      const onSend = jest.fn();
      render(<AgentChat threadId="thread-1" context={{}} messages={[]} onSend={onSend} />);
      const textarea = screen.getByRole('textbox');

      fireEvent.change(textarea, { target: { value: '/' } });
      fireEvent.keyDown(textarea, { key: 'Tab' });
      expect(textarea).toHaveValue('/');

      fireEvent.keyDown(textarea, { key: 'Enter' });
      expect(onSend).toHaveBeenCalledWith('thread-1', {}, [{ type: 'text', text: '/' }]);
    });
  });

  describe('reply usage', () => {
    const finishedReply: AgentMessage = {
      id: 'agent-1',
      threadId: 'thread-1',
      from: 'agent',
      streaming: false,
      content: 'The core realm has three clients.',
      toolCalls: [],
      usage: {
        contextTokens: 36000,
        contextWindowTokens: 256000,
        totalTokens: 111000,
        outputTokens: 1400,
        modelCalls: 3,
      },
    };

    function renderWithUsage(message: AgentMessage, showUsage: boolean) {
      return render(
        <AgentChat threadId="thread-1" context={{}} messages={[message]} onSend={jest.fn()} showUsage={showUsage} />,
      );
    }

    it('shows what a finished reply used when asked to', () => {
      // Act
      renderWithUsage(finishedReply, true);

      // Assert
      expect(screen.getByTestId('agent-message-usage')).toHaveTextContent('About 111k tokens · 3 model calls');
    });

    it('leaves usage out unless asked to show it', () => {
      // Act
      renderWithUsage(finishedReply, false);

      // Assert
      expect(screen.queryByTestId('agent-message-usage')).not.toBeInTheDocument();
    });

    it('leaves usage out while the reply is still streaming', () => {
      // Act
      renderWithUsage({ ...finishedReply, streaming: true }, true);

      // Assert
      expect(screen.queryByTestId('agent-message-usage')).not.toBeInTheDocument();
    });
  });

  describe('reply caption', () => {
    const guideAnswer: AgentMessage = {
      id: 'guide-answer-1',
      threadId: 'thread-1',
      from: 'agent',
      streaming: false,
      content: 'Access tokens last 5 minutes by default.',
      caption: 'From the Access Service guide (no AI used)',
      toolCalls: [],
    };

    function renderWithCaption(message: AgentMessage, showUsage = false) {
      return render(
        <AgentChat threadId="thread-1" context={{}} messages={[message]} onSend={jest.fn()} showUsage={showUsage} />,
      );
    }

    it('shows the caption of a finished reply', () => {
      // Act
      renderWithCaption(guideAnswer);

      // Assert
      expect(screen.getByTestId('agent-message-caption')).toHaveTextContent(
        'From the Access Service guide (no AI used)',
      );
    });

    it('shows the caption under the reply', () => {
      // Arrange
      renderWithCaption(guideAnswer);

      // Act
      const position = screen
        .getByText('Access tokens last 5 minutes by default.')
        .compareDocumentPosition(screen.getByTestId('agent-message-caption'));

      // Assert
      expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('shows the caption under the usage of a reply that has both', () => {
      // Arrange
      renderWithCaption(
        {
          ...guideAnswer,
          usage: {
            contextTokens: 9000,
            contextWindowTokens: 256000,
            totalTokens: 9400,
            outputTokens: 400,
            modelCalls: 1,
          },
        },
        true,
      );

      // Act
      const position = screen
        .getByTestId('agent-message-usage')
        .compareDocumentPosition(screen.getByTestId('agent-message-caption'));

      // Assert
      expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('leaves the caption out while the reply is still streaming', () => {
      // Act
      renderWithCaption({ ...guideAnswer, streaming: true });

      // Assert
      expect(screen.queryByTestId('agent-message-caption')).not.toBeInTheDocument();
    });

    it('shows no caption for a reply without one', () => {
      // Act
      renderWithCaption({ ...guideAnswer, caption: undefined });

      // Assert
      expect(screen.queryByTestId('agent-message-caption')).not.toBeInTheDocument();
    });
  });

  it('shows the status it is given above the message box', () => {
    // Act
    render(
      <AgentChat
        threadId="thread-1"
        context={{}}
        messages={[]}
        onSend={jest.fn()}
        status={<div data-testid="chat-status">Context 14%</div>}
      />,
    );

    // Assert
    expect(screen.getByTestId('chat-status')).toHaveTextContent('Context 14%');
  });
});
