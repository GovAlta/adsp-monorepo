import { ServiceDirectory, TenantService, TokenProvider } from '@abgov/adsp-service-sdk';
import { Mastra } from '@mastra/core';
import { Application } from 'express';
import { Namespace as IoNamespace } from 'socket.io';
import { Logger } from 'winston';
import { createFormAgents } from './agents/form';
import { createTools } from './tools';
import { createAgentRouter } from './router';

export * from './roles';

interface AgentMiddlewareProps {
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  tenantService: TenantService;
}
export async function applyAgentMiddleware(
  app: Application,
  ios: IoNamespace[],
  { logger, directory, tokenProvider, tenantService }: AgentMiddlewareProps
) {
  const { schemaDefinitionTool, formConfigurationRetrievalTool, formConfigurationUpdateTool } = await createTools({
    logger,
    directory,
    tokenProvider,
  });
  const { formGenerationAgent } = await createFormAgents({
    schemaDefinitionTool,
    formConfigurationRetrievalTool,
    formConfigurationUpdateTool,
  });
  const mastra = new Mastra({
    agents: { formGenerationAgent },
  });

  const router = createAgentRouter(mastra, ios, { logger, tenantService });
  app.use('/agent/v1', router);
}
