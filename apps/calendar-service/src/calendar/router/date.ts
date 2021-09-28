import { NotFoundError } from '@core-services/core-common';
import { RequestHandler, Router } from 'express';
import { CalendarRepository } from '../repository';

interface DateRouterProps {
  repository: CalendarRepository;
}

export function getDates(repository: CalendarRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const { top: topValue, after, criteria: criteriaValue } = req.query;
      const top = topValue ? parseInt(topValue as string) : 10;
      const criteria = criteriaValue ? JSON.parse(criteriaValue as string) : null;

      const result = await repository.getDates(top, after as string, criteria);

      res.send(result);
    } catch (err) {
      next(err);
    }
  };
}

export function getDate(repository: CalendarRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const { id: idValue } = req.params;
      const id = parseInt(idValue);

      const result = await repository.getDate(id);
      if (!result) {
        throw new NotFoundError('Calendar Date', idValue);
      }

      res.send(result);
    } catch (err) {
      next(err);
    }
  };
}

export const createDateRouter = ({ repository }: DateRouterProps): Router => {
  const router = Router();

  router.get('/dates', getDates(repository));
  router.get('/dates/:id', getDate(repository));

  return router;
};
