import { ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { type InputProcessor, PromptInjectionDetector } from '@mastra/core/processors';
import type { RequestContext } from '@mastra/core/request-context';
import { Logger } from 'winston';
import { getAgentModelConfiguration, getAgentModelId } from '../model/modelConfiguration';
import { withUsageRecording } from '../model/usageRecordingModel';
import { ACCESS_SERVICE_AGENT_ID } from '../model/executionLimits';
import { createAccessHistoryProcessor } from './accessHistory';
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
