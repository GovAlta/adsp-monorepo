import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { GoabButton, GoabCircularProgress } from '@abgov/react-components';
import styled from 'styled-components';
import { RootState } from '@store/index';
import { Tab, Tabs } from '@components/Tabs';
import { usePlannerApi } from './api';
import BlueprintViewer from './BlueprintViewer';
import ConfidenceBar from './ConfidenceBar';
import DiscoveryPanel from './DiscoveryPanel';
import { PatternManager } from './PatternManager';
import ProblemStatement from './ProblemStatement';
import { Concepts, Hypotheses, NextSteps, PatternMatches } from './ProposedSolution';
import QuestionsPane from './QuestionsPane';
import RefineChat from './RefineChat';
import SolutionHeader from './SolutionHeader';
import { countChatsByService, SpecialistChat } from './SpecialistChat';
import { AnalysisMode, Solution, SpecialistDefinition } from './model';
import { RunAction } from './workplaceTypes';
import { SOLUTION_MODES, usePersistedSolutionMode } from './workplaceLayout';

const PLANNER_CLIENT = 'urn:ads:platform:project-planner-service';
const PLANNER_ADMIN_ROLE = 'planner-admin';

interface SolutionWorkplaceProps {
  solutionId: string;
  onBack?: () => void;
  onSolutionChanged?: () => void;
}

const Layout = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  margin-top: 1rem;
`;

const Rail = styled.div`
  flex: 0 0 200px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const Main = styled.div`
  flex: 1;
  min-width: 0;
`;

const TabsSpacing = styled.div`
  > div:first-child {
    margin-bottom: 1rem;
  }
`;

const RailLabel = styled.p`
  margin: 1rem 0 0.25rem;
  font-weight: bold;
`;

const ModeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const CONVERSATION_MODES = SOLUTION_MODES.filter(([id]) => id !== 'mode3');

type Focus = 'workplace' | 'patterns' | string;

export const SolutionWorkplace: FunctionComponent<SolutionWorkplaceProps> = ({
  solutionId,
  onBack,
  onSolutionChanged,
}) => {
  const api = usePlannerApi();
  const canEditPatterns = useSelector(
    (state: RootState) => !!state.session?.resourceAccess?.[PLANNER_CLIENT]?.roles?.includes(PLANNER_ADMIN_ROLE),
  );
  const [solution, setSolution] = useState<Solution>();
  const [analysisModes, setAnalysisModes] = useState<AnalysisMode[]>(['rules']);
  const [mode, setMode] = useState<AnalysisMode>('rules');
  const [specialists, setSpecialists] = useState<SpecialistDefinition[]>([]);
  const [chatCounts, setChatCounts] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [focus, setFocus] = useState<Focus>('workplace');
  const [tabIndex, setTabIndex] = useState(0);
  const [solutionMode, setSolutionMode] = usePersistedSolutionMode(solutionId);
  const busyRef = useRef(false);
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  const refreshChatCounts = useCallback(async () => {
    try {
      setChatCounts(countChatsByService((await api.listChats({ solutionId })) || []));
    } catch {
      // The api reports the error to the user.
    }
  }, [api, solutionId]);

  useEffect(() => {
    let active = true;
    api
      .getSolution(solutionId)
      .then((loaded) => active && setSolution(loaded))
      .catch(() => active && onBackRef.current?.());
    api
      .getAnalysisOptions()
      .then((options) => {
        const modes = options?.modes?.length ? options.modes : ['rules' as AnalysisMode];
        if (active) {
          setAnalysisModes(modes);
          setMode(modes.includes('ai') ? 'ai' : 'rules');
        }
      })
      .catch(() => undefined);
    api
      .listSpecialists()
      .then((result) => active && setSpecialists(result || []))
      .catch(() => undefined);
    void refreshChatCounts();
    return () => {
      active = false;
    };
  }, [api, solutionId, refreshChatCounts]);

  // Blueprint generation consults specialists, which saves chats against the solution.
  const blueprintGeneratedOn = solution?.state.blueprint?.generatedOn;
  useEffect(() => {
    if (blueprintGeneratedOn) {
      void refreshChatCounts();
    }
  }, [blueprintGeneratedOn, refreshChatCounts]);

  const run: RunAction = async (action) => {
    if (busyRef.current) {
      return;
    }
    busyRef.current = true;
    setBusy(true);
    try {
      await action();
    } catch {
      // The api reports the error to the user.
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  if (!solution) {
    return <GoabCircularProgress visible message="Loading solution..." size="small" />;
  }

  const updateSolution = (updated: Solution) => {
    setSolution(updated);
    onSolutionChanged?.();
  };

  const handleBack = () => {
    onSolutionChanged?.();
    onBack?.();
  };

  const paneProps = { solution, api, mode, busy, run, onSolutionChange: updateSolution };
  const selectedSpecialist = specialists.find((s) => s.service === focus);
  const railName = (specialist: SpecialistDefinition) => specialist.displayName.replace(/ service$/i, '');

  return (
    <div data-testid="solution-workplace">
      <SolutionHeader solution={solution} api={api} onSolutionChange={updateSolution} onBack={onBack && handleBack} />
      <ConfidenceBar confidence={solution.state.confidence} />
      <Layout>
        <Rail role="navigation" aria-label="Workplace navigation">
          <GoabButton
            type={focus === 'workplace' ? 'primary' : 'secondary'}
            size="compact"
            width="100%"
            testId="focus-workplace"
            onClick={() => setFocus('workplace')}
          >
            Workplace
          </GoabButton>
          <RailLabel>Specialists</RailLabel>
          {specialists.length === 0 && <p data-testid="rail-no-specialists">No specialists available.</p>}
          {specialists.map((s) => {
            const count = chatCounts[s.service] || 0;
            return (
              <GoabButton
                key={s.service}
                type={focus === s.service ? 'primary' : 'secondary'}
                size="compact"
                width="100%"
                testId={`focus-specialist-${s.service}`}
                onClick={() => setFocus(s.service)}
              >
                {count > 0 ? `${railName(s)} (${count})` : railName(s)}
              </GoabButton>
            );
          })}
          <RailLabel>Reference</RailLabel>
          <GoabButton
            type={focus === 'patterns' ? 'primary' : 'secondary'}
            size="compact"
            width="100%"
            testId="focus-patterns"
            onClick={() => setFocus('patterns')}
          >
            Patterns
          </GoabButton>
        </Rail>
        <Main>
          {focus === 'patterns' && <PatternManager api={api} canEdit={canEditPatterns} />}
          {focus !== 'workplace' && focus !== 'patterns' && (
            <SpecialistChat
              key={focus}
              service={focus}
              specialist={selectedSpecialist}
              solution={solution}
              api={api}
              mode={mode}
              onChatsChanged={refreshChatCounts}
            />
          )}
          {focus === 'workplace' && (
            <TabsSpacing>
              <Tabs activeIndex={tabIndex} changeTabCallback={setTabIndex}>
                <Tab label="Problem & analysis" testId="tab-problem">
                  <ProblemStatement
                    {...paneProps}
                    title="Problem & analysis"
                    analysisModes={analysisModes}
                    onAnalysisModeChange={setMode}
                  />
                  <h3>Pattern matches</h3>
                  <PatternMatches solution={solution} />
                </Tab>
                <Tab label="Conversation" testId="tab-conversation">
                  <ModeRow role="group" aria-label="Mode">
                    <strong>Mode:</strong>
                    {CONVERSATION_MODES.map(([id, label]) => (
                      <GoabButton
                        key={id}
                        type={solutionMode === id ? 'primary' : 'secondary'}
                        size="compact"
                        testId={`solution-mode-${id}`}
                        onClick={() => setSolutionMode(id)}
                      >
                        {label}
                      </GoabButton>
                    ))}
                  </ModeRow>
                  {solutionMode === 'mode2' ? (
                    <DiscoveryPanel solution={solution} api={api} mode={mode} onSolutionChange={updateSolution} />
                  ) : (
                    <RefineChat {...paneProps} title="Conversation" />
                  )}
                </Tab>
                <Tab label="Hypotheses" testId="tab-hypotheses">
                  <Hypotheses solution={solution} open />
                </Tab>
                <Tab label="Concepts" testId="tab-concepts">
                  <Concepts solution={solution} />
                </Tab>
                <Tab label="Questions" testId="tab-questions">
                  <QuestionsPane {...paneProps} title="Questions" />
                </Tab>
                <Tab label="Next steps" testId="tab-steps">
                  <NextSteps solution={solution} />
                </Tab>
                <Tab label="Blueprint" testId="tab-blueprint">
                  <h2>Blueprint</h2>
                  <BlueprintViewer
                    solution={solution}
                    api={api}
                    mode={mode}
                    busy={busy}
                    onSolutionChange={updateSolution}
                  />
                </Tab>
              </Tabs>
            </TabsSpacing>
          )}
        </Main>
      </Layout>
    </div>
  );
};

export default SolutionWorkplace;
