import { ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { type InputProcessor, PromptInjectionDetector } from '@mastra/core/processors';
import type { RequestContext } from '@mastra/core/request-context';
import { Logger } from 'winston';
import { getAgentModelConfiguration, getAgentModelId } from '../model/modelConfiguration';
import { withUsageRecording } from '../model/usageRecordingModel';
import {
  ACCESS_SERVICE_AGENT_ID,
  FORM_GENERATION_AGENT_ID,
  NOTIFICATION_TEMPLATE_AGENT_ID,
  PDF_GENERATION_AGENT_ID,
} from '../model/executionLimits';
import { createAccessHistoryProcessor, createToolResultHistoryProcessor } from './accessHistory';
import { createNotificationHistoryProcessor } from './notificationHistory';
import { createPdfHistoryProcessor } from './pdfHistory';
import { BrokerInputProcessor } from '../types';
import { FileServiceDownloadProcessor } from './file';

interface InputProcessorProps {
  logger: Logger;
  requestContext: RequestContext<Record<string, unknown>>;
}

export function createInputProcessors({ requestContext }: InputProcessorProps): InputProcessor[] {
  const agentId = requestContext.get('agentId') as string | undefined;
  const processors: InputProcessor[] = [];

  if (agentId === ACCESS_SERVICE_AGENT_ID) {
    processors.push(createAccessHistoryProcessor());
  } else if (agentId === FORM_GENERATION_AGENT_ID) {
    processors.push(createToolResultHistoryProcessor('form-generation-history', 'Form generation history'));
  } else if (agentId === NOTIFICATION_TEMPLATE_AGENT_ID) {
    processors.push(createNotificationHistoryProcessor());
  } else if (agentId === PDF_GENERATION_AGENT_ID) {
    processors.push(createPdfHistoryProcessor());
  }

  processors.push(
    new PromptInjectionDetector({
      // The detector's model calls are not part of the agent's own usage, so they are recorded for the reply.
      model: withUsageRecording(getAgentModelConfiguration(getAgentModelId(agentId)), requestContext),
      threshold: 0.8,
      strategy: 'block',
      detectionTypes: ['injection', 'jailbreak', 'system-override'],
      // The input includes the recalled thread, and each message is a separate model call made in sequence. Earlier
      // user messages were checked on the turn they were sent, so only the new one needs checking.
      lastMessageOnly: true,
      // Some models stall on a strict JSON schema response format until the endpoint times out, which lets the message
      // through unchecked; describing the schema in the prompt instead works on every model.
      structuredOutputOptions: { jsonPromptInjection: true },
    }),
  );

  return processors;
}

interface BrokerInputProcessorProps {
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
}

export function createBrokerInputProcessors({
  logger,
  directory,
  tokenProvider,
}: BrokerInputProcessorProps): BrokerInputProcessor[] {
  return [new FileServiceDownloadProcessor(logger, directory, tokenProvider)];
}
