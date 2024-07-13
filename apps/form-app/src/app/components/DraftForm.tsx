import {
  GoARenderers,
  createDefaultAjv,
  JsonFormContext,
  enumerators,
  ContextProviderFactory,
  JsonFormRegisterProvider,
} from '@abgov/jsonforms-components';
import { GoABadge, GoAButton, GoAButtonGroup } from '@abgov/react-components-new';
import { Grid, GridItem } from '@core-services/app-common';
import { UISchemaElement, JsonSchema4, JsonSchema7 } from '@jsonforms/core';
import { JsonForms } from '@jsonforms/react';
import { FunctionComponent, useContext } from 'react';
import {
  AppDispatch,
  Form,
  FormDefinition,
  ValidationError,
  deleteFile,
  downloadFile,
  filesSelector,
  formActions,
  metaDataSelector,
  uploadFile,
} from '../state';
import { useDispatch, useSelector } from 'react-redux';

export const ContextProvider = ContextProviderFactory();

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

export const populateDropdown = (schema, enumerators) => {
  const newSchema = JSON.parse(JSON.stringify(schema));

  Object.keys(newSchema.properties || {}).forEach((propertyName) => {
    const property = newSchema.properties || {};
    if (property[propertyName]?.enum?.length === 1 && property[propertyName]?.enum[0] === '') {
      property[propertyName].enum = enumerators?.getFormContextData(propertyName) as string[];
    }
  });

  return newSchema as JsonSchema;
};

const JsonFormsWrapper = ({ definition, data, onChange }) => {
  const enumerators = useContext(JsonFormContext) as enumerators;

  return (
    <JsonFormRegisterProvider defaultRegisters={definition?.registerData || []}>
      <JsonForms
        ajv={createDefaultAjv()}
        readonly={false}
        schema={populateDropdown(definition.dataSchema, enumerators)}
        uischema={definition.uiSchema}
        data={data}
        validationMode="ValidateAndShow"
        renderers={GoARenderers}
        onChange={onChange}
      />
    </JsonFormRegisterProvider>
  );
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
  const metadata = useSelector(metaDataSelector);

  const getKeyByValue = (object, value) => {
    return Object.keys(object).find((key) => object[key] === value);
  };

  const uploadFormFile = async (file: File, propertyId: string) => {
    const clonedFiles = { ...files };

    // Handle deleting an existing file if a new file is selected to be uploaded again.
    if (clonedFiles[propertyId]) {
      const urn = files[propertyId];
      delete clonedFiles[propertyId];
      dispatch(deleteFile({ urn, propertyId }));
    }

    const fileMetaData = (
      await dispatch(uploadFile({ typeId: FORM_SUPPORTING_DOCS, recordId: form.urn, file, propertyId })).unwrap()
    ).metadata;

    clonedFiles[propertyId] = fileMetaData.urn;
    dispatch(formActions.updateFormFiles(clonedFiles));
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
    const clonedFiles = { ...files };
    const propertyId = getKeyByValue(clonedFiles, file.urn);

    await dispatch(deleteFile({ urn: file.urn, propertyId }));
    delete clonedFiles[propertyId];

    dispatch(formActions.updateFormFiles(clonedFiles));
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
            fileList: metadata,
            uploadFile: uploadFormFile,
            downloadFile: downloadFormFile,
            deleteFile: deleteFormFile,
          }}
        >
          <JsonFormsWrapper definition={definition} data={data} onChange={onChange} />
        </ContextProvider>
        <GoAButtonGroup alignment="end">
          {showSubmit && (
            <GoAButton
              mt="2xl"
              disabled={!canSubmit}
              type="primary"
              data-testid="form-submit"
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
