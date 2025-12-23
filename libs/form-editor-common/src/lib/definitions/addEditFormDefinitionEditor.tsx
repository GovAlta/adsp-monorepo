import { ContextProviderFactory } from '@abgov/jsonforms-components';
import {
  GoabButtonGroup,
  GoabButton,
  GoabFormItem,
  GoabCheckbox,
  GoabDropdownItem,
  GoabDropdown,
  GoabInput,
  GoabTooltip,
  GoabIcon,
  GoabModal,
  GoabAccordion,
  GoabContainer,
  GoabBadge,
} from '@abgov/react-components';
import MonacoEditor, { useMonaco } from '@monaco-editor/react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ClientRoleTable } from '@components/RoleTable';
import { SaveFormModal } from '@components/saveModal';
import { Tab, Tabs } from '@components/Tabs';
import { PageIndicator } from '@components/Indicator';
import DataTable from '@components/DataTable';
import { DeleteModal } from '@components/DeleteModal';
import { CustomLoader } from '@components/CustomLoader';
import {
  FormDataSchemaElementCompletionItemProvider,
  FormPropertyValueCompletionItemProvider,
  FormUISchemaElementCompletionItemProvider,
} from '@lib/autoComplete';
import { isValidJSONSchemaCheck } from '@lib/validation/checkInput';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, wordMaxLengthCheck, badCharsCheck } from '@lib/validation/checkInput';
import useWindowDimensions from '@lib/useWindowDimensions';
import { AppDispatch, RootState } from '@store/index';
import { FETCH_KEYCLOAK_SERVICE_ROLES } from '@store/access/actions';
import { SecurityClassification } from '@store/common/models';
import { UploadFileService, DownloadFileService, DeleteFileService, ClearNewFileList } from '@store/file/actions';
import {
  setDraftDataSchema,
  setDraftUISchema,
  updateFormDefinition,
  updateEditorFormDefinition,
  getFormDefinitions,
} from '@store/form/action';
import { Disposition, FormDefinition } from '@store/form/model';
import { isFormUpdatedSelector, schemaErrorSelector } from '@store/form/selectors';
import { ActionState } from '@store/session/models';
import {
  TextLoadingIndicator,
  FlexRow,
  NameDescriptionDataSchema,
  FormPreviewContainer,
  EditorPadding,
  FinalButtonPadding,
  FormEditorTitle,
  FormEditor,
  FormFormItem,
  ScrollPane,
  RolesTabBody,
  RightAlign,
  PRE,
  FakeButton,
  SubmissionRecordsBox,
  FormPreviewScrollPane,
  SubmissionConfigurationPadding,
  GoACheckboxPad,
  ReviewPageTabWrapper,
  AddToggleButtonPadding,
  Margin,
} from '../styled-components';
import { AddEditDispositionModal } from './addEditDispositionModal';
import { DispositionItems } from './dispositionItems';
import { FormConfigDefinition } from './formConfigDefinition';
import { JSONFormPreviewer } from './JsonFormPreviewer';
import { PreviewTop, PDFPreviewTemplateCore } from './PDFPreviewTemplateCore';
import { RowFlex, QueueTaskDropdown, H3, BorderBottom, H3Inline, ToolTipAdjust } from './style-components';
import { UpdateSearchCriteriaAndFetchEvents } from '@store/calendar/actions';
import { CalendarEventDefault } from '@store/calendar/models';
import { StartEndDateEditor } from './startEndDateEditor';
import type * as monacoNS from 'monaco-editor';
import { DefinitionAgentChat } from './DefinitionAgentChat';
import { agentConnectedSelector, threadSelector } from '@store/agent/selectors';
import { startThread } from '@store/agent/actions';
import { v4 as uuid } from 'uuid';
import { GoabCheckboxOnChangeDetail, GoabDropdownOnChangeDetail } from '@abgov/ui-components-common';
type IEditor = monacoNS.editor.IStandaloneCodeEditor;

export const ContextProvider = ContextProviderFactory();

const isUseMiniMap = window.screen.availWidth >= 1920;

export const formEditorJsonConfig = {
  'data-testid': 'templateForm-test-input',
  options: {
    selectOnLineNumbers: true,
    renderIndentGuides: true,
    colorDecorators: true,
  },
};

export const onSaveDispositionForModal = (
  newDisposition: boolean,
  currentDisposition: Disposition,
  definition: FormDefinition,
  selectedEditModalIndex: number | null
): [FormDefinition, number | null] => {
  const currentDispositionStates = [...definition.dispositionStates];
  if (newDisposition) {
    if (currentDisposition) {
      currentDispositionStates.push(currentDisposition);
      definition.dispositionStates = currentDispositionStates;
    }
  } else {
    currentDispositionStates.splice(selectedEditModalIndex, 1);
    currentDispositionStates.push(currentDisposition);
    definition.dispositionStates = currentDispositionStates;
  }
  return [definition, null];
};

const types = [
  { type: 'applicantRoles', name: 'Applicant roles' },
  { type: 'clerkRoles', name: 'Clerk roles' },
  { type: 'assessorRoles', name: 'Assessor roles' },
];
const applicantRoles = types[0];
const clerkRoles = types[1];

interface ClientRoleProps {
  roleNames: string[];
  clientId: string;
  anonymousRead: boolean;
  onUpdateRoles: (roles: string[], type: string) => void;
  configuration: Record<string, string[]>;
}

const ClientRole = ({ roleNames, clientId, anonymousRead, configuration, onUpdateRoles }: ClientRoleProps) => {
  return (
    <ClientRoleTable
      roles={roleNames}
      clientId={clientId}
      anonymousRead={anonymousRead}
      roleSelectFunc={onUpdateRoles}
      nameColumnWidth={40}
      service="FormService"
      checkedRoles={[
        { title: types[0].name, selectedRoles: configuration[types[0].type], disabled: anonymousRead },
        { title: types[1].name, selectedRoles: configuration[types[1].type] },
        { title: types[2].name, selectedRoles: configuration[types[2].type] },
      ]}
    />
  );
};

const NO_TASK_CREATED_OPTION = `No task created`;

export function AddEditFormDefinitionEditor({ definition, roles, queueTasks, fileTypes }): JSX.Element {
  const fileList = useSelector((state: RootState) => {
    return state?.fileService.newFileList;
  });

  const dispatch = useDispatch<AppDispatch>();
  const editorRefData = useRef(null);
  const editorRefUi = useRef(null);

  const uploadFile = (file: File, propertyId: string) => {
    const fileInfo = { file: file, type: fileTypes[0]?.id, propertyId: propertyId.split('.')?.[0] };
    dispatch(UploadFileService(fileInfo));
  };
  const downloadFile = (file) => {
    dispatch(DownloadFileService(file));
  };

  const JSONSchemaValidator = isValidJSONSchemaCheck('Data schema');
  const monaco = useMonaco();
  const editorRef = useRef<monacoNS.editor.IStandaloneCodeEditor | null>(null);

  /** Fold all regions. */
  function foldAll(editor: IEditor) {
    editor.trigger('folding-util', 'editor.foldAll', undefined);
  }

  /** Unfold all regions. */
  function unfoldAll(editor: IEditor) {
    editor.trigger('folding-util', 'editor.unfoldAll', undefined);
  }

  const {
    loading: isLoading,
    saving: isSaving,
    uiSchemaDraft: tempUiSchema,
    dataSchemaDraft: tempDataSchema,
  } = useSelector((state: RootState) => state.form.editor);

  const setDefinition = (update: Partial<FormDefinition>) => dispatch(updateEditorFormDefinition(update));
  const formDefinitions = useSelector((state: RootState) => state.form.definitions);
  const schemaError = useSelector(schemaErrorSelector);

  const selectedCoreEvent = useSelector(
    (state: RootState) => state.calendarService?.coreCalendars?.['form-intake']?.selectedCalendarEvents
  );

  const { isFormUpdated, latestNotification, isLoadingRoles, indicator, formServiceApiUrl } = useSelector(
    (state: RootState) => ({
      isFormUpdated: isFormUpdatedSelector(state),
      latestNotification: state.notifications.notifications[state.notifications.notifications.length - 1],
      isLoadingRoles: state.session.indicator?.details[FETCH_KEYCLOAK_SERVICE_ROLES] === ActionState.inProcess,
      indicator: state.session?.indicator,
      formServiceApiUrl: state.config?.serviceUrls?.formServiceApiUrl,
    })
  );

  const [dataEditorLocation, setDataEditorLocation] = useState<number>(0);
  const [uiEditorLocation, setUiEditorLocation] = useState<number>(0);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [data, setData] = useState<unknown>({});
  const [selectedDeleteDispositionIndex, setSelectedDeleteDispositionIndex] = useState<number>(null);
  const [selectedEditModalIndex, setSelectedEditModalIndex] = useState<number>(null);

  const [newDisposition, setNewDisposition] = useState<boolean>(false);
  const [intakePeriodModal, setIntakePeriodModal] = useState<boolean>(false);
  const [saveModal, setSaveModal] = useState({ visible: false });
  const [currentTab, setCurrentTab] = useState(0);
  const [showNew, setShowNew] = useState(false);

  const [showSelectedRoles, setShowSelectedRoles] = useState(false);

  const { height } = useWindowDimensions();
  const calcHeight = latestNotification && !latestNotification.disabled ? height - 50 : height;
  const EditorHeight = calcHeight - 400;
  const [editorErrors, setEditorErrors] = useState({
    uiSchema: null,
    dataSchemaJSON: null,
    dataSchemaJSONSchema: null,
  });

  useEffect(() => {
    if (intakePeriodModal) {
      dispatch(
        UpdateSearchCriteriaAndFetchEvents({
          recordId: `urn:ads:platform:configuration-service:v2:/configuration/form-service/${definition.id}`,
          calendarName: 'form-intake',
        })
      );
    }
  }, [intakePeriodModal]);

  const deleteFile = (file) => {
    dispatch(DeleteFileService(file?.id));
  };

  // Resolved data schema (with refs inlined) is used to generate suggestions.
  const dataSchema = useSelector((state: RootState) => state.form.editor.resolvedDataSchema) as Record<string, unknown>;
  useEffect(() => {
    if (monaco) {
      const valueProvider = monaco.languages.registerCompletionItemProvider(
        'json',
        new FormPropertyValueCompletionItemProvider(dataSchema)
      );

      const uiElementProvider = monaco.languages.registerCompletionItemProvider(
        'json',
        new FormUISchemaElementCompletionItemProvider(dataSchema)
      );

      const dataElementProvider = monaco.languages.registerCompletionItemProvider(
        'json',
        new FormDataSchemaElementCompletionItemProvider()
      );

      return function () {
        valueProvider.dispose();
        uiElementProvider.dispose();
        dataElementProvider.dispose();
      };
    }
  }, [monaco, dataSchema]);

  const getFilteredRoles = (roleNames, clientId, checkedRoles) => {
    const allCheckedRoles = Object.values(checkedRoles).flat();
    return showSelectedRoles
      ? roleNames.filter((role) => {
          const selectedRole = clientId ? `${clientId}:${role}` : role;
          return allCheckedRoles.includes(selectedRole);
        })
      : roleNames;
  };

  const navigate = useNavigate();
  const close = () => {
    dispatch(ClearNewFileList());
    navigate('..?definitions=true', { state: { addOpenFormEditor: true, isNavigatedFromEdit: true } });
    if (Object.keys(formDefinitions).length === 0) {
      dispatch(getFormDefinitions());
    }
  };

  const openModalFunction = (disposition) => {
    const currentDispositions = definition.dispositionStates;
    const dispIndex = currentDispositions.findIndex((disp) => disp.id === disposition.id);
    setSelectedEditModalIndex(dispIndex);
  };

  const updateDispositionFunction = (dispositionStates) => {
    setDefinition({ dispositionStates });
  };

  const openDeleteModalFunction = (disposition) => {
    const currentDispositions = definition.dispositionStates;
    const dispIndex = currentDispositions.findIndex((disp) => disp.id === disposition.id);
    setSelectedDeleteDispositionIndex(dispIndex);
  };

  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('description', 'description', wordMaxLengthCheck(180, 'Description'))
    .build();

  const getQueueTaskToProcessValue = () => {
    let value = NO_TASK_CREATED_OPTION;

    if (definition.queueTaskToProcess) {
      const { queueNameSpace, queueName } = definition.queueTaskToProcess;
      if (queueNameSpace !== '' && queueName !== '') {
        value = `${queueNameSpace}:${queueName}`;
      } else {
        value = NO_TASK_CREATED_OPTION;
      }
    }

    return value;
  };

  const getDispositionForModal = () => {
    if (selectedEditModalIndex !== null) {
      return definition?.dispositionStates && definition.dispositionStates[selectedEditModalIndex];
    }
    return { id: '', name: '', description: '' } as Disposition;
  };

  const saveCurrentTab = (tab: number) => {
    setCurrentTab(tab);
  };

  const handleEditorDidMountData = (editor) => {
    editorRefData.current = editor;

    requestAnimationFrame(() => {
      setTimeout(() => {
        editor.setScrollTop(dataEditorLocation);
      }, 5);
    });

    editor.onDidScrollChange((e) => {
      setDataEditorLocation(e.scrollTop);
    });
  };

  const handleEditorDidMountUi = (editor) => {
    editorRefUi.current = editor;

    requestAnimationFrame(() => {
      setTimeout(() => {
        editor.setScrollTop(uiEditorLocation);
      }, 5);
    });

    editor.onDidScrollChange((e) => {
      setUiEditorLocation(e.scrollTop);
    });
  };
  const getCurrentEditorRef = () => {
    if (activeIndex === 0) return editorRefData.current; // Data schema tab
    if (activeIndex === 1) return editorRefUi.current; // UI schema tab
    return null;
  };

  const agentConnected = useSelector(agentConnectedSelector);
  const [threadId] = useState(uuid());

  const thread = useSelector((state: RootState) => threadSelector(state, threadId));
  useEffect(() => {
    if (!thread) {
      dispatch(startThread('formGenerationAgent', threadId));
    }
  }, [dispatch, thread]);

  return (
    <FormEditor>
      {isLoading ? (
        <PageIndicator />
      ) : (
        <FlexRow>
          {isSaving && <CustomLoader />}
          <NameDescriptionDataSchema>
            <FormEditorTitle>Form / Definition Editor</FormEditorTitle>
            <hr className="hr-resize" />
            {definition && <FormConfigDefinition definition={definition} />}

            <Tabs
              activeIndex={activeIndex}
              changeTabCallback={(index) => {
                setActiveIndex(index);
              }}
              data-testid="form-editor-tabs"
            >
              <Tab label="Data schema" data-testid="form-editor-data-schema-tab" isTightContent={true}>
                <GoabFormItem
                  error={errors?.body ?? editorErrors?.dataSchemaJSON ?? editorErrors?.dataSchemaJSONSchema ?? null}
                  label=""
                >
                  <EditorPadding>
                    <MonacoEditor
                      data-testid="form-data-schema"
                      height={EditorHeight}
                      value={tempDataSchema}
                      onMount={handleEditorDidMountData}
                      onChange={(value) => {
                        const jsonSchemaValidResult = JSONSchemaValidator(value);
                        dispatch(setDraftDataSchema(value));

                        if (jsonSchemaValidResult === '') {
                          setEditorErrors({
                            ...editorErrors,
                            dataSchemaJSONSchema: null,
                          });
                        } else {
                          setEditorErrors({
                            ...editorErrors,
                            dataSchemaJSONSchema: jsonSchemaValidResult,
                          });
                        }
                      }}
                      onValidate={(makers) => {
                        if (makers.length === 0) {
                          setEditorErrors({
                            ...editorErrors,
                            dataSchemaJSON: null,
                          });
                          return;
                        }
                        setEditorErrors({
                          ...editorErrors,
                          dataSchemaJSON: `Invalid JSON: col ${makers[0]?.endColumn}, line: ${makers[0]?.endLineNumber}, ${makers[0]?.message}`,
                        });
                      }}
                      language="json"
                      options={{
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        lineNumbersMinChars: 2,
                        tabSize: 2,
                        padding: {
                          top: 8,
                        },
                        minimap: { enabled: isUseMiniMap },
                        folding: true,
                        foldingStrategy: 'auto',
                        showFoldingControls: 'always',
                      }}
                    />
                  </EditorPadding>
                </GoabFormItem>
              </Tab>
              <Tab label="UI schema" data-testid="form-editor-ui-schema-tab" isTightContent={true}>
                <GoabFormItem error={errors?.body ?? editorErrors?.uiSchema ?? null} label="">
                  <EditorPadding>
                    <MonacoEditor
                      data-testid="form-ui-schema"
                      height={EditorHeight}
                      value={tempUiSchema}
                      {...formEditorJsonConfig}
                      onValidate={(makers) => {
                        if (makers.length === 0) {
                          setEditorErrors({
                            ...editorErrors,
                            uiSchema: null,
                          });
                          return;
                        }
                        setEditorErrors({
                          ...editorErrors,
                          uiSchema: `Invalid JSON: col ${makers[0]?.endColumn}, line: ${makers[0]?.endLineNumber}, ${makers[0]?.message}`,
                        });
                      }}
                      onMount={handleEditorDidMountUi}
                      onChange={(value) => {
                        dispatch(setDraftUISchema(value));
                      }}
                      language="json"
                      options={{
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                        tabSize: 2,
                        padding: {
                          top: 8,
                        },
                        minimap: { enabled: isUseMiniMap },
                        folding: true,
                        foldingStrategy: 'auto',
                        showFoldingControls: 'always',
                      }}
                    />
                  </EditorPadding>
                </GoabFormItem>
              </Tab>
              {agentConnected && (
                <Tab
                  label={
                    <span>
                      AI
                      <GoabBadge type="important" ml="xs" mt="2xs" content="Alpha" icon={false} />
                    </span>
                  }
                  data-testid="form-editor-agent-tab"
                  isTightContent={true}
                >
                  <DefinitionAgentChat definitionId={definition.id} threadId={threadId} height={EditorHeight} />
                </Tab>
              )}
              <Tab label="Roles" data-testid="form-roles-tab" isTightContent={true}>
                <BorderBottom>
                  <AddToggleButtonPadding>
                    <GoabButtonGroup alignment="start">
                      <GoabCheckbox
                        name="showSelectedRoles"
                        text="Show selected roles"
                        checked={showSelectedRoles}
                        onChange={() => setShowSelectedRoles((prev) => !prev)}
                      />
                    </GoabButtonGroup>
                  </AddToggleButtonPadding>
                  <RolesTabBody data-testid="roles-editor-body" style={{ height: EditorHeight - 56 }}>
                    <ScrollPane>
                      {roles.map((e, key) => {
                        const rolesMap = getFilteredRoles(e.roleNames, e.clientId, {
                          applicantRoles: definition?.applicantRoles,
                          clerkRoles: definition?.clerkRoles,
                          assessorRoles: definition?.assessorRoles,
                        });
                        return (
                          rolesMap.length > 0 && (
                            <ClientRole
                              roleNames={rolesMap}
                              key={key}
                              clientId={e.clientId}
                              anonymousRead={definition.anonymousApply}
                              configuration={{
                                applicantRoles: definition.applicantRoles,
                                clerkRoles: definition.clerkRoles,
                                assessorRoles: definition.assessorRoles,
                              }}
                              onUpdateRoles={(roles, type) => {
                                if (type === applicantRoles.name) {
                                  setDefinition({
                                    applicantRoles: [...new Set(roles)],
                                  });
                                } else if (type === clerkRoles.name) {
                                  setDefinition({
                                    clerkRoles: [...new Set(roles)],
                                  });
                                } else {
                                  setDefinition({
                                    assessorRoles: [...new Set(roles)],
                                  });
                                }
                              }}
                            />
                          )
                        );
                      })}
                      {isLoadingRoles && <TextLoadingIndicator>Loading roles from access service</TextLoadingIndicator>}
                    </ScrollPane>
                  </RolesTabBody>
                </BorderBottom>
              </Tab>
              <Tab label="Lifecycle" data-testid="lifecycle" isTightContent={true}>
                <BorderBottom>
                  <div className="life-cycle-auto-scroll" style={{ height: EditorHeight + 7 }}>
                    <H3>Application</H3>
                    <div>
                      <GoabFormItem error={errors?.['formDraftUrlTemplate']} label="Form template URL">
                        <FormFormItem>
                          <GoabInput
                            name="form-url-id"
                            value={definition?.formDraftUrlTemplate}
                            testId="form-url-id"
                            disabled={true}
                            width="100%"
                            onChange={null}
                          />
                        </FormFormItem>
                      </GoabFormItem>
                      <FlexRow>
                        <GoACheckboxPad>
                          <GoabCheckbox
                            name="form-definition-anonymous-apply"
                            key="form-definition-anonymous-apply-checkbox"
                            checked={definition.anonymousApply === true}
                            onChange={(detail: GoabCheckboxOnChangeDetail) => {
                              setDefinition({ anonymousApply: detail.checked });
                            }}
                            text={'Allow anonymous application'}
                          />
                        </GoACheckboxPad>
                        <GoabTooltip
                          content={
                            definition.anonymousApply
                              ? 'Forms of this type will allow anonymous user to apply.'
                              : 'Forms of this type will not allow anonymous user to apply.'
                          }
                          position="top"
                        >
                          <GoabIcon type="information-circle" ariaLabel="anonymous-icon"></GoabIcon>
                        </GoabTooltip>
                      </FlexRow>
                      <FlexRow>
                        <GoACheckboxPad>
                          <GoabCheckbox
                            name="form-definition-allow-multiple-forms-checkbox"
                            key="form-definition-allow-multiple-forms-checkbox"
                            disabled={definition.anonymousApply}
                            checked={
                              !(
                                definition.oneFormPerApplicant === true ||
                                definition.oneFormPerApplicant === undefined ||
                                definition.oneFormPerApplicant === null
                              )
                            }
                            onChange={(detail: GoabCheckboxOnChangeDetail) => {
                              setDefinition({ oneFormPerApplicant: !detail.value });
                            }}
                            text={'Allow multiple forms per applicant'}
                          />
                        </GoACheckboxPad>
                        <GoabTooltip
                          content={
                            definition.oneFormPerApplicant
                              ? 'Forms of this type will only allow applicants to have one form created and submitted at a time.'
                              : 'Forms of this type will allow applicants to have multiple forms be created and submitted at a time.'
                          }
                          position="top"
                        >
                          <GoabIcon type="information-circle" ariaLabel="allow-multiple-icon"></GoabIcon>
                        </GoabTooltip>
                      </FlexRow>
                      <FlexRow>
                        <GoACheckboxPad>
                          <GoabCheckbox
                            name="support-topic"
                            key="support-topic"
                            disabled={definition.anonymousApply}
                            checked={definition.supportTopic}
                            testId="support-topic"
                            onChange={() => {
                              const supportTopic = definition.supportTopic ? false : true;
                              setDefinition({ supportTopic });
                            }}
                            text="Create support topic"
                          />
                        </GoACheckboxPad>
                        <GoabTooltip
                          content={
                            definition.supportTopic
                              ? 'Forms of this type will create a comment topic used for supporting applicants. Applicants will be able to read and write comments to the topic to interact with staff.'
                              : 'Forms of this type will not create a comment topic used for supporting applicants.'
                          }
                          position="top"
                        >
                          <GoabIcon type="information-circle" ariaLabel="support-topic-icon"></GoabIcon>
                        </GoabTooltip>
                      </FlexRow>
                      <FlexRow>
                        <GoACheckboxPad>
                          <GoabCheckbox
                            name="form-definition-scheduled-intakes-checkbox"
                            key="form-definition-scheduled-intakes-checkbox"
                            checked={definition.scheduledIntakes}
                            onChange={(detail: GoabCheckboxOnChangeDetail) => {
                              setDefinition({ scheduledIntakes: detail.checked });
                            }}
                            text={'Use scheduled intakes'}
                          />
                        </GoACheckboxPad>
                        <GoabTooltip
                          content={
                            definition.scheduledIntakes
                              ? 'Forms of this type will have a timeframe to complete and submit a form.'
                              : 'Forms of this type will not have a timeframe to complete and submit a form.'
                          }
                          position="top"
                        >
                          <GoabIcon type="information-circle" ariaLabel="scheduled-icon"></GoabIcon>
                        </GoabTooltip>
                      </FlexRow>
                      {definition.scheduledIntakes && (
                        <div style={{ marginBottom: '0.5rem' }}>
                          <GoabButton
                            type="primary"
                            testId="set-intake-period"
                            onClick={() => {
                              setIntakePeriodModal(true);
                            }}
                          >
                            Intake periods
                          </GoabButton>
                        </div>
                      )}
                    </div>
                    <div>
                      <GoabFormItem error={''} label="Security classification">
                        {/* The style below is to fix an UI component bug */}
                        <div style={{ paddingLeft: '3px' }}>
                          <GoabDropdown
                            name="securityClassifications"
                            width="25rem"
                            value={definition?.securityClassification || ''}
                            onChange={(detail: GoabDropdownOnChangeDetail) => {
                              setDefinition({ securityClassification: detail.value as SecurityClassification });
                            }}
                          >
                            <GoabDropdownItem value={SecurityClassification.Public} label="Public" />
                            <GoabDropdownItem value={SecurityClassification.ProtectedA} label="Protected A" />
                            <GoabDropdownItem value={SecurityClassification.ProtectedB} label="Protected B" />
                            <GoabDropdownItem value={SecurityClassification.ProtectedC} label="Protected C" />
                          </GoabDropdown>
                        </div>
                      </GoabFormItem>
                    </div>
                    <h3>Submission</h3>
                    <FlexRow>
                      <SubmissionRecordsBox>
                        <GoabCheckbox
                          name="generate-pdf-on-submit"
                          key="generate-pdf-on-submit"
                          checked={definition.submissionPdfTemplate ? true : false}
                          testId="generate-pdf-on-submit"
                          onChange={() => {
                            const records = definition.submissionPdfTemplate ? '' : 'submitted-form';
                            setDefinition({ submissionPdfTemplate: records });
                          }}
                          text="Create PDF on submit"
                        />
                      </SubmissionRecordsBox>
                      <GoabTooltip
                        content={
                          definition.submissionPdfTemplate
                            ? 'Forms of this type will generate a PDF on submission '
                            : 'Forms of this type will not generate a PDF on submission'
                        }
                        position="top"
                      >
                        <GoabIcon type="information-circle" ariaLabel="generate-pdf-icon"></GoabIcon>
                      </GoabTooltip>
                    </FlexRow>
                    <FlexRow>
                      <SubmissionRecordsBox>
                        <GoabCheckbox
                          name="submission-records"
                          key="submission-records"
                          checked={definition.submissionRecords}
                          testId="submission-records"
                          onChange={() => {
                            const records = definition.submissionRecords ? false : true;
                            setDefinition({ submissionRecords: records });
                          }}
                          text="Create submission records on submit"
                        />
                      </SubmissionRecordsBox>
                      <GoabTooltip
                        content={
                          definition.submissionRecords
                            ? 'Forms of this type will create submission records. This submission record can be used for processing of the application and to record an adjudication decision (disposition state).'
                            : 'Forms of this type will not create a submission record when submitted. Applications are responsible for managing how forms are processed after they are submitted.'
                        }
                        position="top"
                      >
                        <GoabIcon type="information-circle" ariaLabel="submission-icon"></GoabIcon>
                      </GoabTooltip>
                    </FlexRow>
                    <div style={{ background: definition.submissionRecords ? 'white' : '#f1f1f1' }}>
                      <SubmissionConfigurationPadding>
                        <H3Inline>Task queue to process</H3Inline>
                        <ToolTipAdjust>
                          {definition.submissionRecords && (
                            <GoabTooltip
                              content={
                                getQueueTaskToProcessValue() === NO_TASK_CREATED_OPTION
                                  ? ' No task will be created for processing of the submissions. Applications are responsible for management of how submissions are worked on by users.'
                                  : 'A task will be created in queue “{queue namespace + name}” for submissions of the form. This allows program staff to work on the submissions from the task management application using this queue.'
                              }
                            >
                              <GoabIcon type="information-circle" ariaLabel="queue"></GoabIcon>
                            </GoabTooltip>
                          )}
                        </ToolTipAdjust>
                        <QueueTaskDropdown>
                          {queueTasks && Object.keys(queueTasks).length > 0 && (
                            <GoabDropdown
                              data-test-id="form-submission-select-queue-task-dropdown"
                              name="queueTasks"
                              disabled={!definition.submissionRecords}
                              value={[getQueueTaskToProcessValue()]}
                              onChange={(detail: GoabDropdownOnChangeDetail) => {
                                const separatedQueueTask = detail.value.split(':');
                                if (separatedQueueTask.length > 1) {
                                  setDefinition({
                                    queueTaskToProcess: {
                                      queueNameSpace: separatedQueueTask[0],
                                      queueName: separatedQueueTask[1],
                                    },
                                  });
                                } else {
                                  setDefinition({
                                    queueTaskToProcess: {
                                      queueNameSpace: '',
                                      queueName: '',
                                    },
                                  });
                                }
                              }}
                            >
                              <GoabDropdownItem
                                data-testId={`task-Queue-ToCreate-DropDown`}
                                key={`No-Task-Created`}
                                value={NO_TASK_CREATED_OPTION}
                                label={NO_TASK_CREATED_OPTION}
                              />
                              {queueTasks &&
                                Object.keys(queueTasks)
                                  .sort()
                                  .map((item) => (
                                    <GoabDropdownItem data-testId={item} key={item} value={item} label={item} />
                                  ))}
                            </GoabDropdown>
                          )}
                        </QueueTaskDropdown>
                        <RowFlex>
                          <h3>Disposition states</h3>
                          <div>
                            {definition.submissionRecords ? (
                              <GoabTooltip
                                content="Disposition states represent possible decisions applied to submissions by program staff. For example, an adjudicator may find that a submission is incomplete and records an Incomplete state with rationale of what information is missing."
                                position="top"
                              >
                                <GoabIcon type="information-circle" ariaLabel="disposition-icon"></GoabIcon>
                              </GoabTooltip>
                            ) : (
                              <FakeButton />
                            )}
                          </div>
                          <RightAlign>
                            {definition.submissionRecords ? (
                              <GoabButton
                                type="secondary"
                                testId="Add state"
                                disabled={!definition.submissionRecords}
                                onClick={() => {
                                  setNewDisposition(true);
                                  setSelectedEditModalIndex(null);
                                }}
                              >
                                Add state
                              </GoabButton>
                            ) : (
                              <FakeButton />
                            )}
                          </RightAlign>
                        </RowFlex>

                        <div
                          style={{
                            overflowY: 'auto',
                            zIndex: 0,
                          }}
                        >
                          {definition.dispositionStates && definition.dispositionStates.length === 0 ? (
                            'No disposition states'
                          ) : (
                            <DataTable>
                              <thead>
                                <tr>
                                  <th>Name</th>
                                  <th>Description</th>
                                  <th>Order</th>
                                  <th>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {definition && (
                                  <DispositionItems
                                    openModalFunction={openModalFunction}
                                    updateDispositions={updateDispositionFunction}
                                    openDeleteModalFunction={openDeleteModalFunction}
                                    dispositions={definition.dispositionStates}
                                    submissionRecords={definition.submissionRecords}
                                  />
                                )}
                              </tbody>
                            </DataTable>
                          )}
                        </div>
                      </SubmissionConfigurationPadding>
                    </div>
                  </div>
                </BorderBottom>
              </Tab>
            </Tabs>

            <FinalButtonPadding>
              <GoabButtonGroup alignment="start">
                <GoabButton
                  type="tertiary"
                  testId="collapse-all"
                  onClick={() => {
                    const editor = getCurrentEditorRef();
                    if (editor) foldAll(editor);
                  }}
                  disabled={activeIndex > 1}
                >
                  Collapse all
                </GoabButton>
                <GoabButton
                  testId="expand-all"
                  type="tertiary"
                  disabled={activeIndex > 1}
                  onClick={() => {
                    const editor = getCurrentEditorRef();
                    if (editor) unfoldAll(editor);
                  }}
                >
                  Expand all
                </GoabButton>
              </GoabButtonGroup>

              <GoabButtonGroup alignment="end">
                <GoabButton
                  type="primary"
                  testId="definition-form-save"
                  disabled={
                    !isFormUpdated ||
                    !definition.name ||
                    validators.haveErrors() ||
                    editorErrors.dataSchemaJSON !== null ||
                    editorErrors.dataSchemaJSONSchema !== null ||
                    editorErrors.uiSchema !== null
                  }
                  onClick={() => {
                    if (indicator.show !== true) {
                      dispatch(updateFormDefinition(definition));
                    }
                  }}
                >
                  Save
                </GoabButton>
                <GoabButton
                  testId="form-editor-cancel"
                  type="secondary"
                  onClick={() => {
                    if (isFormUpdated) {
                      setSaveModal({ visible: true });
                    } else {
                      validators.clear();

                      close();
                    }
                  }}
                >
                  Back
                </GoabButton>
              </GoabButtonGroup>
            </FinalButtonPadding>
          </NameDescriptionDataSchema>

          <FormPreviewContainer>
            <Tabs data-testid="preview-tabs" activeIndex={0} changeTabCallback={saveCurrentTab}>
              <Tab label="Preview" data-testid="preview-view-tab">
                <FormPreviewScrollPane>
                  <ContextProvider
                    fileManagement={{
                      fileList: fileList,
                      uploadFile: uploadFile,
                      downloadFile: downloadFile,
                      deleteFile: deleteFile,
                    }}
                    formUrl={formServiceApiUrl}
                  >
                    <GoabFormItem error={schemaError} label="">
                      <JSONFormPreviewer
                        onChange={({ data }) => {
                          setData(data);
                        }}
                        data={data}
                      />
                    </GoabFormItem>
                  </ContextProvider>
                </FormPreviewScrollPane>
              </Tab>
              <Tab label="Data" data-testid="data-view">
                <ReviewPageTabWrapper>{data && <PRE>{JSON.stringify(data, null, 2)}</PRE>}</ReviewPageTabWrapper>
              </Tab>
              {definition?.submissionPdfTemplate ? (
                <Tab
                  label={<PreviewTop title="PDF Preview" form={definition} data={data} currentTab={currentTab} />}
                  data-testid="data-view"
                >
                  <PDFPreviewTemplateCore formName={definition.name} />
                </Tab>
              ) : null}
            </Tabs>
          </FormPreviewContainer>
        </FlexRow>
      )}
      <SaveFormModal
        open={saveModal.visible}
        onDontSave={() => {
          close();
        }}
        onSave={() => {
          dispatch(updateFormDefinition(definition));
          setSaveModal({ visible: false });
          close();
        }}
        saveDisable={!isFormUpdated}
        onCancel={() => {
          setSaveModal({ visible: false });
        }}
      />
      <DeleteModal
        title="Delete disposition state"
        isOpen={selectedDeleteDispositionIndex !== null}
        onCancel={() => {
          setSelectedDeleteDispositionIndex(null);
        }}
        content={
          <div>
            <div>
              Are you sure you wish to delete
              <b>
                {definition?.dispositionStates &&
                  JSON.stringify(definition.dispositionStates[selectedDeleteDispositionIndex]?.name)}
              </b>
              ?
            </div>
          </div>
        }
        onDelete={() => {
          const dispositionStates = [...(definition.dispositionStates || [])];
          dispositionStates.splice(selectedDeleteDispositionIndex, 1);
          setDefinition({ dispositionStates });
          setSelectedDeleteDispositionIndex(null);
        }}
      />

      <AddEditDispositionModal
        open={selectedEditModalIndex !== null || newDisposition}
        isEdit={selectedEditModalIndex !== null}
        existingDispositions={definition?.dispositionStates}
        initialValue={getDispositionForModal()}
        onSave={(currentDispositions) => {
          const [updatedDefinition, index] = onSaveDispositionForModal(
            newDisposition,
            currentDispositions,
            definition,
            selectedEditModalIndex
          );
          setDefinition(updatedDefinition);
          setSelectedDeleteDispositionIndex(index);
        }}
        onClose={() => {
          setNewDisposition(false);
          setSelectedEditModalIndex(null);
        }}
      />
      {intakePeriodModal && (
        <GoabModal heading="Intake Periods" open={intakePeriodModal} maxWidth={'70ch !important'}>
          <form style={{ width: '100%' }}>
            <Margin>
              <div>
                Use intake periods to control when applicants can access and submit this form. You can create one or
                more windows of time to match your application cycles.
              </div>
            </Margin>

            {selectedCoreEvent && selectedCoreEvent.length > 0
              ? selectedCoreEvent.map((coreEvent) => {
                  return (
                    <GoabAccordion heading={coreEvent.name} open={false}>
                      <StartEndDateEditor event={coreEvent} newEvent={false} closeIntake={() => null} />
                    </GoabAccordion>
                  );
                })
              : !showNew && <b>No intake periods configured for this form</b>}

            {showNew && (
              <Margin>
                <GoabContainer mt="m">
                  <StartEndDateEditor
                    formId={definition.id}
                    event={CalendarEventDefault}
                    closeIntake={() => setShowNew(false)}
                    newEvent={true}
                  />
                </GoabContainer>
              </Margin>
            )}
            {!showNew && (
              <Margin>
                <GoabButton type="primary" onClick={() => setShowNew(true)}>
                  New intake period
                </GoabButton>
              </Margin>
            )}
            <GoabButtonGroup alignment="end" mt="xl">
              <GoabButton
                type="secondary"
                disabled={showNew}
                onClick={() => {
                  setIntakePeriodModal(false);
                }}
              >
                Close
              </GoabButton>
            </GoabButtonGroup>
          </form>
        </GoabModal>
      )}
    </FormEditor>
  );
}
