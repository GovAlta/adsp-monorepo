import { createSelector } from 'reselect';
import { RootState } from '@store/index';
import { EventDefinition } from '@store/event/models';

export const selectEventDefinitions = createSelector(
  (state: RootState) => state.event,
  (event) => event?.definitions
);

export const selectFilteredEventDefinitions = createSelector(
  [selectEventDefinitions],
  (eventDefinitions): Record<string, EventDefinition> =>
    Object.entries(eventDefinitions).reduce((acc, [key, eventDef]) => {
      if (!eventDef.isCore) {
        acc[key] = eventDef;
      }
      return acc;
    }, {} as Record<string, EventDefinition>)
);

// The events defined outside of ADSP monorepo.
export const externalEventSuggestionList = [
  'access-service:REGISTER',
  'access-service:VERIFY_EMAIL',
  'access-service:LOGIN',
  'access-service:LOGOUT',
  'access-service:CREATE-CLIENT_ROLE',
  'access-service:CREATE-CLIENT_ROLE_MAPPING',
  'access-service:CREATE-GROUP',
  'access-service:CREATE-GROUP_MEMBERSHIP',
  'access-service:CREATE-REALM_ROLE_MAPPING',
  'access-service:CREATE-CREATE-USER',
  'access-service:CREATE-USER',
  'access-service:UPDATE-CLIENT_ROLE',
  'access-service:UPDATE-USER',
  'access-service:DELETE-USER',
  'access-service:DELETE-REALM_ROLE_MAPPING',
  'access-service:DELETE-REALM_ROLE',
  'access-service:DELETE-GROUP',
  'access-service:DELETE-CLIENT_ROLE',
];
