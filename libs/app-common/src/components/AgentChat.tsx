import { GoAFormItem, GoATextArea } from '@abgov/react-components';
import { min } from 'moment';
import { forwardRef, FunctionComponent, Ref, RefObject, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

interface Message {
  id?: string;
  threadId?: string;
  content: string;
  streaming?: boolean;
  from: 'user' | 'agent';
}

interface MessageItemProps {
  className?: string;
  message: Message;
}
const MessageItem = styled(
  forwardRef<HTMLDivElement, MessageItemProps>(({ className, message }: MessageItemProps, ref) => {
    return (
      <div className={className} data-from={message.from} ref={ref}>
        <p data-from={message.from}>{message.content}</p>
      </div>
    );
  })
)`
  &[data-from='agent'] {
    text-align: left;
  }
  &[data-from='user'] {
    text-align: right;
  }
`;

const ContainerDiv = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  & > :first-child {
    overflow: auto;
    flex: 1;
  }
  & > :last-child {
    flex: 0;
  }
  & p {
    margin: var(--goa-space-m) var(--goa-space-xs);
  }
  & p[data-from='user'] {
    margin-left: var(--goa-space-l);
  }
  & p[data-from='agent'] {
    margin-right: var(--goa-space-l);
  }
`;

interface AgentChatProps {
  threadId: string;
  context: Record<string, unknown>;
  messages: Message[];
  onSend: (threadId: string, context: Record<string, unknown>, content: string) => void;
}
export const AgentChat: FunctionComponent<AgentChatProps> = ({ threadId, context, messages, onSend }) => {
  const [draft, setDraft] = useState('');
  const latestRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (latestRef.current) {
      latestRef.current.scrollIntoView();
    }
  }, [messages]);

  return (
    <ContainerDiv>
      <div>
        <MessageItem message={{ from: 'agent', content: 'How can I help you?' }} />
        {messages.map((message, index) => (
          <MessageItem key={message.id} message={message} ref={index === messages.length - 1 ? latestRef : null} />
        ))}
        {messages[messages.length - 1]?.from === 'user' && (
          <MessageItem message={{ from: 'agent', content: 'Beep boop *robot noises*' }} />
        )}
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
        <GoAFormItem>
          <GoATextArea name="draft" width="100%" value={draft} onChange={(_, value) => setDraft(value)} />
        </GoAFormItem>
      </form>
    </ContainerDiv>
  );
};
