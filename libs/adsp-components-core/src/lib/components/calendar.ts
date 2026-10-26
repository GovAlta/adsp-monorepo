export interface AdspCalendarTheme {
  borderColor: string;
  todayBackground: string;
  eventBackground: string;
  eventTextColor: string;
  recurringEventBackground: string;
  recurringEventTextColor: string;
  holidayBackground: string;
  buttonBackground: string;
  buttonTextColor: string;
  buttonHoverBackground: string;
  todayBackgroundColor: string;
  todayTextColor: string;
  todayFontWeight: string;
}

export const defaultCalendarTheme: AdspCalendarTheme = {
  borderColor: 'var(--adsp-color-border-default)',
  todayBackground: 'var(--adsp-color-surface-card)',
  eventBackground: 'var(--adsp-color-interactive-default)',
  eventTextColor: 'var(--adsp-color-text-light)',
  recurringEventBackground: 'var(--adsp-color-interactive-default)',
  recurringEventTextColor: 'var(--adsp-color-text-light)',
  holidayBackground: 'var(--adsp-color-status-important)',
  buttonBackground: 'var(--adsp-color-interactive-default)',
  buttonTextColor: 'var(--adsp-color-text-light)',
  buttonHoverBackground: 'var(--adsp-color-interactive-hover)',
  todayBackgroundColor: 'var(--adsp-color-interactive-focus)',
  todayTextColor: 'var(--adsp-color-text-light)',
  todayFontWeight: 'var(--adsp-typography-heading-l-font-weight)',
};
