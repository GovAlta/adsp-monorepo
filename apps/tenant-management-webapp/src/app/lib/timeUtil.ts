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
