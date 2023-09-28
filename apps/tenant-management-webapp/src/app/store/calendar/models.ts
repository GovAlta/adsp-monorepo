import { ActionState } from '@store/session/models';

export const EventDeleteModalType = 'calendar-event-delete-model';
export const EventAddEditModalType = 'calendar-event-add-edit-modal';
export interface CalendarItem {
  name: string;
  displayName?: string;
  description?: string;
  readRoles: string[];
  updateRoles: string[];
  selectedCalendarEvents?: CalendarEvent[];
  nextEvents?: string;
}

export type CalendarObjectType = Record<string, CalendarItem>;

export interface CalendarService {
  calendars: CalendarObjectType;
  indicator?: Indicator;
}

export const defaultCalendar: CalendarItem = {
  name: '',
  displayName: '',
  description: '',
  readRoles: [],
  updateRoles: [],
};
export const CALENDAR_INIT: CalendarService = {
  calendars: null,
  indicator: {
    details: {},
  },
  // selectedCalendarEvents: [],
};
export interface Indicator {
  details?: Record<string, ActionState>;
}

export interface Attendee {
  id: number;
  name: string;
  email: string;
}

export interface CalendarEvent {
  id?: number;
  name: string;
  description: string;
  start: string;
  end: string;
  isPublic: boolean;
  isAllDay?: boolean;
  attendees?: Attendee[];
}

export const CalendarEventDefault = {
  id: null,
  name: '',
  description: '',
  start: new Date().toISOString(),
  end: new Date().toISOString(),
  isPublic: false,
  isAllDay: false,
};
