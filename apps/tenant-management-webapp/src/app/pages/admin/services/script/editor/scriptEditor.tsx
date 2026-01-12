import React, { FunctionComponent, useState, useEffect, useRef } from 'react';
import {
  ScriptEditorContainer,
  EditScriptActions,
  MonacoDivBody,
  EditModalStyle,
  ScriptPane,
  ResponseTableStyles,
  TestInputDivBody,
  ScrollPane,
  TextLoadingIndicator,
  MonacoDivTabBody,
  ScriptEditorTitle,
  MonacoDivTriggerEventsBody,
  NotificationBannerWrapper,
} from '../styled-components';
import { TombStone } from './tombstone';

import MonacoEditor, { useMonaco } from '@monaco-editor/react';
import { languages } from 'monaco-editor';
import { SaveFormModal } from '@components/saveModal';
import { ScriptItem } from '@store/script/models';
import { ClearScripts, ExecuteScript } from '@store/script/actions';
import { useDispatch, useSelector } from 'react-redux';
import CheckmarkCircle from '@components/icons/CheckmarkCircle';
import CloseCircle from '@components/icons/CloseCircle';
import { RootState } from '@store/index';
import {
  functionSuggestion,
  functionSignature,
  extractSuggestionsForSchema,
  retrieveScriptSuggestions,
} from '@lib/luaCodeCompletion';
import { buildSuggestions, luaTriggerInScope } from '@lib/autoComplete';
import { GoabButton, GoabFormItem, GoabCheckbox, GoabSkeleton, GoabCircularProgress } from '@abgov/react-components';
import { Tab, Tabs } from '@components/Tabs';
import { ClientRoleTable } from '@components/RoleTable';
import { FETCH_KEYCLOAK_SERVICE_ROLES, fetchKeycloakServiceRoles } from '@store/access/actions';
import { ActionState } from '@store/session/models';
import { selectRoleList } from '@store/sharedSelectors/roles';
import { ScriptEditorEventsTab } from './scriptEditorEventsTab';
import { getEventDefinitions } from '@store/event/actions';
import { scriptEditorConfig, scriptEditorJsonConfig } from './config';
import { CustomLoader } from '@components/CustomLoader';
import { FetchRealmRoles } from '@store/tenant/actions';
import useWindowDimensions from '@lib/useWindowDimensions';
import { NotificationBanner } from 'app/notificationBanner';
export interface ScriptEditorProps {
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
  const [customIndicator, setCustomIndicator] = useState<boolean>(false);
  const scrollPaneRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    dispatch(FetchRealmRoles());
    dispatch(fetchKeycloakServiceRoles());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resetSavedAction = () => {
    onNameChange(selectedScript?.name || '');
    onDescriptionChange(selectedScript?.description || '');
    onScriptChange(selectedScript?.script || '');
  };
  const monaco = useMonaco();
  let activeParam = 0;
  let activeSignature = 0;

  const definitions = useSelector((state: RootState) => state.event.results.map((r) => state.event.definitions[r]));
  const eventDefinitions = useSelector((state: RootState) => state.event.definitions);
  const triggerEvents = script?.triggerEvents;
  useEffect(() => {
    if (!definitions || (definitions && definitions.length === 0)) {
      dispatch(getEventDefinitions());
    }
  }, [eventDefinitions]); // eslint-disable-line react-hooks/exhaustive-deps

  const roles = useSelector(selectRoleList);
  const latestNotification = useSelector(
    (state: RootState) => state.notifications.notifications[state.notifications.notifications.length - 1]
  );
  useEffect(() => {
    if (monaco) {
      const completionProvider = monaco.languages.registerCompletionItemProvider('lua', {
        provideCompletionItems: (model, position) => {
          const functionSuggestions = buildSuggestions(monaco, functionSuggestion, model, position);

          return {
            suggestions: functionSuggestions,
          } as languages.ProviderResult<languages.CompletionList>;
        },
      });
      let eventCompletionProvider = null;
      if (triggerEvents && triggerEvents.length > 0) {
        const eventDefinition = eventDefinitions[`${triggerEvents[0].namespace}:${triggerEvents[0].name}`];
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
          validate: true,
          schemas: [
            {
              uri: 'http://www.schema.org/',
              fileMatch: ['*'],
              schema: {
                type: 'object',
                properties: eventDefinition?.payloadSchema,
              },
            },
          ],
        });

        eventCompletionProvider = monaco.languages.registerCompletionItemProvider('lua', {
          triggerCharacters: ['['],
          provideCompletionItems: (model, position) => {
            const textUntilPosition = model.getValueInRange({
              startLineNumber: 1,
              startColumn: 1,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            });
            const eventSuggestion = extractSuggestionsForSchema(eventDefinition?.payloadSchema, monaco);

            const suggestions = luaTriggerInScope(textUntilPosition, position.lineNumber)
              ? retrieveScriptSuggestions(eventSuggestion, model, position)
              : [];

            return {
              suggestions: suggestions,
            } as languages.ProviderResult<languages.CompletionList>;
          },
        });
      }

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
            // eslint-disable-next-line react-hooks/exhaustive-deps
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
              // eslint-disable-next-line react-hooks/exhaustive-deps
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
        if (triggerEvents && eventCompletionProvider && triggerEvents.length > 0) {
          eventCompletionProvider.dispose();
        }
      };
    }
  }, [monaco, eventDefinitions]);

  const loadingIndicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  useEffect(() => {
    onNameChange(selectedScript?.name || '');
    onDescriptionChange(selectedScript?.description || '');
    onScriptChange(selectedScript?.script || '');
  }, [selectedScript]); // eslint-disable-line react-hooks/exhaustive-deps

  const orderedEventNames =
    Array.isArray(definitions) && definitions.length > 0
      ? definitions
          .map((def) => {
            return `${def?.namespace}:${def?.name}`;
          })
          .sort()
      : [];

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
    selectedScript.useServiceAccount = script.useServiceAccount;
    setTimeout(() => {
      setCustomIndicator(false);
    }, 1000);
    return selectedScript;
  };

  const hasChanged = () => {
    const isTestInputs = selectedScript.testInputs ? selectedScript.testInputs !== testInput : false;
    return (
      selectedScript.name !== name ||
      selectedScript.description !== description ||
      selectedScript.script !== scriptStr ||
      isTestInputs ||
      selectedScript.runnerRoles?.toString() !== script.runnerRoles?.toString() ||
      selectedScript.useServiceAccount !== script.useServiceAccount
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
    );
  };

  //eslint-disable-next-line
  const parseTestResult = (result: string | Record<string, any>) => {
    if (typeof result !== 'string') {
      return JSON.stringify(result);
    }
    return result;
  };
  const notifications = useSelector((state: RootState) => state.notifications.notifications);
  const isNotificationActive = latestNotification && !latestNotification.disabled;

  const monacoHeight = `calc(100vh - 404px${notifications.length > 0 ? ' - 80px' : ''})`;
  const Height = latestNotification && !latestNotification.disabled ? 91 : 0;
  const isServiceAccountDisabled = () => {
    if (script.triggerEvents?.length > 0) return true;

    return false;
  };

  const isServiceAccountChecked = () => {
    if (script.triggerEvents?.length > 0) return true;

    return script.useServiceAccount;
  };

  return (
    <>
      <NotificationBannerWrapper>
        <NotificationBanner />
      </NotificationBannerWrapper>
      <EditModalStyle>
        {customIndicator && <CustomLoader />}
        <ScriptEditorContainer isNotificationActive={isNotificationActive}>
          <div>
            <ScriptEditorTitle>Script editor</ScriptEditorTitle>

            <hr className="hr-only-line" />
            <TombStone selectedScript={selectedScript} onSave={onSave} />
            <div style={{ paddingLeft: '4px' }}>
              <GoabCheckbox
                checked={isServiceAccountChecked()}
                name="script-use-service-account-checkbox"
                testId="script-use-service-account-checkbox"
                disabled={isServiceAccountDisabled()}
                text="Use service account"
                onChange={() => {
                  setScript({
                    ...script,
                    useServiceAccount: !script.useServiceAccount,
                  });
                }}
                ariaLabel={`script-use-service-account-checkbox`}
              />
            </div>
            <Tabs activeIndex={activeIndex} data-testid="editor-tabs">
              <Tab label="Lua script" data-testid="script-editor-tab">
                <MonacoDivBody data-testid="templated-editor-body">
                  <MonacoEditor
                    height={monacoHeight}
                    language={'lua'}
                    value={scriptStr}
                    {...scriptEditorConfig}
                    onChange={(value) => {
                      onScriptChange(value);
                    }}
                  />
                </MonacoDivBody>
              </Tab>
              <Tab label="Roles" data-testid="script-roles-tab">
                <MonacoDivTabBody data-testid="roles-editor-body">
                  <ScrollPane style={{ height: monacoHeight }} ref={scrollPaneRef} className="roles-scroll-pane">
                    {Array.isArray(roles)
                      ? roles.map((r) => {
                          return <ClientRole roleNames={r.roleNames} key={r.clientId} clientId={r.clientId} />;
                        })
                      : null}
                    {fetchKeycloakRolesState === ActionState.inProcess && (
                      <TextLoadingIndicator>Loading roles from access service</TextLoadingIndicator>
                    )}
                  </ScrollPane>
                </MonacoDivTabBody>
              </Tab>
              <Tab label="Trigger events" data-testid="script-trigger-events-tab">
                <MonacoDivTriggerEventsBody data-testid="trigger-events-body" style={{ height: monacoHeight }}>
                  <ScriptEditorEventsTab
                    script={selectedScript}
                    eventNames={orderedEventNames}
                    onEditorSave={(script) => {
                      setScript(script);
                      saveAndReset(script);
                    }}
                  />
                </MonacoDivTriggerEventsBody>
              </Tab>
            </Tabs>
          </div>
          <EditScriptActions>
            <div>
              <GoabButton
                onClick={() => {
                  setCustomIndicator(true);
                  updateScript();
                  saveAndReset(selectedScript);
                  setSaveModal(false);
                }}
                testId="template-form-save"
                type="primary"
                disabled={Object.keys(errors).length > 0 || !hasChanged()}
              >
                Save
              </GoabButton>
            </div>
            <GoabButton
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
            </GoabButton>
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
                <ScriptEditorTitle>Test input</ScriptEditorTitle>
                <hr className="hr-resize" />
                <GoabFormItem error={errors?.['payloadSchema']} label="">
                  <TestInputDivBody data-testid="templated-editor-test">
                    <MonacoEditor
                      language={'json'}
                      value={testInput}
                      {...scriptEditorJsonConfig}
                      onChange={(value) => {
                        setTestInput(value);
                      }}
                    />
                  </TestInputDivBody>
                </GoabFormItem>
              </div>
              <div className="execute-button">
                <GoabButton
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
                </GoabButton>
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
                          <GoabSkeleton key={1} type="text" />
                        </td>
                      </tr>
                    )}

                    {Array.isArray(scriptResponse)
                      ? scriptResponse.map((response) => (
                          <tr>
                            <td data-testid="response-result">
                              <div className="flex-horizontal">
                                <div className="mt-1">
                                  {!response.hasError ? (
                                    <CheckmarkCircle size="medium" />
                                  ) : (
                                    <CloseCircle size="medium" />
                                  )}
                                </div>
                                <div className="mt-3">{response.hasError ? response.result : 'Success'}</div>
                              </div>
                            </td>
                            <td data-testid="response-inputs">{JSON.stringify(response.inputs)}</td>
                            <td data-testid="response-output">
                              {!response.hasError ? parseTestResult(response.result) : ''}
                            </td>
                          </tr>
                        ))
                      : null}
                  </tbody>
                </table>
              </ResponseTableStyles>
            </div>
          </ScriptPane>
        </div>
      </EditModalStyle>
    </>
  );
};
