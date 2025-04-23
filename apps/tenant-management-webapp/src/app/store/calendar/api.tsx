import axios from 'axios';
import { CalendarItem } from './models';

export const fetchCalendarApi = async (token: string, url: string): Promise<Record<string, CalendarItem>> => {
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
