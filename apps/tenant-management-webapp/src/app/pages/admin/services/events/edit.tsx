import React, { FunctionComponent, useState } from 'react';
import Editor from '@monaco-editor/react';
import type { EventDefinition } from '@store/event/models';
import { GoAForm, GoAFormItem, GoAFormButtons } from '@components/Form';
import { GoAButton } from '@abgov/react-components';

const defaultSchema = `{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": true
}`;

interface EventDefinitionFormProps {
  initialValue?: EventDefinition;
  onCancel?: () => void;
  onSave?: (definition: EventDefinition) => void;

  errors?: Record<string, string>;
}

export const EventDefinitionForm: FunctionComponent<EventDefinitionFormProps> = ({
  initialValue,
  onCancel,
  onSave,
  errors,
}) => {
  const isEdit = !!initialValue;

  const [definition, setDefinition] = useState(
    (initialValue ? { ...initialValue, payloadSchema: JSON.stringify(initialValue.payloadSchema, null, 2) } : null) || {
      namespace: '',
      name: '',
      description: '',
      isCore: false,
      payloadSchema: defaultSchema,
    }
  );

  return (
    <GoAForm>
      <GoAFormItem className={errors?.['namespace'] && 'error'}>
        <label>Namespace</label>
        <input
          type="text"
          name="namespace"
          value={definition.namespace}
          disabled={isEdit}
          data-testid="form-namespace"
          onChange={(e) => setDefinition({ ...definition, namespace: e.target.value })}
        />
        <div className="error-msg">{errors?.['namespace']}</div>
      </GoAFormItem>
      <GoAFormItem className={errors?.['name'] && 'error'}>
        <label>Name</label>
        <input
          type="text"
          name="name"
          value={definition.name}
          disabled={isEdit}
          data-testid="form-name"
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
          value={definition.payloadSchema}
          onChange={(value) => setDefinition({ ...definition, payloadSchema: value })}
          language="json"
          options={{ automaticLayout: true, scrollBeyondLastLine: false, tabSize: 2, minimap: { enabled: false } }}
        />
      </GoAFormItem>
      <GoAFormButtons>
        <GoAButton data-testid="form-cancel" buttonType="tertiary" type="button" onClick={onCancel}>
          Cancel
        </GoAButton>
        <GoAButton
          disabled={!definition.namespace || !definition.name}
          buttonType="primary"
          data-testid="form-save"
          type="submit"
          onClick={(e) => {
            onSave({ ...definition, payloadSchema: JSON.parse(definition.payloadSchema) });
            e.preventDefault();
          }}
        >
          Save
        </GoAButton>
      </GoAFormButtons>
    </GoAForm>
  );
};
