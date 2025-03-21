export const standardizeDate = (date: Date | string): string | undefined => {
  try {
    const stdDate = new Date(date).toISOString().substring(0, 10);
    return stdDate;
  } catch (e) {
    return undefined;
  }
};

export const to12HourFormat = (time24: string): string => {
  return UTCToFullLocalTime('2025-03-22 ' + time24, true).slice(-11);
};

export const UTCToFullLocalTime = (fullTime: string, useUTC = false): string => {
  return new Date(fullTime)
    .toLocaleString('en-CA', {
      hour12: true,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      second: 'numeric',
      minute: 'numeric',
      timeZone: useUTC ? undefined : 'America/Edmonton',
    })
    .replace('p.m.', 'PM')
    .replace('a.m.', 'AM');
};
