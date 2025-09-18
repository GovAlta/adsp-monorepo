import { createSelector } from 'reselect';
import { RootState } from '../index';
import { CalendarObjectType, CalendarEventDefault, EventAddEditModalType, EventDeleteModalType } from './models';
import { selectModalStateByType } from '@store/session/selectors';
import { ModalState } from '@store/session/models';
import { defaultCalendar } from '@store/calendar/models';

export const selectCalendars = createSelector(
  (state: RootState) => ({
    ...state?.calendarService?.calendars,
    ...state?.calendarService?.coreCalendars,
  }),
  (calendars: CalendarObjectType) => calendars
);

export const selectCoreCalendars = createSelector(
  (state: RootState) => state?.calendarService.coreCalendars,
  (calendars: CalendarObjectType) => {
    return calendars;
  }
);

export const selectCalendarsByName = createSelector(
  selectCalendars,
  (_, name: string | undefined) => name,
  (calendars, name) => {
    if (name === undefined || calendars === null) {
      return defaultCalendar;
    } else {
      return Object.entries(calendars)
        .map((e) => e[1])
        .find((c) => c.name === name);
    }
  }
);

export const selectEventById = createSelector(
  (state: RootState) => state,
  selectModalStateByType(EventAddEditModalType),
  (_, calendarName: string) => calendarName,
  (state, modal: ModalState, calendarName) => {
    return selectSelectedCalendarEvents(state, calendarName)?.find((e) => `${e.id}` === modal.id);
  }
);

export const selectDeleteEventById = createSelector(
  (state: RootState) => state,
  selectModalStateByType(EventDeleteModalType),
  (_, calendarName: string) => calendarName,
  (state, modal: ModalState, calendarName) => {
    if (modal && modal?.id) {
      return selectSelectedCalendarEvents(state, calendarName)?.find((e) => `${e.id}` === modal.id);
    }
    return null;
  }
);

export const selectIsOpenAddEditModal = createSelector(
  selectModalStateByType(EventAddEditModalType),
  (modal: ModalState) => {
    return modal && modal?.isOpen === true;
  }
);

export const selectAddModalEvent = createSelector(
  (state) => state,
  selectModalStateByType(EventAddEditModalType),
  (_, calendarName: string) => calendarName,
  (state, modal: ModalState, calendarName: string) => {
    if (!modal.isOpen) return null;
    if (modal.id) {
      return selectEventById(state, calendarName);
    }
    return CalendarEventDefault;
  }
);

export const selectSelectedCalendarEvents = createSelector(
  (state: RootState) => state,
  (_, calendarName: string) => calendarName,
  selectModalStateByType(EventAddEditModalType),
  (state, calendarName: string) => {
    return (
      calendarName &&
      selectCalendarsByName(state, calendarName)?.selectedCalendarEvents?.sort((a, b) => {
        return new Date(b.start).valueOf() - new Date(a.start).valueOf();
      })
    );
  }
);

export const selectSelectedCalendarNextEvents = createSelector(
  (state: RootState) => state,
  (_, calendarName: string) => calendarName,
  selectModalStateByType(EventAddEditModalType),
  (state, calendarName: string) => {
    return selectCalendarsByName(state, calendarName)?.nextEvents;
  }
);

export const selectSelectedCalendarEventNames = createSelector(
  (state: RootState) => state,
  (_, calendarName: string) => calendarName,
  (state, calendarName: string) => {
    if (calendarName) {
      const events = selectSelectedCalendarEvents(state, calendarName);
      if (events && events?.length > 0) {
        return events.map((e) => e?.name);
      }
      return [];
    }
    return [];
  }
);
