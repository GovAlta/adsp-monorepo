import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import { FormTemplateEditorContainer } from './styled-components';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, AppState } from '../../../state';
import {
  updateDefinition,
  openEditorForDefinition,

} from '../../../state/form/form.slice';
import { isFormUpdatedSelector, schemaErrorSelector } from '../../../state/form/selectors';

import { Editor } from './Editor';
import { modifiedDefinitionSelector } from '../../../state/form/selectors';
import { setDraftDataSchema, setDraftUiSchema } from '../../../state/form/form.slice';
import { CONFIGURATION_SERVICE_ID } from '../../../state';
import { selectRegisterData } from '../../../state/configuration/selectors';
import { UISchemaElement } from '@jsonforms/core';

//import { downloadFile } from '../../../state/file/file.slice';

const EditorWrapper = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();

  const dispatch = useDispatch<AppDispatch>();

  const selectedId = useSelector((state: AppState) => state.form.editor.selectedId);

  useEffect(() => {
    try {
      if (id && id !== selectedId) {
        dispatch(openEditorForDefinition({ id }));
      }
    } catch (e) {
      console.error('error:' + JSON.stringify(e));
    }
  }, [id, selectedId, dispatch]);

  const { isFormUpdated } = useSelector((state: AppState) => ({
    isFormUpdated: isFormUpdatedSelector(state),
  }));

  const updateFormDefinition = (definition) => {
    dispatch(updateDefinition(definition));
  };

  const definition = useSelector(modifiedDefinitionSelector);

  const setDraftData = (definition: string) => {
    dispatch(setDraftDataSchema(definition));
  };
  const setDraftUi = (definition: string) => {
    dispatch(setDraftUiSchema(definition));
  };

  const resolvedDataSchema = useSelector((state: AppState) => state.form.editor.resolvedDataSchema) as Record<string,unknown>;
  const uiSchema = useSelector((state: AppState) => state.form.editor.uiSchema) as UISchemaElement;

  const fileList = useSelector((state: AppState) => {
    return state?.file.newFileList;
  });

  const downloadFile = (file) => {
    //dispatch(downloadFile(file.urn)).unwrap();
    console.log("pretend to download file")
  };
  const uploadFile = (file) => {

    console.log('pretend to upload file');
  };
  const deleteFile = (file) => {
    console.log('pretend to delete file');
  };


  const registerData = useSelector(selectRegisterData);
  const nonAnonymous = useSelector((state: AppState) => state.configuration?.nonAnonymous);
  const dataList = useSelector((state: AppState) => state.configuration?.dataList);
  
  const formServiceApiUrl = useSelector((state: AppState) => state.config.directory[CONFIGURATION_SERVICE_ID]);
    const schemaError = useSelector(schemaErrorSelector);

  return (
    <AdminLayout>
      <FormTemplateEditorContainer>
        {definition?.id && (
          <Editor
            updateFormDefinition={updateFormDefinition}
            definition={definition}
            setDraftDataSchema={setDraftData}
            setDraftUiSchema={setDraftUi}
            isFormUpdated={isFormUpdated}
            resolvedDataSchema={resolvedDataSchema}
            fileList={fileList}
            uploadFile={uploadFile}
            downloadFile={downloadFile}
            deleteFile={deleteFile}
            formServiceApiUrl={formServiceApiUrl}
            schemaError={schemaError}
            uiSchema={uiSchema}
            registerData={registerData}
            nonAnonymous={nonAnonymous}
            dataList={dataList}
          />
        )}
      </FormTemplateEditorContainer>
    </AdminLayout>
  );
};

const Main = styled.div`
  flex: 1 1 auto;
  padding: var(--goa-space-l, 24px) 0;
`;

const AdminLayout = styled.div`
  display: flex;
`;

export default EditorWrapper
