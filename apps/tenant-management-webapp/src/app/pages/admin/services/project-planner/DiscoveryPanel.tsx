import React, { FunctionComponent, useEffect, useState } from 'react';
import {
  GoabAccordion,
  GoabBadge,
  GoabButton,
  GoabCallout,
  GoabCircularProgress,
  GoabDetails,
  GoabFormItem,
  GoabTextArea,
} from '@abgov/react-components';
import styled from 'styled-components';
import { PlannerApi } from './api';
import { AnalysisMode, ConversationMessage, DiscoveryOptions, Solution, SpecialistDefinition } from './model';
import { countChatsByService, ExpandableText, SpecialistChat } from './SpecialistChat';
import { useBusy } from './useBusy';

const ExpertLayout = styled.div`
  display: grid;
  width: 100%;
  box-sizing: border-box;
  grid-template-columns: 15rem minmax(0, 1fr);
  gap: 2rem;
  align-items: start;

  @media (max-width: 48rem) {
    grid-template-columns: minmax(0, 1fr);
    gap: 1.5rem;
  }
`;

const ExpertList = styled.div`
  display: grid;
  gap: 0.5rem;
  min-width: 0;
`;

const SpecialistChatPanel = styled.div`
  min-width: 0;

  @media (min-width: 48.01rem) {
    border-left: 1px solid #dcdcdc;
    padding-left: 1.5rem;
  }
`;

interface DiscoveryPanelProps {
  solution: Solution;
  api: PlannerApi;
  mode: AnalysisMode;
  onSolutionChange: (solution: Solution) => void;
  specialists?: SpecialistDefinition[];
  // Set while another section (problem statement, header, blueprint) is busy, to block this one too.
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
  onChatsChanged?: () => void;
}

const serviceName = (service: string, specialists: SpecialistDefinition[]) =>
  specialists.find((specialist) => specialist.service === service)?.displayName.replace(/ service$/i, '') || service;

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

const countBadge = (
  count: number,
  label: string,
  testId: string,
  type: 'important' | 'success' | 'information' = 'information',
) => <GoabBadge type={type} content={plural(count, label)} testId={testId} />;

const RECENT_MESSAGE_COUNT = 2;

export const DiscoveryPanel: FunctionComponent<DiscoveryPanelProps> = ({
  solution,
  api,
  mode,
  onSolutionChange,
  specialists = [],
  disabled = false,
  onBusyChange,
  onChatsChanged,
}) => {
  const [draft, setDraft] = useState('');
  const [selectedSpecialistService, setSelectedSpecialistService] = useState<string>();
  const [chatCounts, setChatCounts] = useState<Record<string, number>>({});
  const [chatCountsError, setChatCountsError] = useState(false);
  const [busy, run] = useBusy();
  const blocked = busy || disabled;
  const discovery = solution.state.discovery;
  const confidence = solution.state.confidence;
  const canSkipDiscovery = !!discovery && !discovery.ready && discovery.confidence < discovery.threshold;
  const message = draft.trim();
  const openQuestions = solution.state.questions.filter((question) => question.status === 'open');
  const messages = [...(discovery?.messages || []), ...(solution.state.conversation || [])].sort(
    (first, second) => new Date(first.at).getTime() - new Date(second.at).getTime(),
  );
  const recentMessages = messages.slice(-RECENT_MESSAGE_COUNT);
  const earlierMessages = messages.slice(0, messages.length - recentMessages.length);
  const recommendations = solution.state.blueprint?.serviceMapping || [];
  const activeRecommendation =
    recommendations.find((recommendation) => recommendation.service === selectedSpecialistService) ||
    recommendations[0];
  const activeSpecialist =
    specialists.find((specialist) => specialist.service === selectedSpecialistService) ||
    specialists.find((specialist) =>
      recommendations.some((recommendation) => recommendation.service === specialist.service),
    ) ||
    specialists[0];
  const specialistsWithChatsCount = specialists.filter((specialist) => chatCounts[specialist.service] > 0).length;

  useEffect(() => {
    let active = true;
    api
      .listChats({ solutionId: solution.id })
      .then((chats) => {
        if (active) {
          setChatCounts(countChatsByService(chats));
          setChatCountsError(false);
        }
      })
      .catch(() => {
        if (active) {
          setChatCountsError(true);
        }
      });
    return () => {
      active = false;
    };
  }, [api, solution.id, solution.updatedOn]);

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  const refreshChatCounts = async () => {
    try {
      setChatCounts(countChatsByService(await api.listChats({ solutionId: solution.id })));
      setChatCountsError(false);
    } catch {
      setChatCountsError(true);
    }
  };
  const handleChatsChanged = () => {
    refreshChatCounts();
    onChatsChanged?.();
  };

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
      {discovery?.warning && (
        <GoabCallout type="important" emphasis="medium" heading="Note" testId="discovery-warning">
          {discovery.warning}
        </GoabCallout>
      )}
      <p style={{ fontSize: '85%', margin: '0 0 1rem' }} data-testid="discovery-mode-hint">
        Using {mode === 'ai' ? 'AI analysis' : 'rule-based analysis'}. Change this with the Analysis mode toggle in the
        Problem statement step above.
      </p>
      <GoabAccordion
        heading="Conversation"
        headingContent={countBadge(messages.length, 'message', 'discovery-conversation-count')}
        headingSize="small"
        headingType="filled"
        open={true}
        testId="discovery-conversation"
      >
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
          {messages.length === 0 &&
            (confidence && confidence.score >= confidence.threshold ? (
              <GoabCallout type="information" heading="Planner" testId="discovery-empty-confident">
                <div>
                  Your problem statement already gives me enough detail (confidence {confidence.score}%). Reply below
                  only if you want to add more or ask a question.
                </div>
              </GoabCallout>
            ) : (
              <p>No messages yet.</p>
            ))}
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
      </GoabAccordion>
      <div style={{ marginTop: '1.5rem' }}>
        <GoabAccordion
          heading="Chat/Consult with Specialist"
          headingContent={
            <span style={{ display: specialistsWithChatsCount > 0 ? undefined : 'none' }}>
              {specialistsWithChatsCount > 0 &&
                countBadge(specialistsWithChatsCount, 'specialist', 'optional-experts-count')}
            </span>
          }
          headingType="filled"
          open={false}
          testId="optional-experts"
        >
          <p>Choose a service expert for help with this solution. Recommended services are marked.</p>
          {chatCountsError && (
            <GoabCallout type="important" heading="Saved chat counts unavailable" testId="specialist-chat-counts-error">
              Saved chat counts could not be loaded. You can still open any specialist.
            </GoabCallout>
          )}
          {specialists.length ? (
            <ExpertLayout data-testid="service-expert-layout">
              <ExpertList role="group" aria-label="Available service experts">
                <h3 style={{ margin: 0 }}>Specialists</h3>
                {specialists.map((specialist) => {
                  const label = `${serviceName(specialist.service, specialists)}${
                    chatCounts[specialist.service] ? ' *' : ''
                  }`;

                  return (
                    <GoabButton
                      key={specialist.service}
                      type={activeSpecialist?.service === specialist.service ? 'primary' : 'secondary'}
                      size="compact"
                      width="100%"
                      testId={`specialist-service-${specialist.service}`}
                      onClick={() => setSelectedSpecialistService(specialist.service)}
                    >
                      {label}
                    </GoabButton>
                  );
                })}
              </ExpertList>
              {activeSpecialist && (
                <SpecialistChatPanel data-testid="selected-specialist-chat">
                  <SpecialistChat
                    service={activeSpecialist.service}
                    specialist={activeSpecialist}
                    solution={solution}
                    api={api}
                    mode={mode}
                    disabled={blocked}
                    context={{
                      label:
                        activeRecommendation?.service === activeSpecialist.service
                          ? 'Recommended for this plan'
                          : 'Purpose',
                      description:
                        activeRecommendation?.service === activeSpecialist.service
                          ? activeRecommendation.reason
                          : activeSpecialist.purpose,
                    }}
                    onChatsChanged={handleChatsChanged}
                    onSolutionChange={onSolutionChange}
                  />
                </SpecialistChatPanel>
              )}
            </ExpertLayout>
          ) : (
            <p>No service experts are currently available.</p>
          )}
        </GoabAccordion>
      </div>
    </div>
  );
};

export default DiscoveryPanel;
