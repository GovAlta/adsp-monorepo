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
} from '@abgov/react-components-new';
import MonacoEditor, { useMonaco } from '@monaco-editor/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ClientRoleTable } from '@components/RoleTable';
import { SaveFormModal } from '@components/saveModal';
import { Tab, Tabs } from '@components/Tabs';
import { PageIndicator } from '@components/Indicator';
import DataTable from '@components/DataTable';
import { DeleteModal } from '@components/DeleteModal';
import { CustomLoader } from '@components/CustomLoader';
import { FormPropertyValueCompletionItemProvider, FormUISchemaElementCompletionItemProvider } from '@lib/autoComplete';
import { isValidJSONSchemaCheck } from '@lib/validation/checkInput';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, wordMaxLengthCheck, badCharsCheck } from '@lib/validation/checkInput';
import useWindowDimensions from '@lib/useWindowDimensions';
import { RootState } from '@store/index';
import { FETCH_KEYCLOAK_SERVICE_ROLES, fetchKeycloakServiceRoles } from '@store/access/actions';
import { rolesSelector } from '@store/access/selectors';
import { SecurityClassification } from '@store/common/models';
import { getConfigurationDefinitions } from '@store/configuration/action';
import {
  UploadFileService,
  DownloadFileService,
  DeleteFileService,
  FetchFileTypeService,
  ClearNewFileList,
} from '@store/file/actions';
import {
  setDraftDataSchema,
  setDraftUISchema,
  updateFormDefinition,
  updateEditorFormDefinition,
} from '@store/form/action';
import { Disposition, FormDefinition } from '@store/form/model';
import { isFormUpdatedSelector, modifiedDefinitionSelector, schemaErrorSelector } from '@store/form/selectors';
import { ActionState } from '@store/session/models';
import { FetchRealmRoles } from '@store/tenant/actions';
import { getTaskQueues } from '@store/task/action';
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
} from '../styled-components';
import { AddEditDispositionModal } from './addEditDispositionModal';
import { DispositionItems } from './dispositionItems';
import { FormConfigDefinition } from './formConfigDefinition';
import { InfoCircleWithInlineHelp } from './infoCircleWithInlineHelp';
import { JSONFormPreviewer } from './JsonFormPreviewer';
import { PreviewTop, PDFPreviewTemplateCore } from './PDFPreviewTemplateCore';
import { RowFlex, QueueTaskDropdown, H3, BorderBottom } from './style-components';

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
  isNewDisposition: boolean,
  currentDisposition: Disposition,
  definition: FormDefinition,
  selectedEditModalIndex: number | null
): [FormDefinition, number | null] => {
  if (isNewDisposition) {
    const currentDispositionStates = [...definition.dispositionStates] || [];
    if (currentDisposition) {
      currentDispositionStates.push(currentDisposition);
      definition.dispositionStates = currentDispositionStates;
    }
  } else {
    definition.dispositionStates[selectedEditModalIndex] = currentDisposition;
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

export function AddEditFormDefinitionEditor(): JSX.Element {
  const fileList = useSelector((state: RootState) => {
    return state?.fileService.newFileList;
  });

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(FetchRealmRoles());
    dispatch(fetchKeycloakServiceRoles());
    dispatch(getTaskQueues());
    dispatch(getConfigurationDefinitions());
    dispatch(FetchFileTypeService());
  }, [dispatch]);

  const fileTypes = useSelector((state: RootState) => state.fileService.fileTypes);

  const uploadFile = (file: File, propertyId: string) => {
    const fileInfo = { file: file, type: fileTypes[0]?.id, propertyId: propertyId };
    dispatch(UploadFileService(fileInfo));
  };
  const downloadFile = (file) => {
    dispatch(DownloadFileService(file));
  };

  const JSONSchemaValidator = isValidJSONSchemaCheck('Data schema');
  const monaco = useMonaco();

  const definition = useSelector(modifiedDefinitionSelector);
  const setDefinition = (update: Partial<FormDefinition>) => dispatch(updateEditorFormDefinition(update));
  const isLoading = useSelector((state: RootState) => state.form.editor.loading);
  const isSaving = useSelector((state: RootState) => state.form.editor.saving);

  const tempUiSchema = useSelector((state: RootState) => state.form.editor.uiSchemaDraft);
  const tempDataSchema = useSelector((state: RootState) => state.form.editor.dataSchemaDraft);
  const schemaError = useSelector(schemaErrorSelector);

  const isFormUpdated = useSelector(isFormUpdatedSelector);

  const latestNotification = useSelector(
    (state: RootState) => state.notifications.notifications[state.notifications.notifications.length - 1]
  );
  const queueTasks = useSelector((state: RootState) => state.task?.queues || {});

  const isLoadingRoles = useSelector(
    (state: RootState) => state.session.indicator?.details[FETCH_KEYCLOAK_SERVICE_ROLES] === ActionState.inProcess
  );
  const roles = useSelector(rolesSelector);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const [activeIndex] = useState<number>(0);
  const [data, setData] = useState<unknown>();
  const [selectedDeleteDispositionIndex, setSelectedDeleteDispositionIndex] = useState<number>(null);
  const [selectedEditModalIndex, setSelectedEditModalIndex] = useState<number>(null);

  const [newDisposition, setNewDisposition] = useState<boolean>(false);
  const [saveModal, setSaveModal] = useState({ visible: false });
  const [currentTab, setCurrentTab] = useState(0);

  const { height } = useWindowDimensions();
  const calcHeight = latestNotification && !latestNotification.disabled ? height - 50 : height;
  const EditorHeight = calcHeight - 400;
  const [editorErrors, setEditorErrors] = useState({
    uiSchema: null,
    dataSchemaJSON: null,
    dataSchemaJSONSchema: null,
  });

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

      const elementProvider = monaco.languages.registerCompletionItemProvider(
        'json',
        new FormUISchemaElementCompletionItemProvider(dataSchema)
      );

      return function () {
        valueProvider.dispose();
        elementProvider.dispose();
      };
    }
  }, [monaco, dataSchema]);

  const navigate = useNavigate();
  const close = () => {
    dispatch(ClearNewFileList());
    navigate('..?definitions=true', { state: { isNavigatedFromEdit: true } });
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

            <Tabs activeIndex={activeIndex} data-testid="form-editor-tabs">
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
                      onChange={(value) => {
                        dispatch(setDraftUISchema(value));
                      }}
                      language="json"
                      options={{
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
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
                  <RolesTabBody data-testid="roles-editor-body" style={{ height: EditorHeight - 5 }}>
                    <ScrollPane>
                      {roles.map((e, key) => {
                        return (
                          <ClientRole
                            roleNames={e.roleNames}
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
                            onChange={(name, checked) => {
                              setDefinition({ anonymousApply: checked });
                            }}
                            text={'Allow anonymous application'}
                          />
                        </GoACheckboxPad>
                        <GoATooltip
                          content={
                            definition.anonymousApply
                              ? 'Forms of this type will allow anonymous user to apply.'
                              : 'Forms of this type will allow not anonymous user to apply.'
                          }
                          position="top"
                        >
                          <GoAIcon type="information-circle"></GoAIcon>
                        </GoATooltip>
                      </FlexRow>

                      <FlexRow>
                        <GoACheckboxPad>
                          <GoACheckbox
                            name="support-topic"
                            key="support-topic"
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
                          <GoAIcon type="information-circle"></GoAIcon>
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
                        <GoAIcon type="information-circle"></GoAIcon>
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
                        <GoAIcon type="information-circle"></GoAIcon>
                      </GoATooltip>
                    </FlexRow>
                    <div style={{ background: definition.submissionRecords ? 'white' : '#f1f1f1' }}>
                      <SubmissionConfigurationPadding>
                        <InfoCircleWithInlineHelp
                          initialLabelValue={definition.submissionRecords}
                          label="Task queue to process &nbsp;"
                          text={
                            getQueueTaskToProcessValue() === NO_TASK_CREATED_OPTION
                              ? ' No task will be created for processing of the submissions. Applications are responsible for management of how submissions are worked on by users.'
                              : 'A task will be created in queue “{queue namespace + name}” for submissions of the form. This allows program staff to work on the submissions from the task management application using this queue.'
                          }
                        />
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
                                <GoAIcon type="information-circle"></GoAIcon>
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
              <GoAButtonGroup alignment="start">
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
          delete dispositionStates[selectedDeleteDispositionIndex];
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
    </FormEditor>
  );
}
