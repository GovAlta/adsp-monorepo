import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  GoabButton,
  GoabButtonGroup,
  GoabInput,
  GoabModal,
  GoabFormItem,
  GoabTextArea,
  GoabSpacer,
} from '@abgov/react-components';
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
import { HelpTextComponent } from '@components/HelpTextComponent';
import { NamespaceDropdown } from '@components/NamespaceDropdown';
import { GoabTextAreaOnKeyPressDetail, GoabInputOnChangeDetail } from '@abgov/ui-components-common';

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

  const existingNamespaces = values
    ? values.map((v: ValueDefinition) => v?.namespace).filter((ns): ns is string => !!ns)
    : [];
  const loadingIndicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  const descErrMessage = 'Value description can not be over 180 characters';
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
      <GoabModal
        testId="definition-value"
        open={open}
        heading={isEdit ? 'Edit definition' : 'Add definition'}
        actions={
          <GoabButtonGroup alignment="end">
            <GoabButton
              testId="value-cancel"
              type="secondary"
              onClick={() => {
                setDefinition(initialValue);
                onClose();
                validators.clear();
              }}
            >
              Cancel
            </GoabButton>
            <GoabButton
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
            </GoabButton>
          </GoabButtonGroup>
        }
      >
        <GoabFormItem error={errors?.['namespace']} label="Namespace">
          <NamespaceDropdown
            value={definition.namespace}
            disabled={isEdit}
            testId="value-namespace"
            existingNamespaces={existingNamespaces}
            onChange={(value: string) => {
              const updatedDefinition = { ...definition, namespace: value };
              setDefinition(updatedDefinition);
              const updatedIdentifiers = values.map((v: ValueDefinition) => `${v.namespace}:${v.name}`);
              const currentIdentifier = `${updatedDefinition.namespace}:${updatedDefinition.name}`;
              validators.remove('duplicated');
              validators['duplicated'].check(currentIdentifier, updatedIdentifiers);
              validators['namespace'].check(value);
            }}
            onBlur={() => validators.checkAll({ namespace: definition.namespace })}
          />
        </GoabFormItem>
        <GoabFormItem error={errors?.['name']} label="Name">
          <GoabInput
            type="text"
            name="name"
            value={definition.name}
            disabled={isEdit}
            testId="value-name"
            aria-label="name"
            width="100%"
            onChange={(detail: GoabInputOnChangeDetail) => {
              const updatedDefinition = { ...definition, name: detail.value };
              setDefinition(updatedDefinition);
              const updatedIdentifiers = values.map((v: ValueDefinition) => `${v.namespace}:${v.name}`);
              const currentIdentifier = `${updatedDefinition.namespace}:${updatedDefinition.name}`;
              validators.remove('duplicated');
              validators['duplicated'].check(currentIdentifier, updatedIdentifiers);
              validators['name'].check(detail.value);
            }}
            onBlur={() => validators.checkAll({ name: definition.name })}
          />
        </GoabFormItem>
        <GoabFormItem error={errors?.['description']} label="Description">
          <GoabTextArea
            name="description"
            value={definition.description}
            testId="value-description"
            aria-label="description"
            width="100%"
            onKeyPress={(detail: GoabTextAreaOnKeyPressDetail) => {
              validators.remove('description');
              validators['description'].check(detail.value);
              setDefinition({ ...definition, description: detail.value });
            }}
            // eslint-disable-next-line
            onChange={() => {}}
          />
          <HelpTextComponent
            length={definition?.description?.length || 0}
            maxLength={180}
            descErrMessage={descErrMessage}
            errorMsg={errors?.['description']}
          />
        </GoabFormItem>
        <GoabSpacer vSpacing="xs"></GoabSpacer>
        <GoabFormItem error={errors?.['payloadSchema']} label="Payload schema">
          <Editor
            data-testid="value-schema"
            height={200}
            width="99%"
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
              folding: true,
              foldingStrategy: 'auto',
              showFoldingControls: 'always',
            }}
          />
        </GoabFormItem>
      </GoabModal>
    </ModalOverwrite>
  );
};

const ModalOverwrite = styled.div`
  .modal {
    max-height: 100% !important;
  }
`;
