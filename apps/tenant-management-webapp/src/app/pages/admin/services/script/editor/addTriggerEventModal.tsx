import React, { useEffect, useState } from 'react';
import { GoADropdownOption, GoADropdown } from '@abgov/react-components';

import {
  GoAButton,
  GoAButtonGroup,
  GoAFormItem,
  GoAModal,
  //GoADropdown,
  //GoADropdownItem,
} from '@abgov/react-components-new';

import {
  ScriptItem,
  ScriptItemTriggerEvent,
  ScriptItemTriggerEventCriteria,
  defaultTriggerEvent,
} from '@store/script/models';
import { MonacoDivBody } from '../styled-components';
import MonacoEditor, { Editor, EditorProps, useMonaco } from '@monaco-editor/react';
import { scriptEditorConfig } from './config';

interface AddTriggerEventModalProps {
  initialScript: ScriptItem;
  initialValue?: ScriptItemTriggerEvent;
  scriptId?: string;
  onCancel: () => void;
  onSave: (triggerEvent: ScriptItemTriggerEvent) => void;
  open?: boolean;
  isNew?: boolean;
  eventNames: string[];
  selectedEventName?: string;
}

export const AddTriggerEventModal = ({
  initialScript,
  onCancel,
  onSave,
  open,
  isNew,
  eventNames,
  initialValue,
}: AddTriggerEventModalProps): JSX.Element => {
  const [triggerEvent, setTriggerEvent] = useState<ScriptItemTriggerEvent>(initialValue);

  useEffect(() => {
    if (isNew) {
      setTriggerEvent(defaultTriggerEvent);
    }
  }, [open]);
  useEffect(() => {
    if (isNew) {
      //  setScript({ ...script, triggerEvents: [...(script.triggerEvents || [])] });
      setTriggerEvent(defaultTriggerEvent);
    } else if (initialValue && initialValue.name !== '' && !isNew) {
      setTriggerEvent({
        ...triggerEvent,
        name: initialValue.name,
        criteria: {
          ...triggerEvent.criteria,
          context: JSON.stringify(initialValue?.criteria?.context, null, 2),
        },
      });
    }
  }, [initialValue]);

  const headingText = () => {
    if (isNew) return `Add trigger event`;

    return `Edit trigger event`;
  };

  const filterArray = (array1, array2) => {
    const filtered = array1.filter((el) => {
      return array2.indexOf(el) < 0;
    });

    //For Edits add the current selection that is being looked at.
    if (initialValue && initialValue?.name !== '') {
      filtered.push(initialValue?.name);
    }
    return filtered;
  };

  const eventTriggerNames = initialScript?.triggerEvents.map((ev) => {
    return ev.name;
  });

  const filteredEventNames = [...new Set(filterArray(eventNames, eventTriggerNames))] as string[];
  const isObjectEmpty = (obj) => {
    return JSON.stringify(obj) === '{}';
  };
  const getCriteriaContext = () => {
    if (
      triggerEvent.criteria?.context === null ||
      triggerEvent.criteria?.context === '' ||
      isObjectEmpty(triggerEvent.criteria)
    )
      return '';

    return triggerEvent.criteria?.context;
  };

  console.log('triggerEvent.criteria?.context', triggerEvent.criteria?.context);
  return (
    <GoAModal
      testId="add-trigger-event-modal"
      open={open}
      heading={headingText()}
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            type="secondary"
            testId="script-modal-cancel"
            onClick={() => {
              setTriggerEvent({ ...triggerEvent, name: '' });
              onCancel();
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            type="primary"
            testId="script-modal-save"
            onClick={() => {
              const namespace = triggerEvent.name.split(':')[0];
              const criteria: ScriptItemTriggerEventCriteria = {
                correlationId: `script-${namespace}.toString()}`,
                context: JSON.parse(triggerEvent.criteria.context),
              };
              onSave({ namespace: namespace, name: triggerEvent.name, criteria: criteria });
            }}
          >
            {isNew ? 'Add' : 'Save'}
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      <GoAFormItem label="Select trigger event">
        <GoADropdown
          name="streamEvents"
          selectedValues={[triggerEvent.name]}
          multiSelect={false}
          onChange={(name, values) => {
            setTriggerEvent({
              ...triggerEvent,
              name: values[0],
            });
          }}
        >
          {filteredEventNames &&
            filteredEventNames
              .sort((a, b) => a.localeCompare(b))
              .map((eventName) => (
                <GoADropdownOption data-testId={eventName} key={eventName} value={eventName} label={eventName} />
              ))}
        </GoADropdown>
        {/* <GoADropdown
          name="eventTriggerName"
          value={triggerEvent.name}
          width="100%"
          onChange={(_n: string, value: string) => {
            setEventName(value);
          }}
        >
          {filteredEventNames &&
            filteredEventNames
              .sort((a, b) => a.localeCompare(b))
              .map((eventName) => (
                <GoADropdownItem
                  name={`EventName_${eventName}`}
                  testId={eventName}
                  key={eventName}
                  value={eventName}
                  label={eventName}
                />
              ))}
        </GoADropdown> */}
      </GoAFormItem>

      <GoAFormItem label="Trigger event criteria">
        <MonacoDivBody data-testid="templated-editor-body">
          {/* <Editor
            data-testid="trigger-event-criteria"
            height={200}
            value={triggerEvent.criteria?.context}
            onChange={(value) => {
              // validators.remove('payloadSchema');
              setTriggerEvent({
                ...triggerEvent,
                criteria: {
                  ...triggerEvent.criteria,
                  context: value,
                },
              });
            }}
            language="json"
            options={{
              automaticLayout: true,
              scrollBeyondLastLine: false,
              tabSize: 2,
              minimap: { enabled: false },
            }}
          /> */}
          <MonacoEditor
            language={'json'}
            height={200}
            value={getCriteriaContext()}
            {...scriptEditorConfig}
            onChange={(value) => {
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
