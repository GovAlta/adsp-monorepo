export interface Intake {
  name: string;
  description: string;
  start: Date;
  end?: Date;
  isAllDay: boolean;
  isUpcoming: boolean;
}
