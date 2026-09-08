import type { FormComplexity, GenerationStepType, StepFailure } from '../types';

export const FORM_GENERATION_PROGRESS = 'form-generation-progress';

export type GenerationStepStatus = 'running' | 'saved' | 'retrying' | 'failed';

/** 2 is the end-of-run sweep, where a step that failed is rebuilt against the finished form. */
export type GenerationPass = 1 | 2;

interface ProgressBase {
  type: typeof FORM_GENERATION_PROGRESS;
}

export interface PlanProgressEvent extends ProgressBase {
  phase: 'plan';
  complexity: FormComplexity;
  reason: string;
  total: number;
  steps: { index: number; type: GenerationStepType; label: string }[];
}

export interface StepProgressEvent extends ProgressBase {
  phase: 'step';
  index: number;
  total: number;
  stepType: GenerationStepType;
  label: string;
  status: GenerationStepStatus;
  attempt: number;
  pass: GenerationPass;
  message?: string;
  failedArtifact?: string;
  counts?: { propertyCount: number; categoryCount: number; controlCount: number };
}

export interface CompleteProgressEvent extends ProgressBase {
  phase: 'complete';
  total: number;
  saved: number;
  /** Labels the sweep rebuilt after they failed on the first pass. */
  recovered: string[];
  /** Labels the run never reached because it stopped early. */
  notAttempted: string[];
  failures: StepFailure[];
  validation: { ok: boolean; errors: { path: string; message: string }[] };
}

export type GenerationProgressEvent = PlanProgressEvent | StepProgressEvent | CompleteProgressEvent;

export type ProgressEmitter = (event: GenerationProgressEvent) => Promise<void>;

const noopProgressEmitter: ProgressEmitter = async () => undefined;

/**
 * Mastra forwards tool writer output as a `tool-output` chunk, which is how the editor sees a run advance.
 */
export function createProgressEmitter(writer?: { write(data: unknown): Promise<void> }): ProgressEmitter {
  if (!writer) {
    return noopProgressEmitter;
  }

  return async (event) => {
    await writer.write(event);
  };
}
