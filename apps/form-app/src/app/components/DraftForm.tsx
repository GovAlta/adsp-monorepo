import {
  GoARenderers,
  JsonFormContext,
  enumerators,
  ContextProviderFactory,
  JsonFormRegisterProvider,
  createDefaultAjv,
} from '@abgov/jsonforms-components';
import { GoABadge } from '@abgov/react-components';
import { JsonSchema4, JsonSchema7 } from '@jsonforms/core';
import { JsonForms } from '@jsonforms/react';
import { FunctionComponent, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { standardV1JsonSchema, commonV1JsonSchema } from '@abgov/data-exchange-standard';
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
  uploadAnonymousFile,
  AppState,
  store,
} from '../state';

export const ContextProvider = ContextProviderFactory();

export type JsonSchema = JsonSchema4 | JsonSchema7;
interface DraftFormProps {
  definition: FormDefinition;
  form: Form;
  data: Record<string, unknown>;
  canSubmit: boolean;
  showSubmit: boolean;
  saving: boolean;
  submitting: boolean;
  anonymousApply?: boolean;
  onChange: ({ data, errors }: { data: unknown; errors?: ValidationError[] }) => void;
  onSubmit: (form: Form) => void;
  onSave: ({ data, errors }: { data: unknown; errors?: ValidationError[] }) => void;
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

const JsonFormsWrapper = ({ definition, data, onChange, readonly }) => {
  const enumerators = useContext(JsonFormContext) as enumerators;
  return (
    <JsonFormRegisterProvider defaultRegisters={definition || []}>
      <JsonForms
        readonly={readonly}
        schema={populateDropdown(definition.dataSchema, enumerators)}
        uischema={definition.uiSchema}
        data={data}
        validationMode="ValidateAndShow"
        renderers={GoARenderers}
        onChange={onChange}
        ajv={createDefaultAjv(standardV1JsonSchema, commonV1JsonSchema)}
      />
    </JsonFormRegisterProvider>
  );
};

const SavingIndicator = styled.div`
  display: flex;
  flex-direction: row-reverse;
  opacity: 0;
  transition: opacity 50ms;

  &[data-saving='true'] {
    opacity: 1;
    transition-duration: 1500ms;
  }
`;

export const DraftForm: FunctionComponent<DraftFormProps> = ({
  definition,
  form,
  data,
  saving,
  submitting,
  anonymousApply,
  onChange,
  onSubmit,
  onSave,
}) => {
  const onSubmitFunction = () => {
    onSubmit(form);
  };

  const onSaveFunction = () => {
    onSave({ data });
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
    const propertyIdRoot = propertyId.split('.')[0];
    const fileMetaData =
      anonymousApply === true
        ? (
            await dispatch(
              uploadAnonymousFile({
                typeId: FORM_SUPPORTING_DOCS,
                recordId: form?.urn,
                file,
                propertyId: propertyIdRoot,
              })
            ).unwrap()
          ).metadata
        : (
            await dispatch(
              uploadFile({ typeId: FORM_SUPPORTING_DOCS, recordId: form.urn, file, propertyId: propertyIdRoot })
            ).unwrap()
          ).metadata;

    clonedFiles[propertyId] = fileMetaData.urn;
    dispatch(formActions.updateFormFiles(clonedFiles));
  };

  const downloadFormFile = async (file) => {
    const element = document.createElement('a');

    const localFileCache = (store.getState() as AppState).file?.files[file.urn];

    if (!localFileCache) {
      const fileData = await dispatch(downloadFile(file.urn)).unwrap();
      element.href = URL.createObjectURL(new Blob([fileData.data]));
      element.download = fileData.metadata.filename;
    } else {
      element.href = localFileCache;
      element.download = file.filename;
    }
    document.body.appendChild(element);
    element.click();
  };

  const deleteFormFile = async (file) => {
    const clonedFiles = { ...files };
    const propertyId = getKeyByValue(clonedFiles, file.urn);
    await dispatch(deleteFile({ urn: file.urn, propertyId, anonymousApply }));
    delete clonedFiles[propertyId];
    dispatch(formActions.updateFormFiles(clonedFiles));
  };

  return (
    <div>
      {!anonymousApply && (
        <SavingIndicator data-saving={saving}>
          <GoABadge type="information" content="Saving..." icon={false} />
        </SavingIndicator>
      )}
      <ContextProvider
        submit={{
          submitForm: onSubmitFunction,
          saveForm: onSaveFunction,
        }}
        fileManagement={{
          fileList: metadata,
          uploadFile: uploadFormFile,
          downloadFile: downloadFormFile,
          deleteFile: deleteFormFile,
        }}
        formUrl="https://form.adsp-uat.alberta.ca"
      >
        <JsonFormsWrapper definition={definition} data={data} onChange={onChange} readonly={submitting} />
      </ContextProvider>
    </div>
  );
};
