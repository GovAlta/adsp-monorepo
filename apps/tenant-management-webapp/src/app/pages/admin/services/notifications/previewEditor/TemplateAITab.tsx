import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AgentChat, AgentMessage, Attachment, Message, ToolCall, UserContent } from '@core-services/app-common';
import { messagesSelector } from '@store/agent/selectors';
import { messageAgent } from '@store/agent/actions';
import { AppDispatch, RootState } from '@store/index';
import { Template } from '@store/notification/models';

export interface EmailTemplateProposal {
  subject?: string;
  title?: string;
  subtitle?: string;
  body?: string;
}

const PROPOSAL_TOOL_NAME = 'notificationTemplateProposalTool';

interface TemplateAITabProps {
  threadId: string;
  templates: Template;
  handlebarsVariables: string[];
  notificationType: string;
  notificationTypeId?: string;
  height: number;
  disabled: boolean;
  /** ID of the last proposal that was applied. Stored in the parent so it
   *  survives tab switches and prevents double-apply on remount. */
  appliedProposalId: string | null;
  /** Controlled draft text — lifted to parent so it survives tab switches. */
  draft: string;
  onDraftChange: (value: string) => void;
  onProposal: (proposal: EmailTemplateProposal) => void;
  onApply: (id: string) => void;
  onAttachmentUpload?: (file: File) => Promise<Attachment>;
}

export const TemplateAITab: React.FunctionComponent<TemplateAITabProps> = ({
  threadId,
  templates,
  handlebarsVariables,
  notificationType,
  notificationTypeId,
  height,
  disabled,
  appliedProposalId,
  draft,
  onDraftChange,
  onProposal,
  onApply,
  onAttachmentUpload,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const messages = useSelector((state: RootState) => messagesSelector(state, threadId));

  const context = {
    emailTemplate: templates?.email,
    handlebarsVariables,
    notificationType,
    notificationTypeId,
  };

  // Find the most recent completed proposal message.
  const latestProposalMessage =
    [...messages]
      .reverse()
      .find(
        (m): m is AgentMessage =>
          m.from === 'agent' &&
          !(m as AgentMessage).streaming &&
          (m as AgentMessage).toolCalls?.some(
            (tc: ToolCall) => tc.toolName === PROPOSAL_TOOL_NAME && tc.result != null,
          ),
      ) ?? null;

  // Stable refs ensure callbacks always have the latest closure values.
  const onProposalRef = useRef(onProposal);
  onProposalRef.current = onProposal;
  const onApplyRef = useRef(onApply);
  onApplyRef.current = onApply;

  // Auto-apply every new proposal immediately.
  // appliedProposalId (parent-owned) prevents re-applying the same proposal on remount.
  useEffect(() => {
    if (!latestProposalMessage || latestProposalMessage.id === appliedProposalId) return;
    const proposal = latestProposalMessage.toolCalls?.find((tc: ToolCall) => tc.toolName === PROPOSAL_TOOL_NAME)
      ?.result as EmailTemplateProposal | undefined;
    if (proposal) {
      onApplyRef.current(latestProposalMessage.id);
      onProposalRef.current(proposal);
    }
  }, [latestProposalMessage?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ height }}>
      <AgentChat
        disabled={disabled}
        threadId={threadId}
        context={context}
        draft={draft}
        onDraftChange={onDraftChange}
        messages={messages.map((m: Message) => {
          if (m.from !== 'agent') return m;
          const agentMsg = m as AgentMessage;
          const hasProposalToolCall = agentMsg.toolCalls?.some((tc: ToolCall) => tc.toolName === PROPOSAL_TOOL_NAME);
          if (hasProposalToolCall) {
            return {
              ...agentMsg,

              toolCalls: agentMsg.toolCalls.map((tc: ToolCall) =>
                tc.toolName === PROPOSAL_TOOL_NAME ? { ...tc, toolName: 'Apply template changes', args: {} } : tc,
              ),
            };
          }
          return m;
        })}
        onSend={(tid: string, ctx: Record<string, unknown>, content: UserContent) =>
          dispatch(messageAgent(tid, ctx, content))
        }
        onAttachmentUpload={onAttachmentUpload}
      />
    </div>
  );
};

TemplateAITab.displayName = 'TemplateAITab';
