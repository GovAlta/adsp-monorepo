import { GoabDetails, GoabFormItem, GoabSkeleton, GoabTextArea } from '@abgov/react-components';
import { FunctionComponent, memo, useEffect, useMemo, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import styled from 'styled-components';
import { GoabTextAreaOnChangeDetail } from '@abgov/ui-components-common';
import { AgentMessage, Reasoning, Message, ToolCall, UserMessage } from '../types/agent';

interface UserMessageItemProps {
  className?: string;
  message: UserMessage;
}

const UserMessageItem = memo(styled(({ className, message }: UserMessageItemProps) => {
  return (
    <div className={className} data-from={message.from}>
      <Markdown className="content" data-from={message.from}>
        {message.content}
      </Markdown>
    </div>
  );
})`
  text-align: right;
`);

interface AgentToolCallProps {
  className?: string;
  toolCall: ToolCall;
}

const AgentToolCallBase: FunctionComponent<AgentToolCallProps> = ({ className, toolCall }) => {
  return (
    <div className={className}>
      <GoabDetails heading={`Called ${toolCall.toolName} tool`}>
        <div>
          <span>Input</span>
          <pre>{JSON.stringify(toolCall.args, null, 2)}</pre>
          {toolCall.result && (
            <>
              <span>Result</span>
              <pre>{JSON.stringify(toolCall.result, null, 2)}</pre>
            </>
          )}
          {toolCall.error && (
            <>
              <span>Error</span>
              <pre>{JSON.stringify(toolCall.error, null, 2)}</pre>
            </>
          )}
        </div>
      </GoabDetails>
    </div>
  );
};

const AgentToolCall = memo(styled(AgentToolCallBase)`
  margin: var(--goa-space-xl);
  & pre {
    background: var(--goa-color-greyscale-100);
    white-space: pre-wrap;
    font-family: monospace;
    font-size: var(--goa-font-size-1);
    line-height: var(--goa-space-m);
    padding: var(--goa-space-m);
    text-align: left;
    margin: 0;
    max-height: 250px;
    overflow: auto;
  }
`);

interface AgentReasoningProps {
  className?: string;
  reasoning: Reasoning;
}
const AgentReasoning = styled(({ className, reasoning }: AgentReasoningProps) => {
  return <div className={className}>{reasoning.content}</div>;
})`
  margin: var(--goa-space-xl);
  font-size: var(--goa-font-size-1);
  line-height: var(--goa-space-m);
  padding: var(--goa-space-m);
  text-align: left;
`;

interface AgentMessageItemProps {
  className?: string;
  message: AgentMessage;
}
const AgentMessageItem = memo(styled(({ className, message }: AgentMessageItemProps) => {
  return (
    <div className={className} data-from={message.from}>
      <Markdown className="content" data-from={message.from}>
        {message.content}
      </Markdown>
      {message.reasoning && <AgentReasoning reasoning={message.reasoning} />}
      {message.toolCalls.map((toolCall) => (
        <AgentToolCall key={toolCall.toolCallId} toolCall={toolCall} />
      ))}
    </div>
  );
})`
  text-align: left;
`);

const ContainerDiv = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  & > :first-child {
    overflow: auto;
    flex: 1;
    > :last-child {
      padding-top: var(--goa-space-l);
    }
  }
  & > :last-child {
    flex: 0;
  }
  & .content {
    margin: var(--goa-space-m) var(--goa-space-xs) var(--goa-space-l) var(--goa-space-xs);
  }
  & .content[data-from='user'] {
    margin-left: var(--goa-space-l);
  }
  & .content[data-from='agent'] {
    margin-right: var(--goa-space-l);
  }
`;

const createWelcomeMessage = (threadId: string): AgentMessage => ({
  id: null,
  threadId,
  streaming: false,
  toolCalls: [],
  from: 'agent',
  content: 'How can I help you?',
  reasoning: null,
});

interface AgentChatProps {
  disabled?: boolean;
  threadId: string;
  context: Record<string, unknown>;
  messages: Message[];
  onSend: (threadId: string, context: Record<string, unknown>, content: string) => void;
}
export const AgentChat: FunctionComponent<AgentChatProps> = ({ disabled, threadId, context, messages, onSend }) => {
  const [draft, setDraft] = useState('');
  const latestRef = useRef<HTMLDivElement | null>(null);
  const welcomeMessage = useMemo(() => createWelcomeMessage(threadId), [threadId]);
  const isWaitingForResponse = useMemo(() => messages[messages.length - 1]?.from === 'user', [messages]);

  useEffect(() => {
    const timer = setTimeout(() => {
      latestRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
    return () => clearTimeout(timer);
  }, [messages]);

  return (
    <ContainerDiv>
      <div>
        <AgentMessageItem message={welcomeMessage} />
        {messages.map((message) =>
          message.from === 'user' ? (
            <UserMessageItem key={message.id} message={message} />
          ) : (
            <AgentMessageItem key={message.id} message={message} />
          ),
        )}
        {isWaitingForResponse && <GoabSkeleton type="text" mb="l" mr="4xl" />}
        <div ref={latestRef}></div>
      </div>
      <form
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            onSend(threadId, context, draft);
            setDraft('');
            event.preventDefault();
          }
        }}
      >
        <GoabFormItem ml="xs" mr="xs">
          <GoabTextArea
            disabled={disabled}
            name="draft"
            width="100%"
            value={draft}
            onChange={(detail: GoabTextAreaOnChangeDetail) => setDraft(detail.value)}
          />
        </GoabFormItem>
      </form>
    </ContainerDiv>
  );
};
