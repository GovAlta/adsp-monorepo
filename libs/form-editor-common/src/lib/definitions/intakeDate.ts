import { getDateTime, toDateInputValue } from '@lib/timeUtil';

// Date inputs give a local calendar day ('YYYY-MM-DD'); build the instant in local time so saving keeps the picked day.
export const setTimeString = (date: string, time?: string): string => getDateTime(date, time).toISOString();

export const toInputDate = (value?: string): string => toDateInputValue(value ? new Date(value) : new Date());
