import { ServiceDirectory, TenantService, TokenProvider } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler } from '@core-services/core-common';
import { Application } from 'express';
import { Namespace as IoNamespace } from 'socket.io';
import { Logger } from 'winston';
import { createAgentRouter } from './router';

export * from './agents';
export * from './configuration';
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
  { logger, tenantService }: AgentMiddlewareProps
) {
  const router = createAgentRouter(ios, { logger, tenantService });
  app.use('/agent/v1', assertAuthenticatedHandler, router);
}
