import { EventDefinition } from '@store/event/models';
import { SubscriberRolesOptions } from '@store/stream/models';
import { Role } from '@store/tenant/models';

export const generateSubscriberRolesOptions = (realmRoles: Role[]): SubscriberRolesOptions[] => {
  const dropDownOptions = [
    {
      value: 'anonymousRead',
      label: 'Anyone (Anonymous)',
      key: 'anonymous',
      dataTestId: 'anonymous-option',
    },
  ];

  if (realmRoles) {
    let defaultDropDowns = [];

    defaultDropDowns = realmRoles.map((realmRole) => {
      return {
        value: realmRole.name,
        label: realmRole.name,
        key: realmRole.id,
        dataTestId: `${realmRole}-update-roles-options`,
      };
    });
    return dropDownOptions.concat(defaultDropDowns);
  }
};

export const generateEventOptions = (eventDefinitions: Record<string, EventDefinition>) => {
  return Object.keys(eventDefinitions).map((eventKey, index) => {
    return {
      name: eventDefinitions[eventKey].name,
      value: `${eventDefinitions[eventKey].namespace}:${eventDefinitions[eventKey].name}`,
      nameSpace: eventDefinitions[eventKey].namespace,
      label: `${eventDefinitions[eventKey].namespace}:${eventDefinitions[eventKey].name}`,
      key: index,
      dataTestId: `${eventDefinitions[eventKey].name}-update-roles-options`,
    };
  });
};
