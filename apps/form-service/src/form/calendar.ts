import { FormDefinitionEntity } from './model';
import { Intake } from './types';

export const INTAKE_CALENDAR_NAME = 'form-intake';

export interface CalendarService {
  getScheduledIntake(definition: FormDefinitionEntity): Promise<Intake>;
}
