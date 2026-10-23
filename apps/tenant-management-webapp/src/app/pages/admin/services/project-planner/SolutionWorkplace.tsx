import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';
import {
  GoabBadge,
  GoabButton,
  GoabCallout,
  GoabCircularProgress,
  GoabContainer,
  GoabDetails,
  GoabFormItem,
  GoabIcon,
  GoabTextArea,
} from '@abgov/react-components';
import { Concepts, Hypotheses, NextSteps, PatternMatches } from './AnalysisSections';
import { usePlannerApi } from './api';
import BlueprintViewer from './BlueprintViewer';
import ConfidenceBar from './ConfidenceBar';
import DiscoveryPanel from './DiscoveryPanel';
import { AnalysisModeToggle } from './ModeLayoutToggle';
import ProblemStatement from './ProblemStatement';
import SolutionHeader from './SolutionHeader';
import { AnalysisMode, OpenQuestion, Solution, SpecialistDefinition } from './model';
import { useBusy } from './useBusy';

interface SolutionWorkplaceProps {
  solutionId: string;
  onBack?: () => void;
  onSolutionChanged?: () => void;
}

export const getGuidedStep = (solution: Solution): 1 | 2 | 3 => {
  if (solution.state.blueprint) {
    return 3;
  }
  if (!solution.state.analysis) {
    return 1;
  }
  if (
    solution.state.discovery?.ready ||
    (solution.state.confidence && solution.state.confidence.score >= solution.state.confidence.threshold)
  ) {
    return 3;
  }
  return 2;
};

interface GuidedStepProps {
  heading: string;
  testId: string;
  children: React.ReactNode;
}

const GuidedStep: FunctionComponent<GuidedStepProps> = ({ heading, testId, children }) => {
  const [expanded, setExpanded] = useState(true);
  const headingId = `${testId}-heading`;
  const panelId = `${testId}-content`;

  return (
    <section data-testid={testId} style={{ borderBottom: '1px solid #dcdcdc', padding: '1rem 0' }}>
      <h2 id={headingId} style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.25, margin: 0 }}>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((open) => !open)}
          style={{
            alignItems: 'center',
            background: 'none',
            border: 0,
            color: 'inherit',
            cursor: 'pointer',
            display: 'flex',
            font: 'inherit',
            gap: '0.75rem',
            padding: 0,
            textAlign: 'left',
            width: '100%',
          }}
          data-testid={`${testId}-toggle`}
        >
          <GoabIcon type={expanded ? 'chevron-down' : 'chevron-forward'} size="small" role="presentation" />
          <span>{heading}</span>
        </button>
      </h2>
      {expanded && (
        <div id={panelId} role="region" aria-labelledby={headingId} style={{ paddingTop: '1rem' }}>
          {children}
        </div>
      )}
    </section>
  );
};

export const SolutionWorkplace: FunctionComponent<SolutionWorkplaceProps> = ({
  solutionId,
  onBack,
  onSolutionChanged,
}) => {
  const api = usePlannerApi();
  const [solution, setSolution] = useState<Solution>();
  const [problemDraft, setProblemDraft] = useState('');
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [answersChangedAfterPlan, setAnswersChangedAfterPlan] = useState(false);
  const [specialists, setSpecialists] = useState<SpecialistDefinition[]>([]);
  const [mode, setMode] = useState<AnalysisMode>('ai');
  const [analysisModes, setAnalysisModes] = useState<AnalysisMode[]>(['ai', 'rules']);
  const [analysisOptionsError, setAnalysisOptionsError] = useState(false);
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [blueprintGenerationFailed, setBlueprintGenerationFailed] = useState(false);
  const [busy, runBusy] = useBusy();
  const busyRef = useRef(false);
  const automaticActions = useRef(new Set<string>());
  const savedMode = useRef<AnalysisMode>();
  const userSelectedMode = useRef(false);
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  const updateSolution = useCallback(
    (updated: Solution) => {
      setSolution(updated);
      setProblemDraft(updated.state.problemStatement || '');
      onSolutionChanged?.();
    },
    [onSolutionChanged],
  );

  useEffect(() => {
    let active = true;
    savedMode.current = undefined;
    userSelectedMode.current = false;
    api
      .getSolution(solutionId)
      .then((loaded) => {
        if (active) {
          setSolution(loaded);
          setProblemDraft(loaded.state.problemStatement || '');
          savedMode.current = loaded.state.analysis?.mode;
          if (savedMode.current) {
            setMode(savedMode.current);
          }
        }
      })
      .catch(() => active && onBackRef.current?.());
    api
      .listSpecialists()
      .then((result) => active && setSpecialists(result || []))
      .catch(() => undefined);
    api
      .getAnalysisOptions()
      .then((options) => {
        if (active) {
          setAnalysisModes(options.modes);
          if (!userSelectedMode.current) {
            setMode(savedMode.current ?? options.defaultMode);
          }
        }
      })
      .catch(() => active && setAnalysisOptionsError(true));
    return () => {
      active = false;
    };
  }, [api, solutionId]);

  const run: typeof runBusy = async (action) => {
    if (busyRef.current) {
      return;
    }
    busyRef.current = true;
    await runBusy(action);
    busyRef.current = false;
  };

  const generateInitialBlueprint = () =>
    run(async () => {
      setBlueprintGenerationFailed(false);
      try {
        updateSolution(await api.blueprint(solutionId, { mode }));
      } catch (error) {
        setBlueprintGenerationFailed(true);
        throw error;
      }
    });

  useEffect(() => {
    if (!solution || busy) {
      return;
    }
    const step = getGuidedStep(solution);
    const autoDiscoveryKey = `${solution.id}:discovery:${solution.state.analysis?.analyzedOn}`;
    const autoBlueprintKey = `${solution.id}:blueprint:${solution.state.analysis?.analyzedOn}:${solution.state.discovery?.updatedOn}`;

    if (step === 2 && solution.state.analysis && !solution.state.discovery) {
      if (automaticActions.current.has(autoDiscoveryKey)) {
        return;
      }
      automaticActions.current.add(autoDiscoveryKey);
      void run(async () => {
        updateSolution(await api.discovery(solution.id, { mode, restart: true }));
      });
      return;
    }

    if (step === 3 && !solution.state.blueprint) {
      if (automaticActions.current.has(autoBlueprintKey)) {
        return;
      }
      automaticActions.current.add(autoBlueprintKey);
      void generateInitialBlueprint();
    }
  }, [api, busy, mode, run, solution, updateSolution]);

  if (!solution) {
    return <GoabCircularProgress visible message="Loading solution..." size="small" />;
  }

  const step = getGuidedStep(solution);
  const analysis = solution.state.analysis;
  const blueprint = solution.state.blueprint;
  const problemChanged = problemDraft !== solution.state.problemStatement;
  const answerChanged = solution.state.questions.some(
    (question) => answerDrafts[question.id] !== undefined && answerDrafts[question.id] !== (question.answer || ''),
  );
  const planOutOfDate =
    !!blueprint &&
    (problemChanged ||
      answerChanged ||
      answersChangedAfterPlan ||
      mode !== blueprint.mode ||
      !!solution.blueprintOutOfDate ||
      (!!analysis && new Date(analysis.analyzedOn) > new Date(blueprint.generatedOn)));
  const onDiscoverySolutionChange = updateSolution;

  const handleContinue = () =>
    run(async () => {
      const hasBlueprint = !!solution.state.blueprint;
      const updated =
        problemDraft === solution.state.problemStatement
          ? solution
          : await api.updateSolution(solution.id, { problemStatement: problemDraft });
      if (updated !== solution) {
        updateSolution(updated);
      }
      const analyzed = await api.analyze(solution.id, { mode });
      setMode(analyzed.state.analysis?.mode ?? mode);
      updateSolution(analyzed);
      if (hasBlueprint) {
        updateSolution(await api.blueprint(solution.id, { mode: analyzed.state.analysis?.mode ?? mode }));
      }
    });

  const backToQuestions = () =>
    run(async () => {
      if (problemChanged) {
        updateSolution(await api.updateSolution(solution.id, { problemStatement: problemDraft }));
        updateSolution(await api.analyze(solution.id, { mode }));
      }
      const updated = await api.discovery(solution.id, { mode, restart: true });
      updateSolution(updated);
    });

  const saveAnswer = (question: OpenQuestion, accept: boolean) =>
    run(async () => {
      const answer = accept ? question.answer || '' : (answerDrafts[question.id] ?? question.answer ?? '');
      updateSolution(await api.answerQuestion(solution.id, question.id, answer));
      setAnswersChangedAfterPlan(true);
      setAnswerDrafts((drafts) => {
        const { [question.id]: _removed, ...rest } = drafts;
        return rest;
      });
    });

  const refreshSpecialists = () =>
    run(async () => {
      updateSolution(await api.blueprint(solution.id, { mode, refreshConsultations: true }));
    });

  const answerQuestions = solution.state.questions.filter(
    (question) => question.status === 'inferred' || question.status === 'answered',
  );
  const visibleAnswerQuestions = answerQuestions.slice(0, showAllAnswers ? undefined : 3);

  return (
    <div data-testid="solution-workplace">
      <SolutionHeader
        solution={solution}
        api={api}
        onSolutionChange={updateSolution}
        onBack={
          onBack &&
          (() => {
            onSolutionChanged?.();
            onBack();
          })
        }
      />

      {analysis && <ConfidenceBar confidence={solution.state.confidence} />}
      <p>Describe the problem, answer the planner’s questions, and review the proposed solution.</p>
      <ol aria-label="Project planning steps" style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
        <li>
          <GuidedStep heading="1. Problem statement" testId="guided-step-1">
            <section aria-label="Problem statement">
              <ProblemStatement
                value={problemDraft}
                busy={busy}
                continueLabel="Save & analyze"
                showContinue={false}
                onChange={setProblemDraft}
                onContinue={handleContinue}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <AnalysisModeToggle
                  mode={mode}
                  modes={analysisModes}
                  onChange={(selectedMode) => {
                    userSelectedMode.current = true;
                    setMode(selectedMode);
                  }}
                />
                {analysis && (
                  <GoabBadge
                    type="success"
                    content={`Last run: ${analysis.mode === 'ai' ? 'AI analysis' : 'Rule-based analysis'} · ${new Date(
                      analysis.analyzedOn,
                    ).toLocaleString()}`}
                    icon={false}
                    testId="analysis-mode-badge"
                  />
                )}
              </div>
              <GoabButton
                type="primary"
                testId="problem-continue"
                disabled={busy || !problemDraft.trim()}
                onClick={handleContinue}
                mt="s"
              >
                Save &amp; analyze
              </GoabButton>
              {analysisOptionsError && (
                <GoabCallout
                  type="important"
                  heading="Analysis modes unavailable"
                  testId="analysis-options-error"
                  mt="s"
                >
                  The available analysis modes could not be loaded. Your current selection remains available.
                </GoabCallout>
              )}
              {analysis?.warning && (
                <GoabCallout type="important" heading="Note" testId="analysis-fallback-warning" mt="m">
                  {analysis.warning}
                </GoabCallout>
              )}
              {problemChanged && blueprint && (
                <>
                  <GoabCallout type="important" heading="Plan out of date" testId="problem-plan-out-of-date" mt="m">
                    Your current plan remains available below. Save &amp; analyze to refresh it, or go back to the
                    questions first.
                  </GoabCallout>
                  <GoabButton
                    type="tertiary"
                    testId="problem-back-to-questions"
                    disabled={busy}
                    onClick={backToQuestions}
                    ml="s"
                  >
                    Back to questions
                  </GoabButton>
                </>
              )}
            </section>
          </GuidedStep>
        </li>
        <li>
          <GuidedStep heading="2. Discovery conversation" testId="guided-step-2">
            <section aria-label="Discovery conversation">
              {!analysis ? (
                <p>
                  Save and analyze the problem to start discovery. This section will stay here as your plan develops.
                </p>
              ) : (
                <DiscoveryPanel
                  solution={solution}
                  api={api}
                  mode={mode}
                  onSolutionChange={onDiscoverySolutionChange}
                  specialists={specialists}
                />
              )}
            </section>
          </GuidedStep>
        </li>
        <li>
          <GuidedStep
            heading={
              blueprint
                ? `3. Proposed solution: ${blueprint.overview.title}`
                : `3. Proposed solution${step !== 3 ? ' (after discovery)' : ''}`
            }
            testId="guided-step-3"
          >
            <section aria-label="Proposed solution">
              {blueprint ? (
                <>
                  {!planOutOfDate ? (
                    <GoabCallout type="success" heading="Solution presented" testId="plan-ready" mb="m">
                      Refine it in the conversation or consult a specialist.
                    </GoabCallout>
                  ) : (
                    <GoabCallout type="important" heading="Plan out of date" testId="plan-out-of-date" mb="m">
                      Your problem description, answers, or analysis mode changed since this plan was created. Use Save
                      &amp; analyze above to refresh the analysis and plan before exporting.
                    </GoabCallout>
                  )}

                  <GoabDetails heading="Proposal" maxWidth="100%" mb="s">
                    <Hypotheses solution={solution} open={false} />
                    <PatternMatches solution={solution} />
                  </GoabDetails>
                  <GoabDetails heading="Concepts" maxWidth="100%" mb="s">
                    <Concepts solution={solution} />
                  </GoabDetails>
                  <GoabDetails heading="Next steps" maxWidth="100%" mb="s">
                    <NextSteps solution={solution} />
                  </GoabDetails>
                  <GoabContainer accent="thick" mb="m" testId="project-blueprint">
                    <h3>Project blueprint</h3>
                    <p>Explore the recommended services, architecture, workflows, and delivery plan.</p>
                    <div
                      role="group"
                      aria-label="Blueprint actions"
                      style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}
                    >
                      <GoabButton
                        type="secondary"
                        testId="project-blueprint-generate"
                        disabled={busy}
                        onClick={generateInitialBlueprint}
                      >
                        {busy ? 'Generating…' : blueprint ? 'Regenerate blueprint' : 'Generate blueprint'}
                      </GoabButton>
                      <GoabButton
                        type="tertiary"
                        testId="refresh-specialist-consultations"
                        disabled={busy}
                        onClick={refreshSpecialists}
                      >
                        {busy ? 'Generating…' : 'Regenerate with fresh specialist consultations'}
                      </GoabButton>
                    </div>
                    <BlueprintViewer
                      solution={solution}
                      api={api}
                      mode={mode}
                      busy={busy}
                      onSolutionChange={updateSolution}
                      showControls={false}
                    />
                  </GoabContainer>
                  {answerQuestions.length > 0 && (
                    <GoabDetails
                      heading={`Review details used in this plan (${answerQuestions.length})`}
                      maxWidth="100%"
                      mt="m"
                      testId="inferred-answers"
                    >
                      <>
                        {visibleAnswerQuestions.map((question) => {
                          const answer = answerDrafts[question.id] ?? question.answer ?? '';
                          const inferred = String(question.status) === 'inferred';
                          const edited = answerDrafts[question.id] !== undefined && answer !== (question.answer || '');
                          return (
                            <GoabContainer key={question.id} type="non-interactive" accent="thin" mb="s">
                              <GoabFormItem label={question.question}>
                                <GoabTextArea
                                  name={`answer-${question.id}`}
                                  value={answer}
                                  rows={2}
                                  width="100%"
                                  ariaLabel={question.question}
                                  testId={`plan-answer-${question.id}`}
                                  disabled={busy}
                                  placeholder="Add or correct this answer"
                                  onChange={(detail) =>
                                    setAnswerDrafts((drafts) => ({ ...drafts, [question.id]: detail.value }))
                                  }
                                />
                              </GoabFormItem>
                              <p>
                                {edited
                                  ? 'Your changes are not saved yet.'
                                  : inferred
                                    ? 'Inferred from your description'
                                    : question.status === 'answered'
                                      ? 'Your answer'
                                      : 'Needs an answer'}
                              </p>
                              {edited ? (
                                <GoabButton
                                  type="secondary"
                                  size="compact"
                                  testId={`save-plan-answer-${question.id}`}
                                  disabled={busy}
                                  onClick={() => saveAnswer(question, false)}
                                >
                                  Save
                                </GoabButton>
                              ) : inferred && question.answer ? (
                                <GoabButton
                                  type="tertiary"
                                  size="compact"
                                  testId={`accept-plan-answer-${question.id}`}
                                  disabled={busy}
                                  onClick={() => saveAnswer(question, true)}
                                >
                                  Accept answer
                                </GoabButton>
                              ) : null}
                            </GoabContainer>
                          );
                        })}
                        {answerQuestions.length > 3 && (
                          <GoabButton
                            type="tertiary"
                            size="compact"
                            testId="toggle-more-answers"
                            onClick={() => setShowAllAnswers((show) => !show)}
                          >
                            {showAllAnswers ? 'Show fewer' : `Show more (${answerQuestions.length - 3})`}
                          </GoabButton>
                        )}
                      </>
                    </GoabDetails>
                  )}
                </>
              ) : step === 3 ? (
                <GoabContainer accent="thick" mb="m" testId="project-blueprint">
                  <h3>Project blueprint</h3>
                  <p>Explore the recommended services, architecture, workflows, and delivery plan.</p>
                  {blueprintGenerationFailed ? (
                    <GoabCallout type="important" heading="Plan not ready" testId="blueprint-generation-error" mb="m">
                      The planner could not prepare the plan. Try again.
                    </GoabCallout>
                  ) : (
                    <GoabCircularProgress visible size="small" message="Preparing your plan" />
                  )}
                  <GoabButton
                    type="secondary"
                    testId="project-blueprint-generate"
                    disabled={busy}
                    onClick={generateInitialBlueprint}
                    mt="m"
                  >
                    {busy ? 'Generating…' : 'Generate blueprint'}
                  </GoabButton>
                </GoabContainer>
              ) : (
                <GoabCallout type="important" heading="Not yet" testId="step-disabled-3" mb="m">
                  The solution is presented once confidence reaches 50%, or when you choose “Skip and show me a plan.”
                </GoabCallout>
              )}
            </section>
          </GuidedStep>
        </li>
      </ol>
    </div>
  );
};

export default SolutionWorkplace;
