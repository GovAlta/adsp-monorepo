import { Application } from 'express';
import { CalendarRepository } from './repository';
import { createCalendarRouter } from './router';

export * from './types';
export * from './repository';

interface CalendarMiddlewareProps {
  calendarRepository: CalendarRepository;
}

export const applyCalendarMiddleware = (
  app: Application,
  { calendarRepository }: CalendarMiddlewareProps
): Application => {
  const calendarRouter = createCalendarRouter({ repository: calendarRepository });
  app.use('/calendar/v1', calendarRouter);

  return app;
};
