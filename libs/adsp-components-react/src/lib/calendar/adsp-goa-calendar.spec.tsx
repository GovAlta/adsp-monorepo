import { render, screen, waitFor } from '@testing-library/react';
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
});
