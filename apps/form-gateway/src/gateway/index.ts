import { ServiceDirectory, TokenProvider, adspId, TenantService } from '@abgov/adsp-service-sdk';
import { Application } from 'express';
import { Logger } from 'winston';
import { createGatewayRouter } from './router';

export * from './roles';

const FORM_API_ID = adspId`urn:ads:platform:configuration-service:v2`;
const FILE_API_ID = adspId`urn:ads:platform:file-service:v1`;

interface MiddlewareOptions {
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  tenantService: TenantService;
  RECAPTCHA_SECRET: string;
}

export async function applyGatewayMiddleware(
  app: Application,
  { logger, directory, tokenProvider, tenantService, RECAPTCHA_SECRET }: MiddlewareOptions
) {
  const fileApiUrl = await directory.getServiceUrl(FILE_API_ID);
  const formApiUrl = await directory.getServiceUrl(FORM_API_ID);

  const gatewayRouter = createGatewayRouter({
    logger,
    tokenProvider,
    tenantService,
    fileApiUrl,
    formApiUrl,
    RECAPTCHA_SECRET,
  });
  app.use('/gateway/v1', gatewayRouter);

  return app;
}
