import React, { useState, useEffect, useRef } from 'react';
import { GoAButton, GoAButtonGroup, GoAModal, GoATextArea, GoAInput, GoAFormItem } from '@abgov/react-components';
import { CalendarItem } from '@store/calendar/models';
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
import { HelpTextComponent } from '@components/HelpTextComponent';

interface CalendarModalProps {
  calendarName: string | undefined;
  onCancel?: () => void;
  onSave: (calendar: CalendarItem) => void;
  open: boolean;
  tenantMode: boolean;
}

export const CalendarModal = ({
  tenantMode,
  calendarName,
  onCancel,
  onSave,
  open,
}: CalendarModalProps): JSX.Element => {
  const isNew = !((calendarName?.length ?? 0) > 0);
  const initialValue = useSelector((state: RootState) => selectCalendarsByName(state, calendarName));

  const [calendar, setCalendar] = useState<CalendarItem>(initialValue);
  const dispatch = useDispatch();
  const roles = useSelector(selectRoleList);
  const scrollPaneRef = useRef<HTMLDivElement>(null);
  const descErrMessage = 'Calendar description can not be over 180 characters';
  useEffect(() => {
    dispatch(FetchRealmRoles());
    dispatch(fetchKeycloakServiceRoles());
  }, [dispatch]);

  const calendars = useSelector((state: RootState) => {
    return state?.calendarService?.calendars;
  });

  const calendarNames = calendars ? Object.values(calendars).map((c) => c.displayName) : [];
  const title = isNew ? 'Add calendar' : tenantMode ? 'Edit calendar' : 'View calendar details';

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

  const validateField = (field: string, value: string) => {
    validators.remove(field);
    const validations = { [field]: value };
    if (isNew && field === 'name') {
      validations['duplicated'] = value;
    }
    validators.checkAll(validations);
  };

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
    if (onCancel) {
      onCancel();
    }
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
          { title: 'read', selectedRoles: calendar?.readRoles, disabled: !tenantMode },
          { title: 'modify', selectedRoles: calendar?.updateRoles, disabled: !tenantMode },
        ]}
      />
    );
  };

  const handleCancelClick = () => {
    setCalendar(initialValue);
    validators.clear();
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <GoAModal
      testId="add-calendar-modal"
      open={open}
      heading={title}
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            type={tenantMode ? 'secondary' : 'primary'}
            testId="calendar-modal-cancel"
            onClick={handleCancelClick}
          >
            {tenantMode ? 'Cancel' : 'Close'}
          </GoAButton>
          {tenantMode && (
            <GoAButton
              type="primary"
              testId="calendar-modal-save"
              disabled={validators.haveErrors() || areObjectsEqual(calendar, initialValue)}
              onClick={validationCheck}
            >
              Save
            </GoAButton>
          )}
        </GoAButtonGroup>
      }
    >
      <div
        ref={scrollPaneRef}
        className="roles-scroll-pane"
        style={{ overflowY: 'auto', maxHeight: '70vh', paddingRight: 0 }}
      >
        <GoAFormItem error={errors?.['name']} label="Name">
          <GoAInput
            type="text"
            name="name"
            value={calendar?.displayName}
            testId={`calendar-modal-name-input`}
            aria-label="name"
            disabled={!isNew || !tenantMode}
            width="100%"
            onChange={(name, value) => {
              validateField('name', value);
              const calendarId = toKebabName(value);
              setCalendar({ ...calendar, name: calendarId, displayName: value });
            }}
            onBlur={() => validateField('name', calendar?.displayName || '')}
          />
        </GoAFormItem>
        {tenantMode && (
          <GoAFormItem label="Calendar ID">
            <IdField>{calendar?.name}</IdField>
          </GoAFormItem>
        )}
        {tenantMode && (
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
            <HelpTextComponent
              length={calendar?.description?.length || 0}
              maxLength={180}
              descErrMessage={descErrMessage}
              errorMsg={errors?.['description']}
            />
          </GoAFormItem>
        )}

        {Array.isArray(roles) &&
          roles.length !== 0 &&
          roles.map((r) => <ClientRole roleNames={r.roleNames} key={r.clientId} clientId={r.clientId} />)}

        {Array.isArray(roles) && roles.length === 0 && <TextGoASkeleton />}
      </div>
    </GoAModal>
  );
};
