import { Results } from '@core-services/core-common';
import { CalendarDate, CalendarDateCriteria } from '../types';

export interface CalendarRepository {
  getDate(id: number): Promise<CalendarDate>;
  getDates(top: number, after?: string, criteria?: CalendarDateCriteria): Promise<Results<CalendarDate>>;
}
