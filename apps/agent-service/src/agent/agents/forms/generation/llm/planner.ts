import type { DocumentOutline } from '../../../../utils/documentOutline';
import { FORM_GENERATION_LARGE_CHAR_COUNT, FORM_GENERATION_LARGE_PAGE_COUNT } from '../../../../utils/documentSize';
import type { GenerationLog } from '../run/log';
import type { GenerationAgents } from './agents';
import { generationCallOptions } from './agents';
import { describeSections, plannerSourceText, sourceCharCount, sourcePageCount } from '../run/sourceDocuments';
import {
  generationPlanSchema,
  type FormComplexity,
  type GenerationPlan,
  type PlannedStep,
  type PlannedStepInput,
} from '../types';

const MAX_PLAN_STEPS = 40;

const COMPLEX_CATEGORY_COUNT = 2;
const COMPLEX_PROPERTY_COUNT = 12;

export interface PlanFormInput {
  agents: GenerationAgents;
  requirement: string;
  documents: DocumentOutline[];
  current: { rootType: string; categoryLabels: string[]; propertyCount: number };
  variant: 'pages' | 'stepper';
  abortSignal?: AbortSignal;
  log: GenerationLog;
}

export async function planFormGeneration({
  agents,
  requirement,
  documents,
  current,
  variant,
  abortSignal,
  log,
}: PlanFormInput): Promise<GenerationPlan> {
  const prompt = buildPlannerPrompt({ requirement, documents, current });
  log.record('plan-prompt', { prompt });

  const { object } = await agents.planner.generate(prompt, {
    ...generationCallOptions(abortSignal, 'planner'),
    structuredOutput: { schema: generationPlanSchema },
  });

  log.record('plan-raw', { object });

  const steps = orderByDependency(normalizeSteps(object?.steps ?? []));
  const complexity = resolveComplexity(object?.complexity, steps, documents, current);
  const categoryLabels = uniqueCategoryLabels(steps);
  const planned = withScaffold(steps, complexity, current.rootType, categoryLabels);

  log.record('plan', { complexity, variant, categoryLabels, steps: planned });

  return {
    complexity,
    reason: object?.reason ?? '',
    variant,
    categoryLabels,
    steps: planned,
  };
}

function buildPlannerPrompt({
  requirement,
  documents,
  current,
}: Pick<PlanFormInput, 'requirement' | 'documents' | 'current'>): string {
  const source = plannerSourceText(documents);

  return `Plan the increments needed to build this form.

## What the user asked for
${requirement || '(no additional instruction beyond the attached requirements)'}

## Existing saved form
Root layout: ${current.rootType}
Existing pages: ${current.categoryLabels.length ? current.categoryLabels.join(', ') : '(none)'}
Existing properties: ${current.propertyCount}

## Requirements source sections
${describeSections(documents) || '(no attached document)'}

${source ? `## Requirements content\n${source}` : ''}

## How to plan
- Emit one "category" step per named section of the requirements. Use the section's exact title as the label.
- Some sections address YOU rather than the applicant: control-to-component mappings, notation keys, layout or schema directives, JSON Forms vocabulary, or wording like "use this document to generate". That is guidance for building the form, not part of it. Emit NO step for such a section, whatever it is titled. Plan only content an applicant would read or answer.
- Emit one "branch" step per group of questions that is shown or hidden by an earlier answer.
  Set categoryLabel to the label of the category the branch belongs to.
- Set sectionId to the outline section id holding the content for that step.
- Put one short line in detail naming the questions the step must cover.
- Order steps in document order. Branches are reordered after the pages for you.
- Do NOT emit a scaffold step; the root layout is set automatically.
- Never merge two named sections into one step, and never split one section across two category steps.

## Complexity
COMPLEX when any of these hold: two or more named sections; at least one conditional branch;
twelve or more inputs; document text of ${FORM_GENERATION_LARGE_CHAR_COUNT} characters or more;
${FORM_GENERATION_LARGE_PAGE_COUNT} or more pages; or the saved form already has
${COMPLEX_CATEGORY_COUNT} pages or ${COMPLEX_PROPERTY_COUNT} properties. Otherwise SIMPLE.`;
}

function normalizeSteps(steps: PlannedStepInput[]): PlannedStepInput[] {
  const seen = new Set<string>();

  return steps
    .filter((step) => step.type !== 'scaffold')
    .filter((step) => {
      const key = `${step.type}:${step.label.trim().toLowerCase()}:${step.categoryLabel ?? ''}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, MAX_PLAN_STEPS - 1)
    .map((step) => ({ ...step, label: step.label.trim() }));
}

/**
 * A branch's trigger control is defined by a category step, and its rule fails validation if that
 * property is not saved yet. Asking the model to order them correctly is not enough.
 */
function orderByDependency(steps: PlannedStepInput[]): PlannedStepInput[] {
  return [...steps.filter((step) => step.type === 'category'), ...steps.filter((step) => step.type !== 'category')];
}

/** Fail-to-complex: deterministic signals win over the model's own classification. */
function resolveComplexity(
  modelComplexity: FormComplexity | undefined,
  steps: PlannedStepInput[],
  documents: DocumentOutline[],
  current: PlanFormInput['current'],
): FormComplexity {
  const categoryCount = uniqueCategoryLabels(steps).length;
  const branchCount = steps.filter((step) => step.type === 'branch').length;

  const complex =
    modelComplexity === 'COMPLEX' ||
    categoryCount >= COMPLEX_CATEGORY_COUNT ||
    branchCount > 0 ||
    sourceCharCount(documents) >= FORM_GENERATION_LARGE_CHAR_COUNT ||
    sourcePageCount(documents) >= FORM_GENERATION_LARGE_PAGE_COUNT ||
    current.categoryLabels.length >= COMPLEX_CATEGORY_COUNT ||
    current.propertyCount >= COMPLEX_PROPERTY_COUNT;

  return complex ? 'COMPLEX' : 'SIMPLE';
}

function uniqueCategoryLabels(steps: PlannedStepInput[]): string[] {
  return [...new Set(steps.filter((step) => step.type === 'category').map((step) => step.label))];
}

function withScaffold(
  steps: PlannedStepInput[],
  complexity: FormComplexity,
  rootType: string,
  categoryLabels: string[],
): PlannedStep[] {
  const needsScaffold = complexity === 'COMPLEX' && rootType !== 'Categorization' && categoryLabels.length > 0;
  const ordered: PlannedStepInput[] = needsScaffold
    ? [{ type: 'scaffold', label: 'Set up form pages' }, ...steps]
    : steps;

  return ordered.map((step, position) => ({ ...step, index: position + 1 }));
}
