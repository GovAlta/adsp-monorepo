import { useCallback, useMemo, useRef, useState } from 'react';
// FullCalendar's core relies on the Temporal API; polyfill it for environments without native support.
import 'temporal-polyfill/global';
import FullCalendar from '@fullcalendar/react';
import type { CalendarRef, EventInput } from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import listPlugin from '@fullcalendar/react/list';
import classicThemePlugin from '@fullcalendar/react/themes/classic';
import '@fullcalendar/react/skeleton.css';
import '@fullcalendar/react/themes/classic/theme.css';
import { GoabButton } from '@abgov/react-components';
import type {
  AdspComponentThemeOverrides,
  CalendarView,
  DateRange,
  ICalendarClient,
} from '@abgov/adsp-components-core';
import { useAdspThemeStyle } from '../theme/adsp-theme-provider';
import { useCalendarEvents } from './useCalendarEvents';

// Maps the public, framework-independent CalendarView to FullCalendar's own view names.
const FULL_CALENDAR_VIEW: Record<CalendarView, string> = {
  month: 'dayGridMonth',
  week: 'timeGridWeek',
  day: 'timeGridDay',
  list: 'listWeek',
};

const VIEW_BUTTON_LABEL: Record<string, string> = {
  dayGridMonth: 'Month',
  timeGridWeek: 'Week',
  timeGridDay: 'Day',
  listWeek: 'List',
};

// Views a calendar component can display; kept framework-independent so React, Angular and Vue adapters share it.
//export type CalendarView = 'month' | 'week' | 'day' | 'list';
export interface AdspGoACalendarProps {
  /** Loads events and holidays for the calendar; create it once or memoize it so it's stable across renders. */
  client: ICalendarClient;

  /**
   * The calendar name
   */
  calendar: string;

  /**
   * The default view we want to display
   */
  defaultView?: CalendarView;

  themeOverrides?: AdspComponentThemeOverrides<'calendar'>;

  /** The date range to open the calendar on; events load for the range FullCalendar then displays. */
  initialDateRange?: DateRange;

  /**
   * The test id for calendar component
   */
  testId?: string;
}

export const AdspGoACalendar = ({
  client,
  calendar,
  defaultView = 'month',
  initialDateRange,
  themeOverrides,
  testId,
}: AdspGoACalendarProps) => {
  const themeStyle = useAdspThemeStyle('calendar', themeOverrides);

  // The first fetch waits for FullCalendar to report its visible range via datesSet, so it loads once.
  const [range, setRange] = useState<DateRange>();
  const calendarRef = useRef<CalendarRef>(null);
  const [currentView, setCurrentView] = useState(FULL_CALENDAR_VIEW[defaultView]);

  const { calendarEvents } = useCalendarEvents(client, calendar, range);
  // FullCalendar calls this on every render of the view, including when the range hasn't actually changed; only
  // update state when it has, so the client isn't asked to reload the same range repeatedly.
  const handleDatesSet = useCallback((info: { start: Date; end: Date; view: { type: string } }) => {
    setRange((current) =>
      current?.start?.getTime() === info.start.getTime() && current?.end?.getTime() === info.end.getTime()
        ? current
        : { start: info.start, end: info.end },
    );
    setCurrentView(info.view.type);
  }, []);

  const events = useMemo<EventInput[]>(() => {
    if (!calendarEvents) {
      return [];
    }

    const eventInputs: EventInput[] = calendarEvents.events.map((event) => ({
      id: `event-${event.id}`,
      title: event.name,
      start: event.start,
      end: event.end ?? undefined,
      allDay: event.isAllDay,
      editable: false,
    }));

    // Holidays display as non-editable background events, identified by day since they have no numeric id.
    const holidayInputs: EventInput[] = calendarEvents.holidays.map((holiday) => ({
      id: `holiday-${holiday.day}`,
      title: holiday.name,
      start: holiday.day,
      allDay: true,
      display: 'background',
      editable: false,
    }));

    return [...eventInputs, ...holidayInputs];
  }, [calendarEvents]);

  // The names used in headerToolbar must match keys here, or FullCalendar falls back to its own button rendering.
  const toolbarElements = useMemo(() => {
    const getApi = () => calendarRef.current?.getApi();
    const viewButton = (viewName: string) => (
      <GoabButton
        mr="xs"
        key={viewName}
        size="compact"
        type={currentView === viewName ? 'primary' : 'secondary'}
        onClick={() => getApi()?.changeView(viewName)}
      >
        {VIEW_BUTTON_LABEL[viewName]}
      </GoabButton>
    );

    return {
      prev: (
        <GoabButton size="compact" type="secondary" onClick={() => getApi()?.prev()} mr="s">
          Previous
        </GoabButton>
      ),
      next: (
        <GoabButton size="compact" type="secondary" onClick={() => getApi()?.next()} mr="s">
          Next
        </GoabButton>
      ),
      today: (
        <GoabButton size="compact" type="secondary" onClick={() => getApi()?.today()}>
          Today
        </GoabButton>
      ),

      dayGridMonth: viewButton('dayGridMonth'),
      timeGridWeek: viewButton('timeGridWeek'),
      timeGridDay: viewButton('timeGridDay'),
      listWeek: viewButton('listWeek'),
    };
  }, [currentView]);

  return (
    <div className="adsp-calendar" style={themeStyle} data-testid={testId}>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, classicThemePlugin]}
        initialView={FULL_CALENDAR_VIEW[defaultView]}
        initialDate={initialDateRange?.start}
        headerToolbar={{
          left: 'prev,next,today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
        }}
        toolbarElements={toolbarElements}
        events={events}
        datesSet={handleDatesSet}
      />
    </div>
  );
};
