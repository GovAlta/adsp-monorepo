import { AdspId } from '@abgov/adsp-service-sdk';
import { DateTime } from 'luxon';

export interface CalendarEvent {
  id: number;
  name: string;
  description: string;
  start: DateTime;
  end: DateTime;
  isPublic: boolean;
  isAllDay: boolean;
}

export interface CalendarEventCriteria {
  tenant?: AdspId;
  isPublic?: boolean;
  startsAfter?: DateTime;
  endsBefore?: DateTime;
}

export interface Attendee {
  id: number;
  name: string;
  email: string;
}
