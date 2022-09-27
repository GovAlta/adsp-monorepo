import React, { FunctionComponent, useState } from 'react';
import { ScriptEditorContainer, EditTemplateActions, MonacoDivBody } from '../styled-components';
import { GoAForm, GoAFormItem, GoAInput } from '@abgov/react-components/experimental';
import MonacoEditor, { EditorProps } from '@monaco-editor/react';
import { SaveFormModal } from '@components/saveModal';
import { ScriptItem } from '@store/script/models';
import { runScript } from '@store/script/actions';
import { GoAButton } from '@abgov/react-components';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';

interface ScriptEditorProps {
  modelOpen: boolean;

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
}

export const ScriptEditor: FunctionComponent<ScriptEditorProps> = ({
  modelOpen,

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
}) => {
  const dispatch = useDispatch();
  const [saveModal, setSaveModal] = useState(false);
  const oldScript = currentScriptItem;
  const resetSavedAction = () => {
    console.log(JSON.stringify('ressetting'));
    name = oldScript.name;
    description = oldScript.description;
    scriptStr = oldScript.script;
  };

  console.log(JSON.stringify(currentScriptItem) + '<currentScriptItemcurrentScriptItem');

  const scriptResponse = useSelector((state: RootState) => state.scriptService.scriptResponse);

  const execute = () => {
    console.log(JSON.stringify('we are dispatching'));
    console.log(JSON.stringify(currentScriptItem.id));
    dispatch(runScript(currentScriptItem.id));
  };

  return (
    <div style={{ width: '100%', display: 'flex' }}>
      <ScriptEditorContainer>
        <GoAForm>
          <GoAFormItem error={errors?.['name']}>
            <label>Name</label>
            <GoAInput
              type="text"
              name="name"
              value={name}
              data-testid={`script-modal-name-input`}
              aria-label="script-name"
              onChange={(value) => {
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
                onDescriptionChange(name, value);
              }}
            />
          </GoAFormItem>
          <GoAFormItem>
            <MonacoDivBody data-testid="templated-editor-body">
              <MonacoEditor
                language={'lua'}
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
                setSaveModal(true);
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
            >
              Save
            </GoAButton>
            <GoAButton
              onClick={() => {
                execute();
              }}
              buttonType="primary"
              data-testid="template-form-save"
              type="submit"
            >
              Execute
            </GoAButton>
          </EditTemplateActions>
        </GoAForm>
        {/* Form */}
        <SaveFormModal
          open={saveModal}
          onDontSave={() => {
            resetSavedAction();
            setSaveModal(false);
          }}
          onSave={() => {
            saveAndReset();
            setSaveModal(false);
          }}
          onCancel={() => {
            resetSavedAction();
            setSaveModal(false);
          }}
        />
      </ScriptEditorContainer>
      <div style={{ width: '100%' }}>
        <h3>Script Response</h3>
        <div>{scriptResponse}</div>
      </div>
    </div>
  );
};
