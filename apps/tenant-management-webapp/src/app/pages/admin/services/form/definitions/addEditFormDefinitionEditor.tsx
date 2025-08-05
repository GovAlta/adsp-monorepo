import { ContextProviderFactory } from '@abgov/jsonforms-components';
import {
  GoAButtonGroup,
  GoAButton,
  GoAFormItem,
  GoACheckbox,
  GoADropdownItem,
  GoADropdown,
  GoAInput,
  GoATooltip,
  GoAIcon,
  GoAModal,
  GoAAccordion,
  GoAContainer,
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
import { RootState } from '@store/index';
import { FETCH_KEYCLOAK_SERVICE_ROLES } from '@store/access/actions';
import { SecurityClassification } from '@store/common/models';
import {
  UploadFileService,
  DownloadFileService,
  DeleteFileService,
  ClearNewFileList,
} from '@store/file/actions';
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

  const dispatch = useDispatch();
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
                <GoAFormItem
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
                      }}
                    />
                  </EditorPadding>
                </GoAFormItem>
              </Tab>
              <Tab label="UI schema" data-testid="form-editor-ui-schema-tab" isTightContent={true}>
                <GoAFormItem error={errors?.body ?? editorErrors?.uiSchema ?? null} label="">
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
                      }}
                    />
                  </EditorPadding>
                </GoAFormItem>
              </Tab>
              <Tab label="Roles" data-testid="form-roles-tab" isTightContent={true}>
                <BorderBottom>
                  <AddToggleButtonPadding>
                    <GoAButtonGroup alignment="start">
                      <GoACheckbox
                        name="showSelectedRoles"
                        text="Show selected roles"
                        checked={showSelectedRoles}
                        onChange={() => setShowSelectedRoles((prev) => !prev)}
                      />
                    </GoAButtonGroup>
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
                      <div style={{ marginBottom: '0.5rem' }}>
                        <GoAButton
                          type="primary"
                          testId="set-intake-period"
                          onClick={() => {
                            setIntakePeriodModal(true);
                          }}
                        >
                          Intake periods
                        </GoAButton>
                      </div>

                      <GoAFormItem error={errors?.['formDraftUrlTemplate']} label="Form template URL">
                        <FormFormItem>
                          <GoAInput
                            name="form-url-id"
                            value={definition?.formDraftUrlTemplate}
                            testId="form-url-id"
                            disabled={true}
                            width="100%"
                            onChange={null}
                          />
                        </FormFormItem>
                      </GoAFormItem>
                      <FlexRow>
                        <GoACheckboxPad>
                          <GoACheckbox
                            name="form-definition-anonymous-apply"
                            key="form-definition-anonymous-apply-checkbox"
                            checked={definition.anonymousApply === true}
                            onChange={(_, checked) => {
                              setDefinition({ anonymousApply: checked });
                            }}
                            text={'Allow anonymous application'}
                          />
                        </GoACheckboxPad>
                        <GoATooltip
                          content={
                            definition.anonymousApply
                              ? 'Forms of this type will allow anonymous user to apply.'
                              : 'Forms of this type will not allow anonymous user to apply.'
                          }
                          position="top"
                        >
                          <GoAIcon type="information-circle" ariaLabel="anonymous-icon"></GoAIcon>
                        </GoATooltip>
                      </FlexRow>
                      <FlexRow>
                        <GoACheckboxPad>
                          <GoACheckbox
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
                            onChange={(_, checked) => {
                              setDefinition({ oneFormPerApplicant: !checked });
                            }}
                            text={'Allow multiple forms per applicant'}
                          />
                        </GoACheckboxPad>
                        <GoATooltip
                          content={
                            definition.oneFormPerApplicant
                              ? 'Forms of this type will only allow applicants to have one form created and submitted at a time.'
                              : 'Forms of this type will allow applicants to have multiple forms be created and submitted at a time.'
                          }
                          position="top"
                        >
                          <GoAIcon type="information-circle" ariaLabel="allow-multiple-icon"></GoAIcon>
                        </GoATooltip>
                      </FlexRow>
                      <FlexRow>
                        <GoACheckboxPad>
                          <GoACheckbox
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
                        <GoATooltip
                          content={
                            definition.supportTopic
                              ? 'Forms of this type will create a comment topic used for supporting applicants. Applicants will be able to read and write comments to the topic to interact with staff.'
                              : 'Forms of this type will not create a comment topic used for supporting applicants.'
                          }
                          position="top"
                        >
                          <GoAIcon type="information-circle" ariaLabel="support-topic-icon"></GoAIcon>
                        </GoATooltip>
                      </FlexRow>
                      <FlexRow>
                        <GoACheckboxPad>
                          <GoACheckbox
                            name="form-definition-scheduled-intakes-checkbox"
                            key="form-definition-scheduled-intakes-checkbox"
                            checked={definition.scheduledIntakes}
                            onChange={(_, checked) => {
                              setDefinition({ scheduledIntakes: checked });
                            }}
                            text={'Use scheduled intakes'}
                          />
                        </GoACheckboxPad>
                        <GoATooltip
                          content={
                            definition.scheduledIntakes
                              ? 'Forms of this type will have a timeframe to complete and submit a form.'
                              : 'Forms of this type will not have a timeframe to complete and submit a form.'
                          }
                          position="top"
                        >
                          <GoAIcon type="information-circle" ariaLabel="scheduled-icon"></GoAIcon>
                        </GoATooltip>
                      </FlexRow>
                    </div>
                    <div>
                      <GoAFormItem error={''} label="Security classification">
                        {/* The style below is to fix an UI component bug */}
                        <div style={{ paddingLeft: '3px' }}>
                          <GoADropdown
                            name="securityClassifications"
                            width="25rem"
                            value={definition?.securityClassification || ''}
                            relative={true}
                            onChange={(name: string, value: SecurityClassification) => {
                              setDefinition({ securityClassification: value });
                            }}
                          >
                            <GoADropdownItem value={SecurityClassification.Public} label="Public" />
                            <GoADropdownItem value={SecurityClassification.ProtectedA} label="Protected A" />
                            <GoADropdownItem value={SecurityClassification.ProtectedB} label="Protected B" />
                            <GoADropdownItem value={SecurityClassification.ProtectedC} label="Protected C" />
                          </GoADropdown>
                        </div>
                      </GoAFormItem>
                    </div>
                    <h3>Submission</h3>
                    <FlexRow>
                      <SubmissionRecordsBox>
                        <GoACheckbox
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
                      <GoATooltip
                        content={
                          definition.submissionPdfTemplate
                            ? 'Forms of this type will generate a PDF on submission '
                            : 'Forms of this type will not generate a PDF on submission'
                        }
                        position="top"
                      >
                        <GoAIcon type="information-circle" ariaLabel="generate-pdf-icon"></GoAIcon>
                      </GoATooltip>
                    </FlexRow>
                    <FlexRow>
                      <SubmissionRecordsBox>
                        <GoACheckbox
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
                      <GoATooltip
                        content={
                          definition.submissionRecords
                            ? 'Forms of this type will create submission records. This submission record can be used for processing of the application and to record an adjudication decision (disposition state).'
                            : 'Forms of this type will not create a submission record when submitted. Applications are responsible for managing how forms are processed after they are submitted.'
                        }
                        position="top"
                      >
                        <GoAIcon type="information-circle" ariaLabel="submission-icon"></GoAIcon>
                      </GoATooltip>
                    </FlexRow>
                    <div style={{ background: definition.submissionRecords ? 'white' : '#f1f1f1' }}>
                      <SubmissionConfigurationPadding>
                        <H3Inline>Task queue to process</H3Inline>
                        <ToolTipAdjust>
                          {definition.submissionRecords && (
                            <GoATooltip
                              content={
                                getQueueTaskToProcessValue() === NO_TASK_CREATED_OPTION
                                  ? ' No task will be created for processing of the submissions. Applications are responsible for management of how submissions are worked on by users.'
                                  : 'A task will be created in queue “{queue namespace + name}” for submissions of the form. This allows program staff to work on the submissions from the task management application using this queue.'
                              }
                            >
                              <GoAIcon type="information-circle" ariaLabel="queue"></GoAIcon>
                            </GoATooltip>
                          )}
                        </ToolTipAdjust>
                        <QueueTaskDropdown>
                          {queueTasks && Object.keys(queueTasks).length > 0 && (
                            <GoADropdown
                              data-test-id="form-submission-select-queue-task-dropdown"
                              name="queueTasks"
                              disabled={!definition.submissionRecords}
                              value={[getQueueTaskToProcessValue()]}
                              relative={true}
                              onChange={(name, queueTask: string) => {
                                const separatedQueueTask = queueTask.split(':');
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
                              <GoADropdownItem
                                data-testId={`task-Queue-ToCreate-DropDown`}
                                key={`No-Task-Created`}
                                value={NO_TASK_CREATED_OPTION}
                                label={NO_TASK_CREATED_OPTION}
                              />
                              {queueTasks &&
                                Object.keys(queueTasks)
                                  .sort()
                                  .map((item) => (
                                    <GoADropdownItem data-testId={item} key={item} value={item} label={item} />
                                  ))}
                            </GoADropdown>
                          )}
                        </QueueTaskDropdown>
                        <RowFlex>
                          <h3>Disposition states</h3>
                          <div>
                            {definition.submissionRecords ? (
                              <GoATooltip
                                content="Disposition states represent possible decisions applied to submissions by program staff. For example, an adjudicator may find that a submission is incomplete and records an Incomplete state with rationale of what information is missing."
                                position="top"
                              >
                                <GoAIcon type="information-circle" ariaLabel="disposition-icon"></GoAIcon>
                              </GoATooltip>
                            ) : (
                              <FakeButton />
                            )}
                          </div>
                          <RightAlign>
                            {definition.submissionRecords ? (
                              <GoAButton
                                type="secondary"
                                testId="Add state"
                                disabled={!definition.submissionRecords}
                                onClick={() => {
                                  setNewDisposition(true);
                                  setSelectedEditModalIndex(null);
                                }}
                              >
                                Add state
                              </GoAButton>
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
              <GoAButtonGroup alignment="end">
                <GoAButton
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
                </GoAButton>
                <GoAButton
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
                </GoAButton>
              </GoAButtonGroup>
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
                    <GoAFormItem error={schemaError} label="">
                      <JSONFormPreviewer
                        onChange={({ data }) => {
                          setData(data);
                        }}
                        data={data}
                      />
                    </GoAFormItem>
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
        <GoAModal heading="Intake Periods" open={intakePeriodModal} maxWidth={'70ch !important'}>
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
                    <GoAAccordion heading={coreEvent.name} open={false}>
                      <StartEndDateEditor event={coreEvent} newEvent={false} closeIntake={() => null} />
                    </GoAAccordion>
                  );
                })
              : !showNew && <b>No intake periods configured for this form</b>}

            {showNew && (
              <Margin>
                <GoAContainer mt="m">
                  <StartEndDateEditor
                    formId={definition.id}
                    event={CalendarEventDefault}
                    closeIntake={() => setShowNew(false)}
                    newEvent={true}
                  />
                </GoAContainer>
              </Margin>
            )}
            {!showNew && (
              <Margin>
                <GoAButton type="primary" onClick={() => setShowNew(true)}>
                  New intake period
                </GoAButton>
              </Margin>
            )}
            <GoAButtonGroup alignment="end" mt="xl">
              <GoAButton
                type="secondary"
                disabled={showNew}
                onClick={() => {
                  setIntakePeriodModal(false);
                }}
              >
                Close
              </GoAButton>
            </GoAButtonGroup>
          </form>
        </GoAModal>
      )}
    </FormEditor>
  );
}
