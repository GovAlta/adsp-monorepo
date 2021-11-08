import { Router } from 'express';
import { ServiceConfigurationRepository } from '../repository';
import { mapServiceOption } from './mappers';
import { ServiceOptionEntity } from '../model';
import HttpException from '../errorHandlers/httpException';
import * as HttpStatusCodes from 'http-status-codes';
import { errorHandler } from '../errorHandlers';

interface ServiceOptionRouterProps {
  serviceConfigurationRepository: ServiceConfigurationRepository;
}

export const createConfigurationRouter = ({ serviceConfigurationRepository }: ServiceOptionRouterProps): Router => {
  const serviceOptionRouter = Router();

  serviceOptionRouter.get('/', async (req, res, next) => {
    const { top, after, service } = req.query;

    try {
      const results = service
        ? await serviceConfigurationRepository.findServiceOptions(
            service as string,
            ((top as string) || '10', 10),
            after as string
          )
        : await serviceConfigurationRepository.find(parseInt((top as string) || '10', 10), after as string);

      res.json({
        page: results.page,
        results: results.results.map(mapServiceOption),
      });
    } catch (err) {
      errorHandler(err, req, res, next);
    }
  });

  serviceOptionRouter.get('/:id', async (req, res, next) => {
    const { id } = req.params;

    try {
      const results = await serviceConfigurationRepository.get(id);

      if (!results) {
        throw new HttpException(HttpStatusCodes.NOT_FOUND, `Service Options for ID ${id} was not found`);
      }

      res.json(mapServiceOption(results));
    } catch (err) {
      errorHandler(err, req, res, next);
    }
  });

  serviceOptionRouter.post('/', async (req, res, next) => {
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
      const entity = await ServiceOptionEntity.create(req.user, serviceConfigurationRepository, {
        ...data,
        serviceOption: results,
      });

      res.json(mapServiceOption(entity));
    } catch (err) {
      return errorHandler(err, req, res, next);
    }
  });

  serviceOptionRouter.put('/:id', async (req, res, next) => {
    const data = req.body;
    const { id } = req.params;
    const { service, version } = data;

    try {
      if (!service || !version) {
        throw new HttpException(HttpStatusCodes.BAD_REQUEST, 'Service, Version are required.');
      }

      const results = await serviceConfigurationRepository.get(id);

      if (!results) {
        throw new HttpException(HttpStatusCodes.NOT_FOUND, `Service Options for ID ${id} was not found`);
      }

      const entity = await results.update(req.user, data);

      res.json(mapServiceOption(entity));
    } catch (err) {
      errorHandler(err, req, res, next);
    }
  });

  serviceOptionRouter.get('/:service/:version', async (req, res, next) => {
    const { service, version } = req.params;

    try {
      const result = await serviceConfigurationRepository.getConfigOptionByVersion(service, version);
      if (!result) {
        throw new HttpException(HttpStatusCodes.NOT_FOUND, `Service Options for ${service}:${version} was not found`);
      }

      res.json(mapServiceOption(result));
    } catch (err) {
      errorHandler(err, req, res, next);
    }
  });

  serviceOptionRouter.post('/:service/:version', async (req, res, next) => {
    const data = req.body;
    const { service, version } = req.params;

    try {
      const entity = await serviceConfigurationRepository.getConfigOptionByVersion(service, version);
      const result = entity
        ? await entity.update(req.user, data)
        : await ServiceOptionEntity.create(req.user, serviceConfigurationRepository, data);

      res.json(mapServiceOption(result));
    } catch (err) {
      errorHandler(err, req, res, next);
    }
  });

  serviceOptionRouter.delete('/:id', async (req, res, next) => {
    const { id } = req.params;

    try {
      const results = await serviceConfigurationRepository.get(id);

      if (!results) {
        throw new HttpException(HttpStatusCodes.NOT_FOUND, `Service Options for ID ${id} was not found`);
      }

      const success = await results.delete(req.user);

      res.json(success);
    } catch (err) {
      errorHandler(err, req, res, next);
    }
  });

  return serviceOptionRouter;
};
