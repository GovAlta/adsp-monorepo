import { adspId, type ServiceDirectory, type TokenProvider, type User } from '@abgov/adsp-service-sdk';
import type { AgentExecutionOptions } from '@mastra/core/agent';
import type { Logger } from 'winston';
import { environment } from '../../../../../environments/environment';
import { SOURCE_DOCUMENTS_KEY } from '../../../../types';
import { getLatestFormDefinition } from '../../schema/definitionClient';
import { describeFormForModel } from './formSummary';
import {
  buildFormGenerationInstructions,
  getFormGenerationActiveTools,
  getLatestUserText,
  getPreviousUserText,
  getRecentToolNames,
  selectFormGenerationTopics,
} from './routing';

interface StepRequestContext {
  get(key: string): unknown;
}

export interface FormGenerationStepArgs {
  messages?: readonly unknown[];
  requestContext?: StepRequestContext;
}

export type CurrentFormReader = (requestContext: StepRequestContext | undefined) => Promise<string | undefined>;

interface FormGenerationOptionsProps {
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  tenantId?: string;
}

const CURRENT_FORM_UNAVAILABLE = 'The current form could not be loaded. Call formSchemaIndex to read it.';

/** Reads the saved form for the request's form definition and renders it for the model. */
export function createCurrentFormReader({
  logger,
  directory,
  tokenProvider,
  tenantId,
}: FormGenerationOptionsProps): CurrentFormReader {
  let configurationServiceUrl: Promise<URL> | undefined;

  return async (requestContext) => {
    const formDefinitionId = requestContext?.get('formDefinitionId');
    if (typeof formDefinitionId !== 'string' || !formDefinitionId) {
      return undefined;
    }

    try {
      configurationServiceUrl ??= directory.getServiceUrl(adspId`urn:ads:platform:configuration-service:v2`);
      const { dataSchema, uiSchema } = await getLatestFormDefinition(
        { configurationServiceUrl: await configurationServiceUrl, tokenProvider },
        requestContext?.get('tenantId')?.toString(),
        formDefinitionId,
      );
      return describeFormForModel(dataSchema, uiSchema);
    } catch (err) {
      configurationServiceUrl = undefined;
      logger.warn(`Could not read form definition '${formDefinitionId}' for the agent's instructions.`, {
        context: 'FormGenerationAgent',
        tenant: tenantId,
        error: err instanceof Error ? err.message : String(err),
      });
      return CURRENT_FORM_UNAVAILABLE;
    }
  };
}

function hasSourceDocuments(requestContext: StepRequestContext | undefined): boolean {
  const documents = requestContext?.get(SOURCE_DOCUMENTS_KEY);
  return Array.isArray(documents) && documents.length > 0;
}

/**
 * Sends a model call only the instruction sections and tools that the question needs, with the saved form described
 * in the instructions so the agent does not spend a tool call and a model call reading it. Stateless, because these
 * options are shared by every request: the form is read again for every step, so it includes changes made by earlier
 * steps of the same reply.
 */
export async function prepareFormGenerationStep(
  { messages = [], requestContext }: FormGenerationStepArgs,
  readCurrentForm: CurrentFormReader,
) {
  const selection = selectFormGenerationTopics({
    text: getLatestUserText(messages),
    previousText: getPreviousUserText(messages),
    hasDocuments: hasSourceDocuments(requestContext),
    recentToolNames: getRecentToolNames(messages),
  });
  const user = requestContext?.get('user') as User | undefined;
  const currentForm = selection.greeting ? undefined : await readCurrentForm(requestContext);

  return {
    selection,
    activeTools: getFormGenerationActiveTools(selection),
    systemMessages: [
      {
        role: 'system' as const,
        content: buildFormGenerationInstructions(selection, {
          date: new Date().toISOString().split('T')[0],
          userName: user?.name,
          currentForm,
        }),
      },
    ],
  };
}

export function createFormGenerationAgentOptions(props: FormGenerationOptionsProps): AgentExecutionOptions<undefined> {
  const readCurrentForm = createCurrentFormReader(props);

  return {
    // With an OpenAI-compatible endpoint the reply limit is a provider option (see getAgentProviderOptions).
    ...(environment.MODEL_URL
      ? {}
      : { modelSettings: { maxOutputTokens: environment.AGENT_FORM_GENERATION_MAX_OUTPUT_TOKENS } }),
    prepareStep: async (args: unknown) => {
      const { selection, activeTools, systemMessages } = await prepareFormGenerationStep(
        args as FormGenerationStepArgs,
        readCurrentForm,
      );
      props.logger.debug(
        `Form generation agent step uses topics: ${selection.greeting ? 'greeting' : selection.topics.join(', ') || 'core only'}.`,
        { context: 'FormGenerationAgent', tenant: props.tenantId },
      );
      return { activeTools, systemMessages };
    },
  } as AgentExecutionOptions<undefined>;
}
