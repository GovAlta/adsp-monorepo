import React, { FunctionComponent, useState } from 'react';
import Editor from '@monaco-editor/react';
import type { EventDefinition } from '@store/event/models';
import { GoAButton } from '@abgov/react-components';
import {
  GoAModal,
  GoAModalActions,
  GoAModalContent,
  GoAModalTitle,
  GoAInput,
  GoATextArea,
} from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { wordCheck, characterCheck, validationPattern, isNotEmptyCheck } from '@lib/checkInput';
import { useValidators } from '@lib/useValidators';
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
  const dispatch = useDispatch();

  const forbiddenWords = coreNamespaces.concat('platform');
  const checkForConflicts = wordCheck(forbiddenWords);
  const checkForBadChars = characterCheck(validationPattern.mixedKebabCase);

  const { errors, validators } = useValidators(
    'namespace',
    'namespace',
    checkForConflicts,
    checkForBadChars,
    isNotEmptyCheck('namespace')
  )
    .add('name', 'name', checkForBadChars, isNotEmptyCheck('name'))
    .build();

  return (
    <GoAModal testId="definition-form" isOpen={open}>
      <GoAModalTitle testId="definition-form-title">{isEdit ? 'Edit definition' : 'Add definition'}</GoAModalTitle>
      <GoAModalContent>
        <GoAForm>
          <GoAFormItem error={errors?.['namespace']}>
            <label>Namespace</label>
            <GoAInput
              type="text"
              name="namespace"
              value={definition.namespace}
              disabled={isEdit}
              data-testid="form-namespace"
              aria-label="nameSpace"
              onChange={(name, value) => {
                validators['namespace'].check(value);
                setDefinition({ ...definition, namespace: value });
              }}
            />
          </GoAFormItem>
          <GoAFormItem error={errors?.['name']}>
            <label>Name</label>
            <GoAInput
              type="text"
              name="name"
              value={definition.name}
              disabled={isEdit}
              data-testid="form-name"
              aria-label="name"
              onChange={(name, value) => {
                validators['name'].check(value);
                setDefinition({ ...definition, name: value });
              }}
            />
          </GoAFormItem>
          <GoAFormItem>
            <label>Description</label>
            <GoATextArea
              name="description"
              data-testid="form-description"
              value={definition.description}
              aria-label="description"
              onChange={(name, value) => setDefinition({ ...definition, description: value })}
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
            validators.clear();
          }}
        >
          Cancel
        </GoAButton>
        <GoAButton
          disabled={!definition.namespace || !definition.name || validators.haveErrors()}
          buttonType="primary"
          data-testid="form-save"
          type="submit"
          onClick={(e) => {
            dispatch(updateEventDefinition(definition));
            if (onSave) {
              onSave();
            }
            onClose();
            validators.clear();
          }}
        >
          Save
        </GoAButton>
      </GoAModalActions>
    </GoAModal>
  );
};
