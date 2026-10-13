import React, { FunctionComponent, useState } from 'react';
import { GoabButton, GoabCallout, GoabCircularProgress, GoabFormItem, GoabTextArea } from '@abgov/react-components';
import { PlannerApi } from './api';
import { AnalysisMode, DiscoveryOptions, Solution } from './model';

interface DiscoveryPanelProps {
  solution: Solution;
  api: PlannerApi;
  mode: AnalysisMode;
  onSolutionChange: (solution: Solution) => void;
}

export const DiscoveryPanel: FunctionComponent<DiscoveryPanelProps> = ({ solution, api, mode, onSolutionChange }) => {
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const discovery = solution.state.discovery;
  const ready = !!discovery?.ready;
  const message = draft.trim();

  const discover = async (options: DiscoveryOptions) => {
    setBusy(true);
    try {
      let result = await api.discovery(solution.id, { mode, ...options });
      setDraft('');
      // The proposed solution includes the blueprint: build it when first presented and rebuild it after each refinement.
      if (result.state.discovery?.ready && (!result.state.blueprint || options.message)) {
        onSolutionChange(result);
        result = await api.blueprint(solution.id, { mode });
      }
      onSolutionChange(result);
    } catch {
      // The api reports the error to the user.
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="discovery-panel">
      <h3>Discovery conversation</h3>
      {discovery?.warning && (
        <GoabCallout type="important" heading="Note" testId="discovery-warning">
          {discovery.warning}
        </GoabCallout>
      )}
      {discovery?.messages.length ? (
        discovery.messages.map((m, i) => (
          <GoabCallout
            key={i}
            type={m.role === 'user' ? 'information' : 'important'}
            heading={m.role === 'user' ? 'You' : 'Planner'}
            testId={`discovery-message-${i}`}
          >
            <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
          </GoabCallout>
        ))
      ) : (
        <p data-testid="discovery-empty">
          Start discovery and the Planner will ask clarifying questions in one message. Answer them; once confidence passes{' '}
          {discovery?.threshold ?? 50}% the solution is presented.
        </p>
      )}
      {busy && <GoabCircularProgress visible size="small" message="Asking the model — this can take up to a minute" />}
      {discovery ? (
        <>
          <GoabFormItem label="Your reply">
            <GoabTextArea
              name="discoveryReply"
              value={draft}
              rows={4}
              width="100%"
              testId="discovery-input"
              ariaLabel="Your reply"
              disabled={busy}
              placeholder={ready ? 'Add details or answer further questions to refine the solution' : 'Type your answers here'}
              onChange={(detail) => setDraft(detail.value)}
            />
          </GoabFormItem>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <GoabButton
              type="primary"
              testId="discovery-send"
              disabled={busy || !message}
              onClick={() => discover({ message })}
            >
              {busy ? 'Thinking…' : ready ? 'Send & refine solution' : 'Send reply'}
            </GoabButton>
            {!ready && (
              <GoabButton
                type="secondary"
                testId="discovery-force"
                disabled={busy}
                onClick={() => discover({ force: true, ...(message ? { message } : {}) })}
              >
                Show solution now
              </GoabButton>
            )}
            <GoabButton type="tertiary" testId="discovery-restart" disabled={busy} onClick={() => discover({ restart: true })}>
              Start over
            </GoabButton>
          </div>
        </>
      ) : (
        <GoabButton type="primary" testId="discovery-start" disabled={busy} onClick={() => discover({ restart: true })}>
          {busy ? 'Thinking…' : 'Start discovery'}
        </GoabButton>
      )}
    </div>
  );
};

export default DiscoveryPanel;
