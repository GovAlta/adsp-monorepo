import { Router } from 'express';
import { Logger } from 'winston';
import { isAllowedUser, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import { getConnection, registerConnection, SharePointConnection } from './connections';
import { acquireGraphToken } from './graphAuth';
import { SharePointServiceRoles } from './roles';

export interface SharePointRouterProps {
  logger: Logger;
}

export const createSharePointRouter = ({ logger }: SharePointRouterProps): Router => {
  const router = Router();

  router.post('/connections/:destinationId', (req, res, next) => {
    try {
      const user = req.user as User;
      if (!isAllowedUser(user, req.tenant?.id, SharePointServiceRoles.Admin)) {
        throw new UnauthorizedUserError('register a SharePoint connection', user);
      }

      const { destinationId } = req.params;
      const { azureTenantId, clientId, clientSecret } = req.body as SharePointConnection;
      registerConnection(req.tenant.id.toString(), destinationId, { azureTenantId, clientId, clientSecret });
      logger.info(`Registered SharePoint connection for destination ${destinationId}`);
      res.status(200).json({ message: 'OK' });
    } catch (err) {
      next(err);
    }
  });

  router.post('/destinations/:destinationId/data', (req, res, next) => {
    (async () => {
      const user = req.user as User;
      if (!isAllowedUser(user, req.tenant?.id, SharePointServiceRoles.Writer)) {
        throw new UnauthorizedUserError('push data to SharePoint destination', user);
      }

      const { destinationId } = req.params;
      const connection = getConnection(req.tenant.id.toString(), destinationId);
      if (!connection) {
        throw new NotFoundError('SharePoint connection', destinationId);
      }

      await acquireGraphToken(req.tenant.id.toString(), destinationId, connection, logger);

      logger.info(`POST /sharepoint/v1/sharepoint/destinations/${destinationId}/data`);
      res.status(200).json({
        message: 'OK',
        note: 'Microsoft Graph authentication verified; SharePoint list write is not yet implemented (OSP-797).',
      });
    })().catch(next);
  });

  router.post('/destinations/:destinationId/file/:fileUrl', (req, res, next) => {
    (async () => {
      const user = req.user as User;
      if (!isAllowedUser(user, req.tenant?.id, SharePointServiceRoles.Writer)) {
        throw new UnauthorizedUserError('push file to SharePoint destination', user);
      }

      const { destinationId, fileUrl } = req.params;
      const { delete: deleteParam } = req.query;
      const connection = getConnection(req.tenant.id.toString(), destinationId);
      if (!connection) {
        throw new NotFoundError('SharePoint connection', destinationId);
      }

      await acquireGraphToken(req.tenant.id.toString(), destinationId, connection, logger);

      logger.info(`POST /sharepoint/v1/sharepoint/destinations/${destinationId}/file/${fileUrl}?delete=${deleteParam}`);
      res.status(200).json({
        message: 'OK',
        note: 'Microsoft Graph authentication verified; document library push is not yet implemented.',
      });
    })().catch(next);
  });

  return router;
};
