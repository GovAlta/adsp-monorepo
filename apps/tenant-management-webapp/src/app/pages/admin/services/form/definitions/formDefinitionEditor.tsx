import React, { useEffect } from 'react';
import {
  Modal,
  HideTablet,
  FormTemplateEditorContainer,
  OuterFormTemplateEditorContainer,
  FormEditor,
  IndicatorBox,
} from '../styled-components';
import { ModalContent } from '../../styled-components';
import { useNavigate, useParams } from 'react-router-dom';
import { TabletMessage } from '@components/TabletMessage';
import { useDispatch, useSelector } from 'react-redux';
import { openEditorForDefinition } from '@store/form/action';
import { RootState } from '@store/index';
import { initializeFormEditor } from '@store/form/action';
import { modifiedDefinitionSelector } from '@store/form/selectors';
import { rolesSelector } from '@store/access/selectors';
import { PageIndicator } from '@components/Indicator';
import { REALM_ROLE_KEY } from '@store/sharedSelectors/roles';
import { selectRegisterData } from '@store/configuration/selectors';
import {
  setDraftDataSchema,
  setDraftUISchema,
  updateFormDefinition,
  updateEditorFormDefinition,
  getFormDefinitions,
} from '@store/form/action';
import _ from 'underscore';
import { isFormUpdatedSelector, schemaErrorSelector } from '@store/form/selectors';
import { FETCH_KEYCLOAK_SERVICE_ROLES } from '@store/access/actions';
import { FormEditorCommon } from '../../../../../../../../../libs/form-editor-common/src';
import { SecurityClassification } from '@store/common/models';
import { UploadFileService, DownloadFileService, DeleteFileService, ClearNewFileList } from '@store/file/actions';
import { FormDefinition } from '@store/form/model';
import { CalendarEventDefault } from '@store/calendar/models';
import { UpdateSearchCriteriaAndFetchEvents } from '@store/calendar/actions';
import { ActionState } from '@store/session/models';
import { renameAct } from '@store/form/action';
import { selectDefaultFormUrl } from '@store/form/selectors';
import { UpdateEventsByCalendar, CreateEventsByCalendar } from '@store/calendar/actions';
import { CalendarEvent } from '../../../../../store/calendar/models';
import { DeleteCalendarEvent } from '@store/calendar/actions';
import { FetchFileService } from '@store/file/actions';
import { streamPdfSocket } from '@store/pdf/action';
import { updatePdfResponse, showCurrentFilePdf, setPdfDisplayFileId } from '@store/pdf/action';
import { FileItem } from '@store/file/models';
import { updateTempTemplate } from '../../../../../store/pdf/action';
import { generatePdf } from '../../../../../store/pdf/action';
import { getCorePdfTemplates } from '../../../../../store/pdf/action';
import { GoACircularProgress } from '@abgov/react-components';

export const FormDefinitionEditor = (): JSX.Element => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const selectedId = useSelector((state: RootState) => state.form.editor.selectedId);
  const realmRoles = useSelector((state: RootState) => state.tenant.realmRoles);
  const fileTypes = useSelector((state: RootState) => state.fileService.fileTypes);
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    // This is to handle deep linking to the editor for a specific definition.
    if (id !== selectedId) {
      dispatch(openEditorForDefinition(id));
    }
  });

  const queueTasks = useSelector((state: RootState) => state.task?.queues);
  const definition = useSelector(modifiedDefinitionSelector);
  const roles = useSelector(rolesSelector);

  useEffect(() => {
    dispatch(initializeFormEditor());
  }, [dispatch]);

  const {
    loading: isLoading,
    saving: isSaving,
    uiSchemaDraft: tempUiSchema,
    dataSchemaDraft: tempDataSchema,
  } = useSelector((state: RootState) => state.form.editor);

  const setDefinitionDispatch = (update: Partial<FormDefinition>) => dispatch(updateEditorFormDefinition(update));
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

  const dataSchema = useSelector((state: RootState) => state.form.editor.resolvedDataSchema) as Record<string, unknown>;
  const fileList = useSelector((state: RootState) => state?.fileService?.fileList);

  const hasFormName = (jobFileName, formName) => {
    const partFormName = formName.length >= 10 ? formName.substr(0, 10) : formName;
    return jobFileName.indexOf(partFormName) !== -1;
  };

  const pdfTemplate = useSelector(
    (state: RootState) => state.pdf?.corePdfTemplates['submitted-form'] || state?.pdf?.pdfTemplates[id]
  );

  const jobList = useSelector((state: RootState) =>
    state?.pdf?.jobs.filter((job) => job.templateId === pdfTemplate.id && hasFormName(job.filename, definition?.name))
  );
  const socketChannel = useSelector((state: RootState) => state?.pdf.socketChannel);
  const reloadFile = useSelector((state: RootState) => state.pdf?.reloadFile);
  const currentId = useSelector((state: RootState) => state?.pdf?.currentId);
  const files = useSelector((state: RootState) => state?.pdf.files);
  const registerData = useSelector(selectRegisterData);
  const nonAnonymous = useSelector((state: RootState) => state.configuration?.nonAnonymous);
  const dataList = useSelector((state: RootState) => state.configuration?.dataList);

  const newFileList = useSelector((state: RootState) => state?.fileService.newFileList);
  const tenantName = useSelector((state: RootState) => state.tenant.name);

  const pdfList = useSelector((state: RootState) => state.pdf.jobs, _.isEqual);

  const DeleteFileServiceDispatch = (fileId: string) => {
    dispatch(DeleteFileService(fileId));
  };
  const updateFormDefinitionDispatch = (definition: any) => {
    console.log(JSON.stringify(definition) + '<definition--------');
    dispatch(updateFormDefinition(definition));
  };
  const UploadFileServiceDispatch = (value: any) => {
    dispatch(UploadFileService(value));
  };
  const DownloadFileServiceDispatch = (file: any) => {
    dispatch(DownloadFileService(file));
  };
  const UpdateSearchCriteriaAndFetchEventsDispatch = (record: any) => {
    dispatch(UpdateSearchCriteriaAndFetchEvents(record));
  };
  const ClearNewFileListDispatch = () => {
    dispatch(ClearNewFileList());
  };
  const getFormDefinitionsDispatch = () => {
    dispatch(getFormDefinitions());
  };
  const setDraftDataSchemaDispatch = (value: string) => {
    dispatch(setDraftDataSchema(value));
  };
  const setDraftUISchemaDispatch = (value: string) => {
    dispatch(setDraftUISchema(value));
  };
  const renameActDispatch = (editActTarget: any, newName: any) => {
    dispatch(renameAct(editActTarget, newName));
  };

  const UpdateEventsByCalendarDispatch = (eventId: string, event: CalendarEvent) => {
    dispatch(UpdateEventsByCalendar('form-intake', eventId, event));
  };
  const CreateEventsByCalendarDispatch = (event: CalendarEvent) => {
    dispatch(CreateEventsByCalendar('form-intake', event));
  };
  const DeleteCalendarEventDispatch = (eventId: string) => {
    dispatch(DeleteCalendarEvent(eventId, 'form-intake'));
  };
  const updatePdfResponseDispatch = (fileList: FileItem[]) => {
    dispatch(updatePdfResponse({ fileList: fileList }));
  };
  const showCurrentFilePdfDispatch = (currentFileId: string) => {
    dispatch(showCurrentFilePdf(currentFileId));
  };
  const setPdfDisplayFileIdDispatch = (fileId: string) => {
    dispatch(setPdfDisplayFileId(fileId));
  };
  const streamPdfSocketDispatch = (disconnect: false) => {
    dispatch(streamPdfSocket(disconnect));
  };
  const FetchFileServiceDispatch = (fieldId: string) => {
    dispatch(FetchFileService(fieldId));
  };

  const updateTempTemplateDispatch = (pdfTemplate: any) => {
    dispatch(updateTempTemplate(pdfTemplate));
  };
  const generatePdfDispatch = (payload: any) => {
    dispatch(generatePdf(payload));
  };
  const getCorePdfTemplatesDispatch = () => {
    dispatch(getCorePdfTemplates());
  };

  const defaultFormUrl = useSelector((state: RootState) => selectDefaultFormUrl(state, definition?.id || null));

  const definitions = useSelector((state: RootState) => {
    return state?.form?.definitions;
  });

  return (
    <Modal data-testid="template-form">
      <ModalContent>
        <OuterFormTemplateEditorContainer>
          <TabletMessage goBack={() => navigate('/admin/services/form?definitions=true')} />
          <HideTablet>
            <FormTemplateEditorContainer>
              {definition?.id && realmRoles && queueTasks && fileTypes ? (
                <FormEditorCommon
                  key={id}
                  definition={definition}
                  roles={roles}
                  queueTasks={queueTasks}
                  fileTypes={fileTypes}
                  isLoading={isLoading}
                  isSaving={isSaving}
                  indicator={indicator}
                  tempUiSchema={tempUiSchema}
                  tempDataSchema={tempDataSchema}
                  schemaError={schemaError}
                  selectedCoreEvent={selectedCoreEvent}
                  isFormUpdated={isFormUpdated}
                  latestNotification={latestNotification}
                  isLoadingRoles={isLoadingRoles}
                  newFileList={newFileList}
                  SecurityClassification={SecurityClassification}
                  CalendarEventDefault={CalendarEventDefault}
                  formServiceApiUrl={formServiceApiUrl}
                  fileList={fileList}
                  pdfTemplate={pdfTemplate}
                  jobList={jobList}
                  socketChannel={socketChannel}
                  reloadFile={reloadFile}
                  currentId={currentId}
                  files={files}
                  pdfList={pdfList}
                  REALM_ROLE_KEY={REALM_ROLE_KEY}
                  registerData={registerData}
                  nonAnonymous={nonAnonymous}
                  dataList={dataList}
                  tenantName={tenantName}
                  dataSchema={dataSchema}
                  definitions={definitions}
                  defaultFormUrl={defaultFormUrl}
                  setDefinition={setDefinitionDispatch}
                  DeleteFileService={DeleteFileServiceDispatch}
                  updateFormDefinition={updateFormDefinitionDispatch}
                  UploadFileService={UploadFileServiceDispatch}
                  DownloadFileService={DownloadFileServiceDispatch}
                  ClearNewFileList={ClearNewFileListDispatch}
                  getFormDefinitions={getFormDefinitionsDispatch}
                  setDraftDataSchema={setDraftDataSchemaDispatch}
                  setDraftUISchema={setDraftUISchemaDispatch}
                  UpdateSearchCriteriaAndFetchEvents={UpdateSearchCriteriaAndFetchEventsDispatch}
                  renameAct={renameActDispatch}
                  DeleteCalendarEvent={DeleteCalendarEventDispatch}
                  CreateEventsByCalendar={CreateEventsByCalendarDispatch}
                  UpdateEventsByCalendar={UpdateEventsByCalendarDispatch}
                  streamPdfSocket={streamPdfSocketDispatch}
                  showCurrentFilePdf={showCurrentFilePdfDispatch}
                  setPdfDisplayFileId={setPdfDisplayFileIdDispatch}
                  updatePdfResponse={updatePdfResponseDispatch}
                  FetchFileService={FetchFileServiceDispatch}
                  updateTempTemplate={updateTempTemplateDispatch}
                  generatePdf={generatePdfDispatch}
                  getCorePdfTemplates={getCorePdfTemplatesDispatch}
                />
              ) : (
                <IndicatorBox>
                  <GoACircularProgress visible={true} message="Loading..." size="large" />
                </IndicatorBox>
              )}
            </FormTemplateEditorContainer>
          </HideTablet>
        </OuterFormTemplateEditorContainer>
      </ModalContent>
    </Modal>
  );
};
