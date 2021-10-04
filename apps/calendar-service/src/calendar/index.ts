import { AdspId, EventService, ServiceDirectory } from '@abgov/adsp-service-sdk';
import { Application } from 'express';
import { Logger } from 'winston';
import { CalendarRepository } from './repository';
import { createCalendarRouter, createDateRouter } from './router';

export * from './types';
export * from './roles';
export * from './events';
export * from './model';
export * from './repository';
export * from './configuration';

interface CalendarMiddlewareProps {
  serviceId: AdspId;
  logger: Logger;
  calendarRepository: CalendarRepository;
  eventService: EventService;
  directory: ServiceDirectory;
}

export const applyCalendarMiddleware = (
  app: Application,
  { calendarRepository: repository, ...props }: CalendarMiddlewareProps
): Application => {
  const dateRouter = createDateRouter({ repository });
  const calendarRouter = createCalendarRouter({ repository, ...props });
  app.use('/calendar/v1', [dateRouter, calendarRouter]);

  return app;
};
