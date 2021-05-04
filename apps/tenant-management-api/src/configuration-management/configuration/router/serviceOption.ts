import { Request, Response, Router } from 'express';
import { ServiceConfigurationRepository } from '../repository';
import { mapServiceOption } from './mappers';
import { ServiceOptionEntity } from '../model';
import HttpException from '../errorHandlers/httpException';
import * as HttpStatusCodes from 'http-status-codes';
import { errorHandler } from '../errorHandlers';

interface ServiceOptionRouterProps {
  serviceConfigurationRepository: ServiceConfigurationRepository;
}

export const createConfigurationRouter = ({ serviceConfigurationRepository }: ServiceOptionRouterProps) => {
  const serviceOptionRouter = Router();

  serviceOptionRouter.get('/', async (req: Request, res: Response) => {
    const { top, after } = req.query;

    try {
      const results = await serviceConfigurationRepository.find(parseInt((top as string) || '10', 10), after as string);

      res.json({
        page: results.page,
        results: results.results.map(mapServiceOption),
      });
    } catch (err) {
      errorHandler(err, req, res);
    }
  });

  serviceOptionRouter.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
      const results = await serviceConfigurationRepository.get(id);

      if (!results) {
        throw new HttpException(HttpStatusCodes.NOT_FOUND, `Service Options for ID ${id} was not found`);
      }

      res.json(mapServiceOption(results));
    } catch (err) {
      errorHandler(err, req, res);
    }
  });

  serviceOptionRouter.post('/', async (req: Request, res: Response) => {
    const data = req.body;
    const { service, version } = data;

    try {
      if (!service || !version) {
        throw new HttpException(HttpStatusCodes.BAD_REQUEST, 'Service, Version are required.');
      }

      const results = await serviceConfigurationRepository.getConfigOptionByVersion(service, version);

      if (results) {
        throw new HttpException(
          HttpStatusCodes.BAD_REQUEST,
          `Service Options ${service} version ${version} already exists`
        );
      }
      const entity = await ServiceOptionEntity.create(serviceConfigurationRepository, {
        ...data,
        serviceOption: results,
      });

      res.json(mapServiceOption(entity));
    } catch (err) {
      return errorHandler(err, req, res);
    }
  });

  serviceOptionRouter.put('/', async (req: Request, res: Response) => {
    const data = req.body;
    const { service, id, version } = data;

    try {
      if (!service || !version) {
        throw new HttpException(HttpStatusCodes.BAD_REQUEST, 'Service, Version are required.');
      }

      const results = await serviceConfigurationRepository.get(id);

      if (!results) {
        throw new HttpException(HttpStatusCodes.NOT_FOUND, `Service Options for ID ${id} was not found`);
      }

      const entity = await results.update(data);

      res.json(mapServiceOption(entity));
    } catch (err) {
      errorHandler(err, req, res);
    }
  });

  serviceOptionRouter.delete('/:id', async (req: Request, res: Response, next) => {
    const { id } = req.params;

    try {
      const results = await serviceConfigurationRepository.get(id);

      if (!results) {
        throw new HttpException(HttpStatusCodes.NOT_FOUND, `Service Options for ID ${id} was not found`);
      }

      const success = await results.delete();

      res.json(success);
    } catch (err) {
      errorHandler(err, req, res);
    }
  });

  return serviceOptionRouter;
};
