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
  const { schemaDefinitionTool, formConfigurationRetrievalTool, formConfigurationUpdateTool, fileDownloadTool } =
    await createTools({
      logger,
      directory,
      tokenProvider,
    });
  const { formGenerationAgent, pdfFormAnalysisAgent } = await createFormAgents({
    schemaDefinitionTool,
    formConfigurationRetrievalTool,
    formConfigurationUpdateTool,
    fileDownloadTool,
  });
  const mastra = new Mastra({
    agents: { formGenerationAgent, pdfFormAnalysisAgent },
  });

  const router = createAgentRouter(mastra, ios, { logger, tenantService });
  app.use('/agent/v1', router);
}
