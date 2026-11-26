export enum DayOfWeek {
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
  Sunday = 7,
}

/**
 * general: Alberta general (statutory) holiday.
 * optional: Alberta optional general holiday; employers choose whether to observe it.
 * staff: Government of Alberta staff holiday that isn't a public holiday, such as the Christmas closure.
 */
export const HolidayTypes = ['general', 'optional', 'staff'] as const;
export type HolidayType = (typeof HolidayTypes)[number];

export interface CalendarDate {
  id: number;
  date: Date;
  dayOfWeek: DayOfWeek;
  isWeekend: boolean;
  /** Government of Alberta offices are closed for the holiday. */
  isHoliday: boolean;
  isBusinessDay: boolean;
  holiday: string;
  holidayType: HolidayType;
  isInLieuOfDay: boolean;
}

export interface CalendarDateCriteria {
  max?: Date;
  min?: Date;
  isWeekend?: boolean;
  isHoliday?: boolean;
  isBusinessDay?: boolean;
  isInLieuOfDay?: boolean;
  holidayType?: HolidayType | HolidayType[];
}
