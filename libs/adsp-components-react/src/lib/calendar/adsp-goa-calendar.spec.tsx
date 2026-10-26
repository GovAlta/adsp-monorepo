import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { CalendarEvents, ICalendarClient } from '@abgov/adsp-components-core';
import { AdspGoACalendar } from './adsp-goa-calendar';

// Within the current month, so it's visible in the default dayGridMonth view without a fixed initialDate.
const today = new Date();
const eventDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-15`;

const calendarEvents: CalendarEvents = {
  events: [
    {
      id: 1,
      name: 'Annual review',
      start: new Date(`${eventDay}T15:00:00Z`),
      end: null,
      isAllDay: false,
      isPublic: true,
    },
  ],
  holidays: [
    {
      date: new Date(`${eventDay}T06:00:00Z`),
      day: eventDay,
      name: 'Victoria Day',
      isInLieuOfDay: false,
    },
  ],
};

const createClient = (getCalendarRange: ICalendarClient['getCalendarRange'] = jest.fn()): ICalendarClient => ({
  getCalendarRange,
});

const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

const recurringEvents: CalendarEvents = {
  events: [
    {
      id: 2,
      name: 'Weekly standup',
      start: new Date(`${monthStart}T15:00:00Z`),
      end: null,
      isAllDay: false,
      isPublic: true,
      recurrence: { frequency: 'weekly', interval: 1, end: { until: '2099-12-31' } },
    },
  ],
  holidays: [],
};

// The GoA button wrapper listens for the web component's custom `_click` event rather than a DOM click.
const clickGoabButton = (label: string) => fireEvent(screen.getByText(label), new CustomEvent('_click'));

describe('AdspGoACalendar', () => {
  test('renders a calendar for the given calendar name', async () => {
    // Arrange
    const client = createClient(jest.fn().mockResolvedValue(calendarEvents));

    // Act
    render(<AdspGoACalendar client={client} calendar="my-cal" testId="goa-calendar" />);

    // Assert
    await waitFor(() => expect(screen.getByTestId('goa-calendar')).toBeInTheDocument());
  });

  test('displays events once they are loaded', async () => {
    // Arrange
    const client = createClient(jest.fn().mockResolvedValue(calendarEvents));

    // Act
    render(<AdspGoACalendar client={client} calendar="my-cal" />);

    // Assert
    await waitFor(() => expect(screen.getByText('Annual review')).toBeInTheDocument());
  });

  test('displays holidays as background events', async () => {
    // Arrange
    const client = createClient(jest.fn().mockResolvedValue(calendarEvents));

    // Act
    render(<AdspGoACalendar client={client} calendar="my-cal" />);

    // Assert
    await waitFor(() => expect(screen.getByText('Victoria Day')).toBeInTheDocument());
  });

  test('requests the range visible in the given defaultView', async () => {
    // Arrange
    const getCalendarRange = jest.fn().mockResolvedValue(calendarEvents);
    const client = createClient(getCalendarRange);

    // Act
    render(<AdspGoACalendar client={client} calendar="my-cal" defaultView="day" />);

    // Assert
    await waitFor(() => expect(getCalendarRange).toHaveBeenCalled());
    expect(getCalendarRange).toHaveBeenCalledWith('my-cal', expect.objectContaining({ start: expect.any(Date) }));
  });

  test('applies the current theme to its root element', async () => {
    // Arrange
    const client = createClient(jest.fn().mockResolvedValue(calendarEvents));

    // Act
    render(<AdspGoACalendar client={client} calendar="my-cal" testId="goa-calendar" />);

    // Assert
    await waitFor(() =>
      expect(screen.getByTestId('goa-calendar').style.getPropertyValue('--adsp-color-surface-card')).toBe(
        'var(--goa-color-surface-card)',
      ),
    );
  });

  test('applies instance overrides to its own calendar token', async () => {
    // Arrange
    const client = createClient(jest.fn().mockResolvedValue(calendarEvents));

    // Act
    render(
      <AdspGoACalendar
        client={client}
        calendar="my-cal"
        testId="goa-calendar"
        themeOverrides={{ eventBackground: '#6a1b9a' }}
      />,
    );

    // Assert
    await waitFor(() =>
      expect(
        screen.getByTestId('goa-calendar').style.getPropertyValue('--adsp-components-calendar-event-background'),
      ).toBe('#6a1b9a'),
    );
  });

  test('displays recurring events', async () => {
    // Arrange
    const client = createClient(jest.fn().mockResolvedValue(recurringEvents));

    // Act
    render(<AdspGoACalendar client={client} calendar="my-cal" />);

    // Assert
    await waitFor(() => expect(screen.getAllByText('Weekly standup').length).toBeGreaterThan(0));
  });

  test('renders without events when the calendar has no events or holidays', async () => {
    // Arrange
    const getCalendarRange = jest.fn().mockResolvedValue({ events: [], holidays: [] });
    const client = createClient(getCalendarRange);

    // Act
    render(<AdspGoACalendar client={client} calendar="my-cal" testId="goa-calendar" />);

    // Assert
    await waitFor(() => expect(getCalendarRange).toHaveBeenCalled());
    expect(screen.getByTestId('goa-calendar')).toBeInTheDocument();
  });

  test('requests events for the given initialDateRange', async () => {
    // Arrange
    const getCalendarRange = jest.fn().mockResolvedValue({ events: [], holidays: [] });
    const client = createClient(getCalendarRange);
    const initialDateRange = { start: new Date('2024-03-01T00:00:00Z'), end: new Date('2024-04-01T00:00:00Z') };

    // Act
    render(<AdspGoACalendar client={client} calendar="my-cal" initialDateRange={initialDateRange} />);

    // Assert
    await waitFor(() => expect(getCalendarRange).toHaveBeenCalledWith('my-cal', initialDateRange));
  });

  test('opens on the month of the initialDateRange start', async () => {
    // Arrange
    const marchEvents: CalendarEvents = {
      events: [
        {
          id: 3,
          name: 'Budget planning',
          start: new Date('2024-03-10T15:00:00Z'),
          end: null,
          isAllDay: false,
          isPublic: true,
        },
      ],
      holidays: [],
    };
    const client = createClient(jest.fn().mockResolvedValue(marchEvents));
    const initialDateRange = { start: new Date('2024-03-01T00:00:00Z'), end: new Date('2024-04-01T00:00:00Z') };

    // Act
    render(<AdspGoACalendar client={client} calendar="my-cal" initialDateRange={initialDateRange} />);

    // Assert
    await waitFor(() => expect(screen.getByText('Budget planning')).toBeInTheDocument());
  });

  test.each(['Previous', 'Next', 'Today', 'Month', 'Week', 'Day', 'List'])(
    'renders the %s toolbar button',
    async (label) => {
      // Arrange
      const client = createClient(jest.fn().mockResolvedValue(calendarEvents));

      // Act
      render(<AdspGoACalendar client={client} calendar="my-cal" />);

      // Assert
      await waitFor(() => expect(screen.getByText(label)).toBeInTheDocument());
    },
  );

  test('marks the button of the default view as primary', async () => {
    // Arrange
    const client = createClient(jest.fn().mockResolvedValue(calendarEvents));

    // Act
    render(<AdspGoACalendar client={client} calendar="my-cal" defaultView="week" />);

    // Assert
    await waitFor(() => expect(screen.getByText('Week')).toHaveAttribute('type', 'primary'));
  });

  test('marks the button of the selected view as primary after switching views', async () => {
    // Arrange
    const client = createClient(jest.fn().mockResolvedValue(calendarEvents));
    render(<AdspGoACalendar client={client} calendar="my-cal" />);
    await waitFor(() => expect(screen.getByText('List')).toBeInTheDocument());

    // Act
    clickGoabButton('List');

    // Assert
    await waitFor(() => expect(screen.getByText('List')).toHaveAttribute('type', 'primary'));
  });

  test('marks the button of the previous view as secondary after switching views', async () => {
    // Arrange
    const client = createClient(jest.fn().mockResolvedValue(calendarEvents));
    render(<AdspGoACalendar client={client} calendar="my-cal" />);
    await waitFor(() => expect(screen.getByText('List')).toBeInTheDocument());

    // Act
    clickGoabButton('List');

    // Assert
    await waitFor(() => expect(screen.getByText('Month')).toHaveAttribute('type', 'secondary'));
  });

  test('does not reload the initial range when the calendar first reports its visible dates', async () => {
    // Arrange
    const getCalendarRange = jest.fn().mockResolvedValue(calendarEvents);
    const client = createClient(getCalendarRange);

    // Act
    render(<AdspGoACalendar client={client} calendar="my-cal" />);

    // Assert
    await waitFor(() => expect(screen.getByText('Annual review')).toBeInTheDocument());
    expect(getCalendarRange).toHaveBeenCalledTimes(1);
  });

  test.each(['Next', 'Previous', 'Today'])('requests the newly visible range when %s is clicked', async (label) => {
    // Arrange
    const getCalendarRange = jest.fn().mockResolvedValue(calendarEvents);
    const client = createClient(getCalendarRange);
    render(<AdspGoACalendar client={client} calendar="my-cal" />);
    await waitFor(() => expect(screen.getByText(label)).toBeInTheDocument());
    await waitFor(() => expect(getCalendarRange).toHaveBeenCalledTimes(1));

    // Act
    clickGoabButton(label);

    // Assert
    await waitFor(() => expect(getCalendarRange).toHaveBeenCalledTimes(2));
  });
});
