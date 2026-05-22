import { AgentChat, Attachment, UserContent } from '@core-services/app-common';
import { AppDispatch, RootState } from '@store/index';
import { messageAgent, startThread } from '@store/agent/actions';
import { agentConnectedSelector, messagesSelector, threadSelector } from '@store/agent/selectors';
import { UploadFileService } from '@store/file/actions';
import { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnyAction } from 'redux';
import { v4 as uuid } from 'uuid';

interface EditorAgentChatProps {
  agentName: string;
  resourceId: string;
  context: Record<string, unknown>;
  height: number;
  disabled?: boolean;
  uploadFileType?: string;
}

function useEditorAgentChat(agentName: string, resourceId: string, uploadFileType: string) {
  const dispatch = useDispatch<AppDispatch>();
  const [threadId] = useState(uuid());

  const agentConnected = useSelector(agentConnectedSelector);
  const thread = useSelector((state: RootState) => threadSelector(state, threadId));
  const messages = useSelector((state: RootState) => messagesSelector(state, threadId));

  useEffect(() => {
    if (!thread) {
      dispatch(startThread(agentName, threadId));
    }
  }, [dispatch, agentName, thread, threadId]);

  const handleAttachmentUpload = useCallback(
    async (file: File): Promise<Attachment> => {
      const type = file.type.startsWith('image/') ? 'image' : 'file';

      const { uploadedFile, dataUrl } = await dispatch(
        UploadFileService({
          type: uploadFileType,
          file,
          recordId: resourceId,
        }) as unknown as AnyAction,
      );

      return {
        urn: uploadedFile.urn,
        filename: uploadedFile.filename || file.name,
        type,
        thumbnailUrl: type === 'image' ? dataUrl : undefined,
      };
    },
    [dispatch, uploadFileType, resourceId],
  );

  const handleSend = useCallback(
    (threadId: string, context: Record<string, unknown>, content: UserContent) =>
      dispatch(messageAgent(threadId, context, content)),
    [dispatch],
  );

  return { threadId, messages, agentConnected, handleAttachmentUpload, handleSend };
}

export const EditorAgentChat: FunctionComponent<EditorAgentChatProps> = ({
  agentName,
  resourceId,
  context,
  height,
  disabled: disabledProp,
  uploadFileType = 'agent-attachments',
}) => {
  const { threadId, messages, agentConnected, handleAttachmentUpload, handleSend } = useEditorAgentChat(
    agentName,
    resourceId,
    uploadFileType,
  );

  return (
    <div style={{ height }}>
      <AgentChat
        disabled={disabledProp || !agentConnected}
        threadId={threadId}
        context={context}
        messages={messages}
        onSend={handleSend}
        onAttachmentUpload={handleAttachmentUpload}
      />
    </div>
  );
};
