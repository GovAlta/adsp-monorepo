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
