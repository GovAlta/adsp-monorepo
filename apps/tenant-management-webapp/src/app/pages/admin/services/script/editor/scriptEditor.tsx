import React, { FunctionComponent, useState, useEffect } from 'react';
import {
  ScriptEditorContainer,
  EditScriptActions,
  MonacoDivBody,
  EditModalStyle,
  ScriptPane,
  ResponseTableStyles,
  TestInputDivBody,
} from '../styled-components';

import MonacoEditor, { EditorProps, useMonaco } from '@monaco-editor/react';
import { languages } from 'monaco-editor';
import { SaveFormModal } from '@components/saveModal';
import { ScriptItem } from '@store/script/models';
import { ClearScripts, ExecuteScript } from '@store/script/actions';
import { useDispatch, useSelector } from 'react-redux';
import CheckmarkCircle from '@components/icons/CheckmarkCircle';
import CloseCircle from '@components/icons/CloseCircle';
import { RootState } from '@store/index';
import { GoASkeletonGridColumnContent } from '@abgov/react-components';
import { functionSuggestion, functionSignature } from '@lib/luaCodeCompletion';
import { buildSuggestions } from '@lib/autoComplete';
import { GoATextArea, GoAInput, GoAButton, GoAFormItem } from '@abgov/react-components-new';
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
  const monaco = useMonaco();
  let activeParam = 0;
  let activeSignature = 0;
  useEffect(() => {
    if (monaco) {
      const completionProvider = monaco.languages.registerCompletionItemProvider('lua', {
        provideCompletionItems: (model, position) => {
          const suggestions = buildSuggestions(monaco, functionSuggestion, model, position);
          return {
            suggestions,
          } as languages.ProviderResult<languages.CompletionList>;
        },
      });

      const helperProvider = monaco.languages.registerSignatureHelpProvider('lua', {
        signatureHelpTriggerCharacters: ['(', ','],
        provideSignatureHelp: (model, position, token) => {
          const textUntilPosition = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });

          if (textUntilPosition.slice(-1) === ',') {
            activeParam++;
          }
          if (textUntilPosition.slice(-1) === ')') {
            activeParam = 0;
          }
          const functionNamePosition = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });
          let functionName = '';

          const functionNameArr = functionNamePosition.split(' ');
          if (functionNameArr[functionNameArr.length - 1] === '(') {
            functionName = functionNameArr[functionNameArr.length - 2];
          } else {
            functionName = functionNameArr[functionNameArr.length - 1];
          }

          for (let i = 0; i < functionSignature.length; i++) {
            if (functionSuggestion[i].label.split('(')[0] === functionName.trim()) {
              activeSignature = i;
            }
          }

          return {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            dispose: () => {},
            value: {
              activeParameter: activeParam,
              activeSignature: activeSignature,
              signatures: functionSignature,
            },
          };
        },
      });
      return function cleanup() {
        activeParam = 0;
        completionProvider.dispose();
        helperProvider.dispose();
      };
    }
  }, [monaco]);
  const loadingIndicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  useEffect(() => {
    onNameChange(selectedScript?.name || '');
    onDescriptionChange(selectedScript?.description || '');
    onScriptChange(selectedScript?.script || '');
  }, [selectedScript]);

  const scriptResponse = useSelector((state: RootState) => state.scriptService.scriptResponse);

  const setTestInput = (input: string) => {
    testInputUpdate(input);
  };

  const getInput = (input: string) => {
    return testInput.length > 0 ? { inputs: JSON.parse(testInput) } : {};
  };

  const updateScript = () => {
    selectedScript.name = name;
    selectedScript.description = description;
    selectedScript.script = scriptStr;
    selectedScript.testInputs = getInput(testInput);
    return selectedScript;
  };
  const hasChanged = () => {
    return (
      selectedScript.name !== name ||
      selectedScript.description !== description ||
      selectedScript.script !== scriptStr ||
      selectedScript.testInputs !== testInput
    );
  };

  //eslint-disable-next-line
  const parseTestResult = (result: string | Record<string, any>) => {
    if (typeof result !== 'string') {
      return JSON.stringify(result);
    }
    return result;
  };

  return (
    <EditModalStyle>
      <ScriptEditorContainer>
        <GoAFormItem error={errors?.['name']} label="Name">
          <GoAInput
            type="text"
            name="name"
            width="100%"
            value={name}
            testId={`script-modal-name-input`}
            aria-label="script-name"
            onChange={(key, value) => {
              onNameChange(value);
            }}
          />
        </GoAFormItem>
        <GoAFormItem error={errors?.['description']} label="Description">
          <GoATextArea
            name="description"
            value={description}
            testId={`script-modal-description-input`}
            aria-label="script-description"
            width="100%"
            onChange={(name, value) => {
              onDescriptionChange(value);
            }}
          />
        </GoAFormItem>
        <GoAFormItem label="Lua script">
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
            testId="template-form-close"
            type="secondary"
          >
            Back
          </GoAButton>
          <div>
            <GoAButton
              onClick={() => {
                updateScript();
                saveAndReset(selectedScript);
                setSaveModal(false);
                onEditorCancel();
              }}
              testId="template-form-save"
              type="primary"
              disabled={Object.keys(errors).length > 0 || !hasChanged()}
            >
              Save
            </GoAButton>
          </div>
        </EditScriptActions>
      </ScriptEditorContainer>
      {/* Form */}
      <SaveFormModal
        open={saveModal}
        onDontSave={() => {
          resetSavedAction();
          setSaveModal(false);
          onEditorCancel();
          dispatch(ClearScripts());
        }}
        saveDisable={Object.keys(errors).length > 0 || !hasChanged()}
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
      <div className="half-width">
        <ScriptPane>
          <div className="flex-column">
            <div className="flex-one">
              <GoAFormItem error={errors?.['payloadSchema']} label="Test input">
                <TestInputDivBody data-testid="templated-editor-test">
                  <MonacoEditor
                    language={'json'}
                    value={testInput}
                    {...editorConfig}
                    onChange={(value) => {
                      setTestInput(value);
                    }}
                  />
                </TestInputDivBody>
              </GoAFormItem>
            </div>
            <div className="execute-button">
              <GoAButton
                onClick={() => {
                  const testItem: ScriptItem = {
                    testInputs: {
                      inputs: JSON.parse(testInput),
                    },
                    script: scriptStr,
                  };
                  dispatch(ExecuteScript(testItem));
                }}
                disabled={errors?.['payloadSchema'] || loadingIndicator.show}
                testId="template-form-execute"
                type="secondary"
              >
                Execute
              </GoAButton>
            </div>

            <ResponseTableStyles>
              <table id="response-information">
                <thead>
                  <tr>
                    <th data-testid="response-header-result">Result</th>
                    <th data-testid="response-header-input">Input</th>
                    <th data-testid="response-header-output">Output</th>
                  </tr>
                </thead>

                <tbody>
                  {loadingIndicator.show && (
                    <tr>
                      <td colSpan={3}>
                        <GoASkeletonGridColumnContent key={1} rows={1}></GoASkeletonGridColumnContent>
                      </td>
                    </tr>
                  )}

                  {scriptResponse &&
                    scriptResponse.map((response) => (
                      <tr>
                        <td data-testid="response-result">
                          <div className="flex-horizontal">
                            <div className="mt-1">
                              {!response.hasError ? <CheckmarkCircle size="medium" /> : <CloseCircle size="medium" />}
                            </div>
                            <div className="mt-3">{response.hasError ? response.result : 'Success'}</div>
                          </div>
                        </td>
                        <td data-testid="response-inputs">{JSON.stringify(response.inputs)}</td>
                        <td data-testid="response-output">
                          {!response.hasError ? parseTestResult(response.result) : ''}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </ResponseTableStyles>
          </div>
        </ScriptPane>
      </div>
    </EditModalStyle>
  );
};
