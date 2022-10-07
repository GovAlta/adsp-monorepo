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
  onNameChange: (value: string) => void;
  testInput: string;
  testInputUpdate: (value: string) => void;
  selectedScript: ScriptItem;
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
  onNameChange,
  selectedScript,
  testInput,
  testInputUpdate,
  onDescriptionChange,
  onScriptChange,
  errors,
  saveAndReset,
  onEditorCancel,
}) => {
  const dispatch = useDispatch();
  const [saveModal, setSaveModal] = useState(false);

  const loadingIndicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const resetSavedAction = () => {
    onNameChange(selectedScript?.name || '');
    onDescriptionChange(selectedScript?.description || '');
    onScriptChange(selectedScript?.script || '');
  };

  useEffect(() => {
    onNameChange(selectedScript?.name || '');
    onDescriptionChange(selectedScript?.description || '');
    onScriptChange(selectedScript?.script || '');
  }, [selectedScript]);

  const scriptResponse = useSelector((state: RootState) => state.scriptService.scriptResponse);

  const saveAndExecute = () => {
    dispatch(SaveAndExecuteScript(updateScript()));
  };

  const setTestInput = (input: string) => {
    testInputUpdate(input);
  };

  const updateScript = () => {
    selectedScript.name = name;
    selectedScript.description = description;
    selectedScript.script = scriptStr;
    selectedScript.testInputs = testInput.length > 0 ? { inputs: JSON.parse(testInput) } : {};

    return selectedScript;
  };

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
                  onScriptChange(value);
                }}
              />
            </MonacoDivBody>
          </GoAFormItem>
          <EditTemplateActions>
            <GoAButton
              onClick={() => {
                if (
                  selectedScript.name !== name ||
                  selectedScript.description !== description ||
                  selectedScript.script !== scriptStr
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
              Close
            </GoAButton>
            <GoAButton
              onClick={() => {
                updateScript();
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
            dispatch(ClearScripts());
          }}
          onSave={() => {
            updateScript();
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
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1 }}>
              <GoAFormItem error={errors?.['payloadSchema']}>
                <div style={{ display: 'flex' }}>
                  <label style={{ paddingTop: '10px' }}>Test input</label>

                  <div style={{ margin: '0 10px 10px 10px' }}>
                    <GoAButton
                      onClick={() => {
                        saveAndExecute();
                      }}
                      buttonType="primary"
                      disabled={errors?.['payloadSchema']}
                      data-testid="template-form-save"
                      type="submit"
                    >
                      <div style={{ display: 'flex' }}>
                        <div style={{ paddingTop: '2px' }}>Save and Execute</div>
                        {loadingIndicator.show ? (
                          <SpinnerPadding>
                            <GoAElementLoader
                              visible={true}
                              size="default"
                              baseColour="#c8eef9"
                              spinnerColour="#0070c4"
                            />
                          </SpinnerPadding>
                        ) : (
                          <ReplacePadding />
                        )}
                      </div>
                    </GoAButton>
                  </div>
                </div>
                <MonacoDivBody data-testid="templated-editor-test">
                  <MonacoEditor
                    language="json"
                    value={testInput}
                    {...editorConfig}
                    onChange={(value) => {
                      setTestInput(value);
                    }}
                  />
                </MonacoDivBody>
              </GoAFormItem>
            </div>
            <div style={{ flex: 1, height: '100%' }}>
              <h4>Script Response</h4>
              <div className="script-response">
                {scriptResponse && scriptResponse.map((response) => <div>{JSON.stringify(response)}</div>)}
              </div>
            </div>
          </div>
        </ScriptPane>
      </div>
    </div>
  );
};

const SpinnerPadding = styled.div`
  float: right;
  padding: 3px 0 0 4px;
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

  .script-response {
    background: white;
    padding: 10px;
    border: 1px solid black;
    height: 30vh;
    overflow-y: auto;
  }
`;

const ReplacePadding = styled.div`
  padding: 12px 11px 11px 11px;
`;
