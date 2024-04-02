import { GoARenderers, ContextProvider, ajv } from '@abgov/jsonforms-components';
import { GoABadge, GoAButton, GoAButtonGroup } from '@abgov/react-components-new';
import { Grid, GridItem } from '@core-services/app-common';
import { JsonForms } from '@jsonforms/react';
import { FunctionComponent } from 'react';
import {
  AppDispatch,
  Form,
  FormDefinition,
  ValidationError,
  deleteFile,
  downloadFile,
  fileMetaDataSelector,
  filesSelector,
  propertyIdsWithFileMetaDataSelector,
  updateForm,
  uploadFile,
} from '../state';
import { useDispatch, useSelector } from 'react-redux';

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
  const onSubmitFunction = (data) => {
    onSubmit(form);
  };
  const FORM_SUPPORTING_DOCS = 'form-supporting-documents';

  const dispatch = useDispatch<AppDispatch>();
  const files = useSelector(filesSelector);
  const formPropertyIdsWithMetaData = useSelector(propertyIdsWithFileMetaDataSelector);

  const getKeyByValue = (object, value) => {
    return Object.keys(object).find((key) => object[key] === value);
  };

  const uploadFormFile = async (file: File, propertyId: string) => {
    let clonedFiles = { ...files };

    // Handle deleting an existing file if a new file is selected to be uploaded again.
    if (clonedFiles[propertyId]) {
      const urn = files[propertyId];
      delete clonedFiles[propertyId];
      dispatch(deleteFile(urn));
    }

    const fileMetaData = (
      await dispatch(uploadFile({ typeId: FORM_SUPPORTING_DOCS, recordId: form.urn, file })).unwrap()
    ).metadata;

    clonedFiles = { ...clonedFiles };
    clonedFiles[propertyId] = fileMetaData.urn;

    //Explicitly trigger the updateForm.
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
    await dispatch(deleteFile(file.urn));

    const clonedFiles = { ...files };
    const deleteKey = getKeyByValue(clonedFiles, file.urn);
    delete clonedFiles[deleteKey];

    //Explicitly trigger the updateForm as the file upload control may not have updated
    //file list to remove the icon buttons when handleChange is called.
    dispatch(updateForm({ data: data as Record<string, unknown>, files: clonedFiles }));
  };

  return (
    <Grid>
      <GridItem md={1} />
      <GridItem md={10}>
        <div className="savingIndicator" data-saving={saving}>
          <GoABadge type="information" content="Saving..." />
        </div>
        <ContextProvider
          submit={{
            submitForm: onSubmitFunction,
          }}
          fileManagement={{
            fileList: formPropertyIdsWithMetaData,
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
            <GoAButton
              mt="2xl"
              disabled={!canSubmit}
              type="primary"
              onClick={() => {
                onSubmit(form);
              }}
            >
              Submit
            </GoAButton>
          )}
        </GoAButtonGroup>
      </GridItem>
      <GridItem md={1} />
    </Grid>
  );
};
