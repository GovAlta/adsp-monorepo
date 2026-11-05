/**
 * Standalone local runner: real SharePoint router with a fake dev user and tenant.
 * Needs no Keycloak or platform services. For local demo only; not for deployment.
 */
import * as express from 'express';
import * as cors from 'cors';
import { adspId } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { createErrorHandler, createLogger } from '@core-services/core-common';
import { createSharePointRouter, SharePointServiceRoles } from './sharepoint';

const port = Number(process.env.PORT || 3350);
const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/local`;
const logger = createLogger('sharepoint-service-local', 'debug');

const devUser = {
  id: 'local-dev-user',
  name: 'Local Dev',
  email: 'dev@example.com',
  tenantId,
  roles: [SharePointServiceRoles.Admin, SharePointServiceRoles.Writer],
  isCore: false,
} as unknown as User;

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/sharepoint/v1/sharepoint', (req, _res, next) => {
  req.user = devUser;
  req.tenant = { id: tenantId, name: 'local', realm: 'local' } as never;
  next();
});
app.use('/sharepoint/v1/sharepoint', createSharePointRouter({ logger }));
app.use('/sharepoint/v1/sharepoint', createErrorHandler(logger));
app.get('/health', (_req, res) => res.json({ status: 'ok', mode: 'local' }));

app.listen(port, () => logger.info(`SharePoint service local mode on http://localhost:${port}`));
