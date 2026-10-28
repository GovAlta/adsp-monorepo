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
import { AnalysisMode, DiscoveryOptions, OpenQuestion, Solution, SpecialistDefinition } from './model';
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

const QuestionList = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
`;

const QuestionRow = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
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
  type: 'important' | 'success' | 'information' = count > 0 ? 'important' : 'information',
) => <GoabBadge type={type} content={plural(count, label)} testId={testId} />;

const OPEN_QUESTIONS_LIMIT = 5;
const SUMMARY_LENGTH = 300;

const isLong = (answer?: string): boolean => (answer || '').length > SUMMARY_LENGTH;

type QuestionRowMode = 'closed' | 'answering' | 'viewing';

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
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [rowMode, setRowMode] = useState<Record<string, QuestionRowMode>>({});
  const [showAllOpen, setShowAllOpen] = useState(false);
  const [selectedSpecialistService, setSelectedSpecialistService] = useState<string>();
  const [chatCounts, setChatCounts] = useState<Record<string, number>>({});
  const [chatCountsError, setChatCountsError] = useState(false);
  const [busy, run] = useBusy();
  const blocked = busy || disabled;
  const discovery = solution.state.discovery;
  const canSkipDiscovery = !!discovery && !discovery.ready && discovery.confidence < discovery.threshold;
  const message = draft.trim();
  const allQuestions = [...solution.state.questions].sort((a, b) => {
    if (a.status === 'open' && b.status !== 'open') {
      return 1;
    }
    if (a.status !== 'open' && b.status === 'open') {
      return -1;
    }
    return 0;
  });
  const openQuestions = allQuestions.filter((question) => question.status === 'open');
  const answeredQuestions = allQuestions.filter((question) => question.status !== 'open');
  const visibleOpenIds = new Set(
    (showAllOpen ? openQuestions : openQuestions.slice(0, OPEN_QUESTIONS_LIMIT)).map((question) => question.id),
  );
  const hiddenOpenCount = openQuestions.length - visibleOpenIds.size;
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

  const startAnswering = (question: OpenQuestion) => {
    setAnswerDrafts((drafts) => ({ ...drafts, [question.id]: drafts[question.id] ?? question.answer ?? '' }));
    setRowMode((modes) => ({ ...modes, [question.id]: 'answering' }));
  };

  const cancelAnswering = (questionId: string) => setRowMode((modes) => ({ ...modes, [questionId]: 'closed' }));

  const toggleShowAnswer = (questionId: string) =>
    setRowMode((modes) => ({ ...modes, [questionId]: modes[questionId] === 'viewing' ? 'closed' : 'viewing' }));

  const saveAnswer = (questionId: string) =>
    run(async () => {
      const result = await api.answerQuestion(solution.id, questionId, (answerDrafts[questionId] || '').trim());
      setRowMode((modes) => ({ ...modes, [questionId]: 'closed' }));
      onSolutionChange(result);
    });

  const renderQuestionRow = (question: OpenQuestion) => {
    const isOpen = question.status === 'open';
    const currentMode = rowMode[question.id] || 'closed';
    return (
      <QuestionRow key={question.id} data-testid={`discovery-question-${question.id}`}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span>{question.question}</span>
            <GoabBadge
              type={isOpen ? 'information' : 'success'}
              content={isOpen ? 'Open' : 'Answered'}
              testId={`discovery-question-status-${question.id}`}
            />
          </div>
          {currentMode === 'answering' ? (
            <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.5rem' }}>
              <GoabTextArea
                name={`question-answer-${question.id}`}
                value={answerDrafts[question.id] ?? ''}
                rows={2}
                width="100%"
                maxWidth="100%"
                testId={`discovery-question-input-${question.id}`}
                ariaLabel={`Answer: ${question.question}`}
                disabled={blocked}
                onChange={(detail) => setAnswerDrafts((drafts) => ({ ...drafts, [question.id]: detail.value }))}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <GoabButton
                  type="primary"
                  size="compact"
                  testId={`discovery-question-save-${question.id}`}
                  disabled={blocked || !(answerDrafts[question.id] || '').trim()}
                  onClick={() => saveAnswer(question.id)}
                >
                  Save
                </GoabButton>
                <GoabButton
                  type="tertiary"
                  size="compact"
                  testId={`discovery-question-cancel-${question.id}`}
                  disabled={blocked}
                  onClick={() => cancelAnswering(question.id)}
                >
                  Cancel
                </GoabButton>
              </div>
            </div>
          ) : isOpen ? (
            <GoabButton
              type="secondary"
              size="compact"
              testId={`discovery-question-answer-${question.id}`}
              mt="s"
              disabled={blocked}
              onClick={() => startAnswering(question)}
            >
              Answer
            </GoabButton>
          ) : (
            <div style={{ marginTop: '0.25rem' }}>
              {(!isLong(question.answer) || currentMode === 'viewing') && (
                <p data-testid={`discovery-question-summary-${question.id}`}>{question.answer}</p>
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {isLong(question.answer) && (
                  <GoabButton
                    type="tertiary"
                    size="compact"
                    testId={`discovery-question-toggle-${question.id}`}
                    disabled={blocked}
                    onClick={() => toggleShowAnswer(question.id)}
                  >
                    {currentMode === 'viewing' ? 'Hide answer' : 'Show answer'}
                  </GoabButton>
                )}
                <GoabButton
                  type="tertiary"
                  size="compact"
                  testId={`discovery-question-edit-${question.id}`}
                  disabled={blocked}
                  onClick={() => startAnswering(question)}
                >
                  Edit
                </GoabButton>
              </div>
            </div>
          )}
        </div>
      </QuestionRow>
    );
  };

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
      <p style={{ fontSize: '85%', margin: '0 0 1rem' }} data-testid="discovery-mode-hint">
        Using {mode === 'ai' ? 'AI analysis' : 'rule-based analysis'}. Change this with the Analysis mode toggle in the
        Problem statement step above.
      </p>
      <GoabAccordion
        heading="Questions"
        headingContent={
          <span style={{ display: 'flex', gap: '0.5rem' }}>
            {countBadge(openQuestions.length, 'open question', 'discovery-questions-count')}
            {answeredQuestions.length > 0 &&
              countBadge(answeredQuestions.length, 'answered question', 'discovery-answered-count', 'success')}
          </span>
        }
        headingSize="small"
        open={false}
        testId="discovery-questions"
      >
        <p>
          Answer a question directly below it, or use &quot;Additional details&quot; further down for free-form details.
        </p>
        {allQuestions.length > 0 ? (
          <>
            {answeredQuestions.length > 0 && (
              <div style={{ marginLeft: '-15px', marginBottom: openQuestions.length > 0 ? '1rem' : 0 }}>
                <GoabDetails
                  heading={`Answered questions (${answeredQuestions.length})`}
                  open={false}
                  testId="discovery-answered-questions"
                >
                  <QuestionList>{answeredQuestions.map((question) => renderQuestionRow(question))}</QuestionList>
                </GoabDetails>
              </div>
            )}
            {openQuestions.length === 0 && (
              <GoabCallout type="success" heading="All caught up" testId="discovery-questions-complete" mb="m">
                Nothing more to answer right now — you&apos;ve answered everything the planner currently knows to ask.
                Confidence reflects how well each area is understood; use &quot;Additional details&quot; below to add
                more at any time.
              </GoabCallout>
            )}
            {openQuestions.length > 0 && (
              <>
                <QuestionList>
                  {openQuestions
                    .filter((question) => visibleOpenIds.has(question.id))
                    .map((question) => renderQuestionRow(question))}
                </QuestionList>
                {hiddenOpenCount > 0 && (
                  <GoabButton
                    type="tertiary"
                    size="compact"
                    testId="discovery-questions-show-more"
                    mt="s"
                    disabled={blocked}
                    onClick={() => setShowAllOpen(true)}
                  >
                    Show more ({hiddenOpenCount})
                  </GoabButton>
                )}
                {showAllOpen && openQuestions.length > OPEN_QUESTIONS_LIMIT && (
                  <GoabButton
                    type="tertiary"
                    size="compact"
                    testId="discovery-questions-show-less"
                    mt="s"
                    disabled={blocked}
                    onClick={() => setShowAllOpen(false)}
                  >
                    Show fewer
                  </GoabButton>
                )}
              </>
            )}
          </>
        ) : (
          <p>No questions yet.</p>
        )}
      </GoabAccordion>
      <GoabAccordion
        heading="Conversation"
        headingContent={countBadge(messages.length, 'message', 'discovery-conversation-count')}
        headingSize="small"
        open={true}
        testId="discovery-conversation"
      >
        {messages.length > 0 ? (
          <div style={{ marginLeft: '-15px' }}>
            <GoabDetails
              heading={`Conversation history (${messages.length})`}
              open={false}
              testId="discovery-conversation-history"
            >
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
            </GoabDetails>
          </div>
        ) : (
          <p>No messages yet.</p>
        )}
        {busy && (
          <GoabCircularProgress visible size="small" message="Asking the model — this can take up to a minute" />
        )}
        <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
          <GoabFormItem
            label="Additional details"
            helpText="You can answer any of the open questions here too — just say which one you mean."
          >
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
                    chatCounts[specialist.service] ? ` (${chatCounts[specialist.service]})` : ''
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
