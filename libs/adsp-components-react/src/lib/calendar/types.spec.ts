import { FULL_CALENDAR_VIEW, VIEW_BUTTON_LABEL } from './types';

describe('calendar view maps', () => {
  test('maps each public view to a distinct FullCalendar view', () => {
    // Arrange, Act
    const views = Object.values(FULL_CALENDAR_VIEW);

    // Assert
    expect(FULL_CALENDAR_VIEW).toEqual({
      month: 'dayGridMonth',
      week: 'timeGridWeek',
      day: 'timeGridDay',
      list: 'listWeek',
    });
    expect(new Set(views).size).toBe(views.length);
  });

  test('has a button label for every FullCalendar view', () => {
    // Arrange, Act, Assert
    Object.values(FULL_CALENDAR_VIEW).forEach((view) => expect(VIEW_BUTTON_LABEL[view]).toBeTruthy());
  });
});
