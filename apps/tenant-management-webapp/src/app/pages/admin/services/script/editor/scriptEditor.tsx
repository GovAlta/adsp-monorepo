import React, { FunctionComponent, useState } from 'react';
import { ScriptEditorContainer, EditTemplateActions, MonacoDivBody } from '../styled-components';
import { GoAForm, GoAFormItem, GoAInput } from '@abgov/react-components/experimental';
import MonacoEditor, { EditorProps } from '@monaco-editor/react';
import { SaveFormModal } from '@components/saveModal';
import { ScriptItem } from '@store/script/models';
import { GoAButton } from '@abgov/react-components';

interface ScriptEditorProps {
  editorConfig?: EditorProps;
  name: string;
  description: string;
  scriptStr: string;
  currentScriptItem: ScriptItem;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onScriptChange: (value: string) => void;
  // eslint-disable-next-line
  errors?: any;
  saveAndReset: (closeEventModal?: boolean) => void;
  onEditorCancel: () => void;
}

export const ScriptEditor: FunctionComponent<ScriptEditorProps> = ({
  editorConfig,
  name,
  description,
  scriptStr,
  currentScriptItem,
  onNameChange,
  onDescriptionChange,
  onScriptChange,
  errors,
  saveAndReset,
  onEditorCancel,
}) => {
  const [saveModal, setSaveModal] = useState(false);

  const resetSavedAction = () => {
    onNameChange(currentScriptItem.name);
    onDescriptionChange(currentScriptItem.description);
    onScriptChange(currentScriptItem.script);
  };
  return (
    <ScriptEditorContainer>
      <GoAForm>
        <GoAFormItem error={errors?.['name']}>
          <h3 className="reduce-margin" data-testid="modal-title">
            {`Edit script ${name}`}
          </h3>
          <label>Name</label>
          <GoAInput
            type="text"
            name="name"
            value={name}
            data-testid={`script-modal-name-input`}
            aria-label="script-name"
            onChange={(name, value) => {
              onNameChange(value);
            }}
          />
        </GoAFormItem>
        <GoAFormItem error={errors?.['description']}>
          <label>Description</label>
          <GoAInput
            type="text"
            name="description"
            value={description}
            data-testid={`script-modal-description-input`}
            aria-label="script-description"
            onChange={(name, value) => {
              onDescriptionChange(value);
            }}
          />
        </GoAFormItem>
        <GoAFormItem>
          <label>Lua Script</label>
          <MonacoDivBody data-testid="templated-editor-body">
            <MonacoEditor
              language="lua"
              value={scriptStr}
              {...editorConfig}
              onChange={(value) => {
                onScriptChange(value);
              }}
            />
          </MonacoDivBody>
        </GoAFormItem>

        <EditTemplateActions>
          <GoAButton
            onClick={() => {
              if (
                currentScriptItem.name !== name ||
                currentScriptItem.description !== description ||
                currentScriptItem.script !== scriptStr
              ) {
                setSaveModal(true);
              } else {
                onEditorCancel();
              }
            }}
            data-testid="template-form-close"
            buttonType="secondary"
            type="button"
          >
            Cancel
          </GoAButton>
          <GoAButton
            onClick={() => {
              saveAndReset(true);
            }}
            buttonType="primary"
            data-testid="template-form-save"
            type="submit"
            disabled={Object.keys(errors).length > 0}
          >
            Save
          </GoAButton>
        </EditTemplateActions>
      </GoAForm>
      {/* Form */}
      <SaveFormModal
        open={saveModal}
        onDontSave={() => {
          resetSavedAction();
          setSaveModal(false);
          onEditorCancel();
        }}
        onSave={() => {
          saveAndReset(true);
          setSaveModal(false);
        }}
        onCancel={() => {
          setSaveModal(false);
        }}
      />
    </ScriptEditorContainer>
  );
};
