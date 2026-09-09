import { Agent } from '@mastra/core/agent';
import { loadFormExamples, type FormExampleGroup } from '../../../utils/loadFormExamples';
import {
  getAgentModelConfiguration,
  getGenerationModelId,
  getGenerationReasoningOptions,
  type GenerationRole,
} from '../../../../model/modelConfiguration';

export type GenerationAgent = Pick<Agent, 'generate'>;

export interface GenerationAgents {
  planner: GenerationAgent;
  categoryStepBuilder: GenerationAgent;
  branchStepBuilder: GenerationAgent;
}

const CATEGORY_EXAMPLE_GROUPS: readonly FormExampleGroup[] = [
  'controls',
  'commonFields',
  'content',
  'repeating',
  'validation',
  'computed',
];
const BRANCH_EXAMPLE_GROUPS: readonly FormExampleGroup[] = ['rules', 'validation', 'controls'];

const PLANNER_INSTRUCTIONS = `You plan the construction of an ADSP JSON Forms definition from a requirements document.
You never write schemas. You only decide what will be built and in what order.`;

const STEP_BUILDER_INSTRUCTIONS = `You build ONE increment of an ADSP JSON Forms definition at a time.
You return only the fields and UI elements for the increment you are given, never the whole form.`;

const CATEGORY_RULES = `- Do not wrap the elements in a Category, Group, or Layout. Return the page's elements directly.
- Add HelpContent elements with "markdown": true for instructions and notices that are not questions, but only ones an applicant needs to read.
- Never turn build guidance into HelpContent. Lines that map a requirement to a component, name schema keys or JSON Forms types, or describe the notation of the requirements document are addressed to you, not to the applicant.
- Do not add SHOW/HIDE rules here; conditional groups are added by their own branch increment.`;

const BRANCH_RULES = `- Set branch.triggerScope to the scope of the control that already exists and drives visibility, branch.triggerValue to the exact stored enum value (match its casing), and branch.effect (SHOW when hidden by default).
- branch.triggerScope MUST be copied from the Control scopes listed as already saved. Never invent one; a scope that does not resolve fails the whole increment.
- uiElements must contain ONLY the questions revealed by the branch. Never include the trigger control itself.
- The branch wrapper and its rule are added for you. Do not add a rule to the elements you return.
- If a branch question is mandatory when shown, list it in conditionalRequired with the trigger scope and value, not in required.`;

// Rules and examples live here, not in the per-step prompt, so every step of the same type shares a
// byte-identical system prefix and the provider serves it from its prompt cache.
function stepBuilderInstructions(rules: string, groups: readonly FormExampleGroup[]): string {
  return `${STEP_BUILDER_INSTRUCTIONS}

## Rules for this increment type
${rules}

## Reference
${loadFormExamples(groups)}`;
}

export function createGenerationAgents(): GenerationAgents {
  const plannerModel = getAgentModelConfiguration(getGenerationModelId('planner'));
  const stepModel = getAgentModelConfiguration(getGenerationModelId('step'));

  return {
    planner: new Agent({
      id: 'formGenerationPlanner',
      name: 'Form Generation Planner',
      instructions: PLANNER_INSTRUCTIONS,
      model: plannerModel,
    }),
    categoryStepBuilder: new Agent({
      id: 'formGenerationCategoryStepBuilder',
      name: 'Form Generation Category Step Builder',
      instructions: stepBuilderInstructions(CATEGORY_RULES, CATEGORY_EXAMPLE_GROUPS),
      model: stepModel,
    }),
    branchStepBuilder: new Agent({
      id: 'formGenerationBranchStepBuilder',
      name: 'Form Generation Branch Step Builder',
      instructions: stepBuilderInstructions(BRANCH_RULES, BRANCH_EXAMPLE_GROUPS),
      model: stepModel,
    }),
  };
}

export function generationCallOptions(abortSignal?: AbortSignal, role?: GenerationRole) {
  return {
    ...(abortSignal ? { abortSignal } : {}),
    providerOptions: getGenerationReasoningOptions(role),
  };
}
