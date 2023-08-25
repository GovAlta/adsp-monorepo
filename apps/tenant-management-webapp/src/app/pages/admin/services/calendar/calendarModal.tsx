import React, { FunctionComponent, useState, useEffect } from 'react';
import { GoAButton, GoAButtonGroup, GoAModal, GoATextArea, GoAInput, GoAFormItem } from '@abgov/react-components-new';
import { CalendarItem } from '@store/calendar/models';
import { useSelector } from 'react-redux';
import { Role } from '@store/tenant/models';
import { ClientRoleTable } from '@components/RoleTable';
import { ConfigServiceRole } from '@store/access/models';
import { useValidators } from '@lib/validation/useValidators';
import { toKebabName } from '@lib/kebabName';
import { GoASkeletonGridColumnContent } from '@abgov/react-components';
import { isNotEmptyCheck, wordMaxLengthCheck, duplicateNameCheck, badCharsCheck } from '@lib/validation/checkInput';
import { IdField } from './styled-components';
import { ServiceRoleConfig } from '@store/access/models';
import { RootState } from '@store/index';
interface CalendarModalProps {
  initialValue?: CalendarItem;
  type: string;
  onCancel?: () => void;
  onSave: (calendar: CalendarItem) => void;
  open: boolean;
  realmRoles: Role[];
  tenantClients: ServiceRoleConfig;
}

export const CalendarModal: FunctionComponent<CalendarModalProps> = ({
  initialValue,
  type,
  onCancel,
  onSave,
  open,
  realmRoles,
  tenantClients,
}: CalendarModalProps): JSX.Element => {
  const isNew = type === 'new';

  const [calendar, setCalendar] = useState<CalendarItem>(initialValue);

  const calendars = useSelector((state: RootState) => {
    return state?.calendarService?.calendars;
  });
  const calendarNames = calendars ? Object.keys(calendars) : [];
  const title = isNew ? 'Add calendar' : 'Edit calendar';

  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('duplicated', 'name', duplicateNameCheck(calendarNames, 'Calendar'))
    .add('description', 'description', wordMaxLengthCheck(250, 'Description'))
    .build();

  const roleNames = realmRoles.map((role) => {
    return role.name;
  });
  useEffect(() => {
    setCalendar(initialValue);
  }, [initialValue]);

  let elements = [{ roleNames: roleNames, clientId: '', currentElements: null }];

  const clientElements =
    tenantClients &&
    Object.entries(tenantClients).length > 0 &&
    Object.entries(tenantClients)
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

  const validationCheck = () => {
    const validations = {
      name: calendar.name,
    };

    if (isNew) {
      validations['duplicated'] = calendar.name;

      if (!validators.checkAll(validations)) {
        return;
      }
    }
    onSave(calendar);

    onCancel();
    validators.clear();
  };
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
          service="Calendar"
          checkedRoles={[
            { title: 'read', selectedRoles: calendar?.readRoles },
            { title: 'modify', selectedRoles: calendar?.updateRoles },
          ]}
        />
      </>
    );
  };

  return (
    <GoAModal
      testId="add-calendar-modal"
      open={open}
      heading={title}
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            type="secondary"
            testId="calendar-modal-cancel"
            onClick={() => {
              validators.clear();
              onCancel();
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            type="primary"
            testId="calendar-modal-save"
            disabled={validators.haveErrors()}
            onClick={() => {
              validationCheck();
            }}
          >
            Save
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      <GoAFormItem error={errors?.['name']} label="Name">
        <GoAInput
          type="text"
          name="name"
          value={calendar.displayName}
          testId={`calendar-modal-name-input`}
          aria-label="name"
          disabled={!isNew}
          width="100%"
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
            setCalendar({ ...calendar, name: calendarId, displayName: value });
          }}
        />
      </GoAFormItem>
      <GoAFormItem label="Calendar ID">
        <IdField>{calendar.name}</IdField>
      </GoAFormItem>
      <GoAFormItem error={errors?.['description']} label="Description">
        <GoATextArea
          name="description"
          value={calendar.description}
          testId={`calendar-modal-description-input`}
          aria-label="description"
          width="100%"
          onChange={(name, value) => {
            const description = value;
            validators.remove('description');
            validators['description'].check(description);
            setCalendar({ ...calendar, description });
          }}
        />
      </GoAFormItem>
      {tenantClients &&
        elements.map((e, key) => {
          return <ClientRole roleNames={e.roleNames} key={key} clientId={e.clientId} />;
        })}
      {Object.entries(tenantClients).length === 0 && (
        <GoASkeletonGridColumnContent key={1} rows={4}></GoASkeletonGridColumnContent>
      )}
    </GoAModal>
  );
};
