import React, { FunctionComponent, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { GoAButton, GoAButtonGroup, GoAInput, GoAModal, GoAFormItem, GoATextArea } from '@abgov/react-components-new';
import { ConfigDefinition } from '@store/configuration/model';
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

interface AddEditConfigDefinitionProps {
  onSave: (definition: ConfigDefinition) => void;
  initialValue: ConfigDefinition;
  open: boolean;
  isEdit: boolean;
  onClose: () => void;
  configurations: Record<string, unknown>;
}

export const AddEditConfigDefinition: FunctionComponent<AddEditConfigDefinitionProps> = ({
  onSave,
  initialValue,
  open,
  isEdit,
  onClose,
  configurations,
}) => {
  const [definition, setDefinition] = useState<ConfigDefinition>(initialValue);
  const [payloadSchema, setPayloadSchema] = useState<string>(JSON.stringify(definition.configurationSchema, null, 2));
  const [spinner, setSpinner] = useState<boolean>(false);
  const identifiers = Object.keys(configurations);
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
    .add('duplicated', 'name', duplicateNameCheck(identifiers, 'Configuration'))
    .add('payloadSchema', 'payloadSchema', isValidJSONCheck('payloadSchema'))
    .add('description', 'description', wordMaxLengthCheck(250, 'Description'))
    .build();

  useEffect(() => {
    setDefinition({ ...initialValue });
    setPayloadSchema(JSON.stringify(initialValue.configurationSchema, null, 2));
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
    onSave({ ...definition, configurationSchema: payloadSchemaObj, description: definition.description });
    setDefinition(initialValue);
    onClose();
  };

  return (
    <ModalOverwrite>
      <GoAModal
        testId="definition-form"
        open={open}
        heading={isEdit ? 'Edit definition' : 'Add definition'}
        actions={
          <GoAButtonGroup alignment="end">
            <GoAButton
              testId="form-cancel"
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
              testId="form-save"
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
            testId="form-namespace"
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
            testId="form-name"
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
            testId="form-description"
            aria-label="description"
            width="100%"
            // eslint-disable-next-line
            onChange={() => {}}
            onKeyPress={(name, value) => {
              validators.remove('description');
              validators['description'].check(value);
              setDefinition({ ...definition, description: value });
            }}
          />
        </GoAFormItem>
        <GoAFormItem error={errors?.['payloadSchema']} label="Payload schema">
          <Editor
            data-testid="form-schema"
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
