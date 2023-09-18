import { createSelector } from 'reselect';
import { RootState } from '../index';
import { CalendarObjectType, CalendarEvent, CalendarEventDefault, EventAddEditModalType } from './models';
import { selectModalStateByType } from '@store/session/selectors';
import { ModalState } from '@store/session/models';

export const selectCalendars = createSelector(
  (state: RootState) => state?.calendarService?.calendars,
  (calendars: CalendarObjectType) => {
    return calendars;
  }
);

export const selectEventsById = createSelector(
  (state: RootState) => state?.calendarService?.selectedCalendarEvents,
  (_, id: number) => id,
  (events: CalendarEvent[], id) => {
    return events.find((e) => e.id === id);
  }
);

export const selectAddModalEvent = createSelector(
  selectModalStateByType(EventAddEditModalType),
  (state) => state,
  (modal: ModalState, state) => {
    if (!modal.isOpen) return null;

    if (modal.id) {
      return selectEventsById(state, Number(modal.id));
    }

    return CalendarEventDefault;
  }
);

export const selectSelectedCalendarEvents = createSelector(
  (state: RootState) => state?.calendarService?.selectedCalendarEvents,
  (events: CalendarEvent[]) => {
    return events;
  }
);
