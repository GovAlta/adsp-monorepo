import React, { FunctionComponent, useEffect, useState } from 'react';
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
} from '@abgov/react-components';
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
import { HelpTextComponent } from '@components/HelpTextComponent';

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
  const descErrMessage = 'Configuration description can not be over 180 characters';
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
    onSave({
      ...definition,
      configurationSchema: payloadSchemaObj,
      description: definition.description,
      anonymousRead: definition.anonymousRead,
    });
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
            aria-label="namespace"
            width="100%"
            onChange={(key, value) => {
              const updatedDefinition = { ...definition, namespace: value };
              setDefinition(updatedDefinition);
              const updatedIdentifiers = Object.keys(configurations).map(
                (key) => `${configurations[key]?.namespace}:${configurations[key]?.name}`
              );
              const currentIdentifier = `${updatedDefinition.namespace}:${updatedDefinition.name}`;
              validators.remove('duplicated');
              validators['duplicated'].check(currentIdentifier, updatedIdentifiers);
              validators['namespace'].check(value);
            }}
            onBlur={() => validators.checkAll({ namespace: definition.namespace })}
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
              const updatedDefinition = { ...definition, name: value };
              setDefinition(updatedDefinition);
              const updatedIdentifiers = Object.keys(configurations).map(
                (key) => `${configurations[key]?.namespace}:${configurations[key]?.name}`
              );
              const currentIdentifier = `${updatedDefinition.namespace}:${updatedDefinition.name}`;
              validators.remove('duplicated');
              validators['duplicated'].check(currentIdentifier, updatedIdentifiers);
              validators['name'].check(value);
            }}
            onBlur={() => validators.checkAll({ name: definition.name })}
          />
        </GoAFormItem>

        <GoAFormItem error={errors?.['description']} label="Description">
          <GoATextArea
            name="description"
            value={definition.description}
            testId="form-description"
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
          <HelpTextComponent
            length={definition?.description?.length || 0}
            maxLength={180}
            descErrMessage={descErrMessage}
            errorMsg={errors?.['description']}
          />
        </GoAFormItem>
        <GoASpacer vSpacing="xs"></GoASpacer>
        <GoACheckbox
          name="anonymousRead"
          key="anonymousRead"
          checked={definition.anonymousRead ?? false}
          onChange={(name, value) => {
            setDefinition({ ...definition, anonymousRead: !definition.anonymousRead ?? false });
          }}
          testId={'anonymousRead'}
          ariaLabel="anonymous-read"
          text="Allow anonymous access"
        />
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
              folding: true,
              foldingStrategy: 'auto',
              showFoldingControls: 'always',
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
