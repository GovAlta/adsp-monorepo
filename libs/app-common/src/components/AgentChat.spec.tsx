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

jest.mock('@abgov/react-components', () => ({
  GoabDetails: ({ heading, children }: { heading: string; children: React.ReactNode }) => (
    <details>
      <summary>{heading}</summary>
      {children}
    </details>
  ),
  GoabFormItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  GoabSkeleton: () => <div data-testid="skeleton" />,
  GoabTextArea: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (detail: { value: string }) => void;
  }) => <textarea value={value} onChange={(event) => onChange({ value: event.target.value })} />,
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
});
