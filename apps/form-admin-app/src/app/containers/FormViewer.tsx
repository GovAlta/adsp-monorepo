import { ContextProviderFactory, GoAReviewRenderers } from '@abgov/jsonforms-components';
import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { JsonForms } from '@jsonforms/react';
import { FunctionComponent, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { AppDispatch, downloadFile, FileMetadata } from '../state';

const ContextProvider = ContextProviderFactory();

interface SubmittedFormProps {
  dataSchema: JsonSchema;
  uiSchema: UISchemaElement;
  data: Record<string, unknown>;
  files: Record<string, FileMetadata>;
}

export const FormViewer: FunctionComponent<SubmittedFormProps> = ({ dataSchema, uiSchema, data, files }) => {
  const dispatch = useDispatch<AppDispatch>();

  const downloadFileHandler = useCallback(
    async (file) => {
      const element = document.createElement('a');
      const { file: dataUrl, metadata } = await dispatch(downloadFile(file.urn)).unwrap();
      element.href = dataUrl;
      element.download = metadata.filename;
      element.click();
    },
    [dispatch]
  );

  return dataSchema && uiSchema ? (
    <ContextProvider
      isFormSubmitted={true}
      fileManagement={{
        fileList: files,
        downloadFile: downloadFileHandler,
      }}
    >
      <JsonForms
        readonly={true}
        schema={dataSchema}
        uischema={uiSchema}
        data={data}
        validationMode="NoValidation"
        renderers={GoAReviewRenderers}
      />
    </ContextProvider>
  ) : (
    <LoadingIndicator isLoading={true} />
  );
};
