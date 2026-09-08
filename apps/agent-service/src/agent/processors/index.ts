import { ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { type InputProcessor, PromptInjectionDetector } from '@mastra/core/processors';
import type { RequestContext } from '@mastra/core/request-context';
import { Logger } from 'winston';
import { getAgentModelConfiguration, getAgentModelId } from '../model/modelConfiguration';
import { BrokerInputProcessor } from '../types';
import { FileServiceDownloadProcessor } from './file';

interface InputProcessorProps {
  logger: Logger;
  requestContext: RequestContext<Record<string, unknown>>;
}

export function createInputProcessors({ requestContext }: InputProcessorProps): InputProcessor[] {
  const agentId = requestContext.get('agentId') as string | undefined;

  return [
    new PromptInjectionDetector({
      model: getAgentModelConfiguration(getAgentModelId(agentId)),
      threshold: 0.8,
      strategy: 'block',
      detectionTypes: ['injection', 'jailbreak', 'system-override'],
    }),
  ];
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
