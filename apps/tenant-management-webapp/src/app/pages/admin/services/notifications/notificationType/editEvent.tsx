import React, { FunctionComponent, useEffect, useState } from 'react';
import type { NotificationItem } from '@store/notification/models';
import { useDispatch, useSelector } from 'react-redux';
import {
  GoabButton,
  GoabButtonGroup,
  GoabDropdown,
  GoabDropdownItem,
  GoabModal,
  GoabFormItem,
} from '@abgov/react-components';
import { RootState } from '@store/index';
import { getEventDefinitions } from '@store/event/actions';
import { EventItem, baseTemplate } from '@store/notification/models';
import { GoabDropdownOnChangeDetail } from '@abgov/ui-components-common';
interface NotificationDefinitionFormProps {
  initialValue?: NotificationItem;
  onCancel?: (closeEventModal: boolean) => void;
  onClickedOutside?: () => void;
  onNext?: (notify: NotificationItem, event: EventItem) => void;
  open: boolean;
  selectedEvent: EventItem;
  errors?: Record<string, string>;
}

export const EventModalForm: FunctionComponent<NotificationDefinitionFormProps> = ({
  initialValue,
  onCancel,
  onNext,
  onClickedOutside,
  open,
  selectedEvent,
}) => {
  const [definition, setDefinition] = useState(initialValue);
  const [selectedValues, setValues] = useState([selectedEvent?.name]);

  const dispatch = useDispatch();

  const eventDefinitions = useSelector((state: RootState) => state.event.definitions);

  useEffect(() => {
    dispatch(getEventDefinitions());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // only show next if there is an event selected and its name isnt empty
    if (selectedEvent && selectedEvent.name !== '') {
      setValues([`${selectedEvent.namespace}:${selectedEvent.name}`]);
    } else {
      setValues(['']);
    }
  }, [selectedEvent]);

  function onChange(name, values) {
    setValues([values]);
  }

  useEffect(() => {
    setDefinition(initialValue);
  }, [initialValue]);

  let dropDownOptions = [];

  const existingEventList =
    initialValue?.events?.filter((def) => `${def.namespace}:${def.name}` !== selectedValues[0]) || [];

  for (const key in eventDefinitions) {
    if (key.indexOf('notification-service') > -1) {
      existingEventList.push({ namespace: key.split(':')[0], name: key.split(':')[1] });
    }
  }

  if (initialValue) {
    dropDownOptions = Object.keys(eventDefinitions)
      .sort((a, b) => (a < b ? -1 : 1))
      .filter((def) => {
        return !existingEventList.map((events) => `${events.namespace}:${events.name}`).includes(def);
      })
      .map((eventKey, index) => {
        return {
          name: eventDefinitions[eventKey].name,
          value: `${eventDefinitions[eventKey].namespace}:${eventDefinitions[eventKey].name}`,
          nameSpace: eventDefinitions[eventKey].namespace,
          label: `${eventDefinitions[eventKey].namespace}:${eventDefinitions[eventKey].name}`,
          key: index,
          dataTestId: `${eventDefinitions[eventKey].name}-update-roles-options`,
        };
      });
  }

  return (
    <GoabModal
      testId="event-form"
      open={open}
      onClose={onClickedOutside}
      heading={'Select an event'}
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton
            testId="event-form-cancel"
            type="secondary"
            onClick={() => {
              setValues(['']);
              onCancel(true);
            }}
          >
            Cancel
          </GoabButton>
          <GoabButton
            disabled={selectedValues[0] === ''}
            type="primary"
            testId="event-form-save"
            onClick={() => {
              const dropdownObject = dropDownOptions.find((dropdown) => dropdown.value === selectedValues[0]);
              const eventObject: EventItem = {
                namespace: dropdownObject.nameSpace,
                name: dropdownObject.name,
                templates: JSON.parse(JSON.stringify(baseTemplate)),
              };
              // deep cloning props to avoid unwanted side effects
              // note: do not mutate props directly, it will cause unnecessary side effects
              const deepClonedDefinition = JSON.parse(JSON.stringify(definition));
              deepClonedDefinition.events.push(eventObject);
              onCancel(true);
              onNext(deepClonedDefinition, eventObject);
              setValues(['']);
            }}
          >
            Next
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <GoabFormItem label="">
        <GoabDropdown
          name="event"
          onChange={(detail: GoabDropdownOnChangeDetail) => onChange(detail.name, detail.value)}
          value={selectedValues ? selectedValues : ''}
          aria-label="event-form-dropdown"
          width="50ch"
          testId="event-dropdown"
          mt="s"
          mb="4xl"
        >
          {dropDownOptions.map((item, key) => (
            <GoabDropdownItem label={item.label} value={item.value} key={key} data-testid={item.dataTestId} />
          ))}
        </GoabDropdown>
      </GoabFormItem>
    </GoabModal>
  );
};
