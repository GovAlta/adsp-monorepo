import type { TokenProvider } from '@abgov/adsp-service-sdk';
import type { Logger } from 'winston';
import {
  getLatestFormDefinition,
  updateFormDefinitionSchemas,
  type FormDefinitionLatest,
} from '../../schema/definitionClient';
import { incrementTooLargeReason } from '../increment/limits';
import { collectControlScopes } from '../../schema/counts';
import { mergeIncrement, type IncrementMergeInput } from '../increment/merge';
import { validateFormSchemas } from '../../schema/validateCore';
import type { DocumentOutline } from '../../../../utils/documentOutline';
import { createGenerationLog, modelOutputOf, type GenerationLog } from './log';
import type { GenerationAgents } from '../llm/agents';
import { planFormGeneration } from '../llm/planner';
import { FORM_GENERATION_PROGRESS, type GenerationPass, type ProgressEmitter } from './progress';
import { generateStepPayload } from '../llm/stepBuilder';
import type { GenerationPlan, GenerationRunResult, IncrementPayload, PlannedStep, StepFailure } from '../types';

const MAX_STEP_ATTEMPTS = 3;
interface FormDefinitionClient {
  configurationServiceUrl: URL;
  tokenProvider: TokenProvider;
}

export interface RunFormGenerationInput {
  agents: GenerationAgents;
  client: FormDefinitionClient;
  logger: Logger;
  tenantId?: string;
  formDefinitionId: string;
  requirement: string;
  documents: DocumentOutline[];
  variant: 'pages' | 'stepper';
  emit: ProgressEmitter;
  abortSignal?: AbortSignal;
}

interface StepCounts {
  propertyCount: number;
  categoryCount: number;
  controlCount: number;
}

// Flat rather than a discriminated union: the workspace compiles without strictNullChecks, so `ok` does not narrow.
interface StepOutcome {
  ok: boolean;
  counts?: StepCounts;
  failedArtifact?: string;
  message?: string;
}

// The planned step is kept alongside the failure so a later pass can rebuild it without consulting the plan.
interface FailedStep {
  step: PlannedStep;
  failure: StepFailure;
}

interface PassResult {
  savedSteps: PlannedStep[];
  failed: FailedStep[];
  halted: boolean;
}

const GENERATION_FAILED = 'generation_failed';
// A model call that keeps throwing is a plumbing fault, not something the next step can repair.
const MAX_CONSECUTIVE_GENERATION_FAILURES = 2;
const STALE_READ = 'stale_read';

// The guarded reader is run-scoped state, so it is added here rather than on the caller-supplied input.
type RunInput = RunFormGenerationInput & { readLatest: () => Promise<FormDefinitionLatest> };

/**
 * Every save replaces both schemas wholesale, so a read that comes back empty after content was saved
 * would turn the next merge into a full overwrite. Stop the run instead.
 */
function createGuardedReader(input: RunFormGenerationInput): () => Promise<FormDefinitionLatest> {
  const { client, tenantId, formDefinitionId } = input;
  let sawContent = false;

  return async () => {
    const latest = await getLatestFormDefinition(client, tenantId, formDefinitionId);
    const populated =
      Object.keys((latest.dataSchema?.properties as Record<string, unknown>) ?? {}).length > 0 ||
      collectControlScopes(latest.uiSchema).length > 0;

    if (populated) {
      sawContent = true;
    } else if (sawContent) {
      throw new Error(
        'Configuration service reported the form as empty after content had already been saved. Stopping the run so the saved form is not overwritten.',
      );
    }

    return latest;
  };
}

export async function runFormGeneration(input: RunFormGenerationInput): Promise<GenerationRunResult> {
  const { agents, client, logger, tenantId, formDefinitionId, requirement, documents, variant, emit, abortSignal } =
    input;

  const readLatest = createGuardedReader(input);
  const run: RunInput = { ...input, readLatest };

  const initial = await readLatest();
  const log = createGenerationLog(logger, formDefinitionId, tenantId);
  log.record('run-start', {
    variant,
    requirement,
    // Section ids are here because a planned step naming one that does not exist silently builds from no source.
    documents: documents.map(({ filename, charCount, sections }) => ({
      filename,
      charCount,
      sections: sections.map(({ sectionId, title }) => ({ sectionId, title })),
    })),
    current: describeCurrent(initial),
  });

  const plan = await planFormGeneration({
    agents,
    requirement,
    documents,
    current: describeCurrent(initial),
    variant,
    abortSignal,
    log,
  });

  await emit({
    type: FORM_GENERATION_PROGRESS,
    phase: 'plan',
    complexity: plan.complexity,
    reason: plan.reason,
    total: plan.steps.length,
    steps: plan.steps.map(({ index, type, label }) => ({ index, type, label })),
  });

  const first = await runPass(run, plan, plan.steps, log, 1);
  const savedSteps = [...first.savedSteps];
  const recoveredLabels: string[] = [];
  let failed = first.failed;

  if (canSweep(first, abortSignal)) {
    log.record('sweep-start', { steps: failed.map(({ failure }) => failure) });

    const sweep = await runPass(
      run,
      plan,
      failed.map(({ step }) => step),
      log,
      2,
      new Map(failed.map(({ step, failure }) => [step.index, failure.message])),
    );

    savedSteps.push(...sweep.savedSteps);
    recoveredLabels.push(...sweep.savedSteps.map((step) => step.label));
    failed = sweep.failed;

    log.record('sweep-complete', {
      recovered: recoveredLabels,
      failures: sweep.failed.map(({ failure }) => failure),
    });
  }

  const savedLabels = savedSteps.map((step) => step.label);
  const failures = failed.map(({ failure }) => failure);
  // A halted run leaves later steps untouched, which is a different outcome from a step that was tried and failed.
  const reached = new Set([...savedSteps, ...failed.map(({ step }) => step)].map((step) => step.index));
  const notAttemptedLabels = plan.steps.filter((step) => !reached.has(step.index)).map((step) => step.label);

  const final = await getLatestFormDefinition(client, tenantId, formDefinitionId);
  const validation = validateFormSchemas(final.dataSchema, final.uiSchema);

  await emit({
    type: FORM_GENERATION_PROGRESS,
    phase: 'complete',
    total: plan.steps.length,
    saved: savedLabels.length,
    recovered: recoveredLabels,
    notAttempted: notAttemptedLabels,
    failures,
    validation: { ok: validation.ok, errors: validation.errors },
  });

  log.record('run-complete', {
    total: plan.steps.length,
    saved: savedLabels.length,
    savedLabels,
    recoveredLabels,
    failures,
    validation: { ok: validation.ok, errors: validation.errors },
  });

  return {
    complexity: plan.complexity,
    total: plan.steps.length,
    saved: savedLabels.length,
    savedLabels,
    recoveredLabels,
    notAttemptedLabels,
    failures,
    rootType: (final.uiSchema.type as string) ?? 'VerticalLayout',
    propertyCount: validation.counts.propertyCount,
    categoryCount: validation.counts.categoryCount,
    controlCount: validation.counts.controlCount,
    validation: { ok: validation.ok, errors: validation.errors },
  };
}

async function runPass(
  input: RunInput,
  plan: GenerationPlan,
  steps: PlannedStep[],
  log: GenerationLog,
  pass: GenerationPass,
  priorErrors: Map<number, string> = new Map(),
): Promise<PassResult> {
  const { logger, tenantId, formDefinitionId, emit, abortSignal } = input;
  const savedSteps: PlannedStep[] = [];
  const failed: FailedStep[] = [];
  let consecutiveGenerationFailures = 0;

  for (const step of steps) {
    if (abortSignal?.aborted) {
      return { savedSteps, failed, halted: true };
    }

    const outcome = await runStep(input, plan, step, log, pass, priorErrors.get(step.index));
    if (outcome.ok) {
      consecutiveGenerationFailures = 0;
      savedSteps.push(step);
      await emit({
        type: FORM_GENERATION_PROGRESS,
        phase: 'step',
        index: step.index,
        total: plan.steps.length,
        stepType: step.type,
        label: step.label,
        status: 'saved',
        attempt: 1,
        pass,
        counts: outcome.counts,
      });
      continue;
    }

    const failure: StepFailure = {
      index: step.index,
      label: step.label,
      stepType: step.type,
      failedArtifact: outcome.failedArtifact,
      message: outcome.message,
    };
    failed.push({ step, failure });
    await emit({
      type: FORM_GENERATION_PROGRESS,
      phase: 'step',
      index: step.index,
      total: plan.steps.length,
      stepType: step.type,
      label: step.label,
      status: 'failed',
      attempt: MAX_STEP_ATTEMPTS,
      pass,
      failedArtifact: outcome.failedArtifact,
      message: outcome.message,
    });

    consecutiveGenerationFailures =
      outcome.failedArtifact === GENERATION_FAILED ? consecutiveGenerationFailures + 1 : 0;
    if (consecutiveGenerationFailures >= MAX_CONSECUTIVE_GENERATION_FAILURES) {
      logger.error(`Form generation stopped after repeated model failures: ${outcome.message}`, {
        context: 'formGenerationOrchestrator',
        tenant: tenantId,
        formDefinitionId,
      });
      return { savedSteps, failed, halted: true };
    }

    if (outcome.failedArtifact === STALE_READ) {
      logger.error(`Form generation stopped to protect the saved form: ${outcome.message}`, {
        context: 'formGenerationOrchestrator',
        tenant: tenantId,
        formDefinitionId,
      });
      return { savedSteps, failed, halted: true };
    }
  }

  return { savedSteps, failed, halted: false };
}

/**
 * A step whose dependency was still unbuilt can succeed once the pass is over, so failures get one more
 * round against the finished form. Nothing was saved means nothing changed, so a second round is wasted calls.
 */
function canSweep(pass: PassResult, abortSignal?: AbortSignal): boolean {
  return Boolean(pass.failed.length && pass.savedSteps.length && !pass.halted && !abortSignal?.aborted);
}

async function runStep(
  input: RunInput,
  plan: GenerationPlan,
  step: PlannedStep,
  log: GenerationLog,
  pass: GenerationPass,
  priorError?: string,
): Promise<StepOutcome> {
  const { agents, client, tenantId, formDefinitionId, documents, emit, abortSignal, readLatest } = input;
  let errors: string[] = priorError ? [priorError] : [];
  let generationFailed = false;

  for (let attempt = 1; attempt <= MAX_STEP_ATTEMPTS; attempt++) {
    if (abortSignal?.aborted) {
      return { ok: false, failedArtifact: 'aborted', message: 'Generation was stopped before this step completed.' };
    }

    await emit({
      type: FORM_GENERATION_PROGRESS,
      phase: 'step',
      index: step.index,
      total: plan.steps.length,
      stepType: step.type,
      label: step.label,
      status: attempt === 1 && pass === 1 ? 'running' : 'retrying',
      attempt,
      pass,
      ...(errors.length ? { message: errors[0] } : {}),
    });

    let latest: FormDefinitionLatest;
    try {
      latest = await readLatest();
    } catch (err) {
      const message = describeError(err);
      log.record('step-rejected', { index: step.index, attempt, reason: STALE_READ, message });
      return { ok: false, failedArtifact: STALE_READ, message };
    }

    let payload: IncrementPayload;
    try {
      payload =
        step.type === 'scaffold'
          ? {}
          : await generateStepPayload({
              agents,
              plan,
              step,
              documents,
              context: describeStepContext(latest, plan),
              previousErrors: errors,
              abortSignal,
              log,
            });
    } catch (err) {
      errors = [`The increment could not be generated: ${describeError(err)}`];
      generationFailed = true;
      log.record('step-rejected', {
        index: step.index,
        attempt,
        reason: 'generate_threw',
        message: errors[0],
        modelOutput: modelOutputOf(err),
      });
      continue;
    }

    generationFailed = false;

    const savedScopes = collectControlScopes(latest.uiSchema);
    const resolvedScope = resolveNearMissScope(payload, savedScopes);
    if (resolvedScope) {
      log.record('step-scope-resolved', {
        index: step.index,
        attempt,
        from: payload.branch.triggerScope,
        to: resolvedScope,
      });
      payload = { ...payload, branch: { ...payload.branch, triggerScope: resolvedScope } };
    }

    const contractError = checkStepContract(step, payload, savedScopes);
    if (contractError) {
      errors = [contractError];
      log.record('step-rejected', { index: step.index, attempt, reason: 'contract', message: contractError });
      continue;
    }

    const tooLarge = incrementTooLargeReason(payload);
    if (tooLarge) {
      errors = [`${tooLarge} Return fewer elements for this increment.`];
      log.record('step-rejected', { index: step.index, attempt, reason: 'too_large', message: errors[0] });
      continue;
    }

    const merged = mergeIncrement(latest, toMergeInput(plan, step, payload));
    if (merged.ok === false) {
      errors = [
        merged.failedArtifact === 'duplicate_scope'
          ? `${merged.message} An earlier increment already built that question. Return only the elements that are not saved yet.`
          : merged.message,
      ];
      log.record('step-rejected', {
        index: step.index,
        attempt,
        reason: merged.failedArtifact ?? 'merge',
        message: errors[0],
      });
      continue;
    }

    const validation = validateFormSchemas(merged.dataSchema, merged.uiSchema);
    if (!validation.ok) {
      errors = validation.errors.map((error) => `${error.path}: ${error.message}`);
      log.record('step-rejected', { index: step.index, attempt, reason: 'validation', errors: validation.errors });
      continue;
    }

    try {
      await updateFormDefinitionSchemas(client, tenantId, formDefinitionId, {
        dataSchema: merged.dataSchema,
        uiSchema: merged.uiSchema,
      });
    } catch (err) {
      // The client already retries transient failures, so a throw here is not worth another model call.
      log.record('step-rejected', { index: step.index, attempt, reason: 'save_failed', message: describeError(err) });
      return { ok: false, failedArtifact: 'save_failed', message: describeError(err) };
    }

    log.record('step-saved', { index: step.index, attempt, label: step.label, counts: validation.counts });

    return { ok: true, counts: validation.counts };
  }

  const outcome: StepOutcome = {
    ok: false,
    failedArtifact: generationFailed ? GENERATION_FAILED : 'step_failed',
    message: errors[0] ?? 'The increment could not be built.',
  };

  log.record('step-failed', { index: step.index, label: step.label, stepType: step.type, ...outcome });

  return outcome;
}

function toMergeInput(plan: GenerationPlan, step: PlannedStep, payload: IncrementPayload): IncrementMergeInput {
  if (step.type === 'scaffold') {
    return { incrementType: 'scaffold', categoryLabels: plan.categoryLabels, variant: plan.variant };
  }

  const categoryLabel = step.type === 'branch' ? (step.categoryLabel ?? plan.categoryLabels[0]) : step.label;

  return {
    incrementType: step.type,
    categoryLabel,
    categoryOrder: plan.categoryLabels,
    dataSchemaProperties: payload.dataSchemaProperties,
    required: payload.required,
    uiElements: payload.uiElements as Record<string, unknown>[] | undefined,
    conditionalRequired: (payload.conditionalRequired ?? [])
      .filter((block) => block?.conditionScope && block.required?.length)
      .map((block) => ({
        conditionScope: block.conditionScope,
        conditionValue: block.conditionValue,
        required: block.required,
      })),
    ...(payload.branch?.triggerScope
      ? {
          branch: {
            label: payload.branch.label || step.label,
            triggerScope: payload.branch.triggerScope,
            triggerValue: payload.branch.triggerValue,
            effect: payload.branch.effect,
          },
        }
      : {}),
  };
}

/**
 * The model usually names the right question but a filler word off — isProgramAlreadyRunning for the saved
 * isThisProgramAlreadyRunning. Resolving that here is free; rejecting it spends a whole attempt.
 */
function resolveNearMissScope(payload: IncrementPayload, savedScopes: string[]): string | null {
  const triggerScope = payload.branch?.triggerScope;
  if (!triggerScope || savedScopes.includes(triggerScope)) {
    return null;
  }

  const wanted = scopeTokens(triggerScope);
  const matches = savedScopes.filter((scope) => isNearMiss(wanted, scopeTokens(scope)));

  // More than one candidate is a guess, so leave it to the repair prompt.
  return matches.length === 1 ? matches[0] : null;
}

function scopeTokens(scope: string): Set<string> {
  return new Set(
    scope
      .replace('#/properties/', '')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean),
  );
}

// One name being the other plus a filler word matches; short names are excluded because they collide.
function isNearMiss(a: Set<string>, b: Set<string>): boolean {
  const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];
  return smaller.size >= 3 && [...smaller].every((token) => larger.has(token));
}

function checkStepContract(step: PlannedStep, payload: IncrementPayload, savedScopes: string[]): string | null {
  if (step.type === 'branch') {
    const triggerScope = payload.branch?.triggerScope;
    if (!triggerScope) {
      return 'A branch increment must set branch.triggerScope, branch.triggerValue, and branch.label.';
    }

    // Caught here rather than at validation so the retry names the scopes the model can choose from.
    if (!savedScopes.includes(triggerScope)) {
      return `branch.triggerScope ${triggerScope} is not a saved control, so its rule cannot resolve. Pick the scope of the question that reveals this branch from: ${savedScopes.join(', ') || '(none saved yet)'}.`;
    }
  }

  if (step.type !== 'scaffold' && !payload.uiElements?.length) {
    return 'The increment returned no uiElements. Reply with a single raw JSON object — no markdown fences, no prose — holding the controls and content for this step.';
  }

  return null;
}

function describeCurrent(latest: FormDefinitionLatest) {
  const uiSchema = latest.uiSchema ?? {};
  const elements = Array.isArray(uiSchema.elements) ? (uiSchema.elements as Record<string, unknown>[]) : [];

  return {
    rootType: (uiSchema.type as string) ?? 'VerticalLayout',
    categoryLabels: elements
      .filter((element) => element?.type === 'Category' && typeof element.label === 'string')
      .map((element) => element.label as string),
    propertyCount: Object.keys((latest.dataSchema?.properties as Record<string, unknown>) ?? {}).length,
  };
}

function describeStepContext(latest: FormDefinitionLatest, plan: GenerationPlan) {
  return {
    existingProperties: Object.keys((latest.dataSchema?.properties as Record<string, unknown>) ?? {}),
    existingScopes: collectControlScopes(latest.uiSchema),
    categoryLabels: plan.categoryLabels,
  };
}

function describeError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
