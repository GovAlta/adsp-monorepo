import axios from 'axios';
import { CalendarDefinition, CalendarObjectType } from './models';

const isCalendarDefinition = (value: unknown): value is CalendarDefinition =>
  typeof value === 'object' &&
  value !== null &&
  'name' in value &&
  typeof value.name === 'string' &&
  value.name.length > 0 &&
  'urn' in value &&
  typeof value.urn === 'string' &&
  'source' in value &&
  (value.source === 'tenant' || value.source === 'core') &&
  'readRoles' in value &&
  Array.isArray(value.readRoles) &&
  value.readRoles.every((role: unknown) => typeof role === 'string') &&
  'updateRoles' in value &&
  Array.isArray(value.updateRoles) &&
  value.updateRoles.every((role: unknown) => typeof role === 'string') &&
  (!('displayName' in value) || typeof value.displayName === 'string') &&
  (!('description' in value) || typeof value.description === 'string');

export const fetchCalendarApi = async (token: string, url: string): Promise<CalendarDefinition[]> => {
  const res = await axios.get<CalendarDefinition[]>(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const partitionCalendars = (
  definitions: unknown
): { tenant: CalendarObjectType; core: CalendarObjectType } => {
  if (!Array.isArray(definitions)) {
    throw new Error('Calendar service returned an invalid list of definitions.');
  }

  const entries: { tenant: [string, CalendarDefinition][]; core: [string, CalendarDefinition][] } = {
    tenant: [],
    core: [],
  };
  for (const definition of definitions) {
    if (!isCalendarDefinition(definition)) {
      throw new Error('Calendar service returned an invalid definition.');
    }
    entries[definition.source].push([definition.name, definition]);
  }

  return {
    tenant: Object.fromEntries(entries.tenant),
    core: Object.fromEntries(entries.core),
  };
};
