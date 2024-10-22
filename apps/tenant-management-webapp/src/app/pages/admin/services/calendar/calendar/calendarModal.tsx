import React, { useState, useEffect } from 'react';
import { GoAButton, GoAButtonGroup, GoAModal, GoATextArea, GoAInput, GoAFormItem } from '@abgov/react-components-new';
import { CalendarItem, defaultCalendar } from '@store/calendar/models';
import { useSelector, useDispatch } from 'react-redux';
import { ClientRoleTable } from '@components/RoleTable';
import { useValidators } from '@lib/validation/useValidators';
import { toKebabName } from '@lib/kebabName';

import { isNotEmptyCheck, wordMaxLengthCheck, duplicateNameCheck, badCharsCheck } from '@lib/validation/checkInput';
import { IdField } from '../styled-components';
import { RootState } from '@store/index';
import { FetchRealmRoles } from '@store/tenant/actions';
import { fetchKeycloakServiceRoles } from '@store/access/actions';
import { selectRoleList } from '@store/sharedSelectors/roles';
import { selectCalendarsByName } from '@store/calendar/selectors';
import { TextGoASkeleton } from '@core-services/app-common';
import { areObjectsEqual } from '@lib/objectUtil';
interface CalendarModalProps {
  calendarName: string | undefined;
  onCancel?: () => void;
  onSave: (calendar: CalendarItem) => void;
  open: boolean;
}

export const CalendarModal = ({ calendarName, onCancel, onSave, open }: CalendarModalProps): JSX.Element => {
  const isNew = !(calendarName?.length > 0);
  const initialValue = useSelector((state: RootState) => selectCalendarsByName(state, calendarName));

  const [calendar, setCalendar] = useState<CalendarItem>(initialValue);
  const dispatch = useDispatch();
  const roles = useSelector(selectRoleList);

  useEffect(() => {
    dispatch(FetchRealmRoles());
    dispatch(fetchKeycloakServiceRoles());
  }, [dispatch]);

  const calendars = useSelector((state: RootState) => {
    return state?.calendarService?.calendars;
  });

  const calendarNames = calendars ? Object.values(calendars).map((c) => c.displayName) : [];
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
        nameColumnWidth={80}
        service="Calendar"
        checkedRoles={[
          { title: 'read', selectedRoles: calendar?.readRoles },
          { title: 'modify', selectedRoles: calendar?.updateRoles },
        ]}
      />
    );
  };

  const handleCancelClick = () => {
    setCalendar(initialValue);
    validators.clear();
    onCancel();
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
              handleCancelClick();
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            type="primary"
            testId="calendar-modal-save"
            disabled={validators.haveErrors() || areObjectsEqual(calendar, initialValue)}
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
          value={calendar?.displayName}
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
        <IdField>{calendar?.name}</IdField>
      </GoAFormItem>
      <GoAFormItem error={errors?.['description']} label="Description">
        <GoATextArea
          name="description"
          value={calendar?.description}
          testId={`calendar-modal-description-input`}
          aria-label="description"
          width="100%"
          onKeyPress={(name, value, key) => {
            validators.remove('description');
            validators['description'].check(value);
            setCalendar({ ...calendar, description: value });
          }}
          // eslint-disable-next-line
          onChange={(name, value) => {}}
        />
      </GoAFormItem>
      {roles?.length !== 0 &&
        roles.map((r) => <ClientRole roleNames={r.roleNames} key={r.clientId} clientId={r.clientId} />)}
      {roles?.length === 0 && <TextGoASkeleton />}
    </GoAModal>
  );
};
