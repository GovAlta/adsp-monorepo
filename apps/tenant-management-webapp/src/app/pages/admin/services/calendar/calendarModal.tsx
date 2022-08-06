import React, { useState } from 'react';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAButton } from '@abgov/react-components';
import { GoAForm, GoAFormItem, GoAInput } from '@abgov/react-components/experimental';
import { CalendarItem } from '@store/calendar/models';
import { useDispatch, useSelector } from 'react-redux';
import { CreateCalendar, UpdateCalendar } from '@store/calendar/actions';
import { RootState } from '@store/index';
import { Role } from '@store/tenant/models';
import { createSelector } from 'reselect';
import { ClientRoleTable } from '@components/ClientRoleTable';
import { ConfigServiceRole } from '@store/access/models';
import styled from 'styled-components';
import { useValidators } from '@lib/useValidators';

import { characterCheck, validationPattern, isNotEmptyCheck, Validator } from '@lib/checkInput';
interface CalendarModalProps {
  calendar?: CalendarItem;
  type: string;
  onCancel?: () => void;
  open: boolean;
  roles: Role[];
  calendarNames?: string[];
}

export const CalendarModal = (props: CalendarModalProps): JSX.Element => {
  const isNew = props.type === 'new';

  const [calendar, setCalendar] = useState(props.calendar);

  const title = isNew || open ? 'Add calendar' : 'Edit calendar';

  const selectServiceKeycloakRoles = createSelector(
    (state: RootState) => state.serviceRoles,
    (serviceRoles) => {
      return serviceRoles?.keycloak || {};
    }
  );
  const checkForBadChars = characterCheck(validationPattern.mixedKebabCase);
  const duplicateCalendarCheck = (names: string[]): Validator => {
    return (name: string) => {
      return names.includes(name) ? `Duplicated file type name ${name}.` : '';
    };
  };

  const { errors, validators } = useValidators('name', 'name', checkForBadChars, isNotEmptyCheck('name'))
    .add('duplicated', 'name', duplicateCalendarCheck(props.calendarNames))
    .build();
  const roleNames = props.roles.map((role) => {
    return role.name;
  });
  const dispatch = useDispatch();
  const keycloakClientRoles = useSelector(selectServiceKeycloakRoles);
  let elements = [{ roleNames: roleNames, clientId: '', currentElements: null }];

  const clientElements =
    Object.entries(keycloakClientRoles).length > 0 &&
    Object.entries(keycloakClientRoles)
      .filter(([clientId, config]) => {
        return (config as ConfigServiceRole).roles.length > 0;
      })
      .map(([clientId, config]) => {
        const roles = (config as ConfigServiceRole).roles;
        const roleNames = roles.map((role) => {
          return role.role;
        });
        return { roleNames: roleNames, clientId: clientId, currentElements: null };
      });
  elements = elements.concat(clientElements);

  const ClientRole = ({ roleNames, clientId }) => {
    return (
      <>
        <ClientRoleTable
          roles={roleNames}
          clientId={clientId}
          roleSelectFunc={(roles, type) => {
            if (type === 'read') {
              setCalendar({
                ...calendar,
                readRoles: roles,
              });
            } else {
              setCalendar({
                ...calendar,
                updateRoles: roles,
              });
            }
          }}
          readRoles={calendar?.readRoles}
          updateRoles={calendar?.updateRoles}
        />
      </>
    );
  };

  return (
    <GoAModal testId="add-calendar-modal" isOpen={props.open}>
      <GoAModalTitle>{title}</GoAModalTitle>
      <GoAModalContent>
        <GoAForm>
          <GoAFormItem error={errors?.['name']}>
            <label>Name</label>
            <GoAInput
              type="text"
              name="name"
              value={calendar.name}
              data-testid={`calendar-modal-name-input`}
              aria-label="name"
              onChange={(name, value) => {
                const validations = {
                  name: value,
                };
                validators.remove('name');
                if (isNew) {
                  validations['duplicated'] = value;
                }
                validators.checkAll(validations);
                setCalendar({ ...calendar, name: value });
              }}
            />
          </GoAFormItem>
          <GoAFormItem>
            <label>Description</label>
            <GoAInput
              type="text"
              name="description"
              value={calendar.description}
              data-testid={`calendar-modal-description-input`}
              aria-label="description"
              onChange={(name, value) => {
                const validations = {
                  name: value,
                };
                validators.remove('name');
                if (isNew) {
                  validations['duplicated'] = value;
                }
                validators.checkAll(validations);
                setCalendar({ ...calendar, description: value });
              }}
            />
          </GoAFormItem>
          <GoAFormItem>
            <label>Display Name</label>
            <GoAInput
              type="text"
              name="displayName"
              value={calendar.displayName}
              data-testid={`calendar-modal-display-name-input`}
              aria-label="displayName"
              onChange={(name, value) => {
                setCalendar({ ...calendar, displayName: value });
              }}
            />
          </GoAFormItem>
          {elements.map((e, key) => {
            return <ClientRole roleNames={e.roleNames} key={key} clientId={e.clientId} />;
          })}
          {Object.entries(keycloakClientRoles).length === 0 && (
            <TextLoadingIndicator>Loading roles from access service</TextLoadingIndicator>
          )}
        </GoAForm>
      </GoAModalContent>
      <GoAModalActions>
        <GoAButton
          buttonType="secondary"
          data-testid="calendar-modal-cancel"
          onClick={() => {
            props.onCancel();
          }}
        >
          Cancel
        </GoAButton>
        <GoAButton
          buttonType="primary"
          data-testid="calendar-modal-save"
          onClick={(e) => {
            const validations = {
              name: calendar.name,
            };
            if (isNew) {
              calendar.id = calendar.name.toLowerCase();
              validations['duplicated'] = calendar.name;

              if (!validators.checkAll(validations)) {
                return;
              }
              dispatch(CreateCalendar(calendar));

              props.onCancel();
            }
          }}
        >
          Save
        </GoAButton>
      </GoAModalActions>
    </GoAModal>
  );
};

export const TextLoadingIndicator = styled.div`
  animation: blinker 1s linear infinite;
  font-size: 16px;
  font-style: italic;
  text-align: center;
  @keyframes blinker {
    50% {
      opacity: 0;
    }
  }
`;
