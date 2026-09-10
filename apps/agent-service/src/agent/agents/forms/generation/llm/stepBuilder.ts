import { MAX_INCREMENT_CONTROLS, MAX_INCREMENT_JSON_BYTES, MAX_INCREMENT_PROPERTIES } from '../increment/limits';
import type { DocumentOutline } from '../../../../utils/documentOutline';
import type { GenerationLog } from '../run/log';
import type { GenerationAgents } from './agents';
import { generationCallOptions } from './agents';
import { stepSourceText } from '../run/sourceDocuments';
import {
  branchIncrementSchema,
  categoryIncrementSchema,
  type GenerationPlan,
  type IncrementPayload,
  type PlannedStep,
} from '../types';

export interface StepContext {
  existingProperties: string[];
  existingScopes: string[];
  categoryLabels: string[];
}

export interface GenerateStepInput {
  agents: GenerationAgents;
  plan: GenerationPlan;
  step: PlannedStep;
  documents: DocumentOutline[];
  context: StepContext;
  previousErrors?: string[];
  abortSignal?: AbortSignal;
  log: GenerationLog;
}

export async function generateStepPayload({
  agents,
  plan,
  step,
  documents,
  context,
  previousErrors,
  abortSignal,
  log,
}: GenerateStepInput): Promise<IncrementPayload> {
  const isBranch = step.type === 'branch';
  const builder = isBranch ? agents.branchStepBuilder : agents.categoryStepBuilder;
  const prompt = buildStepPrompt({ plan, step, documents, context, previousErrors });
  log.record('step-prompt', { index: step.index, stepType: step.type, label: step.label, prompt });

  const { object } = await builder.generate(prompt, {
    ...generationCallOptions(abortSignal, 'step'),
    structuredOutput: {
      schema: isBranch ? branchIncrementSchema : categoryIncrementSchema,
      // JSON Forms elements and schema fragments are open-ended, which OpenAI strict response_format rejects.
      jsonPromptInjection: 'system',
    },
  });

  const payload = object as IncrementPayload;

  log.record('step-payload', { index: step.index, stepType: step.type, label: step.label, payload });

  return {
    dataSchemaProperties: payload?.dataSchemaProperties ?? {},
    required: payload?.required ?? [],
    uiElements: payload?.uiElements ?? [],
    conditionalRequired: payload?.conditionalRequired ?? [],
    ...(payload?.branch ? { branch: payload.branch } : {}),
  };
}

function buildStepPrompt({
  plan,
  step,
  documents,
  context,
  previousErrors,
}: Pick<GenerateStepInput, 'plan' | 'step' | 'documents' | 'context' | 'previousErrors'>): string {
  const source = stepSourceText(documents, step.sectionId);

  return `Build increment ${step.index} of ${plan.steps.length} for this form.

## This increment
Type: ${step.type}
${step.type === 'branch' ? `Branch: "${step.label}" inside page "${step.categoryLabel ?? ''}"` : `Page: "${step.label}"`}
${step.detail ? `Must cover: ${step.detail}` : ''}

## Already saved
Properties: ${context.existingProperties.join(', ') || '(none)'}
Control scopes: ${context.existingScopes.join(', ') || '(none)'}
Pages: ${context.categoryLabels.join(', ') || '(none)'}

## Requirements for this increment
${source || '(build from the user instruction alone)'}
${deferredBranches(plan, step)}
## Contract
- Return ONLY this increment. dataSchemaProperties holds new root-level properties; uiElements holds the UI elements to append.
- Use the EXACT wording from the requirements for labels, questions, option text, help content, and order. Never reword.
- Requirements text that tells you HOW to build — component mappings, notation keys, schema or layout directives — is not form content. Never render it; build only what the applicant reads or answers.
- Every Control scope must be "#/properties/<name>" for a property you define in dataSchemaProperties, or one that already exists.
- Never redefine a property or repeat a control scope listed above.
- required lists property names that are always mandatory. Use conditionalRequired for fields that are only mandatory when visible.
- Caps: at most ${MAX_INCREMENT_CONTROLS} Control elements, at most ${MAX_INCREMENT_PROPERTIES} properties, under ${MAX_INCREMENT_JSON_BYTES} bytes of JSON. Split content across increments is not possible here, so stay within the cap by keeping to the requirements for THIS increment only.
${previousErrors?.length ? `\n## The previous attempt failed — fix exactly these problems\n${previousErrors.map((error) => `- ${error}`).join('\n')}` : ''}`;
}

/**
 * A page's section text also contains its conditional follow-ups. Without this the category builds them,
 * and every branch increment that follows then collides on an already-saved scope.
 */
function deferredBranches(plan: GenerationPlan, step: PlannedStep): string {
  if (step.type !== 'category') {
    return '';
  }

  const branches = plan.steps.filter((other) => other.type === 'branch' && other.categoryLabel === step.label);
  if (!branches.length) {
    return '';
  }

  return `
## Built by later increments — do not build these
Build the question that reveals each group, because the group's rule depends on it. Do NOT build the follow-up questions listed here.
${branches.map((branch) => `- ${branch.label}${branch.detail ? `: ${branch.detail}` : ''}`).join('\n')}
`;
}
