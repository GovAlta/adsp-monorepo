import { AgentChat, Attachment, UserContent } from '@core-services/app-common';
import { AppDispatch, RootState } from '@store/index';
import { messageAgent } from '@store/agent/actions';
import { messagesSelector } from '@store/agent/selectors';
import { UploadFileService } from '@store/file/actions';
import { FunctionComponent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnyAction } from 'redux';

interface DefinitionAgentChatProps {
  definitionId: string;
  threadId: string;
  height: number;
}

export const DefinitionAgentChat: FunctionComponent<DefinitionAgentChatProps> = ({
  threadId,
  definitionId,
  height,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const messages = useSelector((state: RootState) => messagesSelector(state, threadId));

  const handleAttachmentUpload = async (file: File): Promise<Attachment> => {
    const type = file.type.startsWith('image/') ? 'image' : 'file';
    
    const { uploadedFile, dataUrl } = await dispatch(
      UploadFileService({
        type: 'agent-attachments',
        file,
        recordId: definitionId,
      }) as unknown as AnyAction
    );

    return {
      urn: uploadedFile.urn,
      filename: uploadedFile.filename || file.name,
      type,
      thumbnailUrl: type === 'image' ? dataUrl : undefined,
    };
  };

  return (
    <div style={{ height }}>
      <AgentChat
        threadId={threadId}
        context={{ formDefinitionId: definitionId }}
        messages={messages}
        onSend={(threadId: string, context: Record<string, unknown>, content: UserContent) =>
          dispatch(messageAgent(threadId, context, content))
        }
        onAttachmentUpload={handleAttachmentUpload}
      />
    </div>
  );
};
