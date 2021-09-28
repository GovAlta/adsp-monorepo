import { CalendarEntity } from '../model';

export * from './date';
export * from './calendar';
export * from './event';

export type CalendarServiceConfiguration = Record<string, CalendarEntity>;
export type CalendarTimeZone = 'America/Edmonton';