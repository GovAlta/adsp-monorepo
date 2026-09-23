import { CALENDAR_INIT, CalendarItem } from './models';
import { selectCalendarForAdministration } from './selectors';

const tenantCalendar: CalendarItem = {
  name: 'shared',
  displayName: 'Tenant calendar',
  readRoles: [],
  updateRoles: [],
};
const coreCalendar: CalendarItem = { ...tenantCalendar, displayName: 'Core calendar' };
const state = {
  calendarService: {
    ...CALENDAR_INIT,
    calendars: { shared: tenantCalendar },
    coreCalendars: { shared: coreCalendar },
  },
};

describe('selectCalendarForAdministration', () => {
  it('loads the editable tenant definition when its name overlaps with a core definition', () => {
    expect(selectCalendarForAdministration(state, 'shared', true)).toBe(tenantCalendar);
  });

  it('loads the view-only core definition when its name overlaps with a tenant definition', () => {
    expect(selectCalendarForAdministration(state, 'shared', false)).toBe(coreCalendar);
  });
});
