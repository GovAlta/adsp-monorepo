import React, { useEffect } from 'react';
import {
  Modal,
  HideTablet,
  FormTemplateEditorContainer,
  OuterFormTemplateEditorContainer,
  FormEditor,
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
import {
  setDraftDataSchema,
  setDraftUISchema,
  updateFormDefinition,
  updateEditorFormDefinition,
  getFormDefinitions,
} from '@store/form/action';
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

  const dataSchema = useSelector((state: RootState) => state.form.editor.resolvedDataSchema) as Record<string, unknown>;

  const fileList = useSelector((state: RootState) => {
    return state?.fileService.newFileList;
  });

  const DeleteFileServiceDispatch = (fileId: string) => {
    dispatch(DeleteFileService(fileId));
  };
  const updateFormDefinitionDispatch = (definition: any) => {
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
                  tempUiSchema={tempUiSchema}
                  tempDataSchema={tempDataSchema}
                  setDefinition={setDefinition}
                  formDefinitions={formDefinitions}
                  schemaError={schemaError}
                  selectedCoreEvent={selectedCoreEvent}
                  isFormUpdated={isFormUpdated}
                  latestNotification={latestNotification}
                  isLoadingRoles={isLoadingRoles}
                  fileList={fileList}
                  SecurityClassification={SecurityClassification}
                  indicator={indicator}
                  CalendarEventDefault={CalendarEventDefault}
                  formServiceApiUrl={formServiceApiUrl}
                  DeleteFileService={DeleteFileServiceDispatch}
                  updateFormDefinition={updateFormDefinitionDispatch}
                  UploadFileService={UploadFileServiceDispatch}
                  DownloadFileService={DownloadFileServiceDispatch}
                  ClearNewFileList={ClearNewFileListDispatch}
                  getFormDefinitions={getFormDefinitionsDispatch}
                  setDraftDataSchema={setDraftDataSchemaDispatch}
                  setDraftUISchema={setDraftUISchemaDispatch}
                  UpdateSearchCriteriaAndFetchEvents={UpdateSearchCriteriaAndFetchEventsDispatch}
                  dataSchema={dataSchema}
                  renameAct={renameActDispatch}
                />
              ) : (
                <FormEditor>
                  <PageIndicator />
                </FormEditor>
              )}
            </FormTemplateEditorContainer>
          </HideTablet>
        </OuterFormTemplateEditorContainer>
      </ModalContent>
    </Modal>
  );
};
