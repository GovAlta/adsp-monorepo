import { GoabDetails, GoabFormItem, GoabSkeleton, GoabTextArea, GoabIconButton } from '@abgov/react-components';
import { GoabTextAreaOnChangeDetail } from '@abgov/ui-components-common';
import { FunctionComponent, memo, useMemo, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import styled from 'styled-components';
import { useAutoScroll } from '../hooks';
import { AgentMessage, AgentError, Reasoning, Message, ToolCall, UserMessage, UserContent, Attachment, ResolvedImagePart, ResolvedFilePart } from '../types/agent';

// ========================================
// Type Definitions
// ========================================

interface AgentChatProps {
  disabled?: boolean;
  threadId: string;
  context: Record<string, unknown>;
  messages: Message[];
  onSend: (threadId: string, context: Record<string, unknown>, content: UserContent) => void;
  onAttachmentUpload?: (file: File) => Promise<Attachment>;
}

interface UserMessageItemProps {
  className?: string;
  message: UserMessage;
}

interface AgentMessageItemProps {
  className?: string;
  message: AgentMessage;
}

interface AgentToolCallProps {
  className?: string;
  toolCall: ToolCall;
}

interface AgentReasoningProps {
  className?: string;
  reasoning: Reasoning;
}

interface AgentErrorProps {
  className?: string;
  error: AgentError;
}

// ========================================
// Helpers
// ========================================

const createWelcomeMessage = (threadId: string): AgentMessage => ({
  id: null,
  threadId,
  streaming: false,
  toolCalls: [],
  from: 'agent',
  content: 'How can I help you?',
  reasoning: null,
});

// ========================================
// Styled Components
// ========================================

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
    max-width: 100%;
    overflow-wrap: break-word;
    word-break: break-word;
  }
  
  & .content[data-from='agent'] {
    margin-right: var(--goa-space-l);
  }
  
  & .content pre,
  & .content code {
    max-width: 100%;
    overflow-x: auto;
  }
`;

const FormDiv = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-m);
  padding: var(--goa-space-m);
`;

const AttachmentItemDiv = styled.div`
  display: flex;
  align-items: center;
  gap: var(--goa-space-xs);
  padding: var(--goa-space-xs) var(--goa-space-s);
  background: var(--goa-color-greyscale-100);
  border-radius: var(--goa-border-radius-m);
  font-size: var(--goa-font-size-0);

  & > img {
    max-width: 60px;
    max-height: 60px;
    object-fit: cover;
    border-radius: var(--goa-border-radius-s);
  }

  & > button {
    padding: 0;
    margin-left: var(--goa-space-xs);
  }
`;

const AttachmentListDiv = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--goa-space-s);
`;

// ========================================
// Message Components
// ========================================

const UserMessageItem = memo(styled(({ className, message }: UserMessageItemProps) => {
  return (
    <div className={className} data-from={message.from}>
      {message.content.map((part, index) => {
        if (part.type === 'text') {
          return (
            <Markdown key={index} className="content" data-from={message.from}>
              {part.text}
            </Markdown>
          );
        } else if (part.type === 'image') {
          const imagePart = part as ResolvedImagePart;
          return (
            <AttachmentItemDiv key={index}>
              {imagePart.image && <img src={imagePart.image} alt={imagePart.filename || 'Image'} />}
              {imagePart.filename && <span>{imagePart.filename}</span>}
            </AttachmentItemDiv>
          );
        } else if (part.type === 'file') {
          const filePart = part as ResolvedFilePart;
          return (
            <AttachmentItemDiv key={index}>
              <span>{filePart.filename || 'File'}</span>
            </AttachmentItemDiv>
          );
        }
        return null;
      })}
    </div>
  );
})`
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--goa-space-xs);

  & .content {
    margin: var(--goa-space-xs) var(--goa-space-xs) var(--goa-space-xs) var(--goa-space-l);
  }
`);

const AgentReasoning = styled(({ className, reasoning }: AgentReasoningProps) => {
  return <div className={className}>{reasoning.content}</div>;
})`
  margin: var(--goa-space-m) var(--goa-space-xl) 0 var(--goa-space-xl);
  font-size: var(--goa-font-size-1);
  line-height: var(--goa-space-m);
  padding: var(--goa-space-m);
  text-align: left;
`;

const AgentErrorBase: FunctionComponent<AgentErrorProps> = ({ className, error }) => {
  const label = error.type === 'tripwire' ? 'Validation Failed' : 'Error';
  return (
    <div className={className}>
      <strong>{label}:</strong> {error.message}
      {error.details && (
        <pre>{JSON.stringify(error.details, null, 2)}</pre>
      )}
    </div>
  );
};

const AgentError = memo(styled(AgentErrorBase)`
  margin: var(--goa-space-m) var(--goa-space-xl) var(--goa-space-l) var(--goa-space-xl);
  padding: var(--goa-space-m);
  background-color: var(--goa-color-emergency-light);
  border-left: 3px solid var(--goa-color-emergency-default);
  border-radius: var(--goa-border-radius-s);
  color: var(--goa-color-text-default);
  font-size: var(--goa-font-size-1);
  line-height: var(--goa-space-m);
  text-align: left;
  
  & strong {
    color: var(--goa-color-emergency-default);
  }
  
  & pre {
    background: var(--goa-color-greyscale-100);
    border: 1px solid var(--goa-color-greyscale-200);
    white-space: pre-wrap;
    font-family: monospace;
    font-size: var(--goa-font-size-0);
    line-height: var(--goa-space-m);
    padding: var(--goa-space-m);
    margin: var(--goa-space-s) 0 0 0;
    overflow: auto;
    max-height: 200px;
  }
`);

/**
 * AgentToolCall component - Displays tool execution status and results
 * 
 * States:
 * - Pending: Tool has been called but no result/error yet (shows loading indicator)
 * - Complete: Tool returned a result (green border, shows result)
 * - Error: Tool execution failed (red border, shows error)
 */
const AgentToolCallBase: FunctionComponent<AgentToolCallProps> = ({ className, toolCall }) => {
  const isPending = !toolCall.result && !toolCall.error;
  const hasArgs = toolCall.args && Object.keys(toolCall.args).length > 0;
  
  const getHeading = () => {
    if (isPending) {
      return `Calling ${toolCall.toolName} tool...`;
    } else if (toolCall.error) {
      return `${toolCall.toolName} tool failed`;
    } else {
      return `Called ${toolCall.toolName} tool`;
    }
  };
  
  return (
    <div className={className} data-status={isPending ? 'pending' : toolCall.error ? 'error' : 'complete'}>
      <GoabDetails heading={getHeading()}>
        <div>
          {isPending && (
            <div className="pending-indicator">
              <GoabSkeleton type="text" />
              <span>Executing tool...</span>
            </div>
          )}
          {hasArgs && (
            <>
              <span>Input</span>
              <pre>{JSON.stringify(toolCall.args, null, 2)}</pre>
            </>
          )}
          {toolCall.result && (
            <>
              <span>Result</span>
              <pre>{JSON.stringify(toolCall.result, null, 2)}</pre>
            </>
          )}
          {toolCall.error && (
            <>
              <span>Error</span>
              <pre className="error-output">{JSON.stringify(toolCall.error, null, 2)}</pre>
            </>
          )}
        </div>
      </GoabDetails>
    </div>
  );
};

const AgentToolCall = memo(styled(AgentToolCallBase)`
  margin: 0 var(--goa-space-xl) var(--goa-space-l) var(--goa-space-xl);
  
  &[data-status='pending'] {
    opacity: 0.8;
  }
  
  &[data-status='error'] {
    border-left: 3px solid var(--goa-color-emergency-default);
  }
  
  &[data-status='complete'] {
    border-left: 3px solid var(--goa-color-success-default);
  }
  
  & .pending-indicator {
    display: flex;
    flex-direction: column;
    gap: var(--goa-space-xs);
    padding: var(--goa-space-s) 0;
    
    & span {
      color: var(--goa-color-text-secondary);
      font-style: italic;
      font-size: var(--goa-font-size-1);
    }
  }
  
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
  
  & pre.error-output {
    background: var(--goa-color-emergency-light);
    border-left: 2px solid var(--goa-color-emergency-default);
  }
`);

const AgentMessageItem = memo(styled(({ className, message }: AgentMessageItemProps) => {
  return (
    <div className={className} data-from={message.from}>
      {message.reasoning && <AgentReasoning reasoning={message.reasoning} />}
      <Markdown className="content" data-from={message.from}>
        {message.content}
      </Markdown>
      {message.toolCalls.map((toolCall) => (
        <AgentToolCall key={toolCall.toolCallId} toolCall={toolCall} />
      ))}
      {message.errors && message.errors.map((error, index) => (
        <AgentError key={index} error={error} />
      ))}
    </div>
  );
})`
  text-align: left;
`);

// ========================================
// Main Component
// ========================================

export const AgentChat: FunctionComponent<AgentChatProps> = ({
  disabled,
  threadId,
  context,
  messages,
  onSend,
  onAttachmentUpload,
}) => {
  // State
  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Hooks
  const { scrollContainerRef, targetElementRef, onScroll, resetScroll } = useAutoScroll([messages]);
  
  // Computed values
  const welcomeMessage = useMemo(() => createWelcomeMessage(threadId), [threadId]);
  const isWaitingForResponse = useMemo(() => messages[messages.length - 1]?.from === 'user', [messages]);

  // Event handlers
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onAttachmentUpload) {
      try {
        setUploading(true);
        const attachment = await onAttachmentUpload(file);
        setAttachments((prev) => [...prev, attachment]);
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setUploading(false);
      }
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = () => {
    const content: UserContent = [];

    if (draft.trim()) {
      content.push({ type: 'text', text: draft });
    }

    for (const attachment of attachments) {
      if (attachment.type === 'image') {
        content.push({ type: 'image', image: attachment.urn });
      } else {
        content.push({ type: 'file', data: attachment.urn });
      }
    }

    if (content.length > 0) {
      onSend(threadId, context, content);
      setDraft('');
      setAttachments([]);
      resetScroll(); // Re-enable auto-scroll for incoming messages
    }
  };

  const removeAttachment = (urn: string) => {
    setAttachments((prev) => prev.filter((a) => a.urn !== urn));
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      handleSend();
      event.preventDefault();
    }
  };

  // Render
  return (
    <ContainerDiv>
      {/* Message list */}
      <div ref={scrollContainerRef} onScroll={onScroll}>
        <AgentMessageItem message={welcomeMessage} />
        {messages.map((message) =>
          message.from === 'user' ? (
            <UserMessageItem key={message.id} message={message} />
          ) : (
            <AgentMessageItem key={message.id} message={message} />
          ),
        )}
        {isWaitingForResponse && <GoabSkeleton type="text" mb="l" mr="4xl" />}
        <div ref={targetElementRef} />
      </div>

      {/* Input form */}
      <FormDiv>
        {onAttachmentUpload && (
          <AttachmentListDiv>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
              disabled={disabled || uploading}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
            {attachments.map((attachment) => (
              <AttachmentItemDiv key={attachment.urn}>
                {attachment.thumbnailUrl && (
                  <img src={attachment.thumbnailUrl} alt={attachment.filename} />
                )}
                <span>{attachment.filename}</span>
                <GoabIconButton
                  icon="trash"
                  size="small"
                  onClick={() => removeAttachment(attachment.urn)}
                  disabled={disabled || uploading}
                />
              </AttachmentItemDiv>
            ))}
            <GoabIconButton
              icon="attach"
              size="small"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              title="Attach file"
            />
          </AttachmentListDiv>
        )}
        
        <form onKeyDown={handleKeyDown}>
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
      </FormDiv>
    </ContainerDiv>
  );
};
