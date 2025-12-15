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
import { getSocketChannel } from '../../../state/pdf/selectors';
import { standardV1JsonSchema, commonV1JsonSchema } from '@abgov/data-exchange-standard';
import { uploadFile, downloadFile, deleteFile, FileItem } from '../../../state/file/file.slice';
import { metaDataSelector, FileWithMetadata } from '../../../state/file/file.slice';
import { store } from '../../../state/store';
import { formActions } from '../../../state/form/form.slice';
import { filesSelector } from '../../../state/form/selectors';
import { UISchemaElement } from '@jsonforms/core';
import { streamPdfSocket } from '../../../state/pdf/pdf.slice';
import { FetchFileService } from '../../../state/file/file.slice';
import { updateTempTemplate } from '../../../state/pdf/pdf.slice';
import { rolesSelector } from '../../../state/keycloak/selectors';
import { fetchKeycloakServiceRoles, fetchRoles } from '../../../state/keycloak/keycloak.slice';

import {
  generatePdf,
  showCurrentFilePdf,
  setPdfDisplayFileId,
  getCorePdfTemplates,
} from '../../../state/pdf/pdf.slice';

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

const hasFormName = (jobFileName: string, formName: string): boolean => {
  const partFormName = formName.length >= 10 ? formName.substr(0, 10) : formName;
  return jobFileName.indexOf(partFormName) !== -1;
};

const EditorWrapper = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();

  const dispatch = useDispatch<AppDispatch>();

  const [tempDefinition, setTempDefinition] = useState<FormDefinition | null>(null);
  const [resolvedTempDefinition, setResolvedTempDefinition] = useState({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dataError, setDataError] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [uiError, setUiError] = useState<any>(null);

  const pdfFiles = useSelector((state: AppState) => state?.pdf.files);
  const currentId = useSelector((state: AppState) => state?.pdf?.currentId);
  const pdfTemplate = useSelector((state: AppState) => state.pdf?.corePdfTemplates?.['submitted-form']);
  const fileList = useSelector((state: AppState) => state.file.fileList);
  const loading = useSelector((state: AppState) => state?.pdf.busy.loading);

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

  const socketChannel = useSelector((state: AppState) => {
    return getSocketChannel(state);
  });

  const jobList = useSelector((state: AppState) =>
    state?.pdf?.jobs.filter(
      (job) => job.templateId === pdfTemplate?.id && hasFormName(job.filename, definition?.name || '')
    )
  );

  // useEffect(() => {
  //   if (definition?.id) {
  //     // dispatch(fetchKeycloakServiceRoles());
  //     dispatch(fetchRoles());
  //   }
  // }, [definition]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    dispatch(getCorePdfTemplates());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    dispatch(updateTempTemplate({ tempTemplate: pdfTemplate }));
  }, [pdfTemplate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!socketChannel) {
      dispatch(streamPdfSocket({ disconnect: false }));
    }
  }, [socketChannel, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const jobIds = new Set(jobList.map((job) => job?.id).filter((id): id is string => !!id));
    const currentFile = fileList.find((file) => file?.recordId && jobIds.has(file?.recordId));

    if (currentFile) {
      dispatch(showCurrentFilePdf({ fileId: currentFile?.id }));
    } else {
      dispatch(setPdfDisplayFileId({ fileId: undefined }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, fileList]);

  const reloadFile = useSelector((state: AppState) => state.pdf?.reloadFile);

  useEffect(() => {
    if (reloadFile && reloadFile[pdfTemplate?.id]) {
      dispatch(FetchFileService({ fileId: reloadFile[pdfTemplate?.id] }));
    }
  }, [reloadFile]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const downloadFileFunction = async (file: FileItem) => {
    const state = store.getState() as AppState;
    const localFileCache = state.file?.files[file.urn];
    const element = document.createElement('a');

    if (localFileCache) {
      element.href = localFileCache;
      element.download = file.filename || 'name';
    } else {
      try {
        const { blob, filename } = await dispatch(downloadFile(file.urn)).unwrap();
        const blobUrl = URL.createObjectURL(new Blob([blob]));
        element.href = blobUrl;
        element.download = filename;
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
  const deleteFileFunction = async (file: FileItem) => {
    const clonedFiles = { ...files };
    const propertyId = getKeyByValue(clonedFiles, file.urn) || '';
    await dispatch(deleteFile({ urn: file.urn, propertyId }));
    delete clonedFiles[propertyId];
    dispatch(formActions.updateFormFiles(clonedFiles));
  };

  const getFileName = (formName: string): string =>
    `${PDF_FORM_TEMPLATE_ID}_${formName.length >= 10 ? formName.substr(0, 10) : formName}_${new Date()
      .toJSON()
      .slice(0, 19)
      .replace(/:/g, '-')}.pdf`;

  const PDF_FORM_TEMPLATE_ID = 'submitted-form';

  const generateTemplate = (data: Record<string, string>) => {
    const payload = {
      templateId: PDF_FORM_TEMPLATE_ID,
      data: { definition: definition },
      fileName: getFileName(definition?.name || ''),
      formId: definition?.name,
      inputData: data,
    };

    dispatch(generatePdf(payload));
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
      setDataError(null);
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

  const roles = useSelector(rolesSelector) as any[];

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
          currentPDF={pdfFiles[currentId]}
          pdfFile={fileList[0]}
          jobList={jobList}
          generatePdf={generateTemplate}
          loading={loading}
          roles={roles}
          updateEditorFormDefinition={(definition: Partial<FormDefinition>) => {
            const tempSchema = {
              ...(tempDefinition || {}),
              ...(definition || {}),
            } as FormDefinition;

            setTempDefinition(tempSchema);
          }}
          fetchKeycloakServiceRoles={() => {
            dispatch(fetchKeycloakServiceRoles());
                dispatch(fetchRoles());
          }}
        />
      )}
    </div>
  );
};

export default EditorWrapper;
