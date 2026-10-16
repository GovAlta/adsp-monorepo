import { AdspId } from '@abgov/adsp-service-sdk';
import { DateTime } from 'luxon';

export type RecurrenceDay = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

// Subset of the RFC 5545 RRULE: FREQ, INTERVAL, BYDAY (weekly), UNTIL, and COUNT.
export interface EventRecurrence {
  frequency: RecurrenceFrequency;
  interval?: number;
  daysOfWeek?: RecurrenceDay[];
  end?: {
    until?: string;
    count?: number;
  };
}

export interface CalendarEvent {
  id: number;
  recordId?: string;
  context?: Record<string, boolean | string | number>;
  name: string;
  description: string;
  start: DateTime;
  end?: DateTime;
  isPublic: boolean;
  isAllDay: boolean;
  recurrence?: EventRecurrence;
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
  activeOn?: DateTime;
  attendeeCriteria?: AttendeeCriteria;
  orderBy?: 'id' | 'start';
}
