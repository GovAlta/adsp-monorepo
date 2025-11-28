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
import { standardV1JsonSchema, commonV1JsonSchema } from '@abgov/data-exchange-standard';

function digestConfiguration(configuration: FormDefinition | null): string {
  return JSON.stringify(
    Object.keys(configuration || {})
      .sort()
      .reduce((values, key) => ({ ...values, [key]: configuration[key] }), {})
  );
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

  const fileList = useSelector((state: AppState) => {
    return state?.file.newFileList;
  });

  const downloadFile = (file) => {
    console.log('pretend to download file');
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
    } catch (err) {
      console.error('Failed to parse data schema: ' + err);
      setDataError(err);
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
    } catch (err) {
      console.error('Failed to parse data schema: ' + err);
      setUiError(err);
    }
  };

  return (
    <div className="form-template-editor-container">
      {definition?.id && (
        <Editor
          updateFormDefinition={updateFormDefinition}
          definition={definition}
          setDraftDataSchema={setDraftData}
          setDraftUiSchema={setDraftUi}
          isFormUpdated={isFormUpdated}
          fileList={fileList}
          uploadFile={uploadFile}
          resolvedDataSchema={resolvedTempDefinition}
          downloadFile={downloadFile}
          deleteFile={deleteFile}
          formServiceApiUrl={formServiceApiUrl}
          schemaError={schemaError}
          uiSchema={tempDefinition?.uiSchema}
          registerData={registerData}
          nonAnonymous={nonAnonymous}
          dataList={dataList}
        />
      )}
    </div>
  );
};

export default EditorWrapper;
