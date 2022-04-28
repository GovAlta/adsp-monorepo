import React, { FunctionComponent, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { GoAButton } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { ConfigDefinition } from '@store/configuration/model';

interface AddEditConfigDefinitionProps {
  onSave: (definition: ConfigDefinition) => void;
  initialValue: ConfigDefinition;
  open: boolean;
  isEdit: boolean;
  onClose: () => void;
}
export const AddEditConfigDefinition: FunctionComponent<AddEditConfigDefinitionProps> = ({
  onSave,
  initialValue,
  open,
  isEdit,
  onClose,
}) => {
  const [definition, setDefinition] = useState<ConfigDefinition>(initialValue);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const regex = new RegExp(/^[a-zA-Z0-9-]+$/);

  const hasFormErrors = () => {
    return Object.keys(errors).length !== 0;
  };
  useEffect(() => {
    setDefinition(initialValue);
  }, [initialValue]);
  return (
    <>
      <GoAModal testId="definition-form" isOpen={open}>
        <GoAModalTitle testId="definition-form-title">{isEdit ? 'Edit definition' : 'Add definition'}</GoAModalTitle>
        <GoAModalContent>
          <GoAForm>
            <GoAFormItem error={errors?.['namespace']}>
              <label>Namespace</label>
              <input
                type="text"
                name="namespace"
                value={definition.namespace}
                disabled={isEdit}
                data-testid="form-namespace"
                aria-label="nameSpace"
                onChange={(e) => {
                  if (!regex.test(e.target.value)) {
                    setErrors({ ...errors, namespace: 'Allowed characters: a-z, A-Z, 0-9, -' });
                  } else {
                    if (e.target.value.toLocaleLowerCase() === 'platform') {
                      setErrors({ ...errors, namespace: 'Cannot use the word platform as namespace' });
                    } else {
                      delete errors['namespace'];
                      setErrors({ ...errors });
                    }
                  }
                  setDefinition({ ...definition, namespace: e.target.value });
                }}
              />
            </GoAFormItem>
            <GoAFormItem error={errors?.['name']}>
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={definition.name}
                disabled={isEdit}
                data-testid="form-name"
                aria-label="name"
                onChange={(e) => {
                  if (!regex.test(e.target.value)) {
                    setErrors({ ...errors, name: 'Allowed characters: a-z, A-Z, 0-9, -' });
                  } else {
                    delete errors['name'];
                    setErrors({ ...errors });
                  }
                  setDefinition({ ...definition, name: e.target.value });
                }}
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
              setErrors({});
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            disabled={!definition.namespace || !definition.name || hasFormErrors()}
            buttonType="primary"
            data-testid="form-save"
            type="submit"
            onClick={(e) => {
              // if no errors in the form then save the definition
              if (!hasFormErrors()) {
                onSave(definition);
                setDefinition(initialValue);
                onClose();
              } else {
                return;
              }
            }}
          >
            Save
          </GoAButton>
        </GoAModalActions>
      </GoAModal>
    </>
  );
};
