import { AdspId } from '@abgov/adsp-service-sdk';
import { Application } from 'express';
import { Logger } from 'winston';
import { CalendarRepository } from './repository';
import { createCalendarRouter, createDateRouter } from './router';

export * from './types';
export * from './roles';
export * from './repository';
export * from './configuration';

interface CalendarMiddlewareProps {
  serviceId: AdspId;
  logger: Logger;
  calendarRepository: CalendarRepository;
}

export const applyCalendarMiddleware = (
  app: Application,
  { calendarRepository: repository, logger, serviceId }: CalendarMiddlewareProps
): Application => {
  const dateRouter = createDateRouter({ repository });
  const calendarRouter = createCalendarRouter({ logger, repository, serviceId });
  app.use('/calendar/v1', [dateRouter, calendarRouter]);

  return app;
};
