import { FunctionComponent } from 'react';
import { AgentChat } from './AgentChat';
import { Attachment, UserContent } from '../types/agent';

type Message = Parameters<typeof AgentChat>[0]['messages'][number];

export interface EditorAgentChatProps {
  threadId: string;
  context: Record<string, unknown>;
  messages: Message[];
  height: number;
  disabled?: boolean;
  onSend: (threadId: string, context: Record<string, unknown>, content: UserContent) => void;
  onAttachmentUpload?: (file: File) => Promise<Attachment>;
}

export const EditorAgentChat: FunctionComponent<EditorAgentChatProps> = ({
  threadId,
  context,
  messages,
  height,
  disabled,
  onSend,
  onAttachmentUpload,
}) => {
  return (
    <div style={{ height }}>
      <AgentChat
        disabled={disabled}
        threadId={threadId}
        context={context}
        messages={messages}
        onSend={onSend}
        onAttachmentUpload={onAttachmentUpload}
      />
    </div>
  );
};
