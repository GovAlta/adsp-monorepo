import { AgentChat } from '@core-services/app-common';
import { AppDispatch, RootState } from '@store/index';
import { messageAgent } from '@store/agent/actions';
import { messagesSelector } from '@store/agent/selectors';
import { FunctionComponent } from 'react';
import { useDispatch, useSelector } from 'react-redux';

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

  return (
    <div style={{ height }}>
      <AgentChat
        threadId={threadId}
        context={{ formDefinitionId: definitionId }}
        messages={messages}
        onSend={(threadId: string, context: Record<string, unknown>, content: string) =>
          dispatch(messageAgent(threadId, context, content))
        }
      />
    </div>
  );
};
