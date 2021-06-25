import { Router, Request, Response } from 'express';
import { discovery, getDirectories } from '../services';
import * as HttpStatusCodes from 'http-status-codes';
import validationMiddleware from '../../middleware/requestValidator';
import { Directory } from '../validator/directory/directoryValidator';
import { requireDirectoryAdmin } from '../../middleware/authentication';
import { DirectoryRepository } from '../repository';

import { DirectoryEntity } from '../model';

import { Logger } from 'winston';
import { NotFoundError } from '@core-services/core-common';

interface DirectoryRouterProps {
  logger: Logger;
  directoryRepository: DirectoryRepository;
}
export const createDirectoryRouter = ({ logger, directoryRepository }: DirectoryRouterProps): Router => {
  const directoryRouter = Router();
  /**
   * Get all of directories
   */
  directoryRouter.get('/', async (req: Request, res: Response, _next) => {
    try {
      const results = (await getDirectories()) as { urn: string; url: string }[];
      res.send(results);
    } catch (err) {
      logger.error(err);
      res.status(HttpStatusCodes.BAD_REQUEST).json({
        errors: [err.message],
      });
    }
  });

  /**
   * Get one directory by urn
   */
  directoryRouter.get('/urn', validationMiddleware(null), async (req: Request, res: Response, _next) => {
    if (req.query.urn) {
      const { urn } = req.query;
      return res.send(await discovery(urn as string, { directoryRepository }));
    }
    logger.error('There is error on getting directory from urn');
    return res.status(HttpStatusCodes.BAD_REQUEST).json({ errors: 'There is no context in post' });
  });

  /***********
   * Get one directory by name
   */
  directoryRouter.get('/directory/:name', validationMiddleware(null), async (req: Request, res: Response, _next) => {
    const { name } = req.params;

    try {
      const directory = await directoryRepository.getDirectories(name);

      res.send({
        name: directory.name,
        services: directory.services,
      });
    } catch (err) {
      logger.error(err);
      res.status(HttpStatusCodes.BAD_REQUEST).json({
        errors: [err.message],
      });
    }
  });

  /**
   * Add one directory
   */
  directoryRouter.post(
    '/',
    requireDirectoryAdmin,
    validationMiddleware(Directory),
    async (req: Request, res: Response) => {
      if (req.body) {
        const data = req.body;
        const entity = await DirectoryEntity.create(directoryRepository, {
          ...data,
        });

        return res.status(HttpStatusCodes.CREATED).json(entity);
      }

      logger.error('post add error');
      return res.sendStatus(HttpStatusCodes.BAD_REQUEST).json({ errors: 'There is no context in post' });
    }
  );

  /**
   * Update one directory
   */
  directoryRouter.put(
    '/',
    requireDirectoryAdmin,
    validationMiddleware(Directory),
    async (req: Request, res: Response) => {
      if (req.body) {
        const data = req.body;
        const entity = await directoryRepository.update(data);
        return res.status(HttpStatusCodes.CREATED).json(entity);
      }

      logger.error('post add/update error');
      return res.sendStatus(HttpStatusCodes.BAD_REQUEST).json({ errors: 'There is no context in post' });
    }
  );

  /**
   * Delete one directory by name
   */
  directoryRouter.delete(
    '/:name',
    requireDirectoryAdmin,
    validationMiddleware(null),
    async (req: Request, res: Response) => {
      const { name } = req.params;
      const directoryEntity = await directoryRepository.getDirectories(name);
      if (!directoryEntity) {
        throw new NotFoundError('File', name);
      }
      try {
        const results = await directoryRepository.delete(directoryEntity);

        res.json(results);
      } catch (err) {
        logger.error(err);
        res.status(HttpStatusCodes.BAD_REQUEST).json({
          errors: [err.message],
        });
      }
    }
  );
  return directoryRouter;
};
