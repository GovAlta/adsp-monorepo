export interface Calendar {
  name: string;
  displayName: string;
  description: string;
  updateRoles: string[];
  readRoles: string[];
}

export type CalendarDefinition = Omit<Calendar, 'description'> & { description?: string };
export type CalendarDefinitionSource = 'tenant' | 'core';
export type CalendarDefinitionsConfiguration = Record<string, CalendarDefinition>;
