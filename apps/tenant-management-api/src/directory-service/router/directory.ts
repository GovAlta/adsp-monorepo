import { Request, Response, Router } from 'express';
import { DirectoryRepository } from '../repository';

import { DirectoryEntity } from '../model';
import validationMiddleware from '../../middleware/requestValidator';
import { Logger } from 'winston';
import { NotFoundError } from '@core-services/core-common';
import { Directory } from '../../directory/validator/directory/directoryValidator';
import { v4 as uuidv4 } from 'uuid';
import { type } from 'node:os';

interface DirectoryRouterProps {
  logger: Logger;
  directoryRepository: DirectoryRepository;
}

export const createDirectoryRouter = ({ logger, directoryRepository }: DirectoryRouterProps): Router => {
  const directoryRouter = Router();

  directoryRouter.get('/directory', validationMiddleware(null), async (req: Request, res: Response, _next) => {
    const { top, after } = req.query;

    try {
      const results = await directoryRepository.find(parseInt((top as string) || '10', 10), after as string);

      res.send({
        results: results.results.map((n) => ({
          id: n.id,
          name: n.name,
          services: n.services,
        })),
      });
    } catch (err) {
      logger.error(err);
    }
  });

  directoryRouter.get('/directory/:name', validationMiddleware(null), async (req, res, _next) => {
    const { name } = req.params;

    try {
      const directory = await directoryRepository.getDirectories(name);

      res.send({
        name: directory.name,
        services: directory.services,
      });
    } catch (err) {
      logger.error(err);
    }
  });

  directoryRouter.post('/directory/', validationMiddleware(Directory), async (req: Request, res: Response) => {
    const data = req.body;
    try {
      const directory = await directoryRepository.getDirectories(data.name);
      console.log('directory', directory);
      let entity;
      if (directory) {
        entity = await directory.update(data);
      } else {
        entity = await DirectoryEntity.create(directoryRepository, {
          ...data,
        });
      }
      if (typeof entity === 'string') {
        res.status(400).json(entity);
      }
      res.send({
        name: entity.name,
        services: entity.services,
      });
    } catch (err) {
      logger.error(err);
    }
  });

  directoryRouter.delete('/directory/:name', validationMiddleware(null), async (req: Request, res: Response) => {
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
    }
  });

  return directoryRouter;
};
