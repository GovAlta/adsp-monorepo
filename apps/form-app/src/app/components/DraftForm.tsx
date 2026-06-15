// clean-code-ignore: RULE-19
import {
  GoARenderers,
  JsonFormContext,
  enumerators,
  ContextProviderFactory,
  JsonFormRegisterProvider,
  createDefaultAjv,
  USER_FIELD_DEFINITIONS,
  autoPopulateValue,
  User,
} from '@abgov/jsonforms-components';
import { GoabBadge } from '@abgov/react-components';
import { JsonSchema4, JsonSchema7, INIT, UPDATE_CORE, UPDATE_DATA } from '@jsonforms/core';
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

const JsonFormsActionType = {
  Init: INIT,
  UpdateCore: UPDATE_CORE,
  UpdateData: UPDATE_DATA,
} as const;

const AUTO_POPULATE_ACTION_TYPES = new Set<string>([JsonFormsActionType.Init, JsonFormsActionType.UpdateCore]);

const shouldAutoPopulate = (actionType: string) => AUTO_POPULATE_ACTION_TYPES.has(actionType);

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

const getAutoPopulateKeys = (definition) =>
  Object.keys(definition.dataSchema.properties ?? {}).filter((key) =>
    Object.keys(USER_FIELD_DEFINITIONS).includes(key),
  );

const getAutoPopulatedData = (definition, user?: User) =>
  Object.fromEntries(
    getAutoPopulateKeys(definition)
      .map((key) => [key, autoPopulateValue(user, { path: key })])
      .filter(([, value]) => value !== undefined && value !== null),
  );

const mergeMissingData = (data, autoPopulatedData) => {
  const mergedData = { ...(data ?? {}) };

  for (const [key, value] of Object.entries(autoPopulatedData)) {
    if (mergedData[key] === undefined) {
      mergedData[key] = value;
    }
  }

  return mergedData;
};

const createMiddleware = (definition, user?: User) => (state, action, defaultReducer) => {
  const newState = { ...defaultReducer(state, action) };

  if (!shouldAutoPopulate(action.type)) {
    return newState;
  }

  return {
    ...newState,
    data: mergeMissingData(newState.data, getAutoPopulatedData(definition, user)),
  };
};

const getRequiredMessage = (propertyName: string, property: Record<string, unknown>) => {
  const label = typeof property.title === 'string' ? property.title : propertyName;
  return `${label} is required`;
};

const schemaKeywords = ['items', 'additionalProperties', 'allOf', 'anyOf', 'oneOf', 'not'] as const;

const isObjectSchema = (schema: unknown): schema is Record<string, unknown> =>
  !!schema && typeof schema === 'object' && !Array.isArray(schema);

const isRequiredStringWithoutMinLength = (property: unknown): property is Record<string, unknown> =>
  isObjectSchema(property) && property.type === 'string' && property.minLength === undefined;

const addMinLengthToRequiredString = (propertyName: string, property: Record<string, unknown>): JsonSchema =>
  ({
    ...property,
    minLength: 1,
    errorMessage: {
      ...(isObjectSchema(property.errorMessage) ? property.errorMessage : {}),
      minLength: getRequiredMessage(propertyName, property),
    },
  }) as JsonSchema;

const addMinLengthToRequiredProperties = (schema: Record<string, unknown>): void => {
  if (!isObjectSchema(schema.properties)) {
    return;
  }

  const properties = { ...(schema.properties as Record<string, JsonSchema>) };
  const required = Array.isArray(schema.required) ? (schema.required as string[]) : [];

  for (const propertyName of required) {
    const property = properties[propertyName];

    if (isRequiredStringWithoutMinLength(property)) {
      properties[propertyName] = addMinLengthToRequiredString(propertyName, property);
    }
  }

  schema.properties = Object.fromEntries(
    Object.entries(properties).map(([key, value]) => [key, addMinLengthToRequiredStrings(value)]),
  );
};

const addMinLengthToNestedSchemas = (schema: Record<string, unknown>): void => {
  for (const keyword of schemaKeywords) {
    const value = schema[keyword];

    if (Array.isArray(value)) {
      schema[keyword] = value.map(addMinLengthToRequiredStrings);
    } else if (isObjectSchema(value)) {
      schema[keyword] = addMinLengthToRequiredStrings(value as JsonSchema);
    }
  }
};

const addMinLengthToRequiredStrings = (schema: JsonSchema): JsonSchema => {
  if (!isObjectSchema(schema)) {
    return schema;
  }

  const modifiedSchema = { ...schema };

  addMinLengthToRequiredProperties(modifiedSchema);
  addMinLengthToNestedSchemas(modifiedSchema);

  return modifiedSchema as JsonSchema;
};

const JsonFormsWrapper = ({ definition, data, onChange, readonly }) => {
  const enumerators = useContext(JsonFormContext) as enumerators;
  const user = useSelector((state: AppState) => state.user);

  const schema = addMinLengthToRequiredStrings(populateDropdown(definition.dataSchema, enumerators));

  const middleware = createMiddleware(definition, user?.user as User);

  return (
    <JsonFormRegisterProvider defaultRegisters={definition || []}>
      <JsonForms
        readonly={readonly}
        schema={schema}
        uischema={definition.uiSchema}
        data={data}
        validationMode="ValidateAndShow"
        renderers={GoARenderers}
        middleware={middleware}
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
              }),
            ).unwrap()
          ).metadata
        : (
            await dispatch(
              uploadFile({
                typeId: FORM_SUPPORTING_DOCS,
                recordId: form.urn,
                file,
                propertyId: propertyIdRoot,
              }),
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
          <GoabBadge type="information" content="Saving..." icon={false} />
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
