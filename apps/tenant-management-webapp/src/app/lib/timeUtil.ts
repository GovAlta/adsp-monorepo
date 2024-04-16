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

export const getDateTime = (date, time) => {
  const newDate = new Date(date);
  const combinedDateTime = new Date(
    newDate.getMonth() + 1 + '/' + newDate.getDate() + '/' + newDate.getFullYear() + ' ' + time
  );
  return combinedDateTime;
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
