export const FORM_GENERATION_CLIENT_DEADLINE_MS = 15 * 60 * 1000 + 15_000;
export const FORM_GENERATION_IDLE_HINT_MS = 60_000;

const FORM_GENERATION_PROGRESS = 'form-generation-progress';

const GENERATION_TOOL_NAMES = new Set(['formGenerationRun', 'generate-form']);

export function isFormGenerationTool(toolName?: string): boolean {
  return Boolean(toolName && GENERATION_TOOL_NAMES.has(toolName));
}

export type GenerationStepStatus = 'pending' | 'running' | 'retrying' | 'saved' | 'failed';

export interface GenerationStep {
  index: number;
  type: string;
  label: string;
  status: GenerationStepStatus;
  attempt?: number;
  /** 2 is the sweep, where a failed step is rebuilt against the finished form. */
  pass?: number;
  message?: string;
}

export interface GenerationValidation {
  ok?: boolean;
  errors?: Array<{ path: string; message: string }>;
}

export interface GenerationFailure {
  index: number;
  label: string;
  message: string;
}

export interface GenerationProgress {
  complexity?: string;
  reason?: string;
  total: number;
  saved: number;
  steps: GenerationStep[];
  done: boolean;
  recovered: string[];
  notAttempted: string[];
  failures: GenerationFailure[];
  validation?: GenerationValidation;
}

interface ProgressEvent {
  type?: string;
  phase?: 'plan' | 'step' | 'complete';
  complexity?: string;
  reason?: string;
  total?: number;
  saved?: number;
  steps?: Array<{ index?: number; type?: string; label?: string }>;
  index?: number;
  stepType?: string;
  label?: string;
  status?: GenerationStepStatus;
  attempt?: number;
  pass?: number;
  message?: string;
  recovered?: string[];
  notAttempted?: string[];
  failures?: GenerationFailure[];
  validation?: GenerationValidation;
}

const EMPTY_PROGRESS: GenerationProgress = {
  total: 0,
  saved: 0,
  steps: [],
  done: false,
  recovered: [],
  notAttempted: [],
  failures: [],
};

/** Folds the progress events written by the generation tool into the run state the editor renders. */
export function readGenerationProgress(progress?: unknown[]): GenerationProgress {
  if (!progress?.length) {
    return EMPTY_PROGRESS;
  }

  return progress.filter(isProgressEvent).reduce(applyEvent, EMPTY_PROGRESS);
}

/** True when the tool has just written a change the editor should reload from configuration service. */
export function isGenerationSavePoint(output: unknown): boolean {
  if (!isProgressEvent(output)) {
    return false;
  }

  return (output.phase === 'step' && output.status === 'saved') || output.phase === 'complete';
}

function isProgressEvent(event: unknown): event is ProgressEvent {
  return Boolean(event) && (event as ProgressEvent).type === FORM_GENERATION_PROGRESS;
}

function applyEvent(state: GenerationProgress, event: ProgressEvent): GenerationProgress {
  switch (event.phase) {
    case 'plan':
      return {
        ...state,
        complexity: event.complexity,
        reason: event.reason,
        total: event.total ?? event.steps?.length ?? 0,
        steps: (event.steps ?? []).map((step, position) => ({
          index: step.index ?? position + 1,
          type: step.type ?? 'category',
          label: step.label ?? '',
          status: 'pending' as const,
        })),
      };
    case 'step': {
      const steps = state.steps.map((step) =>
        step.index === event.index
          ? {
              ...step,
              status: event.status ?? step.status,
              attempt: event.attempt,
              pass: event.pass,
              message: event.message,
            }
          : step,
      );
      return { ...state, steps, saved: steps.filter((step) => step.status === 'saved').length };
    }
    case 'complete':
      return {
        ...state,
        done: true,
        total: event.total ?? state.total,
        saved: event.saved ?? state.saved,
        recovered: event.recovered ?? [],
        notAttempted: event.notAttempted ?? [],
        failures: event.failures ?? [],
        validation: event.validation,
      };
    default:
      return state;
  }
}
