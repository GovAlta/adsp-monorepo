import React, { FunctionComponent, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { GoAButton } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem, GoAInput } from '@abgov/react-components/experimental';
import { ConfigDefinition } from '@store/configuration/model';
import { createSelector } from 'reselect';
import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import { useValidators } from '@lib/useValidators';
import { getConfigurationDefinitions } from '@store/configuration/action';
import { characterCheck, validationPattern, isNotEmptyCheck, isValidJSONCheck, Validator } from '@lib/checkInput';
import styled from 'styled-components';

interface AddEditConfigDefinitionProps {
  onSave: (definition: ConfigDefinition) => void;
  initialValue: ConfigDefinition;
  open: boolean;
  isEdit: boolean;
  onClose: () => void;
}

export const selectConfigurationIdentifier = createSelector(
  (state: RootState) => state.configuration?.coreConfigDefinitions?.configuration || {},
  (state: RootState) => state.configuration?.tenantConfigDefinitions?.configuration || {},
  (coreConfig, tenantConfig) => {
    return [...Object.keys(coreConfig), ...Object.keys(tenantConfig)];
  }
);

export const AddEditConfigDefinition: FunctionComponent<AddEditConfigDefinitionProps> = ({
  onSave,
  initialValue,
  open,
  isEdit,
  onClose,
}) => {
  const [definition, setDefinition] = useState<ConfigDefinition>(initialValue);
  const [payloadSchema, setPayloadSchema] = useState<string>(JSON.stringify(definition.configurationSchema, null, 2));

  const identifiers = useSelector(selectConfigurationIdentifier);
  const checkForBadChars = characterCheck(validationPattern.mixedKebabCase);

  const duplicateConfigCheck = (identifiers: string[]): Validator => {
    return (identifier: string) => {
      return identifiers.includes(identifier) ? `Duplicated event ${identifier}.` : '';
    };
  };

  const namespaceCheck = (): Validator => {
    return (namespace: string) => {
      return namespace === 'platform' ? 'Cannot use the word platform as namespace' : '';
    };
  };

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
    .build();

  useEffect(() => {
    setDefinition(initialValue);
  }, [initialValue]);

  const dispatch = useDispatch();
  useEffect(() => {
    if (!identifiers) {
      dispatch(getConfigurationDefinitions());
    }
  }, []);

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
                  onChange={(name, value) => {
                    validators.remove('namespace');
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
                    validators.remove('name');
                    validators['name'].check(value);
                    setDefinition({ ...definition, name: value });
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
                const validations = {
                  payloadSchema: payloadSchema,
                };

                if (!isEdit) {
                  validations['duplicated'] = `${definition.namespace}:${definition.name}`;
                  validations['name'] = definition.name;
                  validations['namespace'] = definition.namespace;
                }
                if (!validators.checkAll(validations)) {
                  return;
                }
                // if no errors in the form then save the definition
                onSave({ ...definition, configurationSchema: JSON.parse(payloadSchema) });
                setDefinition(initialValue);
                onClose();
              }}
            >
              Save
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
