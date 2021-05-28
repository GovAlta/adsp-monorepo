import { Request, Response, Router } from 'express';
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

  directoryRouter.get('/directory', async (req: Request, res: Response, _next) => {
    const { top, after } = req.query;

    try {
      const results = await directoryRepository.find(parseInt((top as string) || '10', 10), after as string);

      res.send({
        results: results.results.map((n) => ({
          id: n._id,
          name: n.name,
          services: n.services,
        })),
      });
    } catch (err) {
      logger.error(err);
    }
  });

  directoryRouter.get('/directory/:name', async (req, res, _next) => {
    const { name } = req.params;

    try {
      const directory = await directoryRepository.get(name);

      res.send({
        name: directory.name,
        services: directory.services,
      });
    } catch (err) {
      logger.error(err);
    }
  });

  directoryRouter.post('/directory/', async (req: Request, res: Response) => {
    const data = req.body;
    try {
      const directory = await directoryRepository.get(data.name);
      let entity;
      if (directory) {
        entity = await directory.update(data);
      } else {
        entity = await DirectoryEntity.create(directoryRepository, {
          ...data,
        });
      }
      res.json(entity);
    } catch (err) {
      logger.error(err);
    }
  });

  directoryRouter.delete('/directory/:name', async (req: Request, res: Response) => {
    const { name } = req.params;
    const directoryEntity = await directoryRepository.get(name);
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
