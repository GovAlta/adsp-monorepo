export const FormatTimeWithDateAt = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    year: 'numeric',
  };

  const timeParts = new Date(date).toLocaleString('en-US', options).split(',');
  const localTime = `${timeParts[0]}, ${timeParts[1]}, ${timeParts[2]} at ${timeParts[3].toLowerCase()}`;
  return localTime;
};

export const FormatTimeWithAt = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    year: 'numeric',
  };

  const timeParts = new Date(date).toLocaleString('en-US', options).split(',');
  const localTime = `${timeParts[0]}, ${timeParts[1]} at ${timeParts[2].toLowerCase()}`;
  return localTime;
};

export const getTimeFromGMT = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Pad single digits with leading zeros
  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');

  // Combine hours and minutes in HH:MM format
  return `${formattedHours}:${formattedMinutes}`;
};

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

// The Date constructor maps years 0 to 99 onto 1900 to 1999, so a year still being typed into a date
// input arrives in the wrong century: 0020 becomes 1920. Set the year explicitly to keep it as entered.
const localDate = (year: number, month: number, day: number, hours = 0, minutes = 0, seconds = 0): Date => {
  const date = new Date(year, month, day, hours, minutes, seconds);
  date.setFullYear(year);
  return date;
};

// The Date constructor reads a date only string (yyyy-mm-dd) as UTC midnight, which lands on the previous
// day in negative offset timezones like Alberta's; parse the parts so the date stays the one that was entered.
export const parseLocalDate = (date: string | Date): Date => {
  if (date instanceof Date) {
    return date;
  }

  const parts = DATE_ONLY_PATTERN.exec((date || '').trim());
  if (!parts) {
    return new Date(date);
  }

  const [, year, month, day] = parts;
  return localDate(Number(year), Number(month) - 1, Number(day));
};

// Value for a date input, using the local date so it matches what the user sees in the rest of the form.
// The year is padded to four digits because a date input rejects anything else, and a rejected value
// wipes out the year the user is part way through typing.
export const toDateInputValue = (date: Date): string => {
  if (!date || isNaN(date.getTime())) {
    return '';
  }

  return `${padYear(date.getFullYear())}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())}`;
};

export const getDateTime = (date: string | Date, time: string): Date => {
  const newDate = parseLocalDate(date);
  const [hours, minutes, seconds] = (time || '').split(':').map(Number);
  return localDate(
    newDate.getFullYear(),
    newDate.getMonth(),
    newDate.getDate(),
    hours || 0,
    minutes || 0,
    seconds || 0
  );
};

export const getLocalISOString = (date: Date): string => {
  const offset = date.getTimezoneOffset() * 60000; // offset in milliseconds
  const localISOTime = new Date(date.getTime() - offset).toISOString();
  return localISOTime.slice(0, -1) + getTimezoneOffsetString(date);
};

const getTimezoneOffsetString = (date: Date): string => {
  const offset = date.getTimezoneOffset();
  const offsetHours = Math.abs(Math.floor(offset / 60));
  const offsetMinutes = Math.abs(offset % 60);
  const sign = offset > 0 ? '-' : '+';
  return `${sign}${padZero(offsetHours)}:${padZero(offsetMinutes)}`;
};

const padZero = (num: number): string => (num < 10 ? `0${num}` : `${num}`);

const padYear = (year: number): string => `${year}`.padStart(4, '0');
