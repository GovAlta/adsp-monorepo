import { AdspId } from '@abgov/adsp-service-sdk';
import { DateTime } from 'luxon';

export interface CalendarEvent {
  id: number;
  recordId?: string;
  context?: Record<string, boolean | string | number>;
  name: string;
  description: string;
  start: DateTime;
  end: DateTime;
  isPublic: boolean;
  isAllDay: boolean;
}

export interface Attendee {
  id: number;
  name: string;
  email: string;
}

export interface AttendeeCriteria {
  nameEquals?: string;
  emailEquals?: string;
}

export interface CalendarEventCriteria {
  tenant?: AdspId;
  recordId?: string;
  context?: Record<string, boolean | string | number>;
  isPublic?: boolean;
  startsAfter?: DateTime;
  endsBefore?: DateTime;
  attendeeCriteria?: AttendeeCriteria;
}
