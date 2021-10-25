import React, { FunctionComponent, useEffect, useState } from 'react';
import type { NotificationItem, NotificationTypeItem } from '@store/notification/models';
import { useDispatch, useSelector } from 'react-redux';
import { GoAButton, GoADropdown, GoADropdownOption } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { RootState } from '@store/index';
import { getEventDefinitions } from '@store/event/actions';
import { EventItem } from '@store/notification/models';

interface NotificationDefinitionFormProps {
  initialValue?: NotificationItem;
  onCancel?: () => void;
  onSave?: (definition: NotificationItem) => void;
  open: boolean;
  selectedEvent: EventItem;
  errors?: Record<string, string>;
}

const emptyNotificationDefinition: NotificationTypeItem = {
  name: '',
  description: '',
  events: [],
  subscriberRoles: [],
  id: null,
};

export const EventModalForm: FunctionComponent<NotificationDefinitionFormProps> = ({
  initialValue,
  onCancel,
  onSave,
  errors,
  open,
  selectedEvent,
}) => {
  const [definition, setDefinition] = useState(initialValue);
  const [selectedValues, setValues] = useState([selectedEvent?.name]);

  const dispatch = useDispatch();

  const eventDefinitions = useSelector((state: RootState) => state.event.definitions);

  useEffect(() => {
    dispatch(getEventDefinitions());
  }, [dispatch]);

  useEffect(() => {
    console.log(JSON.stringify(selectedEvent) + '<selectedEventxxxx');
    if (selectedEvent) {
      console.log(JSON.stringify(selectedEvent) + '<selectedEvent');
      setValues([`${selectedEvent.namespace}:${selectedEvent.name}`]);
    } else {
      setValues(['']);
    }
  }, [selectedEvent]);

  function onChange(name, values) {
    console.log(JSON.stringify(values) + '<values');
    console.log(JSON.stringify(name) + '<name');
    setValues(values);
  }

  console.log(JSON.stringify(initialValue) + '<initialValue');

  useEffect(() => {
    setDefinition(initialValue);
  }, [initialValue]);

  let dropDownOptions = [];

  //console.log(JSON.stringify(initialValue) + '<--initialValue');

  console.log(JSON.stringify(initialValue?.events) + '<--initialValue?.events?');

  console.log(JSON.stringify(selectedValues[0]) + '<--selectedValues[0]');

  const existingEventList =
    initialValue?.events?.filter((def) => `${def.namespace}:${def.name}` !== selectedValues[0]) || [];

  console.log(JSON.stringify(existingEventList) + '<--existingEventList');

  if (initialValue) {
    dropDownOptions = Object.keys(eventDefinitions)
      .filter((def) => {
        console.log(
          JSON.stringify(existingEventList.map((events) => `${events.namespace}:${events.name}`)) +
            '<--existingEventList'
        );
        console.log(JSON.stringify(def) + '<--def');

        const x = !existingEventList.map((events) => `${events.namespace}:${events.name}`).includes(def);
        console.log(JSON.stringify(x) + '<--x');
        return x;
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

  console.log(JSON.stringify(eventDefinitions) + '<define');
  console.log(JSON.stringify(selectedValues) + '<selectedvalues');

  console.log(JSON.stringify(dropDownOptions) + '<dropDownOptions');

  console.log(JSON.stringify(definition) + '<definition');

  return (
    <GoAModal testId="notification-types-form" isOpen={open}>
      <GoAModalTitle>{'Select an event'}</GoAModalTitle>
      <GoAModalContent>
        <GoAForm>
          <GoAFormItem>
            <div style={{ margin: '0 0 200px 0' }}>
              <GoADropdown name="basic" onChange={onChange} selectedValues={selectedValues}>
                {dropDownOptions.map((item, key) => (
                  <GoADropdownOption label={item.label} value={item.value} key={key} data-testid={item.dataTestId} />
                ))}
              </GoADropdown>
            </div>
          </GoAFormItem>
        </GoAForm>
      </GoAModalContent>
      <GoAModalActions>
        <GoAButton data-testid="form-cancel" buttonType="tertiary" type="button" onClick={onCancel}>
          Cancel
        </GoAButton>
        <GoAButton
          disabled={selectedValues[0] === ''}
          buttonType="primary"
          data-testid="form-save"
          type="submit"
          onClick={() => {
            console.log(JSON.stringify(dropDownOptions) + '<dropDownOptions');
            console.log(JSON.stringify(selectedValues[0]) + '<selectedValues[0]');

            const dropdownObject = dropDownOptions.find((dropdown) => dropdown.value === selectedValues[0]);

            console.log(JSON.stringify(dropdownObject) + '<dropdownObject');

            const eventObject: EventItem = {
              namespace: dropdownObject.nameSpace,
              name: dropdownObject.name,
              templates: {},
              channels: [],
            };
            console.log(JSON.stringify(eventObject) + '<eventObject');
            console.log(JSON.stringify(definition?.events) + '<definition?.events');

            if (selectedEvent) {
              const definitionEventIndex = definition?.events?.findIndex(
                (def) => `${def.namespace}:${def.name}` === `${selectedEvent.namespace}:${selectedEvent.name}`
              );

              console.log(JSON.stringify(definitionEventIndex) + '<definitionEventIndex');

              definition.events[definitionEventIndex] = eventObject;
            } else {
              definition.events.push(eventObject);
            }

            console.log(JSON.stringify(definition) + '<definitionqqq');
            onSave(definition);
            setValues(['']);
          }}
        >
          Save
        </GoAButton>
      </GoAModalActions>
    </GoAModal>
  );
};
