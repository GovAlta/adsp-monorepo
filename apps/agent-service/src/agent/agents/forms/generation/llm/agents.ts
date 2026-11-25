import { Agent } from '@mastra/core/agent';
import { formatSchemaChecklist, loadFormExamples, type FormExampleGroup } from '../../../utils/loadFormExamples';
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
  /** The page builder with the computed field examples, for pages whose requirements calculate something. */
  computedCategoryStepBuilder: GenerationAgent;
  branchStepBuilder: GenerationAgent;
}

const CATEGORY_EXAMPLE_GROUPS: readonly FormExampleGroup[] = [
  'controls',
  'commonFields',
  'content',
  'repeating',
  'validation',
];
// The computed examples are the largest group, so only pages that calculate something get them.
const COMPUTED_CATEGORY_EXAMPLE_GROUPS: readonly FormExampleGroup[] = [...CATEGORY_EXAMPLE_GROUPS, 'computed'];
const BRANCH_EXAMPLE_GROUPS: readonly FormExampleGroup[] = ['rules', 'validation', 'controls'];

const PLANNER_INSTRUCTIONS = `You plan the construction of an ADSP JSON Forms definition from a requirements document.
You never write schemas. You only decide what will be built and in what order.`;

const STEP_BUILDER_INSTRUCTIONS = `You build ONE increment of an ADSP JSON Forms definition at a time.
You return only the fields and UI elements for the increment you are given, never the whole form.`;

const CATEGORY_RULES = `- Do not wrap the elements in a Category, Group, or Layout. Return the page's elements directly.
- Add HelpContent elements with "markdown": true for instructions and notices that are not questions, but only ones an applicant needs to read.
- Never turn build guidance into HelpContent. Lines that map a requirement to a component, name schema keys or JSON Forms types, or describe the notation of the requirements document are addressed to you, not to the applicant.
- Do not add SHOW/HIDE rules here; conditional groups are added by their own branch increment.
- Use the ADSP common definitions instead of building these fields from scratch: a property { "$ref": "https://adsp.alberta.ca/common.v1.schema.json#/definitions/<name>" } with one Control for it that has a label in the requirements' wording. Names: personFullName (a person's name), personFullNameAndDob, postalAddressAlberta or postalAddressCanada (an address), email, phoneNumber, phoneNumberWithType, socialInsuranceNumber, bankAccountNumber, personDependents. Build the parts yourself only when the requirements ask for parts the definition does not have.
- Validate fields whose purpose is clear from the label, even when the requirements do not ask for it: "format": "email" for an email address, "format": "phone" for a telephone number and "format": "postalCode" for a Canadian postal code.`;

const BRANCH_RULES = `- Set branch.triggerScope to the scope of the control that already exists and drives visibility, branch.triggerValue to the exact stored enum value (match its casing), and branch.effect (SHOW when hidden by default).
- branch.triggerScope MUST be copied from the Control scopes listed as already saved. Never invent one; a scope that does not resolve fails the whole increment.
- uiElements must contain ONLY the questions revealed by the branch. Never include the trigger control itself.
- The branch wrapper and its rule are added for you. Do not add a rule to the elements you return.
- If a branch question is mandatory when shown, list it in conditionalRequired with the trigger scope and value, not in required.`;

// Rules and examples live here, not in the per-step prompt, so every step of the same type shares a
// byte-identical system prefix and the provider serves it from its prompt cache. Every step re-sends them, so the
// anti-patterns are a one-line checklist and the examples are single-line JSON without the best practices, which
// are about choosing a layout and reading a document: the planner's job, not a step's.
function stepBuilderInstructions(rules: string, groups: readonly FormExampleGroup[]): string {
  return `${STEP_BUILDER_INSTRUCTIONS}

## Rules for this increment type
${rules}

${formatSchemaChecklist()}

## Reference
${loadFormExamples(groups, { guidance: false, compactJson: true })}`;
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
    computedCategoryStepBuilder: new Agent({
      id: 'formGenerationComputedCategoryStepBuilder',
      name: 'Form Generation Computed Category Step Builder',
      instructions: stepBuilderInstructions(CATEGORY_RULES, COMPUTED_CATEGORY_EXAMPLE_GROUPS),
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
