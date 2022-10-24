import React, { FunctionComponent, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { GoAButton, GoAElementLoader } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem, GoAInput } from '@abgov/react-components/experimental';
import { ConfigDefinition } from '@store/configuration/model';
import { RootState } from '@store/index';
import { useSelector } from 'react-redux';
import { useValidators } from '@lib/useValidators';
import { characterCheck, validationPattern, isNotEmptyCheck, isValidJSONCheck, Validator } from '@lib/checkInput';
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
  const getIdentifer = () => {
    return Object.keys(configurations);
  };
  const [definition, setDefinition] = useState<ConfigDefinition>(initialValue);
  const [payloadSchema, setPayloadSchema] = useState<string>(JSON.stringify(definition.configurationSchema, null, 2));
  const [spinner, setSpinner] = useState<boolean>(false);
  const identifiers = getIdentifer();
  const checkForBadChars = characterCheck(validationPattern.mixedKebabCase);
  const loadingIndicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  const duplicateConfigCheck = (identifiers: string[]): Validator => {
    return (identifier: string) => {
      return identifiers.includes(identifier) ? `Duplicated event ${identifier}.` : '';
    };
  };

  const MAX_NAME_LENGTH = 32;
  const MAX_NAMESPACE_LENGTH = 32;

  const namespaceCheck = (): Validator => {
    return (namespace: string) => {
      return namespace === 'platform' ? 'Cannot use the word platform as namespace' : '';
    };
  };

  const descriptionCheck = (): Validator => (description: string) =>
    description.length > 250 ? 'Description could not over 250 characters ' : '';

  const { errors, validators } = useValidators(
    'namespace',
    'namespace',
    checkForBadChars,
    namespaceCheck(),
    isNotEmptyCheck('namespace')
  )
    .add('name', 'name', checkForBadChars, isNotEmptyCheck('name'))
    .add('duplicated', 'name', duplicateConfigCheck(identifiers))
    .add('payloadSchema', 'payloadSchema', isValidJSONCheck('payloadSchema'))
    .add('description', 'description', descriptionCheck())
    .build();

  useEffect(() => {
    setDefinition(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (spinner && loadingIndicator.show) {
      validationCheck();
      setSpinner(false);
    }
  }, [configurations]);

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
    <>
      <ModalOverwrite>
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
                  onChange={(key, value) => {
                    const namespace = value.substring(0, MAX_NAMESPACE_LENGTH);
                    validators.remove('namespace');
                    validators['namespace'].check(namespace);
                    setDefinition({ ...definition, namespace });
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
                  onChange={(key, value) => {
                    const name = value.substring(0, MAX_NAME_LENGTH);
                    validators.remove('name');
                    validators['name'].check(name);
                    setDefinition({ ...definition, name });
                  }}
                />
              </GoAFormItem>
              <GoAFormItem error={errors?.['description']}>
                <label>Description</label>
                <textarea
                  name="description"
                  value={definition.description}
                  data-testid="form-description"
                  aria-label="description"
                  maxLength={250}
                  onChange={(e) => {
                    const description = e.target.value;
                    validators.remove('description');
                    validators['description'].check(description);
                    setDefinition({ ...definition, description });
                  }}
                />
              </GoAFormItem>
              <GoAFormItem error={errors?.['payloadSchema']}>
                <label>Payload schema</label>
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
            </GoAForm>
          </GoAModalContent>
          <GoAModalActions>
            <GoAButton
              data-testid="form-cancel"
              buttonType="secondary"
              type="button"
              onClick={() => {
                setDefinition(initialValue);
                onClose();
                validators.clear();
              }}
            >
              Cancel
            </GoAButton>
            <GoAButton
              buttonType="primary"
              data-testid="form-save"
              disabled={!definition.name || !definition.namespace || Object.entries(errors).length > 0}
              type="submit"
              onClick={(e) => {
                if (loadingIndicator.show) {
                  setSpinner(true);
                } else {
                  validationCheck();
                }
              }}
            >
              Save
              {spinner && (
                <SpinnerPadding>
                  <GoAElementLoader visible={true} size="default" baseColour="#c8eef9" spinnerColour="#0070c4" />
                </SpinnerPadding>
              )}
            </GoAButton>
          </GoAModalActions>
        </GoAModal>
      </ModalOverwrite>
    </>
  );
};

const ModalOverwrite = styled.div`
  .modal {
    max-height: 100% !important;
  }
`;
const SpinnerPadding = styled.div`
  margin: 0 0 0 5px;
  float: right;
`;
