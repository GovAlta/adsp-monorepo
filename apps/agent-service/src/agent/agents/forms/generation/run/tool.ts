import { adspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { createTool } from '@mastra/core/tools';
import type { ToolExecutionContext } from '@mastra/core/tools';
import type { Logger } from 'winston';
import z from 'zod';
import { createGenerationAgents } from '../llm/agents';
import { runFormGeneration } from './orchestrator';
import { createProgressEmitter } from './progress';
import { readSourceDocuments } from './sourceDocuments';
import { AdspRequestContext } from '../../../../types';

interface FormGenerationToolsProps {
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  logger: Logger;
}

const outputSchema = z.object({
  complexity: z.string(),
  total: z.number(),
  saved: z.number(),
  savedLabels: z.array(z.string()),
  recoveredLabels: z.array(z.string()),
  notAttemptedLabels: z.array(z.string()),
  failures: z.array(
    z.object({
      index: z.number(),
      label: z.string(),
      stepType: z.string(),
      failedArtifact: z.string(),
      message: z.string(),
    }),
  ),
  rootType: z.string(),
  propertyCount: z.number(),
  categoryCount: z.number(),
  controlCount: z.number(),
  validation: z.object({ ok: z.boolean(), errors: z.array(z.object({ path: z.string(), message: z.string() })) }),
  summary: z.string(),
});

export async function createFormGenerationTools({ directory, tokenProvider, logger }: FormGenerationToolsProps) {
  const configurationServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:configuration-service:v2`);
  const client = { configurationServiceUrl, tokenProvider };
  const agents = createGenerationAgents();

  const formGenerationRun = createTool({
    id: 'generate-form',
    description: `Build the form from the user's requirements. Call this ONCE and let it finish.

It plans the pages and conditional branches, then builds and saves them one at a time, repairing and
continuing on its own. Progress appears in the editor as it runs; the preview grows with each save.
Attached requirement documents are read directly from the request — do not paste their content here.
Use this for anything that adds pages, sections, or more than a couple of fields. Use formSchemaPatch
for a targeted edit to content that already exists.`,
    inputSchema: z.object({
      requirement: z
        .string()
        .describe(
          'What the user asked for, in their words. Include any instruction not covered by an attached document.',
        ),
      variant: z
        .enum(['pages', 'stepper'])
        .optional()
        .describe("Multi-page layout style. Defaults to 'pages'; use 'stepper' only when the user asks for one."),
    }),
    outputSchema,
    execute: async (inputData, context: ToolExecutionContext) => {
      const requestContext = context.requestContext as AdspRequestContext<{ formDefinitionId: string }>;
      const tenantId = requestContext.get('tenantId')?.toString();
      const formDefinitionId = requestContext.get('formDefinitionId') as string;

      const result = await runFormGeneration({
        agents,
        client,
        logger,
        tenantId,
        formDefinitionId,
        requirement: inputData.requirement,
        documents: readSourceDocuments(requestContext as never),
        variant: inputData.variant ?? 'pages',
        emit: createProgressEmitter(context.writer),
        abortSignal: context.abortSignal,
      });

      return { ...result, summary: summarize(result) };
    },
  });

  return { formGenerationRun };
}

function summarize(result: Awaited<ReturnType<typeof runFormGeneration>>): string {
  const lines = [`Saved ${result.saved} of ${result.total} planned steps.`];

  for (const label of result.recoveredLabels) {
    lines.push(
      `- "${label}" failed at first and was rebuilt on the retry pass. It is in the form; nothing is missing.`,
    );
  }

  for (const failure of result.failures) {
    lines.push(
      `- "${failure.label}" could not be built after repeated attempts. ${failure.message} ${consequenceOf(failure)}`,
    );
  }

  if (result.notAttemptedLabels.length) {
    lines.push(
      `- The run stopped before reaching ${result.notAttemptedLabels.join(', ')}. Nothing was built for those at all.`,
    );
  }

  if (!result.validation.ok) {
    lines.push(
      `- The saved form has validation errors and may not render until they are fixed: ${result.validation.errors
        .slice(0, 5)
        .map((error) => `${error.path} ${error.message}`)
        .join('; ')}.`,
    );
  } else if (!result.failures.length && !result.notAttemptedLabels.length) {
    lines.push('- Every planned step was built and the form validates.');
  }

  return lines.join('\n');
}

/** What the user has lost, in their terms, rather than in terms of the increment that failed. */
function consequenceOf(failure: { stepType: string }): string {
  switch (failure.stepType) {
    case 'category':
      return 'That page is missing from the form, along with every question on it.';
    case 'branch':
      return 'The form has no conditional group for it, so the questions it would have revealed are missing. The question that triggers it may still be there on its own.';
    default:
      return 'The form layout was not set up as planned.';
  }
}
