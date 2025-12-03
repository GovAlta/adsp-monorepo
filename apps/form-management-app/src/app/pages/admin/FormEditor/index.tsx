import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, FormDefinition } from '../../../state';
import { updateDefinition, getFormConfiguration } from '../../../state/form/form.slice';
import { Editor } from './Editor';
import { savedDefinition } from '../../../state/form/selectors';
import { JSONSchema } from '@apidevtools/json-schema-ref-parser';
import { AppState } from '../../../state';
import { CONFIGURATION_SERVICE_ID } from '../../../state';
import { selectRegisterData } from '../../../state/configuration/selectors';
import { tryResolveRefs } from '@abgov/jsonforms-components';
import styles from './Editor.module.scss';
import { standardV1JsonSchema, commonV1JsonSchema } from '@abgov/data-exchange-standard';
import { uploadFile, downloadFile, deleteFile } from '../../../state/file/file.slice';
import { metaDataSelector } from '../../../state/file/selectors';
import { store } from '../../../state/store';
import { FileWithMetadata } from '../../../state/file/file.slice';

import { formActions } from '../../../state/form/form.slice';
import { filesSelector } from '../../../state/form/selectors';
import { UISchemaElement}  from '@jsonforms/core';

export const FORM_SUPPORTING_DOCS = 'form-supporting-documents';

function digestConfiguration(configuration: FormDefinition | null): string {
  if (!configuration) return '{}';

  const conf = configuration as unknown as Record<string, unknown>;

  return JSON.stringify(
    Object.keys(conf)
      .sort()
      .reduce((values, key) => ({ ...values, [key]: conf[key] }), {})
  );
}

function getKeyByValue<T extends Record<string, unknown>>(obj: T, value: unknown): string | undefined {
  return Object.keys(obj).find((key) => obj[key] === value);
}

const EditorWrapper = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();

  const dispatch = useDispatch<AppDispatch>();

  const [tempDefinition, setTempDefinition] = useState<FormDefinition | null>(null);
  const [resolvedTempDefinition, setResolvedTempDefinition] = useState({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dataError, setDataError] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [uiError, setUiError] = useState<any>(null);

  useEffect(() => {
    try {
      if (id) {
        dispatch(getFormConfiguration({ id }));
      }
    } catch (e) {
      console.error('error:' + JSON.stringify(e));
    }
  }, [id, dispatch]);

  const files = useSelector(filesSelector);
  const metadata = useSelector(metaDataSelector);

  const definition = useSelector(savedDefinition);

  useEffect(() => {
    const init = async () => {
      setTempDefinition(definition || null);

      if (definition?.dataSchema) {
        try {
          const [resolvedSchema, error] = await tryResolveRefs(
            definition.dataSchema,
            standardV1JsonSchema,
            commonV1JsonSchema
          );
          setDataError(error);
          setResolvedTempDefinition(resolvedSchema);
        } catch (err) {
          console.error('Failed to resolve schema:', err);
        }
      }
    };

    init();
  }, [definition]);

  const isFormUpdatedFunction = () => {
    const originalDigest = digestConfiguration(definition);
    const modifiedDigest = digestConfiguration(tempDefinition);
    return originalDigest !== modifiedDigest;
  };

  const isFormUpdated = isFormUpdatedFunction();

  const updateFormDefinition = () => {
    if (tempDefinition) {
      dispatch(updateDefinition(tempDefinition));
    }
  };

  const downloadFileFunction = async (file: FileWithMetadata) => {
    const state = store.getState() as AppState;
    const localFileCache = state.file?.files[file.urn];
    const element = document.createElement('a');

    if (localFileCache) {
      element.href = localFileCache;
      element.download = file.filename || "name";
    } else {
      try {
        const fileData = await dispatch(downloadFile(file.urn)).unwrap();
        const blobUrl = URL.createObjectURL(new Blob([fileData.data]));
        element.href = blobUrl;
        element.download = fileData.metadata.filename;
      } catch (err) {
        console.error('Failed to download file:', err);
        return;
      }
    }

    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  const uploadFileFunction = async (file: FileWithMetadata, propertyId: string) => {
    const clonedFiles = { ...files };
    const propertyIdRoot = propertyId.split('.')[0];
    const fileInfo = {
      file: file,
      typeId: FORM_SUPPORTING_DOCS,
      recordId: definition?.urn || definition?.id || '',
      propertyId: propertyIdRoot,
    };

    try {
      const fileMetaData = (await dispatch(uploadFile(fileInfo)).unwrap()).metadata;
      clonedFiles[propertyId] = fileMetaData.urn;
      dispatch(formActions.updateFormFiles(clonedFiles));
    } catch (err) {
      console.error('File upload failed: ' + JSON.stringify(err));
    }
  };
  const deleteFileFunction = async (file: FileWithMetadata) => {
    const clonedFiles = { ...files };
    const propertyId = getKeyByValue(clonedFiles, file.urn) || "";
    await dispatch(deleteFile({ urn: file.urn, propertyId }));
    delete clonedFiles[propertyId];
    dispatch(formActions.updateFormFiles(clonedFiles));
  };

  const registerData = useSelector(selectRegisterData);
  const nonAnonymous = useSelector((state: AppState) => state.configuration?.nonAnonymous);
  const dataList = useSelector((state: AppState) => state.configuration?.dataList);

  const formServiceApiUrl = useSelector((state: AppState) => state.config.directory[CONFIGURATION_SERVICE_ID]);
  const schemaError = dataError || uiError;

  const setDraftData = async (dataDefinition: string) => {
    try {
      const parsedSchema = JSON.parse(dataDefinition);
      const tempSchema = {
        ...(tempDefinition ?? definition ?? {}),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dataSchema: parsedSchema as unknown as any,
      } as FormDefinition;
      setTempDefinition(tempSchema);

      const [resolvedSchema, error] = await tryResolveRefs(parsedSchema, standardV1JsonSchema, commonV1JsonSchema);
      setResolvedTempDefinition(resolvedSchema);
      setDataError(null)
    } catch (err) {
      console.error('Failed to parse data schema: ' + err);
      setDataError(err instanceof Error ? err.message : String(err));
    }
  };
  const setDraftUi = (uiDefinition: string) => {
    try {
      const parsedSchema = JSON.parse(uiDefinition) as JSONSchema;
      const tempSchema = {
        ...(tempDefinition ?? definition ?? {}),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        uiSchema: parsedSchema as unknown as any,
      } as FormDefinition;
      setTempDefinition(tempSchema);
      setUiError(null);
    } catch (err) {
      console.error('Failed to parse data schema: ' + err);
      setUiError(err instanceof Error ? err.message : String(err));
    }
  };

  const emptyUiSchema: UISchemaElement = {
    type: 'VerticalLayout',
    elements: [],
  };

  return (
    <div className={styles['form-template-editor-container']}>
      {definition?.id && (
        <Editor
          updateFormDefinition={updateFormDefinition}
          definition={definition}
          setDraftDataSchema={setDraftData}
          setDraftUiSchema={setDraftUi}
          isFormUpdated={isFormUpdated}
          fileList={metadata}
          uploadFile={uploadFileFunction}
          resolvedDataSchema={resolvedTempDefinition}
          downloadFile={downloadFileFunction}
          deleteFile={deleteFileFunction}
          formServiceApiUrl={formServiceApiUrl}
          schemaError={schemaError}
          uiSchema={tempDefinition?.uiSchema ?? emptyUiSchema}
          registerData={registerData}
          nonAnonymous={nonAnonymous}
          dataList={dataList}
        />
      )}
    </div>
  );
};

export default EditorWrapper;
