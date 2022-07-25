export enum DayOfWeek {
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
  Sunday = 7,
}

export interface CalendarDate {
  id: number;
  date: Date;
  dayOfWeek: DayOfWeek;
  isWeekend: boolean;
  isHoliday: boolean;
  isBusinessDay: boolean;
  holiday: string;
  isInLieuOfDay: boolean;
}

export interface CalendarDateCriteria {
  max?: Date;
  min?: Date;
  isWeekend?: boolean;
  isHoliday?: boolean;
  isBusinessDay?: boolean;
  isInLieuOfDay?: boolean;
}
