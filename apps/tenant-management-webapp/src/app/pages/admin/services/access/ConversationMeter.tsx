import React, { FunctionComponent } from 'react';
import { GoabLinearProgress } from '@abgov/react-components';
import {
  AgentUsage,
  ConversationStatus,
  contextPercent,
  formatContextTokens,
  formatTokens,
} from '@core-services/app-common';
import { MeterCard } from './styled-component';

interface ConversationMeterProps {
  status?: ConversationStatus;
  usage?: AgentUsage;
}

/** Side panel card: how much of the context window the conversation takes up, and what the last answer used. */
export const ConversationMeter: FunctionComponent<ConversationMeterProps> = ({ status, usage }) => {
  const context = status ?? usage;

  return (
    <MeterCard data-testid="access-agent-conversation-meter">
      <h3>Conversation length</h3>
      {context ? (
        <>
          <GoabLinearProgress
            progress={contextPercent(context)}
            percentVisibility="hidden"
            ariaLabel="Share of the context window used"
            testId="access-agent-conversation-progress"
          />
          <p>
            {formatContextTokens(context.contextTokens)} of {formatContextTokens(context.contextWindowTokens)} tokens
          </p>
          {usage && (
            <p className="secondary">
              Last answer: about {formatTokens(usage.totalTokens)} tokens across {usage.modelCalls} model{' '}
              {usage.modelCalls === 1 ? 'call' : 'calls'}
            </p>
          )}
        </>
      ) : (
        <p className="secondary">No messages yet.</p>
      )}
    </MeterCard>
  );
};
