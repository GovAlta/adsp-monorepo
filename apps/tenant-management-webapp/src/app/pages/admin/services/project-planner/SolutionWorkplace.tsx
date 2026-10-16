import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';
import { GoabButton, GoabCircularProgress, GoabDetails } from '@abgov/react-components';
import styled from 'styled-components';
import { Tab, Tabs } from '@components/Tabs';
import { usePlannerApi } from './api';
import BlueprintViewer from './BlueprintViewer';
import ConfidenceBar from './ConfidenceBar';
import DiscoveryPanel from './DiscoveryPanel';
import ProblemStatement from './ProblemStatement';
import { Concepts, Hypotheses, NextSteps, PatternMatches } from './ProposedSolution';
import QuestionsPane from './QuestionsPane';
import RefineChat from './RefineChat';
import SolutionHeader from './SolutionHeader';
import { countChatsByService, SpecialistChat } from './SpecialistChat';
import { AnalysisMode, Solution, SpecialistDefinition } from './model';
import { RunAction } from './workplaceTypes';

interface SolutionWorkplaceProps {
  solutionId: string;
  onBack?: () => void;
  onSolutionChanged?: () => void;
}

const Layout = styled.div`
  display: flex;
  flex-wrap: wrap;
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

  @media (max-width: 1400px) {
    flex-basis: 160px;
  }
`;

const Main = styled.div`
  flex: 1;
  min-width: 280px;
  overflow: hidden;
`;

const TabsSpacing = styled.div`
  > div:first-child {
    margin-bottom: 1rem;

    > div {
      flex: 1;
    }
  }
`;

const RailLabel = styled.p`
  margin: 1rem 0 0.25rem;
  font-weight: bold;
`;

type Focus = 'workplace' | string;

export const SolutionWorkplace: FunctionComponent<SolutionWorkplaceProps> = ({
  solutionId,
  onBack,
  onSolutionChanged,
}) => {
  const api = usePlannerApi();
  const [solution, setSolution] = useState<Solution>();
  const [analysisModes, setAnalysisModes] = useState<AnalysisMode[]>(['rules']);
  const [mode, setMode] = useState<AnalysisMode>('rules');
  const [specialists, setSpecialists] = useState<SpecialistDefinition[]>([]);
  const [chatCounts, setChatCounts] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [focus, setFocus] = useState<Focus>('workplace');
  const [tabIndex, setTabIndex] = useState(0);
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
  const confidence = solution.state.confidence;
  const ready = !!confidence && confidence.score >= confidence.threshold;
  const hasAnalysis = solution.state.hypotheses.length > 0 || !!solution.state.analysis;

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
        </Rail>
        <Main>
          {focus !== 'workplace' && (
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
                <Tab label="Problem & Analysis" testId="tab-problem">
                  <ProblemStatement
                    {...paneProps}
                    title="Problem & Analysis"
                    analysisModes={analysisModes}
                    onAnalysisModeChange={setMode}
                  />
                  <h3>Pattern matches</h3>
                  <PatternMatches solution={solution} />
                </Tab>
                <Tab label="Conversation" testId="tab-conversation">
                  {ready ? (
                    <RefineChat {...paneProps} title="Conversation" />
                  ) : (
                    <DiscoveryPanel solution={solution} api={api} mode={mode} onSolutionChange={updateSolution} />
                  )}
                  {hasAnalysis && (
                    <>
                      <GoabDetails heading="Concepts" testId="section-concepts" maxWidth="100%" mt="l">
                        <Concepts solution={solution} />
                      </GoabDetails>
                      <GoabDetails heading="Questions" testId="section-questions" maxWidth="100%" mt="m">
                        <QuestionsPane {...paneProps} title="Questions" />
                      </GoabDetails>
                      <GoabDetails heading="Next steps" testId="section-steps" maxWidth="100%" mt="m">
                        <NextSteps solution={solution} />
                      </GoabDetails>
                    </>
                  )}
                </Tab>
                <Tab label="Proposal" testId="tab-hypotheses">
                  <Hypotheses solution={solution} open />
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
