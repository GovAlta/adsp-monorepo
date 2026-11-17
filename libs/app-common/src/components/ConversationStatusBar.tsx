import React, { FunctionComponent, ReactNode } from 'react';
import { GoabIcon, GoabTooltip } from '@abgov/react-components';
import styled from 'styled-components';
import { AgentUsage, ConversationStatus } from '../types/agent';
import {
  ConversationStatusText,
  contextPercent,
  describeConversationStatus,
  formatContextTokens,
  formatTokens,
} from './conversationUsage';

export interface ConversationStatusBarProps {
  /** The conversation status agent-service sent after the last reply. */
  status?: ConversationStatus;
  /** What the last reply used. */
  usage?: AgentUsage;
  /** Shown at the end of the bar, typically the reset chat button. */
  action?: ReactNode;
  testId?: string;
}

type ContextSize = Pick<ConversationStatus, 'contextTokens' | 'contextWindowTokens'>;

function describeDetails(
  context: ContextSize,
  usage: AgentUsage | undefined,
  text: ConversationStatusText | undefined,
) {
  const parts = [
    text && `${text.heading}. ${text.detail}`,
    `Context: ${formatContextTokens(context.contextTokens)} of ${formatContextTokens(context.contextWindowTokens)} tokens (${contextPercent(context)}%).`,
    usage &&
      `Last answer: about ${formatTokens(usage.totalTokens)} tokens across ${usage.modelCalls} model ${usage.modelCalls === 1 ? 'call' : 'calls'}.`,
  ];
  return parts.filter(Boolean).join(' ');
}

const StatusLabel: FunctionComponent<{ text: ConversationStatusText }> = ({ text }) => (
  <>
    <span className="long-label">{text.heading}</span>
    <span className="short-label">{text.shortHeading}</span>
  </>
);

/**
 * One line above the message box: how much of the context window the conversation takes up and what the last answer
 * used. A notice says when memory has started summarising or dropping older messages, and a warning when the
 * conversation is close to the assistant's limit. In narrow panes it keeps the essentials and moves the rest into the
 * tooltip.
 */
export const ConversationStatusBar: FunctionComponent<ConversationStatusBarProps> = ({
  status,
  usage,
  action,
  testId = 'conversation-status',
}) => {
  const context: ContextSize | undefined = status ?? usage;
  const state = status?.state ?? 'ok';
  const text = describeConversationStatus(status);
  const details = context ? describeDetails(context, usage, text) : '';

  return (
    <StatusBarDiv data-testid={testId} data-state={state} role="status">
      <div className="summary">
        {state === 'warning' && text && (
          <strong className="status-label">
            <GoabIcon type="warning" size="small" />
            <StatusLabel text={text} />
          </strong>
        )}
        {state === 'warning' && <span className="separator"> · </span>}
        {context ? (
          <span className="context">
            Context {formatContextTokens(context.contextTokens)}
            <span className="detail"> of {formatContextTokens(context.contextWindowTokens)}</span>
          </span>
        ) : (
          <span>Context: no messages yet</span>
        )}
        {state === 'notice' && text && (
          <>
            <span className="separator"> · </span>
            <span className="status-label">
              <StatusLabel text={text} />
            </span>
          </>
        )}
        {state === 'ok' && usage && (
          <span className="detail"> · Last answer about {formatTokens(usage.totalTokens)} tokens</span>
        )}
        {context && (
          <GoabTooltip content={details} position="top" maxWidth="320px" testId={`${testId}-details`}>
            <GoabIcon type="information-circle" size="small" ariaLabel="Conversation details" />
          </GoabTooltip>
        )}
        {details && <span className="visually-hidden">{details}</span>}
      </div>
      {action && <div className="action">{action}</div>}
    </StatusBarDiv>
  );
};

const NARROW_PANE = '479px';

const StatusBarDiv = styled.div`
  container-type: inline-size;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--goa-space-s);
  min-height: 2rem;
  padding: var(--goa-space-2xs) var(--goa-space-m);
  border-top: 1px solid var(--goa-color-greyscale-200);
  color: var(--goa-color-text-secondary);
  font-size: var(--goa-font-size-2);

  &[data-state='notice'] .status-label {
    color: var(--goa-color-text-default);
  }

  &[data-state='warning'] {
    background: var(--goa-color-warning-background, #fff6e5);
    color: var(--goa-color-text-default);
  }

  & .summary {
    display: flex;
    align-items: center;
    gap: var(--goa-space-xs);
    min-width: 0;
    flex-wrap: wrap;
  }

  & .status-label {
    display: inline-flex;
    align-items: center;
    gap: var(--goa-space-2xs);
  }

  & .short-label {
    display: none;
  }

  & .action {
    flex-shrink: 0;
  }

  & .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  @container (max-width: ${NARROW_PANE}) {
    & .detail,
    & .long-label {
      display: none;
    }

    & .short-label {
      display: inline;
    }
  }
`;
