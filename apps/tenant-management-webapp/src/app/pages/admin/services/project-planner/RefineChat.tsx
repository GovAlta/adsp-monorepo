import React, { FunctionComponent, useState } from 'react';
import { GoabButton, GoabCallout, GoabCircularProgress, GoabFormItem, GoabTextArea } from '@abgov/react-components';
import { PaneProps } from './workplaceTypes';

interface RefineChatProps extends PaneProps {
  title: string;
}

export const RefineChat: FunctionComponent<RefineChatProps> = ({ solution, api, mode, busy, run, onSolutionChange, title }) => {
  const [draft, setDraft] = useState('');
  const messages = solution.state.conversation || [];
  const message = draft.trim();

  const send = () =>
    run(async () => {
      onSolutionChange(await api.chat(solution.id, message, mode));
      setDraft('');
    });

  return (
    <div data-testid="refine-chat">
      <h2>{title}</h2>
      {messages.length ? (
        messages.map((m, i) => (
          <GoabCallout
            key={i}
            type={m.role === 'user' ? 'information' : 'success'}
            heading={m.role === 'user' ? 'You' : 'Planner'}
            testId={`refine-message-${i}`}
          >
            <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
          </GoabCallout>
        ))
      ) : (
        <p data-testid="refine-empty">
          Ask a question, add detail, or correct the planner's understanding.{' '}
          {mode === 'ai' ? 'The AI will answer and refine the analysis.' : 'Switch to AI analysis for conversational replies.'}
        </p>
      )}
      <GoabFormItem label="Message to the planner" mb="m">
        <GoabTextArea
          name="refineMessage"
          value={draft}
          rows={3}
          width="100%"
          testId="refine-input"
          disabled={busy}
          placeholder="e.g. Applicants are small non-profits; decisions need a committee vote."
          onChange={(detail) => setDraft(detail.value)}
        />
      </GoabFormItem>
      <GoabButton type="primary" testId="refine-send" disabled={busy || !message} onClick={send}>
        {busy ? 'Thinking…' : 'Send'}
      </GoabButton>
      {busy && <GoabCircularProgress visible size="small" message="Asking the model — this can take up to a minute" />}
    </div>
  );
};

export default RefineChat;
