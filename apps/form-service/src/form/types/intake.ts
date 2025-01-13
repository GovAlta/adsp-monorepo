export interface Intake {
  urn: string;
  name: string;
  description: string;
  start: Date;
  end?: Date;
  isAllDay: boolean;
  isUpcoming: boolean;
}
