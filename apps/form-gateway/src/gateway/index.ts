import { ServiceDirectory, TokenProvider, adspId } from '@abgov/adsp-service-sdk';
import { Application } from 'express';
import { Logger } from 'winston';
import { createGatewayRouter } from './router';

export * from './roles';

const CONFIGURATION_API_ID = adspId`urn:ads:platform:configuration-service:v2`;

interface MiddlewareOptions {
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
}

export async function applyGatewayMiddleware(
  app: Application,
  { logger, directory, tokenProvider }: MiddlewareOptions
) {
  const configurationApiUrl = await directory.getServiceUrl(CONFIGURATION_API_ID);

  const gatewayRouter = createGatewayRouter({ logger, configurationApiUrl, tokenProvider });
  app.use('/gateway/v1', gatewayRouter);

  return app;
}
