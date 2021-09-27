import { Attendee } from '../calendar';

export interface DateRecord {
  id: number;
  date_value: Date;
  day_of_week: number;
  is_weekend: boolean;
  is_holiday: boolean;
  is_business_day: boolean;
  holiday: string;
}

export interface EventRecord {
  tenant: string;
  calendar: string;
  id: number;
  name: string;
  description: string;
  is_public: boolean;
  is_all_day: boolean;
  start_date: number;
  start_time: number;
  end_date: number;
  end_time: number;
}

export interface AttendeeRecord extends Attendee {
  tenant: string;
  event_id: number;
}
