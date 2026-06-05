import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSelector, useDispatch } from 'react-redux';
import { TemplateAITab, EmailTemplateProposal } from './TemplateAITab';

// --- module mocks -----------------------------------------------------------

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('@store/agent/selectors', () => ({
  messagesSelector: jest.fn(),
}));

jest.mock('@store/agent/actions', () => ({
  messageAgent: jest.fn((tid, ctx, content) => ({ type: 'agent/message', tid, ctx, content })),
}));

let capturedMessages: unknown[] = [];
jest.mock('@core-services/app-common', () => ({
  AgentChat: (props: any) => {
    capturedMessages = props.messages;
    return <div data-testid="agent-chat" data-thread-id={props.threadId} data-disabled={props.disabled} />;
  },
}));

// --- helpers ----------------------------------------------------------------

const mockDispatch = jest.fn();
const mockUseSelector = useSelector as jest.Mock;
const mockUseDispatch = useDispatch as jest.Mock;

const PROPOSAL_TOOL_NAME = 'notificationTemplateProposalTool';

function buildToolCall(result: EmailTemplateProposal | null) {
  return {
    toolCallId: 'tc-001',
    toolName: PROPOSAL_TOOL_NAME,
    args: result ?? {},
    result,
  };
}

function buildAgentMessage(
  overrides: Partial<{
    id: string;
    from: string;
    streaming: boolean;
    toolCalls: Array<{ toolCallId: string; toolName: string; args: Record<string, unknown>; result?: unknown }>;
  }> = {},
) {
  return {
    id: 'msg-001',
    from: 'agent',
    streaming: false,
    toolCalls: [
      buildToolCall({
        subject: 'Your application update',
        title: 'Application Status',
        subtitle: 'Submitted successfully',
        body: '<p>Dear {{firstName}},</p>',
      }),
    ],
    ...overrides,
  };
}

function setupMessages(messages: unknown[] = []) {
  mockUseSelector.mockImplementation(() => messages);
}

function makeBaseProps(overrides: Partial<React.ComponentProps<typeof TemplateAITab>> = {}) {
  return {
    threadId: 'thread-notification-welcome',
    templates: {
      email: {
        subject: 'Welcome to ADSP',
        title: 'Hello',
        subtitle: '',
        body: '<p>Welcome!</p>',
      },
    } as any,
    handlebarsVariables: ['firstName', 'serviceName'],
    notificationType: 'welcome-notification',
    height: 400,
    disabled: false,
    appliedProposalId: null,
    draft: '',
    onDraftChange: jest.fn(),
    onProposal: jest.fn(),
    onApply: jest.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------

describe('TemplateAITab', () => {
  beforeEach(() => {
    mockUseDispatch.mockReturnValue(mockDispatch);
    capturedMessages = [];
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // --- rendering AgentChat -------------------------------------------------

  describe('AgentChat rendering', () => {
    it('renders AgentChat with correct props', () => {
      setupMessages([]);
      const props = makeBaseProps();

      render(<TemplateAITab {...props} />);

      const chat = screen.getByTestId('agent-chat');
      expect(chat).toBeInTheDocument();
      expect(chat).toHaveAttribute('data-thread-id', 'thread-notification-welcome');
      expect(chat).toHaveAttribute('data-disabled', 'false');
    });

    it('passes disabled=true when disabled prop is true', () => {
      setupMessages([]);
      const props = makeBaseProps({ disabled: true });

      render(<TemplateAITab {...props} />);

      expect(screen.getByTestId('agent-chat')).toHaveAttribute('data-disabled', 'true');
    });
  });

  // --- auto-apply behaviour ------------------------------------------------

  describe('auto-apply', () => {
    it('calls onProposal and onApply when a new proposal is detected', () => {
      const proposal: EmailTemplateProposal = {
        subject: 'Your application update',
        title: 'Application Status',
        subtitle: 'Submitted successfully',
        body: '<p>Dear {{firstName}},</p>',
      };
      const agentMessage = buildAgentMessage({ toolCalls: [buildToolCall(proposal)] });
      setupMessages([agentMessage]);
      const onProposal = jest.fn();
      const onApply = jest.fn();
      const props = makeBaseProps({ onProposal, onApply });

      render(<TemplateAITab {...props} />);

      expect(onApply).toHaveBeenCalledWith('msg-001');
      expect(onProposal).toHaveBeenCalledWith(proposal);
    });

    it('does NOT auto-apply if appliedProposalId matches the latest message id', () => {
      const agentMessage = buildAgentMessage({ id: 'msg-001' });
      setupMessages([agentMessage]);
      const onProposal = jest.fn();
      const onApply = jest.fn();
      const props = makeBaseProps({ onProposal, onApply, appliedProposalId: 'msg-001' });

      render(<TemplateAITab {...props} />);

      expect(onApply).not.toHaveBeenCalled();
      expect(onProposal).not.toHaveBeenCalled();
    });

    it('does NOT auto-apply when the proposal message is still streaming', () => {
      const agentMessage = buildAgentMessage({ streaming: true });
      setupMessages([agentMessage]);
      const onProposal = jest.fn();
      const onApply = jest.fn();
      const props = makeBaseProps({ onProposal, onApply });

      render(<TemplateAITab {...props} />);

      expect(onApply).not.toHaveBeenCalled();
      expect(onProposal).not.toHaveBeenCalled();
    });

    it('does NOT auto-apply when tool result is null', () => {
      const agentMessage = buildAgentMessage({ toolCalls: [buildToolCall(null)] });
      setupMessages([agentMessage]);
      const onProposal = jest.fn();
      const onApply = jest.fn();
      const props = makeBaseProps({ onProposal, onApply });

      render(<TemplateAITab {...props} />);

      expect(onApply).not.toHaveBeenCalled();
      expect(onProposal).not.toHaveBeenCalled();
    });

    it('uses the most recent completed proposal when multiple messages exist', () => {
      const olderProposal: EmailTemplateProposal = { subject: 'Old subject' };
      const newerProposal: EmailTemplateProposal = { subject: 'New subject' };
      const olderMessage = buildAgentMessage({ id: 'msg-001', toolCalls: [buildToolCall(olderProposal)] });
      const newerMessage = buildAgentMessage({ id: 'msg-002', toolCalls: [buildToolCall(newerProposal)] });
      setupMessages([olderMessage, newerMessage]);
      const onProposal = jest.fn();
      const onApply = jest.fn();
      const props = makeBaseProps({ onProposal, onApply });

      render(<TemplateAITab {...props} />);

      expect(onApply).toHaveBeenCalledWith('msg-002');
      expect(onProposal).toHaveBeenCalledWith(newerProposal);
    });

    it('does NOT auto-apply for user messages', () => {
      const userMessage = { id: 'msg-user-001', from: 'user', content: 'Update subject' };
      setupMessages([userMessage]);
      const onProposal = jest.fn();
      const onApply = jest.fn();
      const props = makeBaseProps({ onProposal, onApply });

      render(<TemplateAITab {...props} />);

      expect(onApply).not.toHaveBeenCalled();
      expect(onProposal).not.toHaveBeenCalled();
    });
  });

  // --- message mapping (tool call rename) ----------------------------------

  describe('message mapping', () => {
    it('renames proposal tool calls to "Apply template changes"', () => {
      const agentMessage = buildAgentMessage();
      setupMessages([agentMessage]);
      const props = makeBaseProps({ appliedProposalId: 'msg-001' });

      render(<TemplateAITab {...props} />);

      const mapped = capturedMessages[0] as any;
      expect(mapped.toolCalls[0].toolName).toBe('Apply template changes');
      expect(mapped.toolCalls[0].args).toEqual({});
    });

    it('preserves non-proposal tool calls unchanged', () => {
      const otherToolCall = { toolCallId: 'tc-other', toolName: 'someOtherTool', args: { x: 1 }, result: 'ok' };
      const agentMessage = {
        id: 'msg-001',
        from: 'agent',
        streaming: false,
        toolCalls: [otherToolCall],
      };
      setupMessages([agentMessage]);
      const props = makeBaseProps({ appliedProposalId: 'msg-001' });

      render(<TemplateAITab {...props} />);

      const mapped = capturedMessages[0] as any;
      expect(mapped.toolCalls[0].toolName).toBe('someOtherTool');
      expect(mapped.toolCalls[0].args).toEqual({ x: 1 });
    });

    it('passes user messages through unchanged', () => {
      const userMessage = { id: 'msg-user', from: 'user', content: 'Hello' };
      setupMessages([userMessage]);
      const props = makeBaseProps();

      render(<TemplateAITab {...props} />);

      expect(capturedMessages[0]).toEqual(userMessage);
    });
  });
});
