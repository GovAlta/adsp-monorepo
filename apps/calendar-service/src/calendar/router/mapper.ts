import { AdspId } from '@abgov/adsp-service-sdk';
import { CalendarDefinition, CalendarDefinitionSource } from '../types';

export function mapCalendar(apiId: AdspId, calendar: CalendarDefinition, source?: CalendarDefinitionSource) {
  return {
    urn: `${apiId}:/calendars/${calendar.name}`,
    name: calendar.name,
    displayName: calendar.displayName,
    description: calendar.description,
    readRoles: calendar.readRoles || [],
    updateRoles: calendar.updateRoles || [],
    ...(source ? { source } : {}),
  };
}
