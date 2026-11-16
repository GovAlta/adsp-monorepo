import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { StartEndDateEditor } from './startEndDateEditor';

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({ useDispatch: () => mockDispatch }));
jest.mock(
  '@store/calendar/actions',
  () => ({
    CreateEventsByCalendar: jest.fn((calendar, event) => ({ type: 'create', calendar, event })),
    UpdateEventsByCalendar: jest.fn((calendar, id, event) => ({ type: 'update', calendar, id, event })),
    DeleteCalendarEvent: jest.fn((id, calendar) => ({ type: 'delete', id, calendar })),
  }),
  { virtual: true },
);
jest.mock('@store/calendar/models', () => ({}), { virtual: true });
jest.mock(
  '@lib/timeUtil',
  () => jest.requireActual('../../../../../apps/tenant-management-webapp/src/app/lib/timeUtil'),
  { virtual: true },
);

const byTestId = (container: HTMLElement, testId: string) => container.querySelector(`[testid="${testId}"]`) as Element;
const input = (container: HTMLElement, name: string) => byTestId(container, `calendar-event-modal-${name}-input`);
const button = (container: HTMLElement, text: string) =>
  Array.from(container.querySelectorAll('goa-button')).find((b) => b.textContent === text);
const change = (container: HTMLElement, name: string, value: string) =>
  fireEvent(input(container, name), new CustomEvent('_change', { detail: { value } }));
const click = (container: HTMLElement, text: string) =>
  fireEvent(button(container, text) as Element, new CustomEvent('_click'));

const newEvent = () => ({
  start: new Date(2026, 10, 16, 12, 0, 0).toISOString(),
  end: new Date(2026, 10, 16, 12, 0, 0).toISOString(),
});

const pickPeriod = (container: HTMLElement) => {
  change(container, 'start-date', '2026-11-20');
  change(container, 'start-time', '09:00:00');
  change(container, 'end-date', '2026-11-27');
  change(container, 'end-time', '17:00:00');
};

describe('StartEndDateEditor', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
  });

  it('shows the local start and end dates and times of the event', () => {
    const { container } = render(<StartEndDateEditor event={newEvent()} newEvent closeIntake={jest.fn()} />);

    expect(input(container, 'start-date').getAttribute('value')).toBe('2026-11-16');
    expect(input(container, 'end-date').getAttribute('value')).toBe('2026-11-16');
    expect(input(container, 'start-time').getAttribute('value')).toBe('12:00:00');
  });

  it('creates a new intake event with the picked dates and times', () => {
    const closeIntake = jest.fn();
    const event = newEvent();
    const { container } = render(
      <StartEndDateEditor event={event} formId="my-form" newEvent closeIntake={closeIntake} />,
    );

    pickPeriod(container);
    click(container, 'Save');

    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'create', calendar: 'form-intake' }));
    expect(new Date(event.start)).toEqual(new Date(2026, 10, 20, 9, 0, 0));
    expect(new Date(event.end)).toEqual(new Date(2026, 10, 27, 17, 0, 0));
    expect(event).toMatchObject({ recordId: 'my-form', name: expect.stringMatching(/^my-form-\d+$/) });
    expect(closeIntake).toHaveBeenCalled();
  });

  it('updates an existing intake event', () => {
    const event = { ...newEvent(), id: 5 };
    const { container } = render(
      <StartEndDateEditor event={event} formId="my-form" newEvent closeIntake={jest.fn()} />,
    );

    pickPeriod(container);
    click(container, 'Save');

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'update', calendar: 'form-intake', id: '5' }),
    );
    expect(new Date(event.start)).toEqual(new Date(2026, 10, 20, 9, 0, 0));
  });

  it('shows an error and does not save when the end is before the start', () => {
    const closeIntake = jest.fn();
    const { container } = render(<StartEndDateEditor event={newEvent()} newEvent closeIntake={closeIntake} />);

    change(container, 'start-date', '2026-11-20');
    change(container, 'end-date', '2026-11-19');
    click(container, 'Save');

    expect((container.querySelector('goa-form-item[label="End date"]') as Element).getAttribute('error')).toBe(
      'End of event must be after start of event.',
    );
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(closeIntake).not.toHaveBeenCalled();
  });

  it('closes without saving on cancel', () => {
    const closeIntake = jest.fn();
    const { container } = render(<StartEndDateEditor event={newEvent()} newEvent closeIntake={closeIntake} />);

    click(container, 'Cancel');

    expect(closeIntake).toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('starts read only for a saved event and becomes editable on edit', () => {
    const { container } = render(
      <StartEndDateEditor event={{ ...newEvent(), id: 5 }} newEvent={false} closeIntake={jest.fn()} />,
    );

    expect(button(container, 'Save')).toBeUndefined();

    click(container, 'Edit');

    expect(button(container, 'Save')).toBeDefined();
  });

  it('deletes the event after confirmation, and can back out', () => {
    const { container } = render(
      <StartEndDateEditor event={{ ...newEvent(), id: 5 }} newEvent={false} closeIntake={jest.fn()} />,
    );

    click(container, 'Delete');
    click(container, 'Cancel');
    expect(button(container, 'Confirm Delete')).toBeUndefined();

    click(container, 'Delete');
    click(container, 'Confirm Delete');

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'delete', id: '5', calendar: 'form-intake' });
  });
});
