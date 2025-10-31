import React, { useEffect, useState } from 'react';

import {
  GoAButton,
  GoAButtonGroup,
  GoAFormItem,
  GoAModal,
  GoADropdown,
  GoADropdownItem,
} from '@abgov/react-components';

import {
  ScriptItem,
  ScriptItemTriggerEvent,
  ScriptItemTriggerEventCriteria,
  defaultTriggerEvent,
} from '@store/script/models';
import { MonacoDivBody } from '../styled-components';
import MonacoEditor from '@monaco-editor/react';
import { scriptEditorConfig } from './config';
import { useValidators } from '@lib/validation/useValidators';
import { badCharsCheck, isNotEmptyCheck, isValidJSONCheck } from '@lib/validation/checkInput';
import { externalEventSuggestionList } from '@store/event/selectors';

interface TriggerEventModalProps {
  initialScript: ScriptItem;
  initialValue?: ScriptItemTriggerEvent;
  scriptId?: string;
  onCancel: (triggerEvent: ScriptItemTriggerEvent) => void;
  onSave: (triggerEvent: ScriptItemTriggerEvent) => void;
  open?: boolean;
  isNew?: boolean;
  eventNames: string[];
  selectedEventName?: string;
}

export const TriggerEventModal = ({
  initialScript,
  onCancel,
  onSave,
  open,
  isNew,
  eventNames,
  initialValue,
}: TriggerEventModalProps): JSX.Element => {
  const [triggerEvent, setTriggerEvent] = useState<ScriptItemTriggerEvent>(initialValue);

  useEffect(() => {
    if (isNew) {
      setTriggerEvent(defaultTriggerEvent);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isNew) {
      setTriggerEvent(defaultTriggerEvent);
    } else if (initialValue && initialValue.name !== '' && !isNew) {
      setTriggerEvent({
        ...triggerEvent,
        name: initialValue.name,
        namespace: initialValue.namespace,
        criteria: {
          ...triggerEvent.criteria,
          context: initialValue?.criteria?.context ? JSON.stringify(initialValue?.criteria?.context, null, 2) : null,
        },
      });
    }
  }, [initialValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const isObjectEmpty = (obj) => {
    return JSON.stringify(obj) === '{}';
  };

  const filterArray = (array1, array2) => {
    const filtered = array1?.filter((el) => {
      return array2?.indexOf(el) < 0;
    });

    //For Edits, add the current selection that is being looked at.
    if (initialValue && initialValue?.name !== '') {
      filtered.push(`${initialValue.namespace}:${initialValue?.name}`);
    }
    return filtered;
  };

  const eventTriggerNames = initialScript?.triggerEvents?.map((ev) => {
    return `${ev.namespace}:${ev.name}`;
  });

  const filteredEventNames = [
    ...new Set([...filterArray(eventNames, eventTriggerNames || []), ...externalEventSuggestionList]),
  ] as string[];

  const getCriteriaContext = () => {
    if (
      triggerEvent.criteria?.context === null ||
      triggerEvent.criteria?.context === '' ||
      isObjectEmpty(triggerEvent.criteria)
    )
      return '';

    return triggerEvent.criteria?.context;
  };

  const { errors, validators } = useValidators('name', 'name', badCharsCheck, isNotEmptyCheck('name'))
    .add('criteria', 'criteria', isValidJSONCheck('Trigger event criteria'))
    .build();

  const validateTriggerEventCriteria = (value: string) => {
    validators.remove('criteria');

    const validations = {
      criteria: value,
    };
    if (value.length > 0) {
      validators.checkAll(validations);
    }
  };

  const isSaveButtonDisabled = () => {
    const { name } = triggerEvent;
    if (name === null || name === '') {
      return true;
    }

    if (validators.haveErrors()) return true;
    return false;
  };

  return (
    <GoAModal
      testId="add-trigger-event-modal"
      open={open}
      heading={isNew ? 'Add trigger event' : 'Edit trigger event'}
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            type="secondary"
            testId="script-trigger-event-modal-cancel"
            onClick={() => {
              if (isNew) {
                setTriggerEvent({ ...initialValue });
              }
              validators.clear();
              onCancel(triggerEvent);
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            type="primary"
            testId="script-trigger-event-modal-save"
            disabled={isSaveButtonDisabled()}
            onClick={() => {
              const criteria: ScriptItemTriggerEventCriteria = {
                context: triggerEvent.criteria?.context ? JSON.parse(triggerEvent.criteria?.context) : null,
              };
              onSave({ namespace: triggerEvent.namespace, name: triggerEvent.name, criteria });
            }}
          >
            {isNew ? 'Add' : 'Save'}
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      <GoAFormItem label="Select trigger event">
        <GoADropdown
          data-test-id="script-trigger-event-name-dropDown"
          name="script-trigger-event-name-dropDown"
          value={`${triggerEvent.namespace}:${triggerEvent.name}`}
          width="55ch"
          onChange={(name, values) => {
            setTriggerEvent({
              ...triggerEvent,
              namespace: values.toString().split(':')[0],
              name: values.toString().split(':')[1],
            });
          }}
        >
          {filteredEventNames &&
            filteredEventNames
              .sort((a, b) => a.localeCompare(b))
              .map((eventName) => (
                <GoADropdownItem data-testId={eventName} key={eventName} value={eventName} label={eventName} />
              ))}
        </GoADropdown>
      </GoAFormItem>

      <GoAFormItem error={errors?.['criteria']} label="Trigger event criteria">
        <MonacoDivBody data-testid="scrip-trigger-event-template-editor-body">
          <MonacoEditor
            data-test-id="script-trigger-event-editor"
            language={'json'}
            height={200}
            value={getCriteriaContext()}
            {...scriptEditorConfig}
            onChange={(value) => {
              validateTriggerEventCriteria(value);
              setTriggerEvent({
                ...triggerEvent,
                criteria: {
                  ...triggerEvent.criteria,
                  context: value,
                },
              });
            }}
          />
        </MonacoDivBody>
      </GoAFormItem>
    </GoAModal>
  );
};
