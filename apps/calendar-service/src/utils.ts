import { InvalidOperationError } from '@core-services/core-common';
import { DateTime } from 'luxon';
import { environment } from './environments/environment';

const { TIME_ZONE } = environment;
export function toDateId(value?: DateTime, zone = TIME_ZONE): number {
  if (value && !value.isValid) {
    throw new InvalidOperationError(`Provided datetime value is invalid: ${value.invalidExplanation}`);
  }

  const abDateTime = value ? value.setZone(zone) : null;
  return abDateTime ? parseInt(abDateTime.toFormat('yyyyLLdd')) : null;
}

export function toTimeId(value?: DateTime, zone = TIME_ZONE): number {
  if (value && !value.isValid) {
    throw new InvalidOperationError(`Provided datetime value is invalid: ${value.invalidExplanation}`);
  }

  const abDateTime = value ? value.setZone(zone) : null;
  return abDateTime ? parseInt(abDateTime.toFormat('HHmm')) : null;
}

export function fromDateAndTimeIds(dateId: number, timeId: number, zone = TIME_ZONE): DateTime {
  const dateIdDigits = dateId ? dateId.toString() : null;
  const timeIdDigits = timeId
    ? timeId.toLocaleString('en', {
        minimumIntegerDigits: 4,
        useGrouping: false,
      })
    : '0000';
  return dateIdDigits
    ? DateTime.fromISO(
        `${dateIdDigits.substr(0, 4)}-${dateIdDigits.substr(4, 2)}-${dateIdDigits.substr(6, 2)}` +
          `T${timeIdDigits.substr(0, 2)}:${timeIdDigits.substr(2, 2)}:00`,
        { zone }
      )
    : null;
}
