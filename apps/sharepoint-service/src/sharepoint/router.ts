import { Router } from 'express';
import { Logger } from 'winston';

export interface SharePointRouterProps {
  logger: Logger;
}

export const createSharePointRouter = ({ logger }: SharePointRouterProps): Router => {
  const router = Router();

  router.post('/destinations/:destinationId/data', (req, res) => {
    const { destinationId } = req.params;
    logger.info(`POST /sharepoint/v1/sharepoint/destinations/${destinationId}/data`);
    res.status(200).json({ message: 'OK' });
  });

  router.get('/destinations/:destinationId/data', (req, res) => {
    const { destinationId } = req.params;
    logger.info(`GET /sharepoint/v1/sharepoint/destinations/${destinationId}/data`);
    res.status(200).json({ message: 'OK' });
  });

  router.post('/destinations/:destinationId/file/:fileUrl', (req, res) => {
    const { destinationId, fileUrl } = req.params;
    const { delete: deleteParam } = req.query;
    logger.info(`POST /sharepoint/v1/sharepoint/destinations/${destinationId}/file/${fileUrl}?delete=${deleteParam}`);
    res.status(200).json({ message: 'OK' });
  });

  return router;
};
