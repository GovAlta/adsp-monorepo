import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';
import { GoabCircularProgress } from '@abgov/react-components';
import { usePlannerApi } from './api';
import ConfidenceBar from './ConfidenceBar';
import GuidedDiscovery from './GuidedDiscovery';
import { ModeLayoutToggle } from './ModeLayoutToggle';
import { AnalysisMode, Solution, SpecialistDefinition } from './model';
import OptionExplorer from './OptionExplorer';
import RapidRecommend from './RapidRecommend';
import SolutionHeader from './SolutionHeader';
import { countChatsByService } from './SpecialistChat';
import { usePersistedLayout, usePersistedSolutionMode } from './workplaceLayout';
import { ModeProps, RunAction } from './workplaceTypes';

const MODE_HINTS = {
  mode1: 'Initial solution from the problem statement and follow-up questions; you refine it.',
  mode2:
    'Give the problem statement, answer the AI follow-up questions, and get a final refined solution. Then refine by conversation or consult a specialist.',
  mode3: 'Compare other ways this problem could be solved.',
};

const MODES = { mode1: RapidRecommend, mode2: GuidedDiscovery, mode3: OptionExplorer };

interface SolutionWorkplaceProps {
  solutionId: string;
  onBack?: () => void;
}

export const SolutionWorkplace: FunctionComponent<SolutionWorkplaceProps> = ({ solutionId, onBack }) => {
  const api = usePlannerApi();
  const [solution, setSolution] = useState<Solution>();
  const [analysisModes, setAnalysisModes] = useState<AnalysisMode[]>(['rules']);
  const [mode, setMode] = useState<AnalysisMode>('rules');
  const [specialists, setSpecialists] = useState<SpecialistDefinition[]>([]);
  const [chatCounts, setChatCounts] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [solutionMode, setSolutionMode] = usePersistedSolutionMode(solutionId);
  const [layout, setLayout] = usePersistedLayout();
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

  const modeProps: ModeProps = {
    solution,
    api,
    mode,
    busy,
    run,
    layout,
    analysisModes,
    onAnalysisModeChange: setMode,
    specialists,
    chatCounts,
    onChatsChanged: refreshChatCounts,
    onSolutionChange: setSolution,
  };
  const ModeView = MODES[solutionMode];

  return (
    <div data-testid="solution-workplace">
      <SolutionHeader solution={solution} api={api} onSolutionChange={setSolution} onBack={onBack} />
      <ConfidenceBar confidence={solution.state.confidence} />
      <div style={{ margin: '1rem 0' }}>
        <ModeLayoutToggle
          solutionMode={solutionMode}
          onSolutionModeChange={setSolutionMode}
          layout={layout}
          onLayoutChange={setLayout}
        />
        <p data-testid="mode-hint">{MODE_HINTS[solutionMode]}</p>
      </div>
      <ModeView key={solutionMode} {...modeProps} />
    </div>
  );
};

export default SolutionWorkplace;
