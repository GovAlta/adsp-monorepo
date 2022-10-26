import React, { FunctionComponent, useState, useEffect } from 'react';
import {
  ScriptEditorContainer,
  EditScriptActions,
  MonacoDivBody,
  EditModalStyle,
  ScriptPane,
  ResponseTableStyles,
} from '../styled-components';
import { GoAForm, GoAFormItem, GoAInput } from '@abgov/react-components/experimental';
import MonacoEditor, { EditorProps } from '@monaco-editor/react';
import { SaveFormModal } from '@components/saveModal';
import { ScriptItem } from '@store/script/models';
import { SaveAndExecuteScript, ClearScripts } from '@store/script/actions';
import { GoAButton } from '@abgov/react-components';
import { useDispatch, useSelector } from 'react-redux';
import CheckmarkCircle from '@components/icons/CheckmarkCircle';
import CloseCircle from '@components/icons/CloseCircle';
import { RootState } from '@store/index';
import DataTable from '@components/DataTable';

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
  saveAndReset: (script: ScriptItem) => void;
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
  const hasChanged = () => {
    return (
      selectedScript.name !== name || selectedScript.description !== description || selectedScript.script !== scriptStr
    );
  };
  return (
    <EditModalStyle>
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
              onChange={(key, value) => {
                const name = value.substring(0, 32);
                onNameChange(name);
              }}
            />
          </GoAFormItem>
          <GoAFormItem error={errors?.['description']}>
            <label>Description</label>
            <textarea
              name="description"
              value={description}
              data-testid={`script-modal-description-input`}
              aria-label="script-description"
              maxLength={250}
              className="goa-textarea"
              onChange={(e) => {
                onDescriptionChange(e.target.value);
              }}
            />
          </GoAFormItem>
          <GoAFormItem>
            <label>Lua script</label>
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
          <EditScriptActions>
            <GoAButton
              onClick={() => {
                if (hasChanged()) {
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
                saveAndReset(selectedScript);
                setSaveModal(false);
                onEditorCancel();
              }}
              buttonType="primary"
              data-testid="template-form-save"
              type="submit"
              disabled={Object.keys(errors).length > 0 || !hasChanged()}
            >
              Save
            </GoAButton>
          </EditScriptActions>
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
            saveAndReset(selectedScript);
            setSaveModal(false);
            onEditorCancel();
          }}
          onCancel={() => {
            setSaveModal(false);
          }}
        />

        <ScriptPane>
          <div className="flex-column">
            <div className="flex-one">
              <GoAFormItem error={errors?.['payloadSchema']}>
                <div className="flex">
                  <label className="mt-2">Test input</label>
                </div>
                <MonacoDivBody data-testid="templated-editor-test">
                  <MonacoEditor
                    language={'json'}
                    value={testInput}
                    {...editorConfig}
                    onChange={(value) => {
                      setTestInput(value);
                    }}
                  />
                </MonacoDivBody>
              </GoAFormItem>
            </div>
            <div className="execute-button">
              <GoAButton
                onClick={() => {
                  saveAndExecute();
                }}
                buttonType="secondary"
                disabled={errors?.['payloadSchema']}
                data-testid="template-form-save"
                type="submit"
              >
                <div className="flex">
                  <div className="pt-1">Execute</div>
                </div>
              </GoAButton>
            </div>
            <div className="flex-one full-height">
              {scriptResponse && (
                <>
                  <label className="responseLabel">Script response</label>
                  <ResponseTableStyles>
                    <DataTable id="response-information">
                      <thead>
                        <tr>
                          <th data-testid="response-header-time-to-run">Time to run</th>
                          <th data-testid="response-header-input">Input</th>
                          <th data-testid="response-header-result">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scriptResponse.map((response) => (
                          <tr>
                            <td data-testid="response-time-to-run">{response.timeToRun}</td>
                            <td data-testid="response-inputs">{JSON.stringify(response.inputs)}</td>
                            <td data-testid="response-result">
                              <div className="flex-horizontal">
                                {!response.hasError ? <CheckmarkCircle size="medium" /> : <CloseCircle size="medium" />}
                                <div className="mt-3">{response.result}</div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </DataTable>
                  </ResponseTableStyles>
                </>
              )}
            </div>
          </div>
        </ScriptPane>
      </ScriptEditorContainer>
    </EditModalStyle>
  );
};
