import React, { FunctionComponent, useEffect, useState } from 'react';
import type { NotificationItem } from '@store/notification/models';
import { useDispatch, useSelector } from 'react-redux';
import { GoAButton, GoADropdown, GoADropdownOption } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { RootState } from '@store/index';
import { getEventDefinitions } from '@store/event/actions';
import { EventItem, baseTemplate } from '@store/notification/models';

interface NotificationDefinitionFormProps {
  initialValue?: NotificationItem;
  onCancel?: () => void;
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
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      setValues([`${selectedEvent.namespace}:${selectedEvent.name}`]);
    } else {
      setValues(['']);
    }
  }, [selectedEvent]);

  function onChange(name, values) {
    setValues(values);
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
    <GoAModal testId="event-form" isOpen={open} onClose={onClickedOutside}>
      <GoAModalTitle>{'Select an event'}</GoAModalTitle>
      <GoAModalContent>
        <GoAForm>
          <GoAFormItem>
            <div style={{ margin: '0 0 200px 0' }}>
              <GoADropdown name="event" onChange={onChange} selectedValues={selectedValues}>
                {dropDownOptions.map((item, key) => (
                  <GoADropdownOption label={item.label} value={item.value} key={key} data-testid={item.dataTestId} />
                ))}
              </GoADropdown>
            </div>
          </GoAFormItem>
        </GoAForm>
      </GoAModalContent>
      <GoAModalActions>
        <GoAButton data-testid="event-form-cancel" buttonType="secondary" type="button" onClick={onCancel}>
          Cancel
        </GoAButton>
        <GoAButton
          disabled={selectedValues[0] === ''}
          buttonType="primary"
          data-testid="event-form-save"
          type="submit"
          onClick={() => {
            const dropdownObject = dropDownOptions.find((dropdown) => dropdown.value === selectedValues[0]);
            const eventObject: EventItem = {
              namespace: dropdownObject.nameSpace,
              name: dropdownObject.name,
              templates: baseTemplate,
            };
            // deep cloning props to avoid unwanted side effects
            // note: do not mutate props directly, it will cause unnecessary side effects
            const deepClonedDefinition = JSON.parse(JSON.stringify(definition));
            deepClonedDefinition.events.push(eventObject);
            onNext(deepClonedDefinition, eventObject);

            setValues(['']);
          }}
        >
          Next
        </GoAButton>
      </GoAModalActions>
    </GoAModal>
  );
};
