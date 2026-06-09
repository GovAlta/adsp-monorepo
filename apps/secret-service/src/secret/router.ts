import { Router } from 'express';
import { Logger } from 'winston';

export interface SecretRouterProps {
  logger: Logger;
}

export const createSecretRouter = ({ logger }: SecretRouterProps): Router => {
  const router = Router();

  // POST /secret/v1/secrets/
  router.post('/', (req, res) => {
    logger.info('POST /secret/v1/secrets/');
    res.status(200).json({ message: 'OK' });
  });

  // GET /secret/v1/secrets/:id
  router.get('/:id', (req, res) => {
    const { id } = req.params;
    logger.info(`GET /secret/v1/secrets/${id}`);
    res.status(200).json({ message: 'OK' });
  });

  return router;
};
