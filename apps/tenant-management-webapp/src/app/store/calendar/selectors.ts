import { createSelector } from 'reselect';
import { RootState } from '../index';
import { CalendarObjectType, CalendarEventDefault, EventAddEditModalType, EventDeleteModalType } from './models';
import { selectModalStateByType } from '@store/session/selectors';
import { ModalState } from '@store/session/models';

export const selectCalendars = createSelector(
  (state: RootState) => state?.calendarService?.calendars,
  (calendars: CalendarObjectType) => {
    return calendars;
  }
);

export const selectCalendarsById = createSelector(
  selectCalendars,
  (_, name: string) => name,
  (calendars, name) => {
    return Object.entries(calendars)
      .map((e) => e[1])
      .find((c) => c.name === name);
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
    return selectCalendarsById(state, calendarName)?.selectedCalendarEvents;
  }
);

export const selectSelectedCalendarHasMoreEvents = createSelector(
  (state: RootState) => state,
  (_, calendarName: string) => calendarName,
  selectModalStateByType(EventAddEditModalType),
  (state, calendarName: string) => {
    return selectCalendarsById(state, calendarName)?.hasMore === true;
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
