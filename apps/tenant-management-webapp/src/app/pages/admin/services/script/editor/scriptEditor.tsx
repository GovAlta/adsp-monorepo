import React, { FunctionComponent, useState, useEffect } from 'react';
import {
  ScriptEditorContainer,
  EditScriptActions,
  MonacoDivBody,
  EditModalStyle,
  ScriptPane,
  ResponseTableStyles,
  TestInputDivBody,
  UseServiceAccountWrapper,
  ScrollPane,
  TextLoadingIndicator,
  MonacoDivTabBody,
} from '../styled-components';
import { TombStone } from './tombstone';

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
import { GoAButton, GoAFormItem, GoACheckbox } from '@abgov/react-components-new';
import { TaskEditorTitle } from '../styled-components';
import { Tab, Tabs } from '@components/Tabs';
import { ClientRoleTable } from '@components/RoleTable';
import { FETCH_KEYCLOAK_SERVICE_ROLES } from '@store/access/actions';
import { ActionState } from '@store/session/models';
import { selectRoleList } from '@store/sharedSelectors/roles';

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
  onSave;
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
  onSave,
}) => {
  const dispatch = useDispatch();
  const [saveModal, setSaveModal] = useState(false);
  const [script, setScript] = useState<ScriptItem>(selectedScript);
  const [activeIndex] = useState<number>(0);

  const resetSavedAction = () => {
    onNameChange(selectedScript?.name || '');
    onDescriptionChange(selectedScript?.description || '');
    onScriptChange(selectedScript?.script || '');
  };
  const monaco = useMonaco();
  let activeParam = 0;
  let activeSignature = 0;

  useEffect(() => {
    setScript(selectedScript);
  }, []);

  const roles = useSelector(selectRoleList);
  const latestNotification = useSelector(
    (state: RootState) => state.notifications.notifications[state.notifications.notifications.length - 1]
  );

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
    selectedScript.runnerRoles = script.runnerRoles;
    return selectedScript;
  };
  const hasChanged = () => {
    return (
      selectedScript.name !== name ||
      selectedScript.description !== description ||
      selectedScript.script !== scriptStr ||
      selectedScript.testInputs !== testInput ||
      selectedScript.runnerRoles.toString() !== script.runnerRoles.toString()
    );
  };

  const types = [{ type: 'runnerRoles', name: 'Runner roles' }];

  const { fetchKeycloakRolesState } = useSelector((state: RootState) => ({
    fetchKeycloakRolesState: state.session.indicator?.details[FETCH_KEYCLOAK_SERVICE_ROLES] || '',
  }));
  //eslint-disable-next-line
  useEffect(() => {}, [fetchKeycloakRolesState]);

  const ClientRole = ({ roleNames, clientId }) => {
    const runnerRoles = types[0];

    return (
      <>
        <ClientRoleTable
          roles={roleNames}
          clientId={clientId}
          roleSelectFunc={(roles, type) => {
            if (type === runnerRoles.name) {
              setScript({
                ...script,
                runnerRoles: roles,
              });
            }
          }}
          nameColumnWidth={80}
          service="Script"
          checkedRoles={[{ title: types[0].name, selectedRoles: script[types[0].type] }]}
        />
      </>
    );
  };

  //eslint-disable-next-line
  const parseTestResult = (result: string | Record<string, any>) => {
    if (typeof result !== 'string') {
      return JSON.stringify(result);
    }
    return result;
  };

  const getstyles = latestNotification && !latestNotification.disabled ? '410px' : '310px';
  return (
    <EditModalStyle>
      <ScriptEditorContainer>
        <TaskEditorTitle>Script editor</TaskEditorTitle>
        <hr className="hr-resize" />
        <TombStone selectedScript={selectedScript} onSave={onSave} />

        <UseServiceAccountWrapper>
          <GoACheckbox
            checked={selectedScript.useServiceAccount}
            name="script-use-service-account-checkbox"
            testId="script-use-service-account-checkbox"
            onChange={() => {
              setScript({
                ...selectedScript,
                useServiceAccount: !selectedScript.useServiceAccount,
              });
            }}
            ariaLabel={`script-use-service-account-checkbox`}
          />
          Use service account
        </UseServiceAccountWrapper>
        <Tabs activeIndex={activeIndex} data-testid="editor-tabs">
          <Tab label="Lua script" data-testid="script-editor-tab">
            <MonacoDivBody data-testid="templated-editor-body" style={{ height: `calc(72vh - ${getstyles})` }}>
              <MonacoEditor
                language={'lua'}
                value={scriptStr}
                {...editorConfig}
                onChange={(value) => {
                  onScriptChange(value);
                }}
              />
            </MonacoDivBody>
          </Tab>
          <Tab label="Roles" data-testid="script-roles-tab">
            <MonacoDivTabBody data-testid="roles-editor-body">
              <ScrollPane>
                {roles.map((r) => {
                  return <ClientRole roleNames={r.roleNames} key={r.clientId} clientId={r.clientId} />;
                })}
                {fetchKeycloakRolesState === ActionState.inProcess && (
                  <TextLoadingIndicator>Loading roles from access service</TextLoadingIndicator>
                )}
              </ScrollPane>
            </MonacoDivTabBody>
          </Tab>
        </Tabs>

        <EditScriptActions>
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
              <TaskEditorTitle>Test input</TaskEditorTitle>
              <hr className="hr-resize" />
              <GoAFormItem error={errors?.['payloadSchema']} label="">
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
