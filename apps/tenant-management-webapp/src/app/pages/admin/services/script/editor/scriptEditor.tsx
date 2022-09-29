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
  const dispatch = useDispatch();
  const [saveModal, setSaveModal] = useState(false);

  const resetSavedAction = () => {
    onNameChange(currentScriptItem.name);
    onDescriptionChange(currentScriptItem.description);
    onScriptChange(currentScriptItem.script);
  };

  console.log(JSON.stringify(currentScriptItem) + '<currentScriptItemcurrentScriptItem');

  const scriptResponse = useSelector((state: RootState) => state.scriptService.scriptResponse);

  const execute = () => {
    console.log(JSON.stringify('we are dispatching'));
    console.log(JSON.stringify(currentScriptItem.id));
    dispatch(runScript(currentScriptItem.id));
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

          <MonacoEditor
            language="lua"
            value={scriptStr}
            {...editorConfig}
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
