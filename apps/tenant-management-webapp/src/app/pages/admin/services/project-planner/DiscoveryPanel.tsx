import React, { FunctionComponent, useEffect, useState } from 'react';
import {
  GoabAccordion,
  GoabBadge,
  GoabButton,
  GoabCallout,
  GoabCircularProgress,
  GoabFormItem,
  GoabTextArea,
} from '@abgov/react-components';
import styled from 'styled-components';
import { PlannerApi } from './api';
import { AnalysisMode, DiscoveryOptions, Solution, SpecialistDefinition } from './model';
import { countChatsByService, SpecialistChat } from './SpecialistChat';
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
}

const serviceName = (service: string, specialists: SpecialistDefinition[]) =>
  specialists.find((specialist) => specialist.service === service)?.displayName.replace(/ service$/i, '') || service;

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

const countBadge = (count: number, label: string, testId: string) => (
  <GoabBadge type={count > 0 ? 'important' : 'information'} content={plural(count, label)} testId={testId} />
);

export const DiscoveryPanel: FunctionComponent<DiscoveryPanelProps> = ({
  solution,
  api,
  mode,
  onSolutionChange,
  specialists = [],
}) => {
  const [draft, setDraft] = useState('');
  const [selectedSpecialistService, setSelectedSpecialistService] = useState<string>();
  const [chatCounts, setChatCounts] = useState<Record<string, number>>({});
  const [chatCountsError, setChatCountsError] = useState(false);
  const [busy, run] = useBusy();
  const discovery = solution.state.discovery;
  const ready = !!discovery?.ready;
  const message = draft.trim();
  const openQuestions = solution.state.questions.filter((question) => question.status === 'open');
  const messages = [...(discovery?.messages || []), ...(solution.state.conversation || [])].sort(
    (first, second) => new Date(first.at).getTime() - new Date(second.at).getTime(),
  );
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
  }, [api, solution.id]);

  const refreshChatCounts = async () => {
    try {
      setChatCounts(countChatsByService(await api.listChats({ solutionId: solution.id })));
      setChatCountsError(false);
    } catch {
      setChatCountsError(true);
    }
  };

  const send = (options?: DiscoveryOptions) =>
    run(async () => {
      const result = options
        ? await api.discovery(solution.id, { mode, ...options })
        : await api.chat(solution.id, message, mode);
      setDraft('');
      onSolutionChange(result);
    });

  return (
    <div data-testid="discovery-panel">
      {discovery?.warning && (
        <GoabCallout type="important" heading="Note" testId="discovery-warning">
          {discovery.warning}
        </GoabCallout>
      )}
      <p>
        Refine the analysis by answering optional questions, asking a question, adding more details, or correcting gaps.
      </p>
      <GoabAccordion
        heading="Conversation"
        headingContent={countBadge(messages.length, 'message', 'discovery-conversation-count')}
        headingSize="small"
        open={false}
        testId="discovery-conversation"
      >
        {messages.length > 0 ? (
          <section aria-label="Conversation with the planner">
            {messages.map((m, i) => (
              <GoabCallout
                key={`${m.at}-${i}`}
                type={m.role === 'user' ? 'important' : 'information'}
                heading={m.role === 'user' ? 'You' : 'Planner'}
                testId={`discovery-message-${i}`}
                mb="s"
              >
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
              </GoabCallout>
            ))}
          </section>
        ) : (
          <p>No messages yet.</p>
        )}
      </GoabAccordion>
      <GoabAccordion
        heading="Questions"
        headingContent={countBadge(openQuestions.length, 'question', 'discovery-questions-count')}
        headingSize="small"
        open={false}
        testId="discovery-questions"
      >
        {openQuestions.length > 0 ? (
          <ol>
            {openQuestions.map((question) => (
              <li key={question.id}>{question.question}</li>
            ))}
          </ol>
        ) : (
          <p>No remaining questions.</p>
        )}
      </GoabAccordion>
      {busy && <GoabCircularProgress visible size="small" message="Asking the model — this can take up to a minute" />}
      {ready && <p data-testid="discovery-ready">Your answers are enough to prepare a plan.</p>}
      <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        <GoabFormItem label="Add details or answer questions">
          <GoabTextArea
            name="plannerMessage"
            value={draft}
            rows={3}
            width="100%"
            testId="discovery-input"
            ariaLabel="Add details or answer questions"
            disabled={busy}
            placeholder="Answer questions, add details, or correct anything the planner got wrong."
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
            testId="discovery-send"
            disabled={busy || !message}
            onClick={() => send(openQuestions.length ? { message } : undefined)}
          >
            Send &amp; refine
          </GoabButton>
          <GoabButton
            type="tertiary"
            testId="discovery-restart"
            disabled={busy}
            onClick={() => send({ restart: true })}
          >
            Start over
          </GoabButton>
        </div>
      </div>
      <div style={{ marginTop: '1.5rem' }}>
        <GoabAccordion
          heading="Chat/Consult with Specialist"
          headingContent={countBadge(specialists.length, 'specialist', 'optional-experts-count')}
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
                <h4 style={{ margin: 0 }}>Specialists</h4>
                {specialists.map((specialist) => {
                  return (
                    <GoabButton
                      key={specialist.service}
                      type={activeSpecialist?.service === specialist.service ? 'primary' : 'secondary'}
                      size="compact"
                      width="100%"
                      testId={`specialist-service-${specialist.service}`}
                      onClick={() => setSelectedSpecialistService(specialist.service)}
                    >
                      {serviceName(specialist.service, specialists)}
                      {chatCounts[specialist.service] ? ` (${chatCounts[specialist.service]})` : ''}
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
                    onChatsChanged={refreshChatCounts}
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
