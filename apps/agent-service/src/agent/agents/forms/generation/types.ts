import z from 'zod';

export const GENERATION_STEP_TYPES = ['scaffold', 'category', 'branch'] as const;
export type GenerationStepType = (typeof GENERATION_STEP_TYPES)[number];

export type FormComplexity = 'SIMPLE' | 'COMPLEX';

// JSON Forms compares a rule `const` against a stored answer, so the value is a primitive.
export const ruleValueSchema = z.union([z.string(), z.number(), z.boolean()]);

export const branchSchema = z.object({
  label: z.string(),
  triggerScope: z
    .string()
    .describe('Scope of the already-saved control that drives visibility, e.g. #/properties/usesAdsp'),
  triggerValue: ruleValueSchema.describe(
    'The stored answer that reveals this branch, matching the enum casing exactly',
  ),
  effect: z.enum(['SHOW', 'HIDE', 'ENABLE', 'DISABLE']).optional(),
});

export const conditionalRequiredSchema = z.object({
  conditionScope: z.string(),
  conditionValue: ruleValueSchema,
  required: z.array(z.string()),
});

export const plannedStepSchema = z.object({
  type: z.enum(GENERATION_STEP_TYPES),
  label: z.string().min(1),
  categoryLabel: z.string().optional(),
  sectionId: z.string().optional(),
  detail: z.string().optional(),
});

export const generationPlanSchema = z.object({
  complexity: z.enum(['SIMPLE', 'COMPLEX']),
  reason: z.string(),
  steps: z.array(plannedStepSchema).min(1),
});

const incrementShape = {
  dataSchemaProperties: z
    .record(z.object({}).passthrough())
    .optional()
    .describe('New root-level JSON Schema properties, keyed by property name'),
  required: z.array(z.string()).optional(),
  uiElements: z
    .array(z.object({}).passthrough())
    .optional()
    .describe('JSON Forms UI elements to append for this increment'),
  conditionalRequired: z.array(conditionalRequiredSchema).optional(),
};

/** No branch at all, so a category step cannot emit one and collide with the branch increment that follows. */
export const categoryIncrementSchema = z.object(incrementShape);

/** Required: an optional branch told the model the field was skippable, and it returned partial branch objects. */
export const branchIncrementSchema = z.object({ ...incrementShape, branch: branchSchema });

const incrementPayloadSchema = z.object({ ...incrementShape, branch: branchSchema.optional() });

export type PlannedStepInput = z.infer<typeof plannedStepSchema>;
export type PlannedStep = PlannedStepInput & { index: number };
export type IncrementPayload = z.infer<typeof incrementPayloadSchema>;

export interface GenerationPlan {
  complexity: FormComplexity;
  reason: string;
  variant: 'pages' | 'stepper';
  categoryLabels: string[];
  steps: PlannedStep[];
}

export interface StepFailure {
  index: number;
  label: string;
  stepType: GenerationStepType;
  failedArtifact: string;
  message: string;
}

export interface GenerationRunResult {
  complexity: FormComplexity;
  total: number;
  saved: number;
  savedLabels: string[];
  /** Steps that failed on the first pass and were rebuilt by the sweep. A subset of savedLabels. */
  recoveredLabels: string[];
  /** Steps the run never reached because it stopped early. Nothing was built for these. */
  notAttemptedLabels: string[];
  failures: StepFailure[];
  rootType: string;
  propertyCount: number;
  categoryCount: number;
  controlCount: number;
  validation: { ok: boolean; errors: { path: string; message: string }[] };
}
