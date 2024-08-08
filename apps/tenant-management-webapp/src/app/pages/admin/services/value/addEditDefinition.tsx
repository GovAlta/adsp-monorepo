import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  GoAButton,
  GoAButtonGroup,
  GoAInput,
  GoAModal,
  GoAFormItem,
  GoATextArea,
  GoACheckbox,
  GoASpacer,
} from '@abgov/react-components-new';
import { ValueDefinition } from '@store/value/models';
import { RootState } from '@store/index';
import { useSelector } from 'react-redux';
import { useValidators } from '@lib/validation/useValidators';
import {
  isNotEmptyCheck,
  isValidJSONCheck,
  Validator,
  duplicateNameCheck,
  wordMaxLengthCheck,
  badCharsCheck,
} from '@lib/validation/checkInput';
import styled from 'styled-components';
import { defaultValueDefinition } from '@store/value/models';

interface AddEditValueDefinitionProps {
  onSave: (definition: ValueDefinition) => void;
  initialValue: ValueDefinition;
  open: boolean;
  isEdit: boolean;
  onClose: () => void;
  values: ValueDefinition[];
}

export const AddEditValueDefinition = ({
  onSave,
  initialValue,
  open,
  isEdit,
  onClose,
  values,
}: AddEditValueDefinitionProps): JSX.Element => {
  const [definition, setDefinition] = useState<ValueDefinition>(initialValue);
  const [payloadSchema, setPayloadSchema] = useState<string>(JSON.stringify(definition.jsonSchema, null, 2));
  const [spinner, setSpinner] = useState<boolean>(false);
  const identifiers = values && Object.values(values).map((v: ValueDefinition) => `${v.namespace}:${v.name}`);
  const loadingIndicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const namespaceCheck = (): Validator => {
    return (namespace: string) => {
      return namespace === 'platform' ? 'Cannot use the word platform as namespace' : '';
    };
  };

  const { errors, validators } = useValidators(
    'namespace',
    'namespace',
    badCharsCheck,
    namespaceCheck(),
    isNotEmptyCheck('namespace'),
    wordMaxLengthCheck(32, 'Namespace')
  )
    .add('name', 'name', badCharsCheck, isNotEmptyCheck('name'), wordMaxLengthCheck(32, 'Name'))
    .add('duplicated', 'name', duplicateNameCheck(identifiers, 'Value'))
    .add('payloadSchema', 'payloadSchema', isValidJSONCheck('payloadSchema'))
    .add('description', 'description', wordMaxLengthCheck(250, 'Description'))
    .build();

  useEffect(() => {
    setDefinition({ ...initialValue });
    setPayloadSchema(JSON.stringify(initialValue?.jsonSchema, null, 2));
  }, [initialValue]);

  const validationCheck = () => {
    const validations = {
      payloadSchema: payloadSchema,
    };
    if (!isEdit) {
      validations['duplicated'] = `${definition.namespace}:${definition.name}`;
      validations['name'] = definition.name;
      validations['namespace'] = definition.namespace;
      validations['description'] = definition.description;
    }
    if (!validators.checkAll(validations)) {
      return;
    }
    const payloadSchemaObj = JSON.parse(payloadSchema);
    // if no errors in the form then save the definition
    onSave({
      ...definition,
      jsonSchema: payloadSchemaObj,
      description: definition.description,
    });
    setDefinition(initialValue);
    onClose();
  };

  return (
    <ModalOverwrite>
      <GoAModal
        testId="definition-value"
        open={open}
        heading={isEdit ? 'Edit definition' : 'Add definition'}
        actions={
          <GoAButtonGroup alignment="end">
            <GoAButton
              testId="value-cancel"
              type="secondary"
              onClick={() => {
                setDefinition(initialValue);
                onClose();
                validators.clear();
              }}
            >
              Cancel
            </GoAButton>
            <GoAButton
              type="primary"
              testId="value-save"
              disabled={!definition.name || !definition.namespace || Object.entries(errors).length > 0}
              onClick={() => {
                if (loadingIndicator.show) {
                  setSpinner(true);
                } else {
                  validationCheck();
                }
              }}
            >
              Save
            </GoAButton>
          </GoAButtonGroup>
        }
      >
        <GoAFormItem error={errors?.['namespace']} label="Namespace">
          <GoAInput
            type="text"
            name="namespace"
            value={definition.namespace}
            disabled={isEdit}
            testId="value-namespace"
            aria-label="nameSpace"
            width="100%"
            onChange={(key, value) => {
              validators.remove('namespace');
              validators['namespace'].check(value);
              setDefinition({ ...definition, namespace: value });
            }}
          />
        </GoAFormItem>
        <GoAFormItem error={errors?.['name']} label="Name">
          <GoAInput
            type="text"
            name="name"
            value={definition.name}
            disabled={isEdit}
            testId="value-name"
            aria-label="name"
            width="100%"
            onChange={(key, value) => {
              validators.remove('name');
              validators['name'].check(value);
              setDefinition({ ...definition, name: value });
            }}
          />
        </GoAFormItem>
        <GoAFormItem error={errors?.['description']} label="Description">
          <GoATextArea
            name="description"
            value={definition.description}
            testId="value-description"
            aria-label="description"
            width="100%"
            onKeyPress={(name, value, key) => {
              validators.remove('description');
              validators['description'].check(value);
              setDefinition({ ...definition, description: value });
            }}
            // eslint-disable-next-line
            onChange={(name, value) => {}}
          />
        </GoAFormItem>
        <GoASpacer vSpacing="xs"></GoASpacer>
        <GoAFormItem error={errors?.['payloadSchema']} label="Payload schema">
          <Editor
            data-testid="value-schema"
            height={200}
            value={payloadSchema}
            onChange={(value) => {
              validators.remove('payloadSchema');
              setPayloadSchema(value);
            }}
            language="json"
            options={{
              automaticLayout: true,
              scrollBeyondLastLine: false,
              tabSize: 2,
              minimap: { enabled: false },
            }}
          />
        </GoAFormItem>
      </GoAModal>
    </ModalOverwrite>
  );
};

const ModalOverwrite = styled.div`
  .modal {
    max-height: 100% !important;
  }
`;
