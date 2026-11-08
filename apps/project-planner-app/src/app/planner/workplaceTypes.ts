import { PlannerApi } from './api';
import { AnalysisMode, Solution } from './model';

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
