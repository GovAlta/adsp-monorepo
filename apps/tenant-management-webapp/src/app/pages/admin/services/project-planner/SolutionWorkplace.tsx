import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';
import {
  GoabBadge,
  GoabButton,
  GoabCallout,
  GoabCircularProgress,
  GoabContainer,
  GoabDetails,
  GoabIcon,
} from '@abgov/react-components';
import { Concepts, Hypotheses, NextSteps, PatternMatches } from './AnalysisSections';
import { usePlannerApi } from './api';
import BlueprintViewer from './BlueprintViewer';
import ConfidenceBar from './ConfidenceBar';
import DiscoveryPanel from './DiscoveryPanel';
import { AnalysisModeToggle } from './ModeLayoutToggle';
import ProblemStatement from './ProblemStatement';
import ProgressStepper from './ProgressStepper';
import SolutionHeader from './SolutionHeader';
import { AnalysisMode, Solution, SpecialistDefinition } from './model';
import { useBusy } from './useBusy';

const STEPPER_WIDTH_PX = 32;
const STEPPER_GAP_PX = 16;
const STEPPER_MIN_LEFT_PX = 8;
const STEPPER_BOTTOM_MARGIN_PX = 24;

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
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const GuidedStep: FunctionComponent<GuidedStepProps> = ({ heading, testId, expanded, onToggle, children }) => {
  const headingId = `${testId}-heading`;
  const panelId = `${testId}-content`;

  return (
    <div style={{ '--goa-container-padding': '20px 10px' } as React.CSSProperties}>
      <GoabContainer accent="thin" testId={testId} mb="m">
        <h2
          id={headingId}
          style={{ fontSize: 'calc(var(--goa-font-size-7) * 0.80)', fontWeight: 600, lineHeight: 1, margin: 0 }}
        >
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={panelId}
            onClick={onToggle}
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
          <div id={panelId} role="region" aria-labelledby={headingId} style={{ fontSize: '80%', paddingTop: '5px' }}>
            {children}
          </div>
        )}
      </GoabContainer>
    </div>
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
  const [specialists, setSpecialists] = useState<SpecialistDefinition[]>([]);
  const [mode, setMode] = useState<AnalysisMode>('ai');
  const [analysisModes, setAnalysisModes] = useState<AnalysisMode[]>(['ai', 'rules']);
  const [analysisOptionsError, setAnalysisOptionsError] = useState(false);
  const [blueprintGenerationFailed, setBlueprintGenerationFailed] = useState(false);
  const [busy, runBusy] = useBusy();
  const [headerBusy, setHeaderBusy] = useState(false);
  const [discoveryBusy, setDiscoveryBusy] = useState(false);
  const [blueprintBusy, setBlueprintBusy] = useState(false);
  const busyRef = useRef(false);
  const automaticActions = useRef(new Set<string>());
  const savedMode = useRef<AnalysisMode>();
  const userSelectedMode = useRef(false);
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [expandedSteps, setExpandedSteps] = useState<Record<1 | 2 | 3, boolean>>({ 1: true, 2: true, 3: true });
  const pendingScrollStep = useRef<1 | 2 | 3>();
  const [stepperLeft, setStepperLeft] = useState<number>();
  const [stepperTop, setStepperTop] = useState<number>();
  const [stepperHeight, setStepperHeight] = useState<number>();
  const [headerOffset, setHeaderOffset] = useState(0);
  const [bottomSpacerHeight, setBottomSpacerHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const step1Ref = useRef<HTMLLIElement>(null);
  const step2Ref = useRef<HTMLLIElement>(null);
  const step3Ref = useRef<HTMLLIElement>(null);
  const stepRefs = { 1: step1Ref, 2: step2Ref, 3: step3Ref } as const;

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

  const solutionLoaded = !!solution;
  useEffect(() => {
    const updatePosition = () => {
      if (!contentRef.current || !step1Ref.current) {
        return;
      }
      const contentLeft = contentRef.current.getBoundingClientRect().left;
      const top = step1Ref.current.getBoundingClientRect().top;
      setStepperLeft(Math.max(contentLeft - STEPPER_WIDTH_PX - STEPPER_GAP_PX, STEPPER_MIN_LEFT_PX));
      setStepperTop(top);
      setStepperHeight(window.innerHeight - top - STEPPER_BOTTOM_MARGIN_PX);
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [solutionLoaded]);

  useEffect(() => {
    const id = pendingScrollStep.current;
    if (!id || !expandedSteps[id]) {
      return;
    }
    pendingScrollStep.current = undefined;
    const refs = { 1: step1Ref, 2: step2Ref, 3: step3Ref } as const;
    refs[id].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [expandedSteps, step1Ref, step2Ref, step3Ref]);

  useEffect(() => {
    const header = document.querySelector('[data-testid="app-fixed-header"]');
    if (!header) {
      return;
    }
    const updateHeaderOffset = () => setHeaderOffset(header.getBoundingClientRect().height);
    updateHeaderOffset();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const resizeObserver = new ResizeObserver(updateHeaderOffset);
    resizeObserver.observe(header);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const updateBottomSpacer = () => {
      if (!step3Ref.current) {
        return;
      }
      const step3Top = step3Ref.current.getBoundingClientRect().top + window.scrollY;
      setBottomSpacerHeight((previousSpacer) => {
        const documentHeightWithoutSpacer = document.documentElement.scrollHeight - previousSpacer;
        const contentAfterStep3Top = documentHeightWithoutSpacer - step3Top;
        return Math.max(0, window.innerHeight - contentAfterStep3Top);
      });
    };
    updateBottomSpacer();
    window.addEventListener('resize', updateBottomSpacer);
    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateBottomSpacer);
      resizeObserver.observe(document.body);
    }
    return () => {
      window.removeEventListener('resize', updateBottomSpacer);
      resizeObserver?.disconnect();
    };
  }, [solution]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }
    const sections: Array<[1 | 2 | 3, HTMLLIElement | null]> = [
      [1, step1Ref.current],
      [2, step2Ref.current],
      [3, step3Ref.current],
    ];
    // Absolute visible pixels (not intersectionRatio) and fine-grained thresholds, since sections vary hugely in height.
    const visiblePixels = new Map<1 | 2 | 3, number>();
    const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = sections.find(([, element]) => element === entry.target)?.[0];
          if (id) {
            visiblePixels.set(id, entry.intersectionRect.height);
          }
        });
        const [mostVisible] = [...visiblePixels.entries()].sort((a, b) => b[1] - a[1]);
        if (mostVisible && mostVisible[1] > 0) {
          setActiveStep(mostVisible[0]);
        }
      },
      { rootMargin: '0px 0px -70% 0px', threshold: thresholds },
    );
    sections.forEach(([, element]) => element && observer.observe(element));
    return () => observer.disconnect();
  }, [solution]);

  if (!solution) {
    return <GoabCircularProgress visible message="Loading solution..." size="small" />;
  }

  const step = getGuidedStep(solution);
  const analysis = solution.state.analysis;
  const blueprint = solution.state.blueprint;
  const anyBusy = busy || headerBusy || discoveryBusy || blueprintBusy;
  const progressSteps = [
    { id: 1 as const, label: 'Problem statement', complete: !!analysis },
    { id: 2 as const, label: 'Discovery conversation', complete: step >= 3 },
    { id: 3 as const, label: 'Proposed solution', complete: !!blueprint },
  ];
  const scrollToStep = (id: 1 | 2 | 3) => {
    if (!expandedSteps[id]) {
      pendingScrollStep.current = id;
      setExpandedSteps((expanded) => ({ ...expanded, [id]: true }));
      return;
    }
    stepRefs[id].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const toggleStep = (id: 1 | 2 | 3) => setExpandedSteps((expanded) => ({ ...expanded, [id]: !expanded[id] }));
  const problemChanged = problemDraft !== solution.state.problemStatement;
  const planOutOfDate =
    !!blueprint &&
    (problemChanged ||
      mode !== blueprint.mode ||
      !!solution.blueprintOutOfDate ||
      (!!analysis && new Date(analysis.analyzedOn) > new Date(blueprint.generatedOn)));
  const onDiscoverySolutionChange = updateSolution;

  const handleContinue = () =>
    run(async () => {
      const hasBlueprint = !!solution.state.blueprint;
      if (problemDraft !== solution.state.problemStatement) {
        await api.updateSolution(solution.id, { problemStatement: problemDraft });
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

  const refreshSpecialists = () =>
    run(async () => {
      updateSolution(await api.blueprint(solution.id, { mode, refreshConsultations: true }));
    });

  return (
    <div ref={contentRef} data-testid="solution-workplace" style={{ position: 'relative' }}>
      {anyBusy && (
        <div
          aria-hidden="true"
          data-testid="workplace-busy-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 5,
            background: 'rgba(255, 255, 255, 0.35)',
            backdropFilter: 'blur(1px)',
            cursor: 'wait',
          }}
        />
      )}
      <div
        style={{
          height: stepperHeight,
          left: stepperLeft,
          position: 'fixed',
          top: stepperTop,
          zIndex: 10,
        }}
      >
        <ProgressStepper steps={progressSteps} activeId={activeStep} onSelect={scrollToStep} />
      </div>
      <SolutionHeader
        solution={solution}
        api={api}
        onSolutionChange={updateSolution}
        disabled={busy || discoveryBusy || blueprintBusy}
        onBusyChange={setHeaderBusy}
        onBack={
          onBack &&
          (() => {
            onSolutionChanged?.();
            onBack();
          })
        }
      />

      {analysis && <ConfidenceBar confidence={solution.state.confidence} analyzing={busy} />}
      <ol aria-label="Project planning steps" style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
        <li ref={step1Ref} style={{ scrollMarginTop: headerOffset }}>
          <GuidedStep
            heading="1. Problem statement"
            testId="guided-step-1"
            expanded={expandedSteps[1]}
            onToggle={() => toggleStep(1)}
          >
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
                size="compact"
                testId="problem-continue"
                disabled={anyBusy || !problemDraft.trim()}
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
                    disabled={anyBusy}
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
        <li ref={step2Ref} style={{ scrollMarginTop: headerOffset }}>
          <GuidedStep
            heading="2. Discovery conversation"
            testId="guided-step-2"
            expanded={expandedSteps[2]}
            onToggle={() => toggleStep(2)}
          >
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
                  disabled={busy || headerBusy || blueprintBusy}
                  onBusyChange={setDiscoveryBusy}
                />
              )}
            </section>
          </GuidedStep>
        </li>
        <li ref={step3Ref} style={{ scrollMarginTop: headerOffset }}>
          <GuidedStep
            heading={`3. Proposed solution${blueprint ? '' : step !== 3 ? ' (after discovery)' : ''}`}
            testId="guided-step-3"
            expanded={expandedSteps[3]}
            onToggle={() => toggleStep(3)}
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
                  <GoabContainer accent="thin" mb="m" testId="project-blueprint">
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
                        disabled={anyBusy}
                        onClick={generateInitialBlueprint}
                      >
                        {busy ? 'Generating…' : blueprint ? 'Regenerate blueprint' : 'Generate blueprint'}
                      </GoabButton>
                      <GoabButton
                        type="tertiary"
                        testId="refresh-specialist-consultations"
                        disabled={anyBusy}
                        onClick={refreshSpecialists}
                      >
                        {busy ? 'Generating…' : 'Regenerate with fresh specialist consultations'}
                      </GoabButton>
                    </div>
                    <BlueprintViewer
                      solution={solution}
                      api={api}
                      mode={mode}
                      busy={busy || headerBusy || discoveryBusy}
                      onSolutionChange={updateSolution}
                      showControls={false}
                      onBusyChange={setBlueprintBusy}
                    />
                  </GoabContainer>
                </>
              ) : step === 3 ? (
                <GoabContainer accent="thin" mb="m" testId="project-blueprint">
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
      <div aria-hidden="true" style={{ minHeight: bottomSpacerHeight }} />
    </div>
  );
};

export default SolutionWorkplace;
