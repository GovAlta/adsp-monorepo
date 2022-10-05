import React, { FunctionComponent, useState, useEffect } from 'react';
import { ScriptEditorContainer, EditTemplateActions, MonacoDivBody } from '../styled-components';
import { GoAForm, GoAFormItem, GoAInput } from '@abgov/react-components/experimental';
import MonacoEditor, { EditorProps } from '@monaco-editor/react';
import { SaveFormModal } from '@components/saveModal';
import { ScriptItem } from '@store/script/models';
import { SaveAndExecuteScript, ClearScripts } from '@store/script/actions';
import { GoAButton, GoAElementLoader } from '@abgov/react-components';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import styled from 'styled-components';

interface ScriptEditorProps {
  editorConfig?: EditorProps;
  name: string;
  description: string;
  scriptStr: string;
  currentScriptItem: ScriptItem;
  onNameChange: (value: string) => void;
  initialScript: ScriptItem;
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
  initialScript,
  onDescriptionChange,
  onScriptChange,
  errors,
  saveAndReset,
  onEditorCancel,
  showScriptEditForm,
}) => {
  const dispatch = useDispatch();
  const [saveModal, setSaveModal] = useState(false);

  const loadingIndicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const resetSavedAction = () => {
    onNameChange(currentScriptItem?.name);
    onDescriptionChange(currentScriptItem?.description);
    onScriptChange(currentScriptItem?.script);
  };

  useEffect(() => {
    console.log(JSON.stringify(currentScriptItem.name) + '<currentscriptItem.name');
    onNameChange(initialScript?.name || '');
    onDescriptionChange(initialScript?.description || '');
    onScriptChange(initialScript?.script || '');
  }, [initialScript]);

  //console.log(JSON.stringify(currentScriptItem) + '<currentScriptItemcurrentScriptItem');

  const scriptResponse = useSelector((state: RootState) => state.scriptService.scriptResponse);
  const scriptService = useSelector((state: RootState) => state.scriptService);

  const saveAndExecute = () => {
    console.log(JSON.stringify('we are dispatching'));
    console.log(JSON.stringify(currentScriptItem.id));
    currentScriptItem.name = name;
    currentScriptItem.description = description;
    currentScriptItem.script = scriptStr;
    initialScript.name = name;
    initialScript.description = description;
    initialScript.script = scriptStr;

    console.log(JSON.stringify(currentScriptItem) + '<currentScriptItemxxxxxxxxxxxxxxx');
    dispatch(SaveAndExecuteScript(currentScriptItem));
  };

  // useEffect(() => {

  // }, [showScriptEditForm]);

  return (
    <div style={{ width: '100%', display: 'flex' }}>
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
                language={'lua'}
                value={scriptStr}
                {...editorConfig}
                onChange={(value) => {
                  console.log(JSON.stringify('we change script'));
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
                  dispatch(ClearScripts());
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
                saveAndExecute();
              }}
              buttonType="primary"
              data-testid="template-form-save"
              type="submit"
            >
              Save and Execute
              {loadingIndicator.show && (
                <SpinnerPadding>
                  <GoAElementLoader visible={true} size="default" baseColour="#c8eef9" spinnerColour="#0070c4" />
                </SpinnerPadding>
              )}
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
            dispatch(ClearScripts());
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
      <div style={{ width: '50%' }}>
        <ScriptPane>
          <h3>Script Response</h3>
          {/* <div>{JSON.stringify(scriptResponse)}</div> */}
          <div>{scriptResponse && scriptResponse.map((response) => <div>{JSON.stringify(response)}</div>)}</div>
        </ScriptPane>
      </div>
    </div>
  );
};

const SpinnerPadding = styled.div`
  margin: 0 0 0 5px;
  float: right;
`;

const ScriptPane = styled.div`
  height: 100%;
  background: #f3f3f3;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 12px;
  line-height: 16px;
  padding: 24px;
  margin-bottom: 1rem;
  overflow: auto;
`;
