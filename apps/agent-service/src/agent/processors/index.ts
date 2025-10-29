import { type InputProcessor, PromptInjectionDetector } from '@mastra/core/processors';
import { environment } from '../../environments/environment';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { Logger } from 'winston';
import { BrokerInputProcessor } from '../types';
import { FileServiceDownloadProcessor } from './file';
import { ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';

interface InputProcessorProps {
  logger: Logger;
  runtimeContext: RuntimeContext<Record<string, unknown>>;
}

export function createInputProcessors(_prop: InputProcessorProps): InputProcessor[] {
  return [
    new PromptInjectionDetector({
      model: environment.MODEL,
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
