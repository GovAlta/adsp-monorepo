import React, { FunctionComponent, useEffect, useState } from 'react';
import {
  GoabButton,
  GoabCallout,
  GoabCircularProgress,
  GoabDetails,
  GoabFormItem,
  GoabTextArea,
} from '@abgov/react-components';
import { PlannerApi } from './api';
import { AnalysisMode, ConversationMessage, DiscoveryOptions, Solution } from './model';
import { ExpandableText } from './SpecialistChat';
import { useBusy } from './useBusy';

interface DiscoveryPanelProps {
  solution: Solution;
  api: PlannerApi;
  mode: AnalysisMode;
  onSolutionChange: (solution: Solution) => void;
  // Set while another section (problem statement, header, blueprint) is busy, to block this one too.
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
  onMessageCountChange?: (count: number) => void;
}

const RECENT_MESSAGE_COUNT = 2;

export const DiscoveryPanel: FunctionComponent<DiscoveryPanelProps> = ({
  solution,
  api,
  mode,
  onSolutionChange,
  disabled = false,
  onBusyChange,
  onMessageCountChange,
}) => {
  const [draft, setDraft] = useState('');
  const [busy, run] = useBusy();
  const blocked = busy || disabled;
  const discovery = solution.state.discovery;
  const confidence = solution.state.confidence;
  const canSkipDiscovery = !!discovery && !discovery.ready && discovery.confidence < discovery.threshold;
  const message = draft.trim();
  const openQuestions = solution.state.questions.filter((question) => question.status === 'open');
  const realMessages = [...(discovery?.messages || []), ...(solution.state.conversation || [])].sort(
    (first, second) => new Date(first.at).getTime() - new Date(second.at).getTime(),
  );
  const buildGreeting = (): ConversationMessage | undefined =>
    confidence && confidence.score >= confidence.threshold
      ? {
          role: 'assistant',
          content: `Your problem statement already gives me enough detail (confidence ${confidence.score}%). Reply below only if you want to add more or ask a question.`,
          at: new Date(0).toISOString(),
        }
      : undefined;
  const [initialGreeting, setInitialGreeting] = useState<ConversationMessage | undefined>(() =>
    realMessages.length === 0 ? buildGreeting() : undefined,
  );
  useEffect(() => {
    if (realMessages.length === 0) {
      setInitialGreeting(buildGreeting());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realMessages.length, confidence?.score, confidence?.threshold]);
  const messages = initialGreeting ? [initialGreeting, ...realMessages] : realMessages;
  const recentMessages = messages.slice(-RECENT_MESSAGE_COUNT);
  const earlierMessages = messages.slice(0, messages.length - recentMessages.length);

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  useEffect(() => {
    onMessageCountChange?.(messages.length);
  }, [messages.length, onMessageCountChange]);

  const send = (options?: DiscoveryOptions) =>
    run(async () => {
      const result = options
        ? await api.discovery(solution.id, { mode, ...options })
        : await api.chat(solution.id, message, mode);
      setDraft('');
      onSolutionChange(result);
    });

  const renderMessage = (m: ConversationMessage, index: number) => (
    <GoabCallout
      key={`${m.at}-${index}`}
      type={m.role === 'user' ? 'success' : 'information'}
      heading={m.role === 'user' ? 'You' : 'Planner'}
      testId={`discovery-message-${index}`}
      mb="s"
    >
      <ExpandableText content={m.content} testId={`discovery-message-${index}-toggle`} />
    </GoabCallout>
  );

  return (
    <div data-testid="discovery-panel">
      {!blocked && discovery?.warning && (
        <GoabCallout type="important" emphasis="medium" heading="Note" testId="discovery-warning">
          {discovery.warning}
        </GoabCallout>
      )}
      <p style={{ fontSize: '85%', margin: '0 0 1rem', padding: '0 1.5rem' }} data-testid="discovery-mode-hint">
        Using {mode === 'ai' ? 'AI analysis' : 'rule-based analysis'}. Change this with the Analysis mode toggle in the
        Problem statement step above.
      </p>
      <div data-testid="discovery-conversation" style={{ padding: '0 1.5rem' }}>
        <p style={{ fontStyle: 'italic' }} data-testid="discovery-conversation-hint">
          Reply in the box below to add details, ask a question, or answer something the planner raised. Each reply is
          recorded here and the plan — including its confidence — updates automatically.
        </p>
        <section aria-label="Conversation with the planner">
          {earlierMessages.length > 0 && (
            <GoabDetails
              heading={`Show earlier conversation (${earlierMessages.length})`}
              open={false}
              testId="discovery-earlier-conversation"
              maxWidth="100%"
              mb="s"
            >
              {earlierMessages.map((m, i) => renderMessage(m, i))}
            </GoabDetails>
          )}
          {recentMessages.map((m, i) => renderMessage(m, earlierMessages.length + i))}
          {messages.length === 0 && <p>No messages yet.</p>}
        </section>
        {busy && (
          <GoabCircularProgress visible size="small" message="Asking the model — this can take up to a minute" />
        )}
        <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
          <GoabFormItem label="Additional details">
            <GoabTextArea
              name="plannerMessage"
              value={draft}
              rows={3}
              width="100%"
              maxWidth="100%"
              testId="discovery-input"
              ariaLabel="Additional details"
              disabled={blocked}
              placeholder="Add details, ask a question, or correct anything the planner got wrong."
              onChange={(detail) => setDraft(detail.value)}
            />
          </GoabFormItem>
          <div
            role="group"
            aria-label="Discovery actions"
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}
          >
            <GoabButton
              type="primary"
              size="compact"
              testId="discovery-send"
              disabled={blocked || !message}
              onClick={() => send(openQuestions.length ? { message } : undefined)}
            >
              Send &amp; refine
            </GoabButton>
            <GoabButton
              type="tertiary"
              size="compact"
              testId="discovery-restart"
              disabled={blocked}
              onClick={() => send({ restart: true })}
            >
              Start over
            </GoabButton>
            {canSkipDiscovery && (
              <GoabButton
                type="secondary"
                size="compact"
                testId="discovery-force"
                disabled={blocked}
                onClick={() => send({ force: true })}
              >
                Skip and show me a plan
              </GoabButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscoveryPanel;
