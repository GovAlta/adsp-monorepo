import React, { FunctionComponent, useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { EventDefinition } from '@store/event/models';
import { GoabButton, GoabButtonGroup, GoabInput, GoabFormItem, GoabModal, GoabTextArea } from '@abgov/react-components';
import {
  wordCheck,
  isNotEmptyCheck,
  Validator,
  isValidJSONCheck,
  wordMaxLengthCheck,
  badCharsCheckNoSpace,
  duplicateNameCheck,
} from '@lib/validation/checkInput';
import { useValidators } from '@lib/validation/useValidators';
import { updateEventDefinition } from '@store/event/actions';
import { useDispatch } from 'react-redux';
import { HelpTextComponent } from '@components/HelpTextComponent';
import styled from 'styled-components';
import {
  GoabTextAreaOnKeyPressDetail,
  GoabTextAreaOnChangeDetail,
  GoabInputOnChangeDetail,
} from '@abgov/ui-components-common';

interface EventDefinitionFormProps {
  initialValue?: EventDefinition;
  definitions: Record<string, unknown>;
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
  definitions,
}) => {
  const [definition, setDefinition] = useState<EventDefinition>(initialValue);
  const dispatch = useDispatch();
  const [payloadSchema, setPayloadSchema] = useState<string>(JSON.stringify(definition.payloadSchema, null, 2));

  const forbiddenWords = coreNamespaces.concat('platform');
  const checkForConflicts = wordCheck(forbiddenWords);
  const identifiers = Object.keys(definitions);
  const namespaceCheck = (): Validator => {
    return (namespace: string) => {
      return namespace === 'platform' ? 'Cannot use the word platform as namespace' : '';
    };
  };
  const descErrMessage = 'Event description can not be over 180 characters';

  useEffect(() => {
    setDefinition(initialValue);
  }, [initialValue]);
  const { errors, validators } = useValidators(
    'namespace',
    'namespace',
    namespaceCheck(),
    badCharsCheckNoSpace,
    checkForConflicts,
    wordMaxLengthCheck(32, 'Namespace'),
    isNotEmptyCheck('namespace')
  )
    .add('name', 'name', badCharsCheckNoSpace, wordMaxLengthCheck(32, 'Name'), isNotEmptyCheck('name'))
    .add('duplicated', 'name', duplicateNameCheck(identifiers, 'Event'))
    .add('payloadSchema', 'payloadSchema', isValidJSONCheck('payloadSchema'))
    .add('description', 'description', wordMaxLengthCheck(250, 'Description'))
    .build();

  return (
    <ModalOverwrite>
      <GoabModal
        testId="definition-form"
        open={open}
        heading={isEdit ? 'Edit definition' : 'Add definition'}
        actions={
          <GoabButtonGroup alignment="end">
            <GoabButton
              testId="form-cancel"
              type="secondary"
              onClick={() => {
                onClose();
                validators.clear();
              }}
            >
              Cancel
            </GoabButton>
            <GoabButton
              disabled={!definition.namespace || !definition.name || validators.haveErrors()}
              type="primary"
              testId="form-save"
              onClick={() => {
                const validations = {
                  payloadSchema: payloadSchema,
                };

                if (!isEdit) {
                  validations['namespace'] = definition?.namespace;
                  validations['duplicated'] = `${definition?.namespace}:${definition?.name}`;
                  validations['description'] = definition.description;
                  validations['name'] = definition.name;
                }

                if (!validators.checkAll(validations)) {
                  return;
                }
                dispatch(updateEventDefinition({ ...definition, payloadSchema: JSON.parse(payloadSchema) }));
                if (onSave) {
                  onSave();
                }
                onClose();
                validators.clear();
              }}
            >
              Save
            </GoabButton>
          </GoabButtonGroup>
        }
      >
        <GoabFormItem error={errors?.['namespace']} label="Namespace">
          <GoabInput
            type="text"
            name="namespace"
            value={definition.namespace}
            disabled={isEdit}
            width="100%"
            testId="form-namespace"
            aria-label="nameSpace"
            onChange={(detail: GoabInputOnChangeDetail) => {
              validators.remove('namespace');
              validators['namespace'].check(detail.value);
              setDefinition({ ...definition, namespace: detail.value });
            }}
          />
        </GoabFormItem>
        <GoabFormItem error={errors?.['name']} label="Name">
          <GoabInput
            type="text"
            name="name"
            width="100%"
            value={definition.name}
            disabled={isEdit}
            testId="form-name"
            aria-label="name"
            onChange={(detail: GoabInputOnChangeDetail) => {
              validators.remove('name');
              validators['name'].check(detail.value);
              setDefinition({ ...definition, name: detail.value });
            }}
          />
        </GoabFormItem>
        <GoabFormItem error={errors?.['description']} label="Description">
          <GoabTextArea
            name="description"
            testId="form-description"
            value={definition.description}
            aria-label="description"
            width="100%"
            onKeyPress={(detail: GoabTextAreaOnKeyPressDetail) => {
              validators.remove('description');
              validators['description'].check(detail.value);
              setDefinition({ ...definition, description: detail.value });
            }}
            // eslint-disable-next-line
            onChange={(detail: GoabTextAreaOnChangeDetail) => {}}
          />
          <HelpTextComponent
            length={definition?.description?.length || 0}
            maxLength={180}
            descErrMessage={descErrMessage}
            errorMsg={errors?.['description']}
          />
        </GoabFormItem>
        <GoabFormItem error={errors?.['payloadSchema']} label="Payload schema">
          <Editor
            data-testid="form-schema"
            height={200}
            value={payloadSchema}
            onChange={(value) => {
              validators.remove('payloadSchema');
              setPayloadSchema(value);
            }}
            width="99%"
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
