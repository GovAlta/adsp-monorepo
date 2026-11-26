import { createValidationHandler, InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { RequestHandler, Router } from 'express';
import { param } from 'express-validator';
import { CalendarDateCriteria, HolidayTypes } from '../types';
import { CalendarRepository } from '../repository';
import { criteriaQueryValidator, topQueryValidator } from './validation';

interface DateRouterProps {
  repository: CalendarRepository;
}

function assertHolidayTypes(criteria: CalendarDateCriteria): void {
  if (criteria?.holidayType == null) {
    return;
  }

  const holidayTypes: unknown[] = Array.isArray(criteria.holidayType) ? criteria.holidayType : [criteria.holidayType];
  if (holidayTypes.some((holidayType) => !(HolidayTypes as readonly unknown[]).includes(holidayType))) {
    throw new InvalidOperationError(`holidayType must be one of: ${HolidayTypes.join(', ')}.`);
  }
}

export function getDates(repository: CalendarRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const { top: topValue, after, criteria: criteriaValue } = req.query;
      const top = topValue ? parseInt(topValue as string) : 10;
      const criteria = criteriaValue ? JSON.parse(criteriaValue as string) : null;
      assertHolidayTypes(criteria);

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

  router.get('/dates', createValidationHandler(topQueryValidator(), criteriaQueryValidator()), getDates(repository));
  router.get(
    '/dates/:id',
    createValidationHandler(param('id').isInt({ min: 20200000, max: 20600000 })),
    getDate(repository),
  );

  return router;
};
