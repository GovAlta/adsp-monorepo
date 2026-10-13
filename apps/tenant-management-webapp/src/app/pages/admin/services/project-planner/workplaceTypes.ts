import { PlannerApi } from './api';
import { AnalysisMode, Solution, SpecialistDefinition } from './model';
import { Layout } from './workplaceLayout';

/** Runs an async action while the workplace is busy; ignores errors, which the api reports to the user. */
export type RunAction = (action: () => Promise<void>) => Promise<void>;

export interface PaneProps {
  solution: Solution;
  api: PlannerApi;
  mode: AnalysisMode;
  busy: boolean;
  run: RunAction;
  onSolutionChange: (solution: Solution) => void;
}

export interface ModeProps extends PaneProps {
  layout: Layout;
  analysisModes: AnalysisMode[];
  onAnalysisModeChange: (mode: AnalysisMode) => void;
  specialists: SpecialistDefinition[];
  chatCounts: Record<string, number>;
  onChatsChanged: () => void;
}
