import React from 'react';
import { render, screen } from '@testing-library/react';
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
});
