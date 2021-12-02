import React, { FunctionComponent, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import type { EventDefinition } from '@store/event/models';
import { GoAButton } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';

interface EventDefinitionFormProps {
  initialValue?: EventDefinition;
  onCancel?: () => void;
  onSave?: (definition: EventDefinition) => void;
  open: boolean;

  errors?: Record<string, string>;
}

const emptyValue = {
  namespace: '',
  name: '',
  description: '',
  isCore: false,
  payloadSchema: {
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: true,
  },
};

export const EventDefinitionModalForm: FunctionComponent<EventDefinitionFormProps> = ({
  initialValue,
  onCancel,
  onSave,
  errors,
  open,
}) => {
  const isEdit = !!initialValue;
  const [definition, setDefinition] = useState<EventDefinition>(emptyValue);

  useEffect(() => {
    isEdit && setDefinition(initialValue);
  }, [initialValue]);

  return (
    <GoAModal testId="definition-form" isOpen={open}>
      <GoAModalTitle>{isEdit ? 'Edit definition' : 'Add definition'}</GoAModalTitle>
      <GoAModalContent>
        <GoAForm>
          <GoAFormItem error={errors?.['namespace'] && 'error'}>
            <label>Namespace</label>
            <input
              type="text"
              name="namespace"
              value={definition.namespace}
              disabled={isEdit}
              data-testid="form-namespace"
              aria-label="nameSpace"
              onChange={(e) => setDefinition({ ...definition, namespace: e.target.value })}
            />
            <div className="error-msg">{errors?.['namespace']}</div>
          </GoAFormItem>
          <GoAFormItem error={errors?.['name'] && 'error'}>
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={definition.name}
              disabled={isEdit}
              data-testid="form-name"
              aria-label="name"
              onChange={(e) => setDefinition({ ...definition, name: e.target.value })}
            />
            <div className="error-msg">{errors?.['name']}</div>
          </GoAFormItem>
          <GoAFormItem>
            <label>Description</label>
            <textarea
              name="description"
              data-testid="form-description"
              value={definition.description}
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
        <GoAButton data-testid="form-cancel" buttonType="tertiary" type="button" onClick={onCancel}>
          Cancel
        </GoAButton>
        <GoAButton
          disabled={!definition.namespace || !definition.name}
          buttonType="primary"
          data-testid="form-save"
          type="submit"
          onClick={(e) => onSave(definition)}
        >
          Save
        </GoAButton>
      </GoAModalActions>
    </GoAModal>
  );
};
