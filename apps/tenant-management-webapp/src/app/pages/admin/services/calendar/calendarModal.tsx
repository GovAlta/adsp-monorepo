import React, { useState } from 'react';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAButton } from '@abgov/react-components';
import { GoAForm, GoAFormItem, GoAInput } from '@abgov/react-components/experimental';
import { CalendarItem } from '@store/calendar/models';
import { useDispatch } from 'react-redux';
import { CreateCalendar } from '@store/calendar/actions';
import { Role } from '@store/tenant/models';
import { ClientRoleTable } from '@components/ClientRoleTable';
import { ConfigServiceRole } from '@store/access/models';
import { useValidators } from '@lib/useValidators';
import { toKebabName } from '@lib/kebabName';
import { GoASkeletonGridColumnContent } from '@abgov/react-components';
import { characterCheck, validationPattern, isNotEmptyCheck, Validator } from '@lib/checkInput';
import { IdField } from './styled-components';
import { ServiceRoleConfig } from '@store/access/models';

interface CalendarModalProps {
  calendar?: CalendarItem;
  type: string;
  onCancel?: () => void;
  open: boolean;
  realmRoles: Role[];
  tenantClients: ServiceRoleConfig;
  calendarNames?: string[];
}

export const CalendarModal = (props: CalendarModalProps): JSX.Element => {
  const isNew = props.type === 'new' || props.open;

  const [calendar, setCalendar] = useState(props.calendar);

  const title = isNew ? 'Add calendar' : 'Edit calendar';

  const checkForBadChars = characterCheck(validationPattern.mixedKebabCase);
  const duplicateCalendarCheck = (names: string[]): Validator => {
    return (name: string) => {
      return names.includes(name) ? `Duplicated file type name ${name}.` : '';
    };
  };
  const descriptionCheck = (): Validator => (description: string) =>
    description.length > 250 ? 'Description could not over 250 characters ' : '';

  const { errors, validators } = useValidators('name', 'name', checkForBadChars, isNotEmptyCheck('name'))
    .add('duplicated', 'name', duplicateCalendarCheck(props.calendarNames))
    .add('description', 'description', descriptionCheck())
    .build();

  const roleNames = props.realmRoles.map((role) => {
    return role.name;
  });
  const dispatch = useDispatch();

  let elements = [{ roleNames: roleNames, clientId: '', currentElements: null }];

  const clientElements =
    props.tenantClients &&
    Object.entries(props.tenantClients).length > 0 &&
    Object.entries(props.tenantClients)
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
                const calendarId = toKebabName(value);
                setCalendar({ ...calendar, name: value, id: calendarId });
              }}
            />
          </GoAFormItem>
          <GoAFormItem>
            <label>Calendar ID</label>
            <IdField>{calendar.id}</IdField>
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
                validators.remove('description');
                validators['description'].check(value);
                setCalendar({ ...calendar, description: value });
              }}
            />
          </GoAFormItem>
          {props.tenantClients &&
            elements.map((e, key) => {
              return <ClientRole roleNames={e.roleNames} key={key} clientId={e.clientId} />;
            })}
          {Object.entries(props.tenantClients).length === 0 && (
            <GoASkeletonGridColumnContent key={1} rows={4}></GoASkeletonGridColumnContent>
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
            }
            props.onCancel();
            validators.clear();
          }}
        >
          Save
        </GoAButton>
      </GoAModalActions>
    </GoAModal>
  );
};
