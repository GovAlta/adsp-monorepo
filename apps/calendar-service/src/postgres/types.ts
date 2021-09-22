export interface DateRecord {
  id: number;
  date_value: Date;
  day_of_week: number;
  is_weekend: boolean;
  is_holiday: boolean;
  is_business_day: boolean;
  holiday: string;
}
