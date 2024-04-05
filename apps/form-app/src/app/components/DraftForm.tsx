import { GoARenderers, ContextProvider, ajv, getData } from '@abgov/jsonforms-components';
import { GoABadge, GoAButton, GoAButtonGroup } from '@abgov/react-components-new';
import { Grid, GridItem } from '@core-services/app-common';
import { UISchemaElement, JsonSchema4, JsonSchema7 } from '@jsonforms/core';
import { JsonForms } from '@jsonforms/react';
import { FunctionComponent } from 'react';
import {
  AppDispatch,
  Form,
  FormDefinition,
  ValidationError,
  deleteFile,
  downloadFile,
  filesSelector,
  loadFileMetadata,
  propertyIdsWithFileMetaDataSelector,
  updateForm,
  uploadFile,
} from '../state';
import { useDispatch, useSelector } from 'react-redux';

export type JsonSchema = JsonSchema4 | JsonSchema7;
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

export const populateDropdown = (schema) => {
  const newSchema = JSON.parse(JSON.stringify(schema));

  Object.keys(newSchema.properties || {}).forEach((propertyName) => {
    const property = newSchema.properties || {};
    if (property[propertyName]?.enum?.length === 1 && property[propertyName]?.enum[0] === '') {
      property[propertyName].enum = getData(propertyName) as string[];
    }
  });

  return newSchema as JsonSchema;
};

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
  const onSubmitFunction = () => {
    onSubmit(form);
  };
  const FORM_SUPPORTING_DOCS = 'form-supporting-documents';

  const dispatch = useDispatch<AppDispatch>();
  const files = useSelector(filesSelector);
  const formPropertyIdsWithMetaData = useSelector(propertyIdsWithFileMetaDataSelector);

  const getKeyByValue = (object, value) => {
    return Object.keys(object).find((key) => object[key] === value);
  };

  const updateFormAndRefreshMetadata = async (clonedFiles: Record<string, string>) => {
    await dispatch(updateForm({ data: data as Record<string, unknown>, files: clonedFiles }));

    Object.values(clonedFiles).forEach((urn) => {
      dispatch(loadFileMetadata(urn));
    });
  };

  const uploadFormFile = async (file: File, propertyId: string) => {
    let clonedFiles: Record<string, string> = { ...files };

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
    await updateFormAndRefreshMetadata(clonedFiles);
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

    const clonedFiles: Record<string, string> = { ...files };
    const deleteKey = getKeyByValue(clonedFiles, file.urn);
    delete clonedFiles[deleteKey];

    await updateFormAndRefreshMetadata(clonedFiles);
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
            schema={populateDropdown(definition.dataSchema)}
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
