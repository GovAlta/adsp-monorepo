import { AgentChat, AgentMessage, Attachment, Message, UserContent } from '@core-services/app-common';
import { FunctionComponent, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuid } from 'uuid';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppDispatch,
  AppState,
  agentActions,
  agentMessagesSelector,
  directorySelector,
  getAccessToken,
  uploadFile,
} from '../state';
import { AgentChunk } from '../state/agent.slice';

const AGENT_SERVICE_ID = 'urn:ads:platform:agent-service';
const FORM_UPDATE_AGENT_ID = 'formUpdateAgent';
const AGENT_ATTACHMENTS_FILE_TYPE = 'agent-attachments';

interface StreamMessage {
  threadId: string;
  messageId: string;
  chunk?: AgentChunk;
  done?: boolean;
}

interface FormUpdateResult {
  id?: string;
  data?: Record<string, unknown>;
  files?: Record<string, string>;
}

interface FormAgentChatProps {
  formId: string;
  formDefinitionId: string;
  onFormUpdate: (result: FormUpdateResult) => void;
}

interface QueuedOutboundMessage {
  messageId: string;
  context: Record<string, unknown>;
  content: UserContent;
}

function resolveAgentServiceUrl(directory: Record<string, string>): string | undefined {
  const direct = directory[AGENT_SERVICE_ID] || directory[`${AGENT_SERVICE_ID}:v1`];
  if (direct) {
    return direct;
  }

  const found = Object.entries(directory).find(([urn]) => urn.startsWith(AGENT_SERVICE_ID));
  return found?.[1];
}

export const FormAgentChat: FunctionComponent<FormAgentChatProps> = ({ formId, formDefinitionId, onFormUpdate }) => {
  const directory = useSelector(directorySelector);
  const connectedUser = useSelector((state: AppState) => state.user.user);
  const messages = useSelector(agentMessagesSelector);
  const dispatch = useDispatch<AppDispatch>();

  const socketRef = useRef<Socket | null>(null);
  const initializedMessageIdsRef = useRef<Set<string>>(new Set());
  const onFormUpdateRef = useRef(onFormUpdate);
  const reconnectTimerRef = useRef<number | null>(null);
  const queuedMessagesRef = useRef<QueuedOutboundMessage[]>([]);
  // Connected not currently used since chat stays active with outbound queue even when disconnected.
  const [_connected, setConnected] = useState(false);

  const threadId = useMemo(() => `form-${formId}`, [formId]);
  const threadMessages = useMemo(() => messages.filter((message) => message.threadId === threadId), [messages, threadId]);
  const agentServiceUrl = useMemo(() => resolveAgentServiceUrl(directory), [directory]);

  // Reset per-thread runtime state when form context changes.
  useEffect(() => {
    initializedMessageIdsRef.current.clear();
    queuedMessagesRef.current = [];
  }, [threadId]);

  useEffect(() => {
    onFormUpdateRef.current = onFormUpdate;
  }, [onFormUpdate]);

  useEffect(() => {
    if (!agentServiceUrl || !connectedUser) {
      setConnected(false);
      return;
    }

    const scheduleReconnect = (delayMs = 1500) => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }

      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null;
        const activeSocket = socketRef.current;
        if (activeSocket && !activeSocket.connected) {
          activeSocket.connect();
        }
      }, delayMs);
    };

    const socket = io(agentServiceUrl, {
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: async (cb) => {
        try {
          const token = await getAccessToken();
          cb(token ? { token } : null);
        } catch {
          cb(null);
        }
      },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      while (queuedMessagesRef.current.length > 0 && socket.connected) {
        const queued = queuedMessagesRef.current.shift();
        if (!queued) {
          break;
        }

        socket.send({
          agent: FORM_UPDATE_AGENT_ID,
          threadId,
          messageId: queued.messageId,
          content: queued.content,
          context: queued.context,
          rawChunks: true,
        });
      }
    });

    socket.on('disconnect', (reason) => {
      setConnected(false);

      // Server-initiated disconnects don't auto-reconnect in socket.io.
      if (reason === 'io server disconnect') {
        scheduleReconnect();
      }
    });

    socket.on('connect_error', () => {
      setConnected(false);
    });

    socket.on('stream', (streamMessage: StreamMessage) => {
      const { threadId: streamThreadId, messageId, chunk, done } = streamMessage;

      if (streamThreadId && streamThreadId !== threadId) {
        return;
      }

      // Handle form update tool results
      if (
        chunk?.type === 'tool-result' && chunk.payload.toolName === 'formDataUpdateTool'
      ) {
        const update = chunk.payload.result as FormUpdateResult;
        if (update?.data || update?.files) {
          onFormUpdateRef.current(update);
        }
      }

      // Initialize message on first chunk
      if (!initializedMessageIdsRef.current.has(messageId)) {
        initializedMessageIdsRef.current.add(messageId);
        const initial: AgentMessage = {
          id: messageId,
          threadId,
          from: 'agent',
          content: '',
          toolCalls: [],
          streaming: !done,
        };
        dispatch(agentActions.initializeMessage(initial));
      }

      // Process chunk if present
      if (chunk) {
        dispatch(agentActions.updateMessage({ messageId, chunk }));
      }

      // Mark as complete if this is the last chunk
      if (done) {
        dispatch(agentActions.completeMessage(messageId));
      }
    });

    socket.on('error', (message: string) => {
      const errorMessage: AgentMessage = {
        id: uuid(),
        threadId,
        from: 'agent',
        content: '',
        toolCalls: [],
        streaming: false,
        errors: [{ type: 'error', message }],
      };
      dispatch(agentActions.initializeMessage(errorMessage));
    });

    socket.on('session-expired', () => {
      setConnected(false);
      scheduleReconnect(250);
    });

    return () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [agentServiceUrl, connectedUser, threadId, dispatch]);

  const handleSend = (_threadId: string, context: Record<string, unknown>, content: UserContent) => {
    const messageId = uuid();

    const userMessage: Message = {
      id: messageId,
      threadId,
      from: 'user',
      content,
    };
    dispatch(agentActions.initializeMessage(userMessage));

    const socket = socketRef.current;
    if (socket?.connected) {
      socket.send({
        agent: FORM_UPDATE_AGENT_ID,
        threadId,
        messageId,
        content,
        context,
        rawChunks: true,
      });
      return;
    }

    queuedMessagesRef.current.push({ messageId, content, context });
    if (socket && !socket.connected) {
      socket.connect();
    }
  };

  const handleAttachmentUpload = async (file: File): Promise<Attachment> => {
    const type: 'image' | 'file' = file.type.startsWith('image/') ? 'image' : 'file';
    const uploaded = await dispatch(
      uploadFile({
        typeId: AGENT_ATTACHMENTS_FILE_TYPE,
        file,
        recordId: formId,
        propertyId: AGENT_ATTACHMENTS_FILE_TYPE,
      })
    ).unwrap();

    return {
      urn: uploaded.metadata.urn,
      filename: uploaded.metadata.filename || file.name,
      type,
      thumbnailUrl: type === 'image' ? uploaded.file : undefined,
    };
  };

  return (
    <AgentChat
      disabled={!agentServiceUrl || !connectedUser}
      threadId={threadId}
      context={{ formId, formDefinitionId }}
      messages={threadMessages}
      onSend={handleSend}
      onAttachmentUpload={handleAttachmentUpload}
    />
  );
};
