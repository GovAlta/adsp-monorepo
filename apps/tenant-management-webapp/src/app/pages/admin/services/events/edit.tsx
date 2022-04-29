import React, { FunctionComponent, useState } from 'react';
import Editor from '@monaco-editor/react';
import type { EventDefinition } from '@store/event/models';
import { GoAButton } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import {
  ReactCleansingReporter,
  wordCleanser,
  characterCleanser,
  cleansingPatterns,
  checkInput,
  isNotEmptyCheck,
} from '@lib/checkInput';
import { updateEventDefinition } from '@store/event/actions';
import { useDispatch } from 'react-redux';

interface EventDefinitionFormProps {
  initialValue?: EventDefinition;
  onClose?: () => void;
  onSave?: () => void;
  open: boolean;
  isEdit: boolean;
  coreNamespaces: string[];
}

export const EventDefinitionModalForm: FunctionComponent<EventDefinitionFormProps> = ({
  initialValue,
  onClose,
  open,
  onSave,
  isEdit,
  coreNamespaces,
}) => {
  const [definition, setDefinition] = useState<EventDefinition>(initialValue);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dispatch = useDispatch();
  const reporter = new ReactCleansingReporter(errors, setErrors);
  const hasFormErrors = () => {
    return Object.keys(errors).length !== 0;
  };
  const forbidden = coreNamespaces.concat('platform');
  const checkForConflicts = wordCleanser(forbidden, 'namespace');
  const checkForBadChars = characterCleanser(cleansingPatterns.alphanumericAC);

  return (
    <GoAModal testId="definition-form" isOpen={open}>
      <GoAModalTitle testId="definition-form-title">{isEdit ? 'Edit definition' : 'Add definition'}</GoAModalTitle>
      <GoAModalContent>
        <GoAForm>
          <GoAFormItem error={errors?.['namespace']}>
            <label>Namespace</label>
            <input
              type="text"
              name="namespace"
              value={definition.namespace}
              disabled={isEdit}
              data-testid="form-namespace"
              aria-label="nameSpace"
              onChange={(e) => {
                checkInput(
                  e.target.value,
                  [checkForConflicts, checkForBadChars, isNotEmptyCheck('namespace')],
                  reporter,
                  'namespace'
                );
                setDefinition({ ...definition, namespace: e.target.value });
              }}
            />
          </GoAFormItem>
          <GoAFormItem error={errors?.['name']}>
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={definition.name}
              disabled={isEdit}
              data-testid="form-name"
              aria-label="name"
              onChange={(e) => {
                checkInput(e.target.value, [checkForBadChars, isNotEmptyCheck('name')], reporter, 'name');
                setDefinition({ ...definition, name: e.target.value });
              }}
            />
          </GoAFormItem>
          <GoAFormItem>
            <label>Description</label>
            <textarea
              name="description"
              data-testid="form-description"
              value={definition.description}
              aria-label="description"
              onChange={(e) => setDefinition({ ...definition, description: e.target.value })}
            />
          </GoAFormItem>
          <GoAFormItem>
            <label>Payload schema</label>
            <Editor
              data-testid="form-schema"
              height={200}
              value={JSON.stringify(definition.payloadSchema, null, 2)}
              onChange={(value) => setDefinition({ ...definition, payloadSchema: JSON.parse(value) })}
              language="json"
              options={{ automaticLayout: true, scrollBeyondLastLine: false, tabSize: 2, minimap: { enabled: false } }}
            />
          </GoAFormItem>
        </GoAForm>
      </GoAModalContent>
      <GoAModalActions>
        <GoAButton
          data-testid="form-cancel"
          buttonType="secondary"
          type="button"
          onClick={() => {
            onClose();
            setErrors({});
          }}
        >
          Cancel
        </GoAButton>
        <GoAButton
          disabled={!definition.namespace || !definition.name || hasFormErrors()}
          buttonType="primary"
          data-testid="form-save"
          type="submit"
          onClick={(e) => {
            dispatch(updateEventDefinition(definition));
            if (onSave) {
              onSave();
            }
            onClose();
            setErrors({});
          }}
        >
          Save
        </GoAButton>
      </GoAModalActions>
    </GoAModal>
  );
};
