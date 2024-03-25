import { ContextProvider, GoARenderers, ajv } from '@abgov/jsonforms-components';
import { GoABadge, GoAButton, GoAButtonGroup } from '@abgov/react-components-new';
import { Grid, GridItem } from '@core-services/app-common';
import { JsonForms, useJsonForms } from '@jsonforms/react';
import { FunctionComponent, useEffect, useState } from 'react';
import {
  AppDispatch,
  FileMetadata,
  Form,
  FormDefinition,
  ValidationError,
  deleteFile,
  downloadFile,
  filesSelector,
  propertyIdsWithFileMetaData,
  updateForm,
  uploadFile,
} from '../state';
import { useDispatch, useSelector } from 'react-redux';
import { DeleteModal } from './DeleteModal';

interface DraftFormProps {
  definition: FormDefinition;
  form: Form;
  data: Record<string, unknown>;
  canSubmit: boolean;
  showSubmit: boolean;
  saving: boolean;
  onChange: ({ data, errors }: { data: unknown; errors?: ValidationError[] }) => void;
  onSubmit: (form: Form) => void;
}

export const DraftForm: FunctionComponent<DraftFormProps> = ({
  definition,
  form,
  data,
  canSubmit,
  showSubmit,
  saving,
  onChange,
  onSubmit,
}) => {
  const FORM_SUPPORTING_DOCS = 'form-supporting-documents';

  const dispatch = useDispatch<AppDispatch>();
  const files = useSelector(filesSelector);
  const formPropertyIdsWithMethData = useSelector(propertyIdsWithFileMetaData);

  useEffect(() => {}, [dispatch, files]);

  const [showFileDeleteConfirmation, setShowFileDeleteConfirmation] = useState(false);
  const [selectedFile, setSelectFile] = useState<FileMetadata>(null);

  const getKeyByValue = (object, value) => {
    return Object.keys(object).find((key) => object[key] === value);
  };

  const uploadFormFile = async (file: File, propertyId: string) => {
    const fileMetaData = (
      await dispatch(uploadFile({ typeId: FORM_SUPPORTING_DOCS, recordId: form.urn, file: file })).unwrap()
    ).metadata;

    const clonedFiles = { ...files };
    clonedFiles[propertyId] = fileMetaData.urn;

    //Explicitly trigger the updateForm as the Modal controls whether the the update form should occur.
    dispatch(updateForm({ data: data as Record<string, unknown>, files: clonedFiles }));
  };

  const downloadFormFile = async (file) => {
    const fileData = await dispatch(downloadFile(file.urn)).unwrap();
    const element = document.createElement('a');
    element.href = URL.createObjectURL(new Blob([fileData.data]));
    element.download = fileData.metadata.filename;
    document.body.appendChild(element);
    element.click();
  };

  const deleteFormFile = async (file) => {
    setSelectFile(file);
    setShowFileDeleteConfirmation(true);
  };

  return (
    <Grid>
      <GridItem md={1} />
      <GridItem md={10}>
        <div className="savingIndicator" data-saving={saving}>
          <GoABadge type="information" content="Saving..." />
        </div>
        <ContextProvider
          fileManagement={{
            fileList: formPropertyIdsWithMethData,
            uploadFile: uploadFormFile,
            downloadFile: downloadFormFile,
            deleteFile: deleteFormFile,
          }}
        >
          <JsonForms
            ajv={ajv}
            readonly={false}
            schema={definition.dataSchema}
            uischema={definition.uiSchema}
            data={data}
            validationMode="ValidateAndShow"
            renderers={GoARenderers}
            onChange={onChange}
          />
        </ContextProvider>
        <GoAButtonGroup alignment="end">
          {showSubmit && (
            <GoAButton mt="2xl" disabled={!canSubmit} type="primary" onClick={() => onSubmit(form)}>
              Submit
            </GoAButton>
          )}
        </GoAButtonGroup>
        <DeleteModal
          isOpen={showFileDeleteConfirmation}
          title="Delete file"
          content={`Delete file ${selectedFile?.filename} ?`}
          onCancel={() => setShowFileDeleteConfirmation(false)}
          onDelete={() => {
            setShowFileDeleteConfirmation(false);

            const clonedFiles = { ...files };
            const deleteKey = getKeyByValue(clonedFiles, selectedFile.urn);
            delete clonedFiles[deleteKey];

            dispatch(deleteFile(selectedFile.urn));

            //Explicitly trigger the updateForm as the Modal controls whether the the update form should occur.
            dispatch(updateForm({ data: data as Record<string, unknown>, files: clonedFiles }));
          }}
        />
      </GridItem>
      <GridItem md={1} />
    </Grid>
  );
};
