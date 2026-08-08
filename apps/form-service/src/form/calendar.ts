import { FormDefinitionEntity } from './model';
import { Intake } from './types';

export const INTAKE_CALENDAR_NAME = 'form-intake';

export interface CalendarService {
  getScheduledIntake(definition: FormDefinitionEntity, token?: string): Promise<Intake>;
  updateScheduleIntake(
    tenantId: string,
    intakeParameters: {
      name: string;
      calendarEventId: string;
      start: Date;
      end: Date;
    },
    token?: string,
  ): Promise<Intake>;
}
